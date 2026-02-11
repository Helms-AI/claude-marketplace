/**
 * Activity Timeline Organism - Chronological view of activities
 * @module components/organisms/activity-timeline
 *
 * Groups activities by time and displays them in chronological order
 * with filtering support.
 */
import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, filteredToolActivities } from '../../store/app-state.js';
import '../atoms/empty-state.js';
import '../molecules/activity-group.js';
import '../molecules/search-input.js';

/**
 * Time group definitions
 */
const TIME_GROUPS = [
    { id: 'running', label: 'Running', icon: 'play-circle', maxAge: 0 },
    { id: 'just-now', label: 'Just Now', icon: 'zap', maxAge: 60000 },           // 1 minute
    { id: 'minutes-ago', label: 'Minutes Ago', icon: 'clock', maxAge: 300000 },  // 5 minutes
    { id: 'recent', label: 'Recent', icon: 'clock-3', maxAge: 1800000 },         // 30 minutes
    { id: 'earlier', label: 'Earlier', icon: 'history', maxAge: 86400000 },      // 24 hours
    { id: 'older', label: 'Older', icon: 'archive', maxAge: Infinity }
];

class ActivityTimeline extends SignalWatcher(LitElement) {
    static properties = {
        showFilter: { type: Boolean, attribute: 'show-filter' },
        maxActivities: { type: Number, attribute: 'max-activities' }
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow: hidden;
        }

        .filter-container {
            padding: var(--spacing-sm, 8px);
            border-bottom: 1px solid var(--border-color, #3c3c3c);
        }

        .timeline-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
        }

        .timeline-groups {
            display: flex;
            flex-direction: column;
        }

        .empty-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: var(--spacing-xl, 24px);
        }

        /* Custom scrollbar */
        .timeline-content::-webkit-scrollbar {
            width: 8px;
        }

        .timeline-content::-webkit-scrollbar-track {
            background: transparent;
        }

        .timeline-content::-webkit-scrollbar-thumb {
            background: var(--border-color, #3c3c3c);
            border-radius: 4px;
        }

        .timeline-content::-webkit-scrollbar-thumb:hover {
            background: var(--text-muted, #9ca3af);
        }
    `;

    constructor() {
        super();
        this.showFilter = true;
        this.maxActivities = 100;
    }

    connectedCallback() {
        super.connectedCallback();
        this.watchSignals([
            AppStore.conversationEvents,
            AppStore.activitiesFilter
        ]);
    }

    /**
     * Group activities by time
     * @private
     */
    _groupByTime(activities) {
        const now = Date.now();
        const groups = new Map();

        // Initialize all groups
        TIME_GROUPS.forEach(group => {
            groups.set(group.id, { ...group, activities: [] });
        });

        // Sort activities by timestamp (newest first)
        const sorted = [...activities].sort((a, b) =>
            (b.timestamp || 0) - (a.timestamp || 0)
        );

        // Categorize each activity
        sorted.forEach(activity => {
            const status = activity.status || 'success';
            const timestamp = activity.timestamp || 0;
            const age = now - timestamp;

            // Running activities go in the "running" group
            if (status === 'running') {
                groups.get('running').activities.push(activity);
                return;
            }

            // Find the appropriate time group
            for (const timeGroup of TIME_GROUPS) {
                if (timeGroup.id === 'running') continue;
                if (age <= timeGroup.maxAge) {
                    groups.get(timeGroup.id).activities.push(activity);
                    break;
                }
            }
        });

        // Filter out empty groups (except "running" which we always show if non-empty)
        return Array.from(groups.values()).filter(group =>
            group.activities.length > 0
        );
    }

    /**
     * Handle filter change
     * @private
     */
    _handleFilterChange(e) {
        const filter = e.detail?.value || e.target?.value || '';
        AppStore.activitiesFilter.value = filter;
    }

    render() {
        const activities = filteredToolActivities.value.slice(0, this.maxActivities);
        const groups = this._groupByTime(activities);

        const isEmpty = groups.length === 0;

        return html`
            ${this.showFilter ? html`
                <div class="filter-container">
                    <dash-search-input
                        placeholder="Filter activities..."
                        value="${AppStore.activitiesFilter.value}"
                        @input=${this._handleFilterChange}
                    ></dash-search-input>
                </div>
            ` : ''}

            <div class="timeline-content">
                ${isEmpty ? html`
                    <div class="empty-container">
                        <dash-empty-state
                            icon="activity"
                            title="No activities"
                            description="Tool activities will appear here as they run"
                            variant="compact"
                        ></dash-empty-state>
                    </div>
                ` : html`
                    <div class="timeline-groups">
                        ${groups.map(group => html`
                            <activity-group
                                label="${group.label}"
                                icon="${group.icon}"
                                .activities=${group.activities}
                                ?expanded=${group.id === 'running' || group.id === 'just-now'}
                            ></activity-group>
                        `)}
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('activity-timeline', ActivityTimeline);
export { ActivityTimeline };
