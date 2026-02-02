/**
 * Collapsed Preview Molecule - Mini-list for collapsed aside state
 * @module components/molecules/collapsed-preview
 *
 * Shows last 3 activities with status dots and truncated names
 * in the collapsed state of the activities aside panel.
 */
import { LitElement, html, css } from 'lit';
import '../atoms/activity-indicator.js';
import '../atoms/icon.js';

class CollapsedPreview extends LitElement {
    static properties = {
        activities: { type: Array },   // Array of recent activities
        maxItems: { type: Number, attribute: 'max-items' }
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
        }

        .preview-item {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-xs, 4px) 0;
        }

        .preview-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted, #9ca3af);
        }

        .preview-name {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-secondary, #a0a0a0);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 20px;
        }

        .preview-item.running .preview-icon {
            color: var(--accent-color, #3b82f6);
        }

        .preview-item.running .preview-name {
            color: var(--accent-color, #3b82f6);
        }

        .preview-item.error .preview-icon {
            color: var(--danger-color, #ef4444);
        }

        .preview-item.error .preview-name {
            color: var(--danger-color, #ef4444);
        }

        .more-indicator {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #9ca3af);
            text-align: center;
            padding: var(--spacing-xs, 4px) 0;
        }

        .expand-hint {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-sm, 8px) 0;
            color: var(--text-muted, #9ca3af);
            opacity: 0.6;
        }
    `;

    constructor() {
        super();
        this.activities = [];
        this.maxItems = 3;
    }

    /**
     * Get icon for tool type
     * @private
     */
    _getToolIcon(tool) {
        const iconMap = {
            Read: 'file-text',
            Write: 'file-plus',
            Edit: 'file-edit',
            Bash: 'terminal',
            Glob: 'folder-search',
            Grep: 'search',
            Task: 'git-branch',
            WebFetch: 'globe',
            WebSearch: 'search',
            AskUserQuestion: 'message-circle'
        };
        return iconMap[tool] || 'wrench';
    }

    /**
     * Get short tool abbreviation
     * @private
     */
    _getShortName(tool) {
        const shortMap = {
            Read: 'R',
            Write: 'W',
            Edit: 'E',
            Bash: 'B',
            Glob: 'G',
            Grep: 'Gr',
            Task: 'T',
            WebFetch: 'WF',
            WebSearch: 'WS',
            AskUserQuestion: 'Q'
        };
        return shortMap[tool] || tool.charAt(0);
    }

    render() {
        const visibleItems = this.activities.slice(0, this.maxItems);
        const hasMore = this.activities.length > this.maxItems;

        if (visibleItems.length === 0) {
            return html`
                <div class="expand-hint">
                    <dash-icon name="chevron-left" size="14"></dash-icon>
                </div>
            `;
        }

        return html`
            ${visibleItems.map(activity => {
                const tool = activity.tool || activity.content?.tool || 'Unknown';
                const status = activity.status || 'success';

                return html`
                    <div class="preview-item ${status}" title="${tool}">
                        <activity-indicator
                            status="${status}"
                            size="xs"
                        ></activity-indicator>
                        <span class="preview-icon">
                            <dash-icon name="${this._getToolIcon(tool)}" size="12"></dash-icon>
                        </span>
                    </div>
                `;
            })}

            ${hasMore ? html`
                <div class="more-indicator">...</div>
            ` : ''}

            <div class="expand-hint">
                <dash-icon name="chevron-left" size="14"></dash-icon>
            </div>
        `;
    }
}

customElements.define('collapsed-preview', CollapsedPreview);
export { CollapsedPreview };
