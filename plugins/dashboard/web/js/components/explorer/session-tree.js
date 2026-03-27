/**
 * Session Tree Component - Store-connected tree view of historical sessions
 * @module components/explorer/session-tree
 *
 * Displays sessions grouped by time:
 * - Today
 * - This Week
 * - This Month
 * - Older
 *
 * Active sessions are shown with a green pulse indicator.
 */

import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions, filteredHistoricalSessions } from '../../store/app-state.js';
import { SessionService } from '../../services/session-service.js';
import './session-item.js';

function _groupByTime(sessions) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const groups = {
        today: [],
        thisWeek: [],
        thisMonth: [],
        older: []
    };

    for (const session of sessions) {
        const date = new Date(session.last_activity);
        if (date >= startOfToday) {
            groups.today.push(session);
        } else if (date >= startOfWeek) {
            groups.thisWeek.push(session);
        } else if (date >= startOfMonth) {
            groups.thisMonth.push(session);
        } else {
            groups.older.push(session);
        }
    }

    return groups;
}

class SessionTree extends SignalWatcher(LitElement) {
    static properties = {
        _expandedGroups: { type: Object, state: true },
        _loading: { type: Boolean, state: true }
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

        /* Time Group Headers */
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
            font-weight: 600;
            font-size: var(--font-size-xs, 11px);
            color: var(--text-secondary, #aaa);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .time-group-header:hover {
            background: var(--bg-hover, rgba(255,255,255,0.05));
        }

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

        .time-label { flex: 1; }
        .time-count {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #666);
            opacity: 0.7;
        }

        .time-group-items.collapsed {
            display: none;
        }
    `;

    constructor() {
        super();
        this._expandedGroups = { today: true, thisWeek: true, thisMonth: false, older: false };
        this._loading = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.watchSignals([
            AppStore.historicalSessions,
            AppStore.sessionFilter
        ]);

        if (AppStore.historicalSessions.value.length === 0 && !this._loading) {
            this._loading = true;
            SessionService.loadAll().finally(() => { this._loading = false; });
        }
    }

    _toggleGroup(groupId) {
        this._expandedGroups = {
            ...this._expandedGroups,
            [groupId]: !this._expandedGroups[groupId]
        };
    }

    _handleSessionOpen(session) {
        this.dispatchEvent(new CustomEvent('session-open', {
            detail: { session },
            bubbles: true,
            composed: true
        }));
        // Also dispatch to window so app.js bridge can catch it
        window.dispatchEvent(new CustomEvent('session-open', {
            detail: { session }
        }));
    }

    _handleSessionSelect(e) {
        this._handleSessionOpen(e.detail.session);
    }

    _renderEmpty() {
        const filter = AppStore.sessionFilter.value;
        return html`
            <div class="empty-state">
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
                <div class="empty-title">No sessions</div>
                <div class="empty-text">${filter ? 'Try a different search term' : 'Past Claude sessions will appear here'}</div>
            </div>
        `;
    }

    _renderGroup(groupId, label, sessions) {
        if (!sessions.length) return '';
        const isExpanded = this._expandedGroups[groupId];

        return html`
            <div class="time-group">
                <div class="time-group-header"
                     tabindex="0"
                     role="button"
                     aria-expanded="${isExpanded}"
                     @click=${() => this._toggleGroup(groupId)}
                     @keydown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._toggleGroup(groupId); } }}>
                    <span class="expand-icon ${isExpanded ? 'expanded' : ''}">▸</span>
                    <span class="time-label">${label}</span>
                    <span class="time-count">(${sessions.length})</span>
                </div>
                <div class="time-group-items ${isExpanded ? '' : 'collapsed'}">
                    ${repeat(sessions, s => s.session_id, s => html`
                        <session-item
                            .session=${s}
                            @session-select=${this._handleSessionSelect}
                            @session-open=${(e) => this._handleSessionOpen(e.detail.session)}
                        ></session-item>
                    `)}
                </div>
            </div>
        `;
    }

    render() {
        if (this._loading) {
            return html`<div class="loading-state"><div class="loading-spinner"></div></div>`;
        }

        const sessions = filteredHistoricalSessions.value;

        if (!sessions.length) {
            return this._renderEmpty();
        }

        const groups = _groupByTime(sessions);

        return html`
            <div class="tree-container" role="tree" aria-label="Sessions">
                ${this._renderGroup('today', 'Today', groups.today)}
                ${this._renderGroup('thisWeek', 'This Week', groups.thisWeek)}
                ${this._renderGroup('thisMonth', 'This Month', groups.thisMonth)}
                ${this._renderGroup('older', 'Older', groups.older)}
            </div>
        `;
    }
}

customElements.define('session-tree', SessionTree);
export { SessionTree };
