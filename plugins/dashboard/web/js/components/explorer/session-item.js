/**
 * Session Item Component - Displays a single historical session in the tree
 * @module components/explorer/session-item
 */

import { LitElement, html, css } from 'lit';
import { treeItemBaseStyles } from './tree-item-base.js';
import { formatRelativeTime } from '../../services/formatters.js';

class SessionItem extends LitElement {
    static properties = {
        session: { type: Object },
        selected: { type: Boolean, reflect: true }
    };

    static styles = [treeItemBaseStyles, css`
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        .status-dot.active {
            background: var(--color-success, #4ade80);
            animation: pulse 2s ease-in-out infinite;
        }
        .status-dot.ended {
            background: var(--text-muted, #666);
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .item-meta {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            margin-top: 2px;
        }
        .item-time {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #888);
        }
        .message-badge {
            font-size: 10px;
            padding: 1px 5px;
            border-radius: 10px;
            background: var(--bg-tertiary, #e9ecef);
            color: var(--text-muted, #999);
            flex-shrink: 0;
        }
        .tree-item.selected {
            background: var(--bg-secondary, rgba(255,255,255,0.08));
        }
    `];

    constructor() {
        super();
        this.session = null;
        this.selected = false;
    }

    _handleClick(e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('session-select', {
            detail: { session: this.session },
            bubbles: true,
            composed: true
        }));
    }

    _handleDoubleClick(e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('session-open', {
            detail: { session: this.session },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        if (!this.session) return '';
        const { session_id, is_active, name, first_message_preview, last_activity, message_count } = this.session;
        const displayName = name || first_message_preview || `Session ${session_id?.slice(0, 8)}`;

        return html`
            <div class="tree-item ${this.selected ? 'selected' : ''}"
                 @click=${this._handleClick}
                 @dblclick=${this._handleDoubleClick}>
                <span class="expand-icon"></span>
                <span class="status-dot ${is_active ? 'active' : 'ended'}"></span>
                <div class="item-content">
                    <div class="item-name">${displayName}</div>
                    <div class="item-meta">
                        <span class="item-time">${formatRelativeTime(last_activity)}</span>
                    </div>
                </div>
                ${message_count ? html`<span class="message-badge">${message_count}</span>` : ''}
            </div>
        `;
    }
}

customElements.define('session-item', SessionItem);
export { SessionItem };
