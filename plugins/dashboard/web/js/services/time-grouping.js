/**
 * Time Grouping Service - Groups changesets by time-based hierarchy
 * @module services/time-grouping
 *
 * Provides time-based grouping for changeset treeview:
 * - Yearly → Monthly → Weekly → Daily → Today → Hourly
 * - Active changesets separated from completed
 * - Empty groups hidden by default
 */

import {
    getTimePeriod,
    getWeekLabel,
    isSameDay,
    isYesterday,
    isSameWeek,
    isLastWeek,
    isSameMonth,
    isSameYear
} from './formatters.js';

/**
 * @typedef {Object} TimeGroup
 * @property {string} id - Unique identifier (e.g., 'today.last-hour')
 * @property {string} label - Display label
 * @property {string} icon - Icon identifier (clock, calendar, etc.)
 * @property {number} level - Nesting depth (0=top, 1=sub, 2=sub-sub)
 * @property {Array} items - Changesets directly in this group
 * @property {TimeGroup[]} children - Nested time groups
 * @property {boolean} defaultExpanded - Whether to expand by default
 * @property {number} totalCount - Total items including children
 */

/**
 * Time period configuration
 * Order determines display priority (top to bottom)
 */
const TIME_PERIODS = [
    {
        key: 'today',
        label: 'Today',
        icon: 'calendar',
        level: 0,
        match: (date, now) => isSameDay(date, now),
        children: [
            {
                key: 'last-hour',
                label: 'Last Hour',
                icon: 'clock',
                level: 1,
                match: (date, now) => date >= new Date(now.getTime() - 60 * 60 * 1000),
                defaultExpanded: true
            },
            {
                key: 'earlier-today',
                label: 'Earlier',
                icon: 'clock',
                level: 1,
                match: (date, now) => isSameDay(date, now) && date < new Date(now.getTime() - 60 * 60 * 1000),
                defaultExpanded: false
            }
        ],
        defaultExpanded: true
    },
    {
        key: 'yesterday',
        label: 'Yesterday',
        icon: 'calendar',
        level: 0,
        match: (date, now) => isYesterday(date, now),
        defaultExpanded: false
    },
    {
        key: 'this-week',
        labelFn: () => `This Week (${getWeekLabel('this-week')})`,
        icon: 'calendar',
        level: 0,
        match: (date, now) => isSameWeek(date, now) && !isSameDay(date, now) && !isYesterday(date, now),
        defaultExpanded: false
    },
    {
        key: 'last-week',
        labelFn: () => `Last Week (${getWeekLabel('last-week')})`,
        icon: 'calendar',
        level: 0,
        match: (date, now) => isLastWeek(date, now),
        defaultExpanded: false
    }
];

/**
 * Check if a changeset is considered "active"
 * @param {Object} changeset - Changeset object
 * @returns {boolean} True if active
 */
function isActiveChangeset(changeset) {
    return changeset.status === 'active' ||
           changeset.phase === 'active' ||
           changeset.status === 'in-progress' ||
           changeset.phase === 'in-progress';
}

/**
 * Parse date from changeset (handles various date field names)
 * @param {Object} changeset - Changeset object
 * @returns {Date} Parsed date
 */
function getChangesetDate(changeset) {
    const dateStr = changeset.createdAt ||
                    changeset.created_at ||
                    changeset.timestamp ||
                    changeset.startTime ||
                    changeset.start_time;

    if (!dateStr) {
        // Extract from ID if in format YYYYMMDD-HHMMSS-name
        const match = changeset.id?.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/);
        if (match) {
            const [, year, month, day, hour, min, sec] = match;
            return new Date(year, month - 1, day, hour, min, sec);
        }
        return new Date(); // Default to now if no date found
    }

    return new Date(dateStr);
}

/**
 * Build time group tree from completed changesets
 * @param {Array} changesets - Array of completed changesets
 * @returns {TimeGroup[]} Hierarchical time groups
 */
