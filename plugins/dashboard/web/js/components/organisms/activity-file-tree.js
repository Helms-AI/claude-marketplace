/**
 * Activity File Tree Organism - File-grouped view of activities
 * @module components/organisms/activity-file-tree
 *
 * Organizes activities by the files they touch, with expandable file nodes.
 * Useful for understanding what files were modified during a session.
 */
import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, filteredToolActivities } from '../../store/app-state.js';
import '../atoms/icon.js';
import '../atoms/empty-state.js';
import '../molecules/activity-item.js';

class ActivityFileTree extends SignalWatcher(LitElement) {
    static properties = {
        showFilter: { type: Boolean, attribute: 'show-filter' },
        maxFiles: { type: Number, attribute: 'max-files' },
        expandedFiles: { state: true }
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow: hidden;
        }

        .filter-container {
            padding: var(--spacing-sm, 8px);
            border-bottom: 1px solid var(--border-color, #3c3c3c);
        }

        .tree-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
        }

        .file-list {
            display: flex;
            flex-direction: column;
        }

        .file-node {
            border-bottom: 1px solid var(--border-color, #3c3c3c);
        }

        .file-node:last-child {
            border-bottom: none;
        }

        .file-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            cursor: pointer;
            user-select: none;
            transition: background var(--transition-fast, 150ms ease);
        }

