/**
 * ErrorPanel Organism - Error stream display panel
 * @module components/organisms/error-panel
 */
import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import '../atoms/icon.js';

/**
 * Tool CSS classes for styling
 */
const TOOL_CLASSES = {
    'Bash': 'tool-bash',
    'Read': 'tool-read',
    'Write': 'tool-write',
    'Edit': 'tool-edit',
    'Grep': 'tool-search',
    'Glob': 'tool-search',
    'WebFetch': 'tool-web',
    'WebSearch': 'tool-web',
    'Task': 'tool-task'
};

/**
 * @fires dash-clear - When errors are cleared
 * @fires dash-dismiss - When a single error is dismissed
 */
class DashErrorPanel extends LitElement {
    static properties = {
        errors: { type: Array },
        open: { type: Boolean, reflect: true }
    };

    static styles = css`
        :host {
            display: block;
            height: 100%;
            overflow: hidden;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-secondary, #f9fafb);
        }

        .title {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            font-size: var(--font-size-sm, 12px);
            font-weight: 600;
            color: var(--text-primary, #1f2937);
        }

        .count {
            padding: 2px 6px;
            font-size: 10px;
            font-weight: 600;
            color: var(--danger-color, #ef4444);
            background: var(--danger-bg, #fef2f2);
            border-radius: 10px;
        }

        .clear-btn {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: 4px 8px;
            border: none;
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #9ca3af);
            cursor: pointer;
            transition: all 0.15s;
        }

        .clear-btn:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
            color: var(--text-primary, #1f2937);
        }

        .list {
            height: calc(100% - 40px);
            overflow-y: auto;
        }

        .error-item {
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border-bottom: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.05));
        }

        .error-item:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.02));
        }

        .error-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            margin-bottom: var(--spacing-xs, 4px);
        }

        .error-time {
            font-size: 10px;
            color: var(--text-muted, #9ca3af);
            font-family: var(--font-mono, monospace);
        }

        .error-tool {
            padding: 1px 5px;
            font-size: 10px;
            font-weight: 500;
            border-radius: 3px;
            background: var(--bg-tertiary, #e5e7eb);
            color: var(--text-secondary, #6b7280);
        }

        .error-tool.tool-bash { background: #fef3c7; color: #92400e; }
        .error-tool.tool-read { background: #dbeafe; color: #1e40af; }
        .error-tool.tool-write { background: #dcfce7; color: #166534; }
        .error-tool.tool-edit { background: #e0e7ff; color: #3730a3; }
        .error-tool.tool-search { background: #fae8ff; color: #86198f; }
        .error-tool.tool-web { background: #cffafe; color: #0e7490; }
        .error-tool.tool-task { background: #fce7f3; color: #9d174d; }

        .dismiss-btn {
            margin-left: auto;
            display: flex;
            padding: 2px;
            border: none;
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            color: var(--text-muted, #9ca3af);
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.15s;
        }

        .error-item:hover .dismiss-btn {
            opacity: 1;
        }

        .dismiss-btn:hover {
            color: var(--text-primary, #1f2937);
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
        }

        .error-message {
            font-size: var(--font-size-xs, 11px);
            color: var(--danger-color, #ef4444);
            line-height: 1.4;
            word-break: break-word;
        }

        .error-details {
            margin-top: var(--spacing-xs, 4px);
        }

        .error-details summary {
            font-size: 10px;
            color: var(--text-muted, #9ca3af);
            cursor: pointer;
        }

        .error-details-content {
            margin-top: var(--spacing-xs, 4px);
            padding: var(--spacing-sm, 8px);
            font-size: 10px;
            font-family: var(--font-mono, monospace);
            background: var(--bg-tertiary, #e5e7eb);
            border-radius: var(--radius-sm, 4px);
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-all;
            max-height: 150px;
            overflow-y: auto;
        }

        .error-source {
            margin-top: var(--spacing-xs, 4px);
            font-size: 10px;
            color: var(--text-muted, #9ca3af);
            font-style: italic;
        }

        .empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: var(--spacing-xl, 24px);
            color: var(--text-muted, #9ca3af);
            text-align: center;
        }

        .empty-icon {
            margin-bottom: var(--spacing-sm, 8px);
            color: var(--success-color, #22c55e);
        }

        .empty-text {
            font-size: var(--font-size-sm, 12px);
            font-weight: 500;
        }

        .empty-hint {
            font-size: var(--font-size-xs, 11px);
            margin-top: var(--spacing-xs, 4px);
            opacity: 0.7;
        }
    `;

    constructor() {
        super();
        this.errors = [];
        this.open = false;
    }

    render() {
        if (this.errors.length === 0) {
            return html`
                <div class="empty">
                    <span class="empty-icon">
                        <dash-icon name="check-circle" size="24"></dash-icon>
                    </span>
                    <span class="empty-text">No errors</span>
                    <span class="empty-hint">Errors from tool executions will appear here</span>
                </div>
            `;
        }

        return html`
            <div class="header">
                <div class="title">
                    <dash-icon name="alert-circle" size="14"></dash-icon>
                    <span>Errors</span>
                    <span class="count">${this.errors.length}</span>
                </div>
                <button class="clear-btn" @click="${this._handleClear}">
                    <dash-icon name="trash-2" size="12"></dash-icon>
                    Clear
                </button>
            </div>

            <div class="list">
                ${repeat(
                    this.errors,
                    error => error.id,
                    error => this._renderError(error)
                )}
            </div>
        `;
    }

    _renderError(error) {
        const time = this._formatTime(error.timestamp);
        const toolClass = TOOL_CLASSES[error.tool] || 'tool-default';

        return html`
            <div class="error-item" data-error-id="${error.id}">
                <div class="error-header">
                    <span class="error-time">${time}</span>
                    <span class="error-tool ${toolClass}">${error.tool}</span>
                    <button class="dismiss-btn" @click="${() => this._handleDismiss(error.id)}" title="Dismiss">
                        <dash-icon name="x" size="12"></dash-icon>
                    </button>
                </div>
                <div class="error-message">${error.message}</div>
                ${error.details ? html`
                    <details class="error-details">
                        <summary>Show details</summary>
                        <pre class="error-details-content">${error.details}</pre>
                    </details>
                ` : ''}
                ${error.source !== 'main' ? html`
                    <div class="error-source">from agent: ${error.source}</div>
                ` : ''}
            </div>
        `;
    }

    _formatTime(timestamp) {
        if (!timestamp) return '--:--:--';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }

    _handleClear() {
        this.dispatchEvent(new CustomEvent('dash-clear', {
            bubbles: true,
            composed: true
        }));
    }

    _handleDismiss(errorId) {
        this.dispatchEvent(new CustomEvent('dash-dismiss', {
            bubbles: true,
            composed: true,
            detail: { errorId }
        }));
    }

    /**
     * Add an error to the panel
     * @param {Object} error
     */
    addError(error) {
        this.errors = [error, ...this.errors];
    }

    /**
     * Remove an error by ID
     * @param {number} errorId
     */
    removeError(errorId) {
        this.errors = this.errors.filter(e => e.id !== errorId);
    }

    /**
     * Clear all errors
     */
    clear() {
        this.errors = [];
    }
}

customElements.define('dash-error-panel', DashErrorPanel);
export { DashErrorPanel };
