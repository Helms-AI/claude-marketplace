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
    formatBytes
};
