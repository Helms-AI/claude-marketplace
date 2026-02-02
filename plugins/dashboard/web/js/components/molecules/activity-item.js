/**
 * Activity Item Molecule - Single tool activity display
 * @module components/molecules/activity-item
 *
 * Displays a single tool activity with status indicator, tool name,
 * file path, timestamp, and expandable result view.
 * Shared between aside panel and bottom panel.
 */
import { LitElement, html, css } from 'lit';
import { formatRelativeTime, formatShortTime } from '../../services/formatters.js';
import '../atoms/activity-indicator.js';
import '../atoms/icon.js';

/**
 * Tool icon mapping
 */
const TOOL_ICONS = {
    Read: 'file-text',
    Write: 'file-plus',
    Edit: 'file-edit',
    Bash: 'terminal',
    Glob: 'folder-search',
    Grep: 'search',
    Task: 'git-branch',
    WebFetch: 'globe',
    WebSearch: 'search',
    AskUserQuestion: 'message-circle',
    default: 'wrench'
};

class ActivityItem extends LitElement {
    static properties = {
        tool: { type: String },           // Tool name (Read, Write, etc.)
        file: { type: String },           // File path or null
        status: { type: String },         // 'running' | 'success' | 'error' | 'pending'
        timestamp: { type: Number },      // Unix timestamp
        duration: { type: Number },       // Duration in ms (if completed)
        result: { type: String },         // Tool output/result
        error: { type: String },          // Error message if failed
        compact: { type: Boolean },       // Compact mode for collapsed view
        showIcon: { type: Boolean, attribute: 'show-icon' },
        showTimestamp: { type: Boolean, attribute: 'show-timestamp' },
        _expanded: { type: Boolean, state: true }  // Internal expansion state
    };

    static styles = css`
        :host {
            display: block;
        }

        .activity-item {
            display: flex;
            flex-direction: column;
            border-radius: var(--radius-sm, 4px);
            transition: background var(--transition-fast, 150ms ease);
            cursor: default;
        }

        .activity-item:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.05));
        }

        .activity-row {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
        }

        /* Compact mode */
        :host([compact]) .activity-row {
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            gap: var(--spacing-xs, 4px);
        }

        .indicator {
            flex-shrink: 0;
        }

        .icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            flex-shrink: 0;
            color: var(--text-muted, #9ca3af);
        }

        :host([compact]) .icon-wrapper {
            width: 18px;
            height: 18px;
        }

        .content {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 1px;
        }

        .tool-name {
            font-size: var(--font-size-sm, 12px);
            font-weight: 500;
            color: var(--text-primary, #e0e0e0);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        :host([compact]) .tool-name {
            font-size: var(--font-size-xs, 11px);
        }

        .file-path {
            font-size: var(--font-size-xs, 11px);
            font-family: var(--font-mono, monospace);
            color: var(--text-muted, #9ca3af);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        :host([compact]) .file-path {
            display: none;
        }

        .meta {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            flex-shrink: 0;
        }

        .timestamp {
            font-size: var(--font-size-xs, 11px);
            font-family: var(--font-mono, monospace);
            color: var(--text-muted, #9ca3af);
            white-space: nowrap;
        }

        .duration {
            font-size: var(--font-size-xs, 11px);
            font-family: var(--font-mono, monospace);
            color: var(--text-secondary, #a0a0a0);
            padding: 1px 4px;
            background: var(--bg-tertiary, rgba(255, 255, 255, 0.05));
            border-radius: var(--radius-sm, 4px);
        }

        /* Expand button */
        .expand-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            padding: 0;
            background: transparent;
            border: none;
            color: var(--text-muted, #9ca3af);
            cursor: pointer;
            border-radius: var(--radius-sm, 4px);
            transition: all var(--transition-fast, 150ms ease);
        }

        .expand-btn:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.08));
            color: var(--text-primary, #e0e0e0);
        }

        .expand-btn dash-icon {
            transition: transform var(--transition-fast, 150ms ease);
        }

        .expand-btn.expanded dash-icon {
            transform: rotate(90deg);
        }

        /* Expandable result section */
        .result-section {
            margin: 0 var(--spacing-md, 12px) var(--spacing-sm, 8px);
            padding: var(--spacing-sm, 8px);
            background: var(--bg-tertiary, rgba(0, 0, 0, 0.2));
            border-radius: var(--radius-sm, 4px);
            border-left: 2px solid var(--border-color, #3c3c3c);
            font-size: var(--font-size-xs, 11px);
            font-family: var(--font-mono, monospace);
            max-height: 200px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-word;
            color: var(--text-secondary, #a0a0a0);
        }

        .result-section.success {
            border-left-color: var(--success-color, #22c55e);
        }

        .result-section.error {
            border-left-color: var(--danger-color, #ef4444);
            color: var(--danger-color, #ef4444);
        }

        /* Status-based styling */
        .activity-item.running {
            background: rgba(59, 130, 246, 0.05);
        }

        .activity-item.running .tool-name {
            color: var(--accent-color, #3b82f6);
        }

        .activity-item.error {
            background: rgba(239, 68, 68, 0.05);
        }

        .activity-item.error .tool-name {
            color: var(--danger-color, #ef4444);
        }

        .activity-item.success .tool-name {
            color: var(--success-color, #22c55e);
        }

        /* Custom scrollbar for result section */
        .result-section::-webkit-scrollbar {
            width: 6px;
        }

        .result-section::-webkit-scrollbar-track {
            background: transparent;
        }

        .result-section::-webkit-scrollbar-thumb {
            background: var(--border-color, #3c3c3c);
            border-radius: 3px;
        }
    `;

