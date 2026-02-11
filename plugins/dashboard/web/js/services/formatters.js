/**
 * Formatters Service - Shared formatting utilities
 * @module services/formatters
 *
 * Common formatting functions used across dashboard components.
 * Extracted from agents.js and skills.js to reduce duplication.
 */

/**
 * Format a date as relative time (e.g., "2 hours ago", "Just now")
 * @param {Date|string} date - Date to format
 * @returns {string} Human-readable relative time
 */
export function formatRelativeTime(date) {
    if (!date) return 'Never';

    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid date';

    const now = new Date();
    const diffMs = now - dateObj;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;

    return dateObj.toLocaleDateString();
}

/**
 * Format a date as a short time (e.g., "14:32")
 * @param {Date|string} date - Date to format
 * @returns {string} Short time string
 */
export function formatShortTime(date) {
    if (!date) return '';

    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    return dateObj.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format a date as a full timestamp (e.g., "Jan 15, 2024 14:32")
 * @param {Date|string} date - Date to format
 * @returns {string} Full timestamp string
 */
export function formatTimestamp(date) {
    if (!date) return '';

    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    return dateObj.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Generate initials from a name
 * @param {string} name - Full name
 * @returns {string} Up to 2 character initials
 */
export function getInitials(name) {
    if (!name || typeof name !== 'string') return '?';

    return name
        .trim()
        .split(/\s+/)
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Format an event type string for display
 * @param {string} eventType - Event type (e.g., "tool_use", "agent_invoked")
 * @returns {string} Human-readable event type
 */
export function formatEventType(eventType) {
    if (!eventType || typeof eventType !== 'string') return '';

    return eventType
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Get display name for a domain
 * @param {string} domain - Domain identifier (e.g., "user-experience")
 * @returns {string} Human-readable domain name
 */
export function getDomainDisplayName(domain) {
    if (!domain || typeof domain !== 'string') return '';

    return domain.replace(/-/g, ' ');
}

/**
 * Get CSS class for a domain
 * @param {string} domain - Domain identifier
 * @returns {string} CSS class name
 */
export function getDomainClass(domain) {
    if (!domain || typeof domain !== 'string') return '';

    return `domain-${domain}`;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text || '';

    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format a number with abbreviation (e.g., 1.2K, 3.4M)
 * @param {number} num - Number to format
 * @returns {string} Abbreviated number string
 */
export function formatNumber(num) {
    if (num === null || num === undefined) return '0';

    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes - Bytes to format
 * @returns {string} Human-readable size
 */
export function formatBytes(bytes) {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i];
}

// ============================================================
// Time Period Utilities for Changeset Grouping
// ============================================================

/**
 * Check if two dates are the same day
 * @param {Date} d1 - First date
 * @param {Date} d2 - Second date
 * @returns {boolean} True if same day
 */
export function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

/**
 * Check if d1 is yesterday relative to d2
 * @param {Date} d1 - Date to check
 * @param {Date} d2 - Reference date (usually now)
 * @returns {boolean} True if d1 is yesterday
 */
export function isYesterday(d1, d2) {
    const yesterday = new Date(d2);
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(d1, yesterday);
}

/**
 * Get the start of the week (Monday) for a given date
 * @param {Date} date - Date to get week start for
 * @returns {Date} Monday of that week
 */
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    // Adjust: Sunday (0) becomes 6, Monday (1) becomes 0, etc.
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Check if two dates are in the same week (Monday-Sunday)
 * @param {Date} d1 - First date
 * @param {Date} d2 - Second date
 * @returns {boolean} True if same week
 */
export function isSameWeek(d1, d2) {
    const week1 = getWeekStart(d1);
    const week2 = getWeekStart(d2);
    return week1.getTime() === week2.getTime();
}

/**
 * Check if d1 is in the week before d2's week
 * @param {Date} d1 - Date to check
 * @param {Date} d2 - Reference date (usually now)
 * @returns {boolean} True if d1 is in last week
 */
export function isLastWeek(d1, d2) {
    const lastWeekStart = getWeekStart(d2);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 7);
    return d1 >= lastWeekStart && d1 < lastWeekEnd;
}

/**
 * Check if two dates are in the same month
 * @param {Date} d1 - First date
 * @param {Date} d2 - Second date
 * @returns {boolean} True if same month and year
 */
export function isSameMonth(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth();
}

/**
 * Check if two dates are in the same year
 * @param {Date} d1 - First date
 * @param {Date} d2 - Second date
 * @returns {boolean} True if same year
 */
export function isSameYear(d1, d2) {
    return d1.getFullYear() === d2.getFullYear();
}

/**
 * Get the time period key for a date
 * Used for grouping changesets by time hierarchy
 * @param {Date|string} date - Date to categorize
 * @returns {string} Time period key
 */
export function getTimePeriod(date) {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'unknown';

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    if (dateObj >= oneHourAgo) return 'last-hour';
    if (isSameDay(dateObj, now)) return 'earlier-today';
    if (isYesterday(dateObj, now)) return 'yesterday';
    if (isSameWeek(dateObj, now)) return 'this-week';
    if (isLastWeek(dateObj, now)) return 'last-week';
    if (isSameMonth(dateObj, now)) return 'this-month';
    if (isSameYear(dateObj, now)) return dateObj.toLocaleString('default', { month: 'long' });
    return dateObj.getFullYear().toString();
}

/**
 * Format a week as a date range (e.g., "Jan 27-31" or "Jan 27 - Feb 2")
 * @param {Date} date - Any date within the week
 * @returns {string} Formatted week range
 */
export function formatWeekRange(date) {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startMonth = weekStart.toLocaleString('default', { month: 'short' });
    const endMonth = weekEnd.toLocaleString('default', { month: 'short' });
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();

    if (startMonth === endMonth) {
        return `${startMonth} ${startDay}-${endDay}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

/**
 * Get the week range for "this week" or "last week" labels
 * @param {string} periodKey - 'this-week' or 'last-week'
 * @returns {string} Formatted week range
 */
export function getWeekLabel(periodKey) {
    const now = new Date();
    if (periodKey === 'this-week') {
        return formatWeekRange(now);
    }
    if (periodKey === 'last-week') {
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        return formatWeekRange(lastWeek);
    }
    return '';
}

// Export all formatters as a namespace for convenience
export const Formatters = {
    formatRelativeTime,
    formatShortTime,
    formatTimestamp,
    getInitials,
    formatEventType,
    getDomainDisplayName,
    getDomainClass,
    truncateText,
    formatNumber,
    formatBytes,
    // Time period utilities
    isSameDay,
    isYesterday,
    isSameWeek,
    isLastWeek,
    isSameMonth,
    isSameYear,
    getTimePeriod,
    formatWeekRange,
    getWeekLabel
};
