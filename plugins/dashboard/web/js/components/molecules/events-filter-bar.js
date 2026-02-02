/**
 * Events Filter Bar Component - Category quick filter chips
 * @module components/molecules/events-filter-bar
 *
 * Provides category filter chips for:
 * - All, Changesets, Activity, Conversation, Graph, System
 * - Shows count per category
 * - Active state styling
 */

import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions, sseEventStats } from '../../store/app-state.js';
import '../atoms/icon.js';

/**
 * Category definitions
 */
const CATEGORIES = [
    { id: 'all', label: 'All', icon: 'layers' },
    { id: 'changeset', label: 'Changesets', icon: 'git-commit' },
    { id: 'activity', label: 'Activity', icon: 'activity' },
    { id: 'conversation', label: 'Conversation', icon: 'message-circle' },
    { id: 'graph', label: 'Graph', icon: 'git-branch' },
    { id: 'system', label: 'System', icon: 'settings' }
];

class EventsFilterBar extends SignalWatcher(LitElement) {
    static styles = css`
        :host {
            display: block;
        }

        .filter-bar {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-xs, 4px) 0;
        }

        .filter-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            border: 1px solid var(--border-color, #3c3c3c);
            border-radius: var(--radius-full, 9999px);
            background: transparent;
            color: var(--text-muted, #9ca3af);
            font-size: var(--font-size-xs, 10px);
            font-weight: 500;
            cursor: pointer;
            transition: all var(--transition-fast, 150ms ease);
            white-space: nowrap;
        }

        .filter-chip:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.05));
            border-color: var(--border-hover, #4c4c4c);
            color: var(--text-primary, #e0e0e0);
        }

        .filter-chip.active {
            background: var(--accent-color-alpha, rgba(59, 130, 246, 0.15));
            border-color: var(--accent-color, #3b82f6);
            color: var(--accent-color, #3b82f6);
        }

        .filter-chip .count {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 16px;
            height: 14px;
            padding: 0 4px;
            background: var(--bg-tertiary, rgba(0, 0, 0, 0.2));
            border-radius: 7px;
            font-size: 9px;
        }

        .filter-chip.active .count {
            background: var(--accent-color, #3b82f6);
            color: white;
        }

        /* Category-specific colors for active state */
        .filter-chip.active[data-category="changeset"] {
            --accent-color: var(--info-color, #3b82f6);
            --accent-color-alpha: rgba(59, 130, 246, 0.15);
        }
        .filter-chip.active[data-category="activity"] {
            --accent-color: var(--warning-color, #f59e0b);
            --accent-color-alpha: rgba(245, 158, 11, 0.15);
        }
        .filter-chip.active[data-category="conversation"] {
            --accent-color: var(--accent-color, #8b5cf6);
            --accent-color-alpha: rgba(139, 92, 246, 0.15);
        }
        .filter-chip.active[data-category="graph"] {
            --accent-color: var(--success-color, #22c55e);
            --accent-color-alpha: rgba(34, 197, 94, 0.15);
        }
        .filter-chip.active[data-category="system"] {
            --accent-color: var(--text-muted, #6b7280);
            --accent-color-alpha: rgba(107, 114, 128, 0.15);
        }
    `;

    connectedCallback() {
        super.connectedCallback();
        this.watchSignals([
            AppStore.sseEventsFilterType,
            AppStore.sseEvents,
            AppStore.sseHiddenEventTypes
        ]);
    }

    /**
     * Handle filter chip click
     * @private
     */
    _handleFilterClick(categoryId) {
        Actions.setSSEEventsFilterType(categoryId);

        this.dispatchEvent(new CustomEvent('filter-change', {
            detail: { category: categoryId },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Render a filter chip
     * @private
     */
    _renderChip(category) {
        const activeFilter = AppStore.sseEventsFilterType.value;
        const isActive = activeFilter === category.id;
        const stats = sseEventStats.value;
        const count = stats.byCategory[category.id] || 0;

        return html`
            <button
                class="filter-chip ${isActive ? 'active' : ''}"
                data-category="${category.id}"
                @click=${() => this._handleFilterClick(category.id)}
                aria-pressed="${isActive}"
            >
                <dash-icon name="${category.icon}" size="10"></dash-icon>
                <span>${category.label}</span>
                <span class="count">${count}</span>
            </button>
        `;
    }

    render() {
        return html`
            <div class="filter-bar" role="group" aria-label="Event category filters">
                ${CATEGORIES.map(cat => this._renderChip(cat))}
            </div>
        `;
    }
}

customElements.define('events-filter-bar', EventsFilterBar);
export { EventsFilterBar, CATEGORIES };
