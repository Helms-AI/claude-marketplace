/**
 * Events Panel Component - Main SSE events monitor panel
 * @module components/organisms/events-panel
 *
 * Displays real-time SSE events with:
 * - Filter toolbar (search input + action buttons)
 * - EventsFilterBar for category quick-filters
 * - Stats display (total/rate/filtered counts)
 * - Paused banner with resume button
 * - Event list with auto-scroll (pauses when user scrolls up)
 * - Empty state when no events
 */

import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions, filteredSSEEvents, sseEventStats } from '../../store/app-state.js';
import '../atoms/icon.js';
import '../atoms/button.js';
import '../atoms/spinner.js';
import '../molecules/search-input.js';
import '../molecules/events-filter-bar.js';
import '../molecules/events-settings-dropdown.js';
import './event-item.js';

class EventsPanel extends SignalWatcher(LitElement) {
    static properties = {
        _userScrolledUp: { type: Boolean, state: true }
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow: hidden;
        }

        /* Header / Toolbar */
        .toolbar {
            display: flex;
            flex-direction: column;
            padding: var(--spacing-sm, 8px);
            border-bottom: 1px solid var(--border-color, #3c3c3c);
            flex-shrink: 0;
            gap: var(--spacing-xs, 4px);
        }

        .toolbar-row {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
        }

        .search-wrapper {
            flex: 1;
        }

        dash-search-input {
            width: 100%;
        }

        /* Stats bar */
        .stats-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            background: var(--bg-secondary, rgba(255, 255, 255, 0.02));
            border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
            flex-shrink: 0;
        }

        .stats-left, .stats-right {
            display: flex;
            align-items: center;
            gap: var(--spacing-md, 12px);
        }

