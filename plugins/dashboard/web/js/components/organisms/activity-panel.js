/**
 * ActivityPanel Organism - Real-time activity feed
 * @module components/organisms/activity-panel
 */
import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';
import '../atoms/dot.js';

/**
 * @typedef {Object} ActivityItem
 * @property {string} type - Activity type (changeset, agent, skill, event)
 * @property {string} message - Activity message
 * @property {Date|string} time - Timestamp
 * @property {string} [icon] - Optional icon name
 */

class DashActivityPanel extends LitElement {
    static properties = {
        activities: { type: Array },
        maxItems: { type: Number, attribute: 'max-items' },
        emptyMessage: { type: String, attribute: 'empty-message' }
    };

    static styles = css`
        :host {
            display: block;
            height: 100%;
            overflow: hidden;
        }

        .container {
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            flex-shrink: 0;
        }

        .title {
            font-size: var(--font-size-xs, 11px);
            font-weight: 600;
            color: var(--text-muted, #9ca3af);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .badge {
            padding: 2px 6px;
            font-size: 10px;
            font-weight: 600;
            color: var(--text-muted, #9ca3af);
            background: var(--bg-tertiary, #e5e7eb);
            border-radius: 10px;
        }

        .list {
            flex: 1;
            overflow-y: auto;
            padding: var(--spacing-xs, 4px) 0;
        }

        .item {
            display: flex;
            align-items: flex-start;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-xs, 4px) var(--spacing-md, 12px);
            transition: background 0.1s;
        }

        .item:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.02));
        }

        .item-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: var(--bg-secondary, #f3f4f6);
            flex-shrink: 0;
            margin-top: 1px;
        }

        .item-icon.changeset { background: var(--purple-bg, #f3e8ff); color: var(--purple-color, #9333ea); }
        .item-icon.agent { background: var(--blue-bg, #dbeafe); color: var(--blue-color, #3b82f6); }
        .item-icon.skill { background: var(--green-bg, #dcfce7); color: var(--green-color, #22c55e); }
        .item-icon.error { background: var(--danger-bg, #fee2e2); color: var(--danger-color, #ef4444); }

        .item-content {
            flex: 1;
            min-width: 0;
        }

        .item-message {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-primary, #1f2937);
            line-height: 1.4;
            word-break: break-word;
        }

        .item-time {
            font-size: 10px;
            color: var(--text-muted, #9ca3af);
            margin-top: 1px;
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
            font-size: 24px;
            margin-bottom: var(--spacing-sm, 8px);
            opacity: 0.5;
        }

        .empty-text {
            font-size: var(--font-size-sm, 12px);
        }

        .clear-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xs, 4px);
            border: none;
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            color: var(--text-muted, #9ca3af);
            cursor: pointer;
            transition: all 0.15s;
        }

        .clear-btn:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
            color: var(--text-secondary, #6b7280);
        }
    `;

    constructor() {
        super();
        this.activities = [];
        this.maxItems = 50;
        this.emptyMessage = 'No activity yet';
    }

    render() {
        return html`
            <div class="container">
                <div class="header">
                    <span class="title">Activity</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${this.activities.length > 0 ? html`
                            <span class="badge">${this.activities.length}</span>
                            <button class="clear-btn" @click="${this._clearAll}" title="Clear all">
                                <dash-icon name="x" size="12"></dash-icon>
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div class="list">
                    ${this.activities.length === 0 ? html`
                        <div class="empty">
                            <span class="empty-icon">📋</span>
                            <span class="empty-text">${this.emptyMessage}</span>
                        </div>
                    ` : this.activities.map(activity => this._renderItem(activity))}
                </div>
            </div>
        `;
    }

    _renderItem(activity) {
        const iconName = this._getIconName(activity.type);
        const time = this._formatTime(activity.time);

        return html`
            <div class="item">
                <span class="item-icon ${activity.type}">
                    <dash-icon name="${iconName}" size="10"></dash-icon>
                </span>
                <div class="item-content">
                    <div class="item-message">${activity.message}</div>
                    <div class="item-time">${time}</div>
                </div>
            </div>
        `;
    }

    _getIconName(type) {
        switch (type) {
            case 'changeset': return 'git-branch';
            case 'agent': return 'user';
            case 'skill': return 'tool';
            case 'error': return 'alert-circle';
            default: return 'activity';
        }
    }

    _formatTime(time) {
        const date = time instanceof Date ? time : new Date(time);
        return date.toLocaleTimeString();
    }

    /**
     * Add an activity to the feed
     * @param {ActivityItem} activity
     */
    addActivity(activity) {
        this.activities = [activity, ...this.activities].slice(0, this.maxItems);
    }

    _clearAll() {
        this.activities = [];
        this.dispatchEvent(new CustomEvent('dash-clear', {
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('dash-activity-panel', DashActivityPanel);
export { DashActivityPanel };
