/**
 * Activity List Molecule - Timeline of events/activities
 * @module components/molecules/activity-list
 *
 * Displays a list of activity events with timestamps.
 * Used in agent modals, skill modals, and activity panels.
 */
import { LitElement, html, css } from 'lit';
import { formatShortTime, formatRelativeTime, formatEventType } from '../../services/formatters.js';
import '../atoms/empty-state.js';

class DashActivityList extends LitElement {
    static properties = {
        items: { type: Array },         // [{timestamp, event_type, icon?, content?}]
        maxItems: { type: Number, attribute: 'max-items' },
        emptyMessage: { type: String, attribute: 'empty-message' },
        emptyIcon: { type: String, attribute: 'empty-icon' },
        showTimeAgo: { type: Boolean, attribute: 'show-time-ago' },
        compact: { type: Boolean }      // Compact mode for modals
    };

    static styles = css`
        :host {
            display: block;
        }

        .activity-list {
            display: flex;
            flex-direction: column;
        }

        .activity-row {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            transition: background var(--transition-fast, 150ms ease);
        }

        .activity-row:last-child {
            border-bottom: none;
        }

        .activity-row:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.02));
        }

        /* Compact mode */
        :host([compact]) .activity-row {
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
        }

        .activity-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            flex-shrink: 0;
            color: var(--text-muted, #9ca3af);
        }

        :host([compact]) .activity-icon {
            width: 20px;
            height: 20px;
        }

        .activity-content {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .activity-event {
            font-size: var(--font-size-sm, 12px);
            color: var(--text-primary, #1f2937);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .activity-detail {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #9ca3af);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .activity-time {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #9ca3af);
            font-family: var(--font-mono);
            white-space: nowrap;
            flex-shrink: 0;
        }

        /* Alternating rows */
        .activity-row:nth-child(even) {
            background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
        }

        .activity-row:nth-child(even):hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.04));
        }

        /* Empty state */
        .empty-container {
            padding: var(--spacing-md, 12px);
        }
    `;

    constructor() {
        super();
        this.items = [];
        this.maxItems = 10;
        this.emptyMessage = 'No activity';
        this.emptyIcon = 'clock';
        this.showTimeAgo = false;
        this.compact = false;
    }

    _getEventIcon(eventType) {
        // Map event types to Lucide icons
        const iconMap = {
            'tool_use': 'wrench',
            'tool_result': 'check-circle',
            'message': 'message-square',
            'error': 'alert-circle',
            'warning': 'alert-triangle',
            'success': 'check-circle-2',
            'invoked': 'zap',
            'agent_invoked': 'bot',
            'skill_invoked': 'play',
            'handoff': 'arrow-right-left',
            'start': 'play-circle',
            'complete': 'check-circle',
            'default': 'activity'
        };

        if (!eventType) return iconMap.default;

        const normalizedType = eventType.toLowerCase().replace(/[-_]/g, '');
        for (const [key, icon] of Object.entries(iconMap)) {
            if (normalizedType.includes(key.replace(/[-_]/g, ''))) {
                return icon;
            }
        }
        return iconMap.default;
    }

    _formatTime(timestamp) {
        if (!timestamp) return '';

        if (this.showTimeAgo) {
            return formatRelativeTime(timestamp);
        }
        return formatShortTime(timestamp);
    }

    render() {
        const visibleItems = this.items.slice(0, this.maxItems);

        if (visibleItems.length === 0) {
            return html`
                <div class="empty-container">
                    <dash-empty-state
                        icon="${this.emptyIcon}"
                        title="${this.emptyMessage}"
                        variant="inline"
                    ></dash-empty-state>
                </div>
            `;
        }

        return html`
            <div class="activity-list">
                ${visibleItems.map(item => {
                    const eventText = item.content?.tool ||
                                      formatEventType(item.event_type) ||
                                      item.event ||
                                      'Activity';
                    const icon = item.icon || this._getEventIcon(item.event_type);

                    return html`
                        <div class="activity-row">
                            <div class="activity-icon">
                                <dash-icon name="${icon}" size="${this.compact ? 14 : 16}"></dash-icon>
                            </div>
                            <div class="activity-content">
                                <span class="activity-event">${eventText}</span>
                                ${item.detail ? html`
                                    <span class="activity-detail">${item.detail}</span>
                                ` : ''}
                            </div>
                            <span class="activity-time">${this._formatTime(item.timestamp)}</span>
                        </div>
                    `;
                })}
            </div>
        `;
    }
}

customElements.define('dash-activity-list', DashActivityList);
export { DashActivityList };