        .stat {
            font-size: var(--font-size-xs, 10px);
            color: var(--text-muted, #6b7280);
        }

        .stat .value {
            color: var(--text-secondary, #b0b0b0);
            font-weight: 500;
            font-variant-numeric: tabular-nums;
        }

        .stat .rate {
            color: var(--success-color, #22c55e);
        }

        /* Paused banner */
        .paused-banner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            background: var(--warning-color-alpha, rgba(245, 158, 11, 0.1));
            border-bottom: 1px solid var(--warning-color, #f59e0b);
            flex-shrink: 0;
        }

        .paused-banner .message {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            font-size: var(--font-size-xs, 11px);
            color: var(--warning-color, #f59e0b);
        }

        .paused-banner .unread-count {
            background: var(--warning-color, #f59e0b);
            color: var(--bg-primary, #1e1e1e);
            padding: 0 6px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 10px;
        }

        .resume-btn {
            padding: 2px 8px;
            font-size: var(--font-size-xs, 10px);
            background: var(--warning-color, #f59e0b);
            color: var(--bg-primary, #1e1e1e);
            border: none;
            border-radius: var(--radius-sm, 4px);
            cursor: pointer;
            font-weight: 500;
        }

        .resume-btn:hover {
            filter: brightness(1.1);
        }

        /* Event list */
        .event-list {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
        }

        .event-list::-webkit-scrollbar {
            width: 6px;
        }

        .event-list::-webkit-scrollbar-track {
            background: transparent;
        }

        .event-list::-webkit-scrollbar-thumb {
            background: var(--bg-tertiary, #3c3c3c);
            border-radius: 3px;
        }

        .event-list::-webkit-scrollbar-thumb:hover {
            background: var(--text-muted, #6b7280);
        }

        /* Empty state */
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: var(--spacing-xl, 32px);
            text-align: center;
            color: var(--text-muted, #6b7280);
        }

        .empty-state dash-icon {
            margin-bottom: var(--spacing-sm, 8px);
            opacity: 0.5;
        }

        .empty-state .title {
            font-size: var(--font-size-sm, 13px);
            font-weight: 500;
            color: var(--text-secondary, #b0b0b0);
            margin-bottom: var(--spacing-xs, 4px);
        }

        .empty-state .description {
            font-size: var(--font-size-xs, 11px);
        }

        /* Loading state */
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-lg, 24px);
        }
    `;

    constructor() {
        super();
        this._userScrolledUp = false;
        this._eventListRef = null;
        this._autoScrollEnabled = true;
    }

    connectedCallback() {
        super.connectedCallback();
        this.watchSignals([
            AppStore.sseEvents,
            AppStore.sseEventsFilter,
            AppStore.sseEventsFilterType,
            AppStore.sseEventsPaused,
            AppStore.sseEventsPerSecond,
            AppStore.sseUnreadCount,
            AppStore.sseHiddenEventTypes
        ]);
    }

    firstUpdated() {
        this._eventListRef = this.shadowRoot.querySelector('.event-list');
        if (this._eventListRef) {
            this._eventListRef.addEventListener('scroll', this._handleScroll.bind(this));
        }
    }

    updated(changedProps) {
        super.updated(changedProps);

        // Auto-scroll to top when new events arrive (if not paused)
        if (!AppStore.sseEventsPaused.value && this._eventListRef && !this._userScrolledUp) {
            // Events are added to the top, so scroll to top
            this._eventListRef.scrollTop = 0;
        }
    }

    /**
     * Handle scroll events - pause auto-scroll when user scrolls away from top,
     * auto-resume when user scrolls back to top
     * @private
     */
    _handleScroll() {
        if (!this._eventListRef) return;

        const { scrollTop } = this._eventListRef;

        // If user scrolled away from top (events are newest-first at top)
        if (scrollTop > 50) {
            if (!this._userScrolledUp) {
                this._userScrolledUp = true;
                Actions.setSSEEventsPaused(true);
            }
        } else if (scrollTop <= 10) {
            // Auto-resume when scrolled back to top
            if (this._userScrolledUp) {
                this._userScrolledUp = false;
                Actions.setSSEEventsPaused(false);
            }
        }
    }

    /**
     * Handle search input change
     * @private
     */
    _handleSearchChange(e) {
        const filter = e.detail?.value || e.target?.value || '';
        Actions.setSSEEventsFilter(filter);
    }

    /**
     * Resume auto-scroll
     * @private
     */
    _handleResume() {
        this._userScrolledUp = false;
        Actions.setSSEEventsPaused(false);

        // Scroll to top
        if (this._eventListRef) {
            this._eventListRef.scrollTop = 0;
        }
    }

    /**
     * Clear search filter
     * @private
     */
    _handleClearFilter() {
        Actions.setSSEEventsFilter('');
    }

    render() {
        const events = filteredSSEEvents.value;
        const stats = sseEventStats.value;
        const isPaused = AppStore.sseEventsPaused.value;
        const unreadCount = AppStore.sseUnreadCount.value;
        const rate = AppStore.sseEventsPerSecond.value;
        const filter = AppStore.sseEventsFilter.value;

        return html`
            <!-- Toolbar -->
            <div class="toolbar">
                <div class="toolbar-row">
                    <div class="search-wrapper">
                        <dash-search-input
                            placeholder="Filter events..."
                            .value=${filter}
                            @input=${this._handleSearchChange}
                            @clear=${this._handleClearFilter}
                        ></dash-search-input>
                    </div>
                    <events-settings-dropdown></events-settings-dropdown>
                </div>
                <events-filter-bar></events-filter-bar>
            </div>

            <!-- Stats bar -->
            <div class="stats-bar">
                <div class="stats-left">
                    <span class="stat">
                        Showing <span class="value">${events.length}</span> of <span class="value">${stats.visible}</span>
                    </span>
                </div>
                <div class="stats-right">
                    <span class="stat">
                        <span class="value rate">${rate}/s</span>
                    </span>
                </div>
            </div>

            <!-- Paused banner -->
            ${isPaused ? html`
                <div class="paused-banner">
                    <div class="message">
                        <dash-icon name="pause-circle" size="14"></dash-icon>
                        <span>Auto-scroll paused</span>
                        ${unreadCount > 0 ? html`
                            <span class="unread-count">+${unreadCount} new</span>
                        ` : ''}
                    </div>
                    <button class="resume-btn" @click=${this._handleResume}>
                        Resume
                    </button>
                </div>
            ` : ''}

            <!-- Event list -->
            <div class="event-list">
                ${events.length === 0
                    ? html`
                        <div class="empty-state">
                            <dash-icon name="radio" size="32"></dash-icon>
                            <div class="title">No events yet</div>
                            <div class="description">
                                ${filter
                                    ? 'No events match your filter'
                                    : 'Events will appear here as they arrive'
                                }
                            </div>
                        </div>
                    `
                    : events.map(event => html`
                        <event-item .event=${event}></event-item>
                    `)
                }
            </div>
        `;
    }
}

customElements.define('events-panel', EventsPanel);
export { EventsPanel };
