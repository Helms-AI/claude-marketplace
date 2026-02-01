/**
 * Error Service - Manages error state and events
 * @module services/error-service
 */
import { signal, computed } from '@preact/signals-core';

/**
 * @typedef {Object} ErrorEntry
 * @property {number} id - Error ID
 * @property {string} tool - Tool that caused the error
 * @property {string} message - Error message
 * @property {string|null} details - Full error details
 * @property {string} timestamp - ISO timestamp
 * @property {string} source - 'main' or agent ID
 * @property {string|null} messageId - Associated message ID
 */

/**
 * Common error patterns to detect
 */
const ERROR_PATTERNS = [
    /error:/i,
    /failed:/i,
    /exception:/i,
    /exit code [1-9]/i,
    /command not found/i,
    /permission denied/i,
    /no such file/i,
    /cannot find/i,
    /timeout/i,
    /ENOENT/i,
    /EACCES/i,
    /ETIMEDOUT/i
];

class ErrorServiceClass {
    /** @type {import('@preact/signals-core').Signal<ErrorEntry[]>} */
    errors = signal([]);

    /** Maximum errors to keep */
    maxErrors = 100;

    /** Error ID counter */
    _idCounter = 0;

    /** Event callbacks */
    _onError = null;
    _onClear = null;

    // Computed values
    count = computed(() => this.errors.value.length);
    hasErrors = computed(() => this.errors.value.length > 0);

    /**
     * Set callback for new errors
     * @param {Function} callback
     */
    onError(callback) {
        this._onError = callback;
    }

    /**
     * Set callback for clear events
     * @param {Function} callback
     */
    onClear(callback) {
        this._onClear = callback;
    }

    /**
     * Add an error
     * @param {Object} error - Error object
     * @returns {ErrorEntry} The created error entry
     */
    addError(error) {
        const entry = {
            id: ++this._idCounter,
            tool: error.tool || 'Unknown',
            message: error.message || 'An error occurred',
            details: error.details || null,
            timestamp: error.timestamp || new Date().toISOString(),
            source: error.source || 'main',
            messageId: error.messageId || null
        };

        // Add to beginning (newest first)
        const newErrors = [entry, ...this.errors.value];

        // Trim to max size
        if (newErrors.length > this.maxErrors) {
            this.errors.value = newErrors.slice(0, this.maxErrors);
        } else {
            this.errors.value = newErrors;
        }

        if (this._onError) {
            this._onError(entry);
        }

        return entry;
    }

    /**
     * Parse a tool result to extract error information
     * @param {Object} toolResult - The tool_result block
     * @param {string} toolName - Name of the tool
     * @param {string} source - 'main' or agent ID
     * @returns {Object|null} Error object or null if not an error
     */
    parseToolResult(toolResult, toolName, source) {
        if (!toolResult) return null;

        // Check for explicit error flag
        const isError = toolResult.is_error === true;

        // Check for error patterns in content
        const content = typeof toolResult.content === 'string'
            ? toolResult.content
            : JSON.stringify(toolResult.content || '');

        const hasErrorPattern = ERROR_PATTERNS.some(pattern => pattern.test(content));

        if (!isError && !hasErrorPattern) {
            return null;
        }

        // Extract error message
        let message = 'Tool execution failed';
        let details = null;

        if (isError) {
            message = this._extractErrorMessage(content);
            details = content.length > 200 ? content : null;
        } else if (hasErrorPattern) {
            // Find the matching error line
            const lines = content.split('\n');
            for (const line of lines) {
                if (ERROR_PATTERNS.some(p => p.test(line))) {
                    message = line.trim().substring(0, 100);
                    break;
                }
            }
            if (content.length > message.length + 50) {
                details = content;
            }
        }

        return {
            tool: toolName,
            message: message,
            details: details,
            timestamp: new Date().toISOString(),
            source: source
        };
    }

    /**
     * Extract a clean error message from content
     * @param {string} content - Raw error content
     * @returns {string} Cleaned error message
     */
    _extractErrorMessage(content) {
        if (!content) return 'Unknown error';

        const lines = content.split('\n').filter(l => l.trim());

        // Look for common error prefixes
        for (const line of lines) {
            if (/^(error|Error|ERROR):/i.test(line)) {
                return line.substring(0, 100);
            }
        }

        // Return first non-empty line, truncated
        return (lines[0] || 'Unknown error').substring(0, 100);
    }

    /**
     * Remove a specific error by ID
     * @param {number} errorId
     */
    removeError(errorId) {
        this.errors.value = this.errors.value.filter(e => e.id !== errorId);
    }

    /**
     * Clear all errors
     */
    clear() {
        this.errors.value = [];
        this._idCounter = 0;

        if (this._onClear) {
            this._onClear();
        }
    }

    /**
     * Get an error by ID
     * @param {number} errorId
     * @returns {ErrorEntry|undefined}
     */
    getError(errorId) {
        return this.errors.value.find(e => e.id === errorId);
    }
}

// Singleton export
export const ErrorService = new ErrorServiceClass();
export { ErrorServiceClass };
