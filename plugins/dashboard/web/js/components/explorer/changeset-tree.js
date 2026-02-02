/**
 * Changeset Tree Component - Store-connected tree view of changesets
 * @module components/explorer/changeset-tree
 *
 * Displays changesets in a time-based hierarchy:
 * - Active section at top with elevated styling
 * - Time groups: Today > Last Hour, Earlier > Yesterday > This Week > etc.
 * - Empty groups are hidden
 */

import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { SignalWatcher } from '../core/signal-watcher.js';
import {
    AppStore,
    Actions,
    filteredChangesets,
    changesetsByTime
} from '../../store/app-state.js';
import { ChangesetService } from '../../services/changeset-service.js';
import { formatRelativeTime } from '../../services/formatters.js';
import { getTimeIcon } from '../../services/time-grouping.js';
import './changeset-item.js';

class ChangesetTree extends SignalWatcher(LitElement) {
    static properties = {
        // Props can still be passed for flexibility, but store is primary source
        changesets: { type: Array },
        selectedId: { type: String, attribute: 'selected-id' },
        filter: { type: String },
        loading: { type: Boolean, reflect: true },
        useStore: { type: Boolean, attribute: 'use-store' },
        // Internal state for keyboard navigation
        _focusedIndex: { type: Number, state: true }
    };

    static styles = css`
        :host { display: block; height: 100%; overflow-y: auto; }
        .tree-container {
            padding: var(--spacing-xs, 4px);
        }

        /* Empty State */
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xl, 32px) var(--spacing-md, 12px);
            text-align: center;
            color: var(--text-muted, #999);
        }
        .empty-icon {
            width: 48px;
            height: 48px;
            margin-bottom: var(--spacing-sm, 8px);
            opacity: 0.3;
        }
        .empty-icon svg { width: 100%; height: 100%; }
        .empty-title { font-size: var(--font-size-sm, 13px); font-weight: 500; color: var(--text-secondary, #666); margin-bottom: var(--spacing-xs, 4px); }
        .empty-text { font-size: var(--font-size-xs, 11px); }

        /* Loading State */
        .loading-state {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-lg, 24px);
        }
        .loading-spinner {
            width: 24px;
            height: 24px;
            border: 2px solid var(--border-color, #e0e0e0);
            border-top-color: var(--accent-color, #4a90d9);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ============================================
         * Active Section - Elevated Box
         * ============================================ */
        .active-section {
            background: rgba(74, 144, 217, 0.05);
            border: 1px solid rgba(74, 144, 217, 0.2);
            border-radius: var(--radius-md, 6px);
            padding: var(--spacing-sm, 8px);
            margin-bottom: var(--spacing-md, 12px);
        }
        .active-section-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-xs, 4px) 0;
            font-size: var(--font-size-xs, 11px);
            font-weight: 700;
            color: var(--accent-color, #4a90d9);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: var(--spacing-xs, 4px);
        }
        .active-section-header .section-icon {
            width: 14px;
            height: 14px;
        }
        .active-section-count {
            background: var(--accent-color, #4a90d9);
            color: white;
            font-size: 10px;
            padding: 1px 6px;
            border-radius: 10px;
            font-weight: 600;
        }

        /* Active Indicator Pulse */
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }
        .active-indicator {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--accent-color, #4a90d9);
            animation: pulse 2s ease-in-out infinite;
            flex-shrink: 0;
        }

        /* ============================================
         * Time Group Headers - Visual Hierarchy
         * ============================================ */
        .time-group {
            margin-top: var(--spacing-xs, 4px);
        }
        .time-group:first-child { margin-top: 0; }

        .time-group-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            cursor: pointer;
            border-radius: var(--radius-sm, 4px);
            user-select: none;
            transition: background 150ms ease;
        }
        .time-group-header:hover {
            background: var(--bg-hover, rgba(255,255,255,0.05));
        }
        .time-group-header:focus {
            outline: none;
            background: var(--bg-hover, rgba(255,255,255,0.05));
            box-shadow: 0 0 0 2px var(--accent-color, #4a90d9);
        }

        /* Level-specific styling */
        .time-group-header.level-0 {
            font-weight: 600;
            font-size: var(--font-size-xs, 11px);
            color: var(--text-secondary, #aaa);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .time-group-header.level-1 {
            font-weight: 500;
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #888);
            padding-left: calc(var(--spacing-sm, 8px) + 12px);
        }
        .time-group-header.level-2 {
            font-weight: 500;
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #777);
            padding-left: calc(var(--spacing-sm, 8px) + 24px);
        }

        /* Expand/Collapse Icon */
        .expand-icon {
            display: inline-flex;
            transition: transform 150ms ease;
            font-size: 10px;
            color: var(--text-muted, #888);
            width: 12px;
            justify-content: center;
        }
        .expand-icon.expanded {
            transform: rotate(90deg);
        }

        /* Time Icon */
        .time-icon {
            display: inline-flex;
            width: 14px;
            height: 14px;
            opacity: 0.6;
        }
        .time-icon svg {
            width: 100%;
            height: 100%;
        }

        /* Time Group Label & Count */
        .time-label {
            flex: 1;
        }
        .time-count {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #666);
            opacity: 0.7;
        }

        /* Time Group Items Container */
        .time-group-items {
            overflow: hidden;
        }
        .time-group-items.collapsed {
            display: none;
        }

        /* Item indentation based on depth */
        .time-group-items[data-depth="0"] changeset-item { padding-left: var(--spacing-sm, 8px); }
        .time-group-items[data-depth="1"] changeset-item { padding-left: calc(var(--spacing-sm, 8px) + 12px); }
        .time-group-items[data-depth="2"] changeset-item { padding-left: calc(var(--spacing-sm, 8px) + 24px); }

        /* Active changeset item styling */
        .active-changeset-item {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            border-radius: var(--radius-sm, 4px);
            cursor: pointer;
            transition: background 150ms ease;
        }
        .active-changeset-item:hover {
            background: rgba(74, 144, 217, 0.1);
        }
        .active-changeset-item.selected {
            background: rgba(74, 144, 217, 0.15);
        }
        .active-changeset-info {
            flex: 1;
            min-width: 0;
        }
        .active-changeset-name {
            font-size: var(--font-size-sm, 13px);
            color: var(--text-primary, #fff);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .active-changeset-meta {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #888);
        }
        .active-status-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 1px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 500;
            background: rgba(74, 144, 217, 0.15);
            color: var(--accent-color, #4a90d9);
        }
    `;