    constructor() {
        super();
        this.tool = 'Unknown';
        this.file = null;
        this.status = 'pending';
        this.timestamp = Date.now();
        this.duration = null;
        this.result = null;
        this.error = null;
        this._expanded = false;
        this.compact = false;
        this.showIcon = true;
        this.showTimestamp = true;
    }

    /**
     * Get icon for tool type
     * @private
     */
    _getToolIcon() {
        return TOOL_ICONS[this.tool] || TOOL_ICONS.default;
    }

    /**
     * Format file path for display
     * @private
     */
    _formatFilePath() {
        if (!this.file) return null;
        const parts = this.file.split('/');
        if (parts.length <= 2) return this.file;
        return `.../${parts.slice(-2).join('/')}`;
    }

    /**
     * Format duration for display
     * @private
     */
    _formatDuration() {
        if (!this.duration) return null;
        if (this.duration < 1000) return `${this.duration}ms`;
        if (this.duration < 60000) return `${(this.duration / 1000).toFixed(1)}s`;
        return `${Math.floor(this.duration / 60000)}m`;
    }

    /**
     * Format timestamp for display
     * @private
     */
    _formatTimestamp() {
        if (!this.timestamp) return '';
        // Use relative time for recent activities
        const age = Date.now() - this.timestamp;
        if (age < 60000) return 'just now';
        if (age < 3600000) return formatRelativeTime(this.timestamp);
        return formatShortTime(this.timestamp);
    }

    /**
     * Toggle expansion state
     * @private
     */
    _handleToggleExpand(e) {
        e.stopPropagation();
        this._expanded = !this._expanded;
    }

    /**
     * Check if activity has viewable result
     * @private
     */
    _hasResult() {
        return (this.status === 'success' || this.status === 'error') &&
               (this.result || this.error);
    }

    /**
     * Format result for display (truncate if too long)
     * @private
     */
    _formatResult() {
        const text = this.error || this.result;
        if (!text) return '';
        const str = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
        // Limit to ~500 chars for display
        return str.length > 500 ? str.slice(0, 500) + '\n...(truncated)' : str;
    }

    render() {
        const formattedPath = this._formatFilePath();
        const formattedDuration = this._formatDuration();
        const formattedTime = this._formatTimestamp();
        const hasResult = this._hasResult();

        return html`
            <div class="activity-item ${this.status}">
                <div class="activity-row">
                    <span class="indicator">
                        <activity-indicator
                            status="${this.status}"
                            size="${this.compact ? 'xs' : 'sm'}"
                        ></activity-indicator>
                    </span>

                    ${this.showIcon ? html`
                        <span class="icon-wrapper">
                            <dash-icon
                                name="${this._getToolIcon()}"
                                size="${this.compact ? 12 : 14}"
                            ></dash-icon>
                        </span>
                    ` : ''}

                    <div class="content">
                        <span class="tool-name">${this.tool}</span>
                        ${formattedPath ? html`
                            <span class="file-path" title="${this.file}">${formattedPath}</span>
                        ` : ''}
                    </div>

                    <div class="meta">
                        ${formattedDuration ? html`
                            <span class="duration">${formattedDuration}</span>
                        ` : ''}
                        ${this.showTimestamp && formattedTime ? html`
                            <span class="timestamp">${formattedTime}</span>
                        ` : ''}
                        ${hasResult && !this.compact ? html`
                            <button
                                class="expand-btn ${this._expanded ? 'expanded' : ''}"
                                @click=${this._handleToggleExpand}
                                aria-expanded="${this._expanded}"
                                aria-label="${this._expanded ? 'Collapse result' : 'Show result'}"
                                title="${this._expanded ? 'Hide result' : 'Show result'}"
                            >
                                <dash-icon name="chevron-right" size="12"></dash-icon>
                            </button>
                        ` : ''}
                    </div>
                </div>

                ${hasResult && this._expanded ? html`
                    <div
                        class="result-section ${this.status}"
                        role="region"
                        aria-label="Tool result"
                    >${this._formatResult()}</div>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('activity-item', ActivityItem);
export { ActivityItem, TOOL_ICONS };
