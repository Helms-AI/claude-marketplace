/**
 * Event Item Component - Single SSE event display
 * @module components/organisms/event-item
 *
 * Displays a single SSE event with:
 * - Icon + color by event type
 * - Event type label + preview + relative timestamp
 * - Expandable details with JSON payload
 * - Copy to clipboard button
 */

import { LitElement, html, css } from 'lit';
import { formatRelativeTime } from '../../services/formatters.js';
import '../atoms/icon.js';
import '../atoms/button.js';
import '../molecules/json-viewer.js';

/**
 * Event type configurations
 */
const EVENT_TYPE_CONFIG = {
    // Changeset events
    changeset_created: { icon: 'plus-circle', color: 'var(--success-color, #22c55e)', category: 'changeset' },
    changeset_updated: { icon: 'edit-2', color: 'var(--info-color, #3b82f6)', category: 'changeset' },
    changeset_deleted: { icon: 'trash-2', color: 'var(--error-color, #ef4444)', category: 'changeset' },
    changeset_update: { icon: 'refresh-cw', color: 'var(--info-color, #3b82f6)', category: 'changeset' },

    // Activity events
    activity: { icon: 'activity', color: 'var(--warning-color, #f59e0b)', category: 'activity' },
    tool_use: { icon: 'terminal', color: 'var(--accent-color, #8b5cf6)', category: 'activity' },
    tool_result: { icon: 'check-circle', color: 'var(--success-color, #22c55e)', category: 'activity' },

    // Conversation events
    conversation_event: { icon: 'message-circle', color: 'var(--info-color, #3b82f6)', category: 'conversation' },
    transcript_message: { icon: 'file-text', color: 'var(--text-muted, #9ca3af)', category: 'conversation' },

    // Graph events
    graph_activity: { icon: 'git-branch', color: 'var(--warning-color, #f59e0b)', category: 'graph' },
    graph_handoff: { icon: 'arrow-right-circle', color: 'var(--accent-color, #8b5cf6)', category: 'graph' },

    // System events
    connected: { icon: 'wifi', color: 'var(--success-color, #22c55e)', category: 'system' },
    error: { icon: 'alert-circle', color: 'var(--error-color, #ef4444)', category: 'system' },
    heartbeat: { icon: 'heart', color: 'var(--text-muted, #6b7280)', category: 'system' },

    // Default
    _default: { icon: 'radio', color: 'var(--text-muted, #9ca3af)', category: 'system' }
};

class EventItem extends LitElement {
    static properties = {
        event: { type: Object },
        expanded: { type: Boolean, state: true }
    };

    static styles = css`
        :host {
            display: block;
        }

        .event-item {
            display: flex;
            flex-direction: column;
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
            cursor: pointer;
            transition: background-color var(--transition-fast, 150ms ease);
        }

        .event-item:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.03));
        }

        .event-item.expanded {
            background: var(--bg-secondary, rgba(255, 255, 255, 0.05));
        }

        .event-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            min-height: 24px;
        }

        .event-icon {
            flex-shrink: 0;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .event-type {
            font-size: var(--font-size-xs, 11px);
            font-weight: 500;
            color: var(--text-primary, #e0e0e0);
            flex-shrink: 0;
        }

        .event-preview {
            flex: 1;
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #9ca3af);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin-left: var(--spacing-xs, 4px);
        }

        .event-time {
            flex-shrink: 0;
            font-size: var(--font-size-xs, 10px);
            color: var(--text-muted, #6b7280);
            margin-left: var(--spacing-sm, 8px);
        }

        .expand-icon {
            flex-shrink: 0;
            transition: transform var(--transition-fast, 150ms ease);
        }

        .expand-icon.expanded {
            transform: rotate(90deg);
        }

        .event-details {
            display: none;
            margin-top: var(--spacing-xs, 4px);
        }

        .event-details.visible {
            display: block;
        }

        /* Let the json-viewer handle its own styling */
        .event-details json-viewer {
            --font-size-xs: 10px;
        }

        /* Category colors as left border */
        .event-item[data-category="changeset"] {
            border-left: 2px solid var(--info-color, #3b82f6);
        }
        .event-item[data-category="activity"] {
            border-left: 2px solid var(--warning-color, #f59e0b);
        }
        .event-item[data-category="conversation"] {
            border-left: 2px solid var(--accent-color, #8b5cf6);
        }
        .event-item[data-category="graph"] {
            border-left: 2px solid var(--success-color, #22c55e);
        }
        .event-item[data-category="system"] {
            border-left: 2px solid var(--text-muted, #6b7280);
        }
    `;

    constructor() {
        super();
        this.event = null;
        this.expanded = false;
    }

    /**
     * Get configuration for event type
     * @private
     */
    _getTypeConfig() {
        if (!this.event) return EVENT_TYPE_CONFIG._default;
        return EVENT_TYPE_CONFIG[this.event.type] || EVENT_TYPE_CONFIG._default;
    }

    /**
     * Get a preview string for the event data
     * @private
     */
    _getPreview() {
        if (!this.event?.data) return '';

        const data = this.event.data;

        // Try to extract meaningful preview
        if (data.changeset_id) return data.changeset_id;
        if (data.id) return data.id;
        if (data.name) return data.name;
        if (data.message?.role) return `${data.message.role} message`;
        if (data.tool) return data.tool;
        if (typeof data === 'string') return data.substring(0, 50);

        // Fall back to truncated JSON
        const json = JSON.stringify(data);
        return json.length > 40 ? json.substring(0, 40) + '...' : json;
    }

    /**
     * Toggle expanded state
     * @private
     */
    _toggleExpanded() {
        this.expanded = !this.expanded;
    }

    render() {
        if (!this.event) return html``;

        const config = this._getTypeConfig();
        const preview = this._getPreview();
        const timestamp = this.event.receivedAt || this.event.timestamp;
        const relativeTime = timestamp ? formatRelativeTime(timestamp) : '';

        return html`
            <div
                class="event-item ${this.expanded ? 'expanded' : ''}"
                data-category="${config.category}"
                @click=${this._toggleExpanded}
            >
                <div class="event-header">
                    <dash-icon
                        class="expand-icon ${this.expanded ? 'expanded' : ''}"
                        name="chevron-right"
                        size="12"
                    ></dash-icon>
                    <div class="event-icon" style="color: ${config.color}">
                        <dash-icon name="${config.icon}" size="14"></dash-icon>
                    </div>
                    <span class="event-type">${this.event.type || 'unknown'}</span>
                    <span class="event-preview">${preview}</span>
                    <span class="event-time">${relativeTime}</span>
                </div>

                <div class="event-details ${this.expanded ? 'visible' : ''}" @click=${(e) => e.stopPropagation()}>
                    <json-viewer
                        .data=${this.event}
                        mode="pretty"
                        max-height="250px"
                    ></json-viewer>
                </div>
            </div>
        `;
    }
}

customElements.define('event-item', EventItem);
export { EventItem, EVENT_TYPE_CONFIG };