        .file-header:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.05));
        }

        .chevron {
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted, #9ca3af);
            transition: transform var(--transition-fast, 150ms ease);
        }

        .chevron.expanded {
            transform: rotate(90deg);
        }

        .file-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted, #9ca3af);
        }

        .file-name {
            flex: 1;
            font-size: var(--font-size-sm, 12px);
            font-family: var(--font-mono, monospace);
            color: var(--text-primary, #e0e0e0);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .file-count {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #9ca3af);
            padding: 1px 6px;
            background: var(--bg-tertiary, rgba(255, 255, 255, 0.05));
            border-radius: 10px;
        }

        .file-activities {
            display: none;
            padding-left: var(--spacing-md, 12px);
        }

        .file-activities.expanded {
            display: block;
        }

        .no-file-group {
            opacity: 0.7;
        }

        .empty-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: var(--spacing-xl, 24px);
        }

        /* Custom scrollbar */
        .tree-content::-webkit-scrollbar {
            width: 8px;
        }

        .tree-content::-webkit-scrollbar-track {
            background: transparent;
        }

        .tree-content::-webkit-scrollbar-thumb {
            background: var(--border-color, #3c3c3c);
            border-radius: 4px;
        }

        .tree-content::-webkit-scrollbar-thumb:hover {
            background: var(--text-muted, #9ca3af);
        }
    `;

    constructor() {
        super();
        this.showFilter = true;
        this.maxFiles = 50;
        this.expandedFiles = new Set();
    }

    connectedCallback() {
        super.connectedCallback();
        this.watchSignals([
            AppStore.conversationEvents,
            AppStore.activitiesFilter
        ]);
    }

    /**
     * Group activities by file
     * @private
     */
    _groupByFile(activities) {
        const fileGroups = new Map();
        const noFileGroup = [];

        activities.forEach(activity => {
            const file = activity.file || activity.content?.file || null;

            if (!file) {
                noFileGroup.push(activity);
                return;
            }

            if (!fileGroups.has(file)) {
                fileGroups.set(file, []);
            }
            fileGroups.get(file).push(activity);
        });

        // Sort files by most recent activity
        const sortedFiles = Array.from(fileGroups.entries())
            .map(([file, acts]) => ({
                file,
                activities: acts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
                lastActivity: Math.max(...acts.map(a => a.timestamp || 0))
            }))
            .sort((a, b) => b.lastActivity - a.lastActivity)
            .slice(0, this.maxFiles);

        // Add "no file" group at the end if non-empty
        if (noFileGroup.length > 0) {
            sortedFiles.push({
                file: null,
                activities: noFileGroup.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
                lastActivity: Math.max(...noFileGroup.map(a => a.timestamp || 0)),
                isNoFile: true
            });
        }

        return sortedFiles;
    }

    /**
     * Get display name for file
     * @private
     */
    _getFileName(file) {
        if (!file) return 'Other Activities';
        const parts = file.split('/');
        return parts[parts.length - 1];
    }

    /**
     * Get directory path for file
     * @private
     */
    _getFilePath(file) {
        if (!file) return '';
        const parts = file.split('/');
        if (parts.length <= 1) return '';
        return parts.slice(0, -1).join('/');
    }

    /**
     * Get icon for file type
     * @private
     */
    _getFileIcon(file) {
        if (!file) return 'folder-x';

        const ext = file.split('.').pop()?.toLowerCase() || '';
        const iconMap = {
            js: 'file-code',
            ts: 'file-code',
            jsx: 'file-code',
            tsx: 'file-code',
            json: 'file-json',
            md: 'file-text',
            css: 'file-code',
            html: 'file-code',
            py: 'file-code',
            sh: 'terminal',
            yml: 'file-cog',
            yaml: 'file-cog'
        };

        return iconMap[ext] || 'file';
    }

    /**
     * Toggle file expansion
     * @private
     */
    _toggleFile(file) {
        const key = file || '__no_file__';
        const newExpanded = new Set(this.expandedFiles);

        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }

        this.expandedFiles = newExpanded;
    }

    /**
     * Check if file is expanded
     * @private
     */
    _isExpanded(file) {
        const key = file || '__no_file__';
        return this.expandedFiles.has(key);
    }

    /**
     * Handle filter change
     * @private
     */
    _handleFilterChange(e) {
        const filter = e.detail?.value || e.target?.value || '';
        AppStore.activitiesFilter.value = filter;
    }

    render() {
        const activities = filteredToolActivities.value;
        const fileGroups = this._groupByFile(activities);

        const isEmpty = fileGroups.length === 0;

        return html`
            ${this.showFilter ? html`
                <div class="filter-container">
                    <dash-search-input
                        placeholder="Filter files..."
                        value="${AppStore.activitiesFilter.value}"
                        @input=${this._handleFilterChange}
                    ></dash-search-input>
                </div>
            ` : ''}

            <div class="tree-content">
                ${isEmpty ? html`
                    <div class="empty-container">
                        <dash-empty-state
                            icon="folder"
                            title="No file activities"
                            description="Files with tool activities will appear here"
                            variant="compact"
                        ></dash-empty-state>
                    </div>
                ` : html`
                    <div class="file-list">
                        ${fileGroups.map(group => {
                            const isExpanded = this._isExpanded(group.file);

                            return html`
                                <div class="file-node ${group.isNoFile ? 'no-file-group' : ''}">
                                    <div
                                        class="file-header"
                                        @click=${() => this._toggleFile(group.file)}
                                        role="button"
                                        aria-expanded="${isExpanded}"
                                        tabindex="0"
                                        @keydown=${(e) => e.key === 'Enter' && this._toggleFile(group.file)}
                                    >
                                        <span class="chevron ${isExpanded ? 'expanded' : ''}">
                                            <dash-icon name="chevron-right" size="14"></dash-icon>
                                        </span>
                                        <span class="file-icon">
                                            <dash-icon name="${this._getFileIcon(group.file)}" size="14"></dash-icon>
                                        </span>
                                        <span class="file-name" title="${group.file || 'Other'}">
                                            ${this._getFileName(group.file)}
                                        </span>
                                        <span class="file-count">${group.activities.length}</span>
                                    </div>

                                    <div class="file-activities ${isExpanded ? 'expanded' : ''}">
                                        ${group.activities.map(activity => html`
                                            <activity-item
                                                tool="${activity.tool || activity.content?.tool || 'Unknown'}"
                                                file="${activity.file || activity.content?.file || ''}"
                                                status="${activity.status || 'success'}"
                                                timestamp="${activity.timestamp}"
                                                duration="${activity.duration || null}"
                                                show-icon
                                            ></activity-item>
                                        `)}
                                    </div>
                                </div>
                            `;
                        })}
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('activity-file-tree', ActivityFileTree);
export { ActivityFileTree };
