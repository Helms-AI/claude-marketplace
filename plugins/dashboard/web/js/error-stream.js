/**
 * Error Stream Module
 * Captures and displays errors from tool executions in a dedicated panel.
 * Provides a centralized view of all errors with quick navigation to source.
 */

const ErrorStream = {
    // Array of error objects
    errors: [],

    // Maximum errors to keep in memory
    maxErrors: 100,

    // DOM element references
    container: null,
    badge: null,

    // Error ID counter
    errorIdCounter: 0,

    /**
     * Initialize the error stream.
     */
    init() {
        this.container = document.getElementById('errorsList');
        this.badge = document.getElementById('errorsBadge');
        this.errors = [];
        this.errorIdCounter = 0;
        this.render();
    },

    /**
     * Add an error from a tool result.
     * @param {Object} error - Error object with tool, message, details, timestamp
     */
    addError(error) {
        const errorEntry = {
            id: ++this.errorIdCounter,
            tool: error.tool || 'Unknown',
            message: error.message || 'An error occurred',
            details: error.details || null,
            timestamp: error.timestamp || new Date().toISOString(),
            source: error.source || 'main',
            messageId: error.messageId || null
        };

        // Add to beginning of array (newest first)
        this.errors.unshift(errorEntry);

        // Trim to max size
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(0, this.maxErrors);
        }

        // Update UI
        this.render();
        this.updateBadge();

        // Flash the errors tab if not active
        this.flashTab();

        return errorEntry;
    },

    /**
     * Parse a tool result to extract error information.
     * @param {Object} toolResult - The tool_result block from message
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

        // Common error patterns
        const errorPatterns = [
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

        const hasErrorPattern = errorPatterns.some(pattern => pattern.test(content));

        if (!isError && !hasErrorPattern) {
            return null;
        }

        // Extract error message
        let message = 'Tool execution failed';
        let details = null;

        if (isError) {
            message = this.extractErrorMessage(content);
            details = content.length > 200 ? content : null;
        } else if (hasErrorPattern) {
            // Find the matching error line
            const lines = content.split('\n');
            for (const line of lines) {
                if (errorPatterns.some(p => p.test(line))) {
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
    },

    /**
     * Extract a clean error message from content.
     * @param {string} content - Raw error content
     * @returns {string} Cleaned error message
     */
    extractErrorMessage(content) {
        if (!content) return 'Unknown error';

        // Try to find the most relevant error line
        const lines = content.split('\n').filter(l => l.trim());

        // Look for common error prefixes
        for (const line of lines) {
            if (/^(error|Error|ERROR):/i.test(line)) {
                return line.substring(0, 100);
            }
        }

        // Return first non-empty line, truncated
        return (lines[0] || 'Unknown error').substring(0, 100);
    },

    /**
     * Clear all errors.
     */
    clear() {
        this.errors = [];
        this.errorIdCounter = 0;
        this.render();
        this.updateBadge();
    },

    /**
     * Remove a specific error by ID.
     * @param {number} errorId - The error ID to remove
     */
    removeError(errorId) {
        this.errors = this.errors.filter(e => e.id !== errorId);
        this.render();
        this.updateBadge();
    },

    /**
     * Update the badge count.
     */
    updateBadge() {
        if (this.badge) {
            const count = this.errors.length;
            this.badge.textContent = count;
            this.badge.style.display = count > 0 ? 'inline-flex' : 'none';

            // Add warning class if errors exist
            if (count > 0) {
                this.badge.classList.add('has-errors');
            } else {
                this.badge.classList.remove('has-errors');
            }
        }
    },

    /**
     * Flash the errors tab to draw attention.
     */
    flashTab() {
        const tab = document.querySelector('.panel-tab[data-tab="errors"]');
        if (tab && !tab.classList.contains('active')) {
            tab.classList.add('flash');
            setTimeout(() => tab.classList.remove('flash'), 1000);
        }
    },

    /**
     * Render the error list.
     */
    render() {
        if (!this.container) return;

        if (this.errors.length === 0) {
            this.container.innerHTML = `
                <div class="error-stream-empty">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span>No errors</span>
                    <span class="empty-hint">Errors from tool executions will appear here</span>
                </div>
            `;
            return;
        }

        let html = `
            <div class="error-stream-header">
                <span class="error-count">${this.errors.length} error${this.errors.length !== 1 ? 's' : ''}</span>
                <button class="error-clear-btn" onclick="ErrorStream.clear()" title="Clear all errors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Clear
                </button>
            </div>
            <div class="error-list">
        `;

        this.errors.forEach(error => {
            const time = this.formatTime(error.timestamp);
            const toolClass = this.getToolClass(error.tool);

            html += `
                <div class="error-item" data-error-id="${error.id}">
                    <div class="error-item-header">
                        <span class="error-time">${time}</span>
                        <span class="error-tool ${toolClass}">${this.escapeHtml(error.tool)}</span>
                        <button class="error-dismiss" onclick="ErrorStream.removeError(${error.id})" title="Dismiss">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="error-message">${this.escapeHtml(error.message)}</div>
                    ${error.details ? `
                        <details class="error-details">
                            <summary>Show details</summary>
                            <pre class="error-details-content">${this.escapeHtml(error.details)}</pre>
                        </details>
                    ` : ''}
                    ${error.source !== 'main' ? `
                        <div class="error-source">from agent: ${this.escapeHtml(error.source)}</div>
                    ` : ''}
                </div>
            `;
        });

        html += '</div>';
        this.container.innerHTML = html;
    },

    /**
     * Get CSS class for tool type.
     * @param {string} tool - Tool name
     * @returns {string} CSS class
     */
    getToolClass(tool) {
        const toolClasses = {
            'Bash': 'tool-bash',
            'Read': 'tool-read',
            'Write': 'tool-write',
            'Edit': 'tool-edit',
            'Grep': 'tool-search',
            'Glob': 'tool-search',
            'WebFetch': 'tool-web',
            'WebSearch': 'tool-web',
            'Task': 'tool-task'
        };
        return toolClasses[tool] || 'tool-default';
    },

    /**
     * Format timestamp for display.
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Formatted time
     */
    formatTime(timestamp) {
        if (!timestamp) return '--:--:--';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    },

    /**
     * Escape HTML to prevent XSS.
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