function buildTimeGroupTree(changesets) {
    const now = new Date();
    const groups = [];
    const monthGroups = new Map(); // For grouping by month
    const yearGroups = new Map();  // For grouping by year

    // Sort changesets by date descending
    const sorted = [...changesets].sort((a, b) => {
        return getChangesetDate(b) - getChangesetDate(a);
    });

    // Process each changeset
    for (const changeset of sorted) {
        const date = getChangesetDate(changeset);
        let matched = false;

        // Check against defined time periods
        for (const period of TIME_PERIODS) {
            if (period.match(date, now)) {
                // Find or create this period's group
                let group = groups.find(g => g.id === period.key);
                if (!group) {
                    group = createGroup(period);
                    groups.push(group);
                }

                // Check children (e.g., "last-hour" under "today")
                if (period.children) {
                    let childMatched = false;
                    for (const childPeriod of period.children) {
                        if (childPeriod.match(date, now)) {
                            let childGroup = group.children.find(c => c.id === `${period.key}.${childPeriod.key}`);
                            if (!childGroup) {
                                childGroup = createGroup(childPeriod, period.key);
                                group.children.push(childGroup);
                            }
                            childGroup.items.push(changeset);
                            childMatched = true;
                            break;
                        }
                    }
                    if (!childMatched) {
                        // Put in parent if no child matches
                        group.items.push(changeset);
                    }
                } else {
                    group.items.push(changeset);
                }

                matched = true;
                break;
            }
        }

        // If not matched to recent periods, group by month/year
        if (!matched) {
            if (isSameYear(date, now)) {
                // Group by month
                const monthKey = date.toLocaleString('default', { month: 'long' });
                let monthGroup = monthGroups.get(monthKey);
                if (!monthGroup) {
                    monthGroup = {
                        id: `month-${date.getMonth()}`,
                        label: monthKey,
                        icon: 'calendar-days',
                        level: 0,
                        items: [],
                        children: [],
                        defaultExpanded: false,
                        totalCount: 0,
                        sortOrder: date.getMonth()
                    };
                    monthGroups.set(monthKey, monthGroup);
                }
                monthGroup.items.push(changeset);
            } else {
                // Group by year
                const yearKey = date.getFullYear().toString();
                let yearGroup = yearGroups.get(yearKey);
                if (!yearGroup) {
                    yearGroup = {
                        id: `year-${yearKey}`,
                        label: yearKey,
                        icon: 'calendar-range',
                        level: 0,
                        items: [],
                        children: [],
                        defaultExpanded: false,
                        totalCount: 0,
                        sortOrder: date.getFullYear()
                    };
                    yearGroups.set(yearKey, yearGroup);
                }
                yearGroup.items.push(changeset);
            }
        }
    }

    // Calculate totals for each group
    for (const group of groups) {
        group.totalCount = group.items.length +
            group.children.reduce((sum, child) => sum + child.items.length, 0);
    }

    // Add month groups (sorted by month descending, but after recent periods)
    const sortedMonths = Array.from(monthGroups.values())
        .sort((a, b) => b.sortOrder - a.sortOrder);
    for (const monthGroup of sortedMonths) {
        monthGroup.totalCount = monthGroup.items.length;
        groups.push(monthGroup);
    }

    // Add year groups (sorted by year descending)
    const sortedYears = Array.from(yearGroups.values())
        .sort((a, b) => b.sortOrder - a.sortOrder);
    for (const yearGroup of sortedYears) {
        yearGroup.totalCount = yearGroup.items.length;
        groups.push(yearGroup);
    }

    return groups;
}

/**
 * Create a TimeGroup from period config
 * @param {Object} period - Period configuration
 * @param {string} parentKey - Parent group key (optional)
 * @returns {TimeGroup} New time group
 */
function createGroup(period, parentKey = null) {
    const id = parentKey ? `${parentKey}.${period.key}` : period.key;
    return {
        id,
        label: period.labelFn ? period.labelFn() : period.label,
        icon: period.icon,
        level: period.level,
        items: [],
        children: [],
        defaultExpanded: period.defaultExpanded ?? false,
        totalCount: 0
    };
}

/**
 * Groups changesets into time-based hierarchy
 * @param {Array} changesets - Flat array of changesets
 * @returns {Object} { active: [], timeGroups: TimeGroup[] }
 */
export function groupChangesetsByTime(changesets) {
    if (!Array.isArray(changesets) || changesets.length === 0) {
        return { active: [], timeGroups: [] };
    }

    // Separate active from completed
    const active = changesets.filter(isActiveChangeset);
    const completed = changesets.filter(cs => !isActiveChangeset(cs));

    // Build time group tree from completed
    const timeGroups = buildTimeGroupTree(completed);

    return { active, timeGroups };
}

/**
 * Get default expansion state for time groups
 * @returns {Object} Map of group IDs to expansion state
 */
export function getDefaultExpansionState() {
    const state = {};

    for (const period of TIME_PERIODS) {
        state[period.key] = period.defaultExpanded ?? false;
        if (period.children) {
            for (const child of period.children) {
                state[`${period.key}.${child.key}`] = child.defaultExpanded ?? false;
            }
        }
    }

    return state;
}

/**
 * Get the icon name for a time period
 * @param {string} icon - Icon identifier
 * @returns {string} Lucide icon name
 */
export function getTimeIcon(icon) {
    const iconMap = {
        'clock': 'clock',
        'calendar': 'calendar',
        'calendar-days': 'calendar-days',
        'calendar-range': 'calendar-range'
    };
    return iconMap[icon] || 'calendar';
}

// Export utilities for testing
export const _internal = {
    isActiveChangeset,
    getChangesetDate,
    buildTimeGroupTree,
    createGroup,
    TIME_PERIODS
};