    constructor() {
        super();
        this.changesets = [];
        this.selectedId = null;
        this.filter = '';
        this.loading = false;
        this.useStore = true;
        this._focusedIndex = -1;
    }

    connectedCallback() {
        super.connectedCallback();

        if (this.useStore) {
            this.watchSignals([
                AppStore.changesets,
                AppStore.loadingChangesets,
                AppStore.changesetFilter,
                AppStore.selectedChangeset,
                AppStore.changesetExpandedItems,
                AppStore.changesetTimeGroups
            ]);

            if (AppStore.changesets.value.length === 0 && !AppStore.loadingChangesets.value) {
                ChangesetService.fetchChangesets();
            }
        }

        // Add keyboard listener
        this.addEventListener('keydown', this._handleKeydown.bind(this));
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('keydown', this._handleKeydown.bind(this));
    }

    // Keyboard navigation
    _handleKeydown(e) {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) return;

        e.preventDefault();
        const focusable = this.shadowRoot.querySelectorAll('.time-group-header, changeset-item, .active-changeset-item');
        const current = this.shadowRoot.activeElement;
        const index = Array.from(focusable).indexOf(current);

        switch (e.key) {
            case 'ArrowDown':
                if (index < focusable.length - 1) {
                    focusable[index + 1].focus();
                }
                break;
            case 'ArrowUp':
                if (index > 0) {
                    focusable[index - 1].focus();
                }
                break;
            case 'ArrowRight':
                // Expand if on group header
                if (current?.classList.contains('time-group-header')) {
                    const groupId = current.dataset.groupId;
                    if (groupId && !Actions.isChangesetTimeGroupExpanded(groupId)) {
                        Actions.toggleChangesetTimeGroup(groupId);
                    }
                }
                break;
            case 'ArrowLeft':
                // Collapse if on group header
                if (current?.classList.contains('time-group-header')) {
                    const groupId = current.dataset.groupId;
                    if (groupId && Actions.isChangesetTimeGroupExpanded(groupId)) {
                        Actions.toggleChangesetTimeGroup(groupId);
                    }
                }
                break;
            case 'Enter':
                current?.click();
                break;
        }
    }

    _getSelectedId() {
        if (!this.useStore) return this.selectedId;
        return AppStore.selectedChangeset.value?.id || null;
    }

    _isLoading() {
        if (!this.useStore) return this.loading;
        return AppStore.loadingChangesets.value;
    }

    _getFilter() {
        if (!this.useStore) return this.filter;
        return AppStore.changesetFilter.value;
    }

    _getGroupedChangesets() {
        if (!this.useStore) {
            // For prop mode, do simple active/completed split
            const active = this.changesets.filter(cs => cs.status === 'active' || cs.phase === 'active');
            const timeGroups = [{ id: 'all', label: 'All', items: this.changesets.filter(cs => cs.status !== 'active' && cs.phase !== 'active') }];
            return { active, timeGroups };
        }

        // Apply filter if present
        const filter = this._getFilter();
        if (filter) {
            const filtered = filteredChangesets.value;
            const active = filtered.filter(cs => cs.status === 'active' || cs.phase === 'active' || cs.status === 'in-progress' || cs.phase === 'in-progress');
            return { active, timeGroups: [{ id: 'filtered', label: 'Results', icon: 'search', level: 0, items: filtered.filter(cs => !active.includes(cs)), children: [], totalCount: filtered.length - active.length }] };
        }

        return changesetsByTime.value;
    }

    _isTimeGroupExpanded(groupId) {
        return Actions.isChangesetTimeGroupExpanded(groupId);
    }

    _toggleTimeGroup(groupId) {
        Actions.toggleChangesetTimeGroup(groupId);
    }

    _handleChangesetSelect(changeset) {
        if (this.useStore) {
            ChangesetService.select(changeset, { loadConversation: true, watch: true });
        } else {
            this.selectedId = changeset?.id;
        }

        this.dispatchEvent(new CustomEvent('changeset-select', {
            detail: { changeset },
            bubbles: true,
            composed: true
        }));
    }

    _handleChangesetOpen(e) {
        this.dispatchEvent(new CustomEvent('changeset-open', { detail: e.detail, bubbles: true, composed: true }));
    }

    _handleArtifactOpen(e) {
        this.dispatchEvent(new CustomEvent('artifact-open', { detail: e.detail, bubbles: true, composed: true }));
    }

    // Render calendar icon based on type
    _renderTimeIcon(icon) {
        const icons = {
            clock: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>`,
            calendar: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>`,
            'calendar-days': html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <path d="M8 14h.01"></path>
                <path d="M12 14h.01"></path>
                <path d="M16 14h.01"></path>
                <path d="M8 18h.01"></path>
                <path d="M12 18h.01"></path>
            </svg>`,
            'calendar-range': html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <path d="M17 14h-6"></path>
                <path d="M13 18h-2"></path>
            </svg>`,
            search: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>`
        };
        return icons[icon] || icons.calendar;
    }

    _renderEmpty() {
        const filter = this._getFilter();
        return html`
            <div class="empty-state">
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="18" cy="18" r="3"></circle>
                        <circle cx="6" cy="6" r="3"></circle>
                        <path d="M6 21V9a9 9 0 0 0 9 9"></path>
                    </svg>
                </div>
                <div class="empty-title">No changesets</div>
                <div class="empty-text">${filter ? 'Try a different search term' : 'Active changesets will appear here'}</div>
            </div>
        `;
    }

    _renderActiveSection(activeChangesets) {
        if (!activeChangesets.length) return '';

        const selectedId = this._getSelectedId();

        return html`
            <div class="active-section">
                <div class="active-section-header">
                    <span class="section-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                    </span>
                    <span>Active</span>
                    <span class="active-section-count">${activeChangesets.length}</span>
                </div>
                ${repeat(activeChangesets, cs => cs.id, cs => html`
                    <div class="active-changeset-item ${selectedId === cs.id ? 'selected' : ''}"
                         tabindex="0"
                         @click=${() => this._handleChangesetSelect(cs)}
                         @keydown=${(e) => e.key === 'Enter' && this._handleChangesetSelect(cs)}>
                        <span class="active-indicator"></span>
                        <div class="active-changeset-info">
                            <div class="active-changeset-name">${cs.name || cs.task || cs.id}</div>
                            <div class="active-changeset-meta">
                                <span class="active-status-badge">${cs.phase || cs.status || 'active'}</span>
                                <span>${formatRelativeTime(cs.createdAt || cs.created_at || cs.startTime)}</span>
                            </div>
                        </div>
                    </div>
                `)}
            </div>
        `;
    }

    _renderTimeGroup(group, depth = 0) {
        if (!group) return '';

        const isExpanded = this._isTimeGroupExpanded(group.id);
        const totalCount = group.totalCount || group.items?.length || 0;

        // Skip empty groups
        if (totalCount === 0 && (!group.children || group.children.length === 0)) {
            return '';
        }

        const selectedId = this._getSelectedId();

        return html`
            <div class="time-group">
                <div class="time-group-header level-${group.level}"
                     tabindex="0"
                     data-group-id="${group.id}"
                     role="button"
                     aria-expanded="${isExpanded}"
                     @click=${() => this._toggleTimeGroup(group.id)}
                     @keydown=${(e) => {
                         if (e.key === 'Enter' || e.key === ' ') {
                             e.preventDefault();
                             this._toggleTimeGroup(group.id);
                         }
                     }}>
                    <span class="expand-icon ${isExpanded ? 'expanded' : ''}">▸</span>
                    <span class="time-icon">${this._renderTimeIcon(group.icon)}</span>
                    <span class="time-label">${group.label}</span>
                    <span class="time-count">(${totalCount})</span>
                </div>
                <div class="time-group-items ${isExpanded ? '' : 'collapsed'}" data-depth="${depth}">
                    ${group.children?.map(child => this._renderTimeGroup(child, depth + 1))}
                    ${group.items?.length ? repeat(group.items, cs => cs.id, cs => html`
                        <changeset-item
                            .changeset=${cs}
                            ?selected=${selectedId === cs.id}
                            @changeset-select=${(e) => this._handleChangesetSelect(e.detail.changeset)}
                            @changeset-open=${this._handleChangesetOpen}
                            @artifact-open=${this._handleArtifactOpen}
                        ></changeset-item>
                    `) : ''}
                </div>
            </div>
        `;
    }

    render() {
        if (this._isLoading()) {
            return html`<div class="loading-state"><div class="loading-spinner"></div></div>`;
        }

        const { active, timeGroups } = this._getGroupedChangesets();

        // Check if there's any content
        const hasActive = active && active.length > 0;
        const hasTimeGroups = timeGroups && timeGroups.some(g => g.totalCount > 0 || g.items?.length > 0);

        if (!hasActive && !hasTimeGroups) {
            return this._renderEmpty();
        }

        return html`
            <div class="tree-container" role="tree" aria-label="Changesets">
                ${this._renderActiveSection(active)}
                ${timeGroups.map(group => this._renderTimeGroup(group, 0))}
            </div>
        `;
    }
}

customElements.define('changeset-tree', ChangesetTree);
export { ChangesetTree };
