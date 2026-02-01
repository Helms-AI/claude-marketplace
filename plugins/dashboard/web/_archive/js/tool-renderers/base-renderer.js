/**
 * Base Renderer - Shared utilities for all tool renderers
 * Provides common functionality for rendering tool cards
 */

const BaseRenderer = {
    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Truncate text to a maximum length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text with ellipsis if needed
     */
    truncate(text, maxLength = 80) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    /**
     * Create a badge element
     * @param {string} text - Badge text
     * @param {string} type - Badge type: 'default' | 'accent' | 'muted'
     * @returns {string} HTML string
     */
    badge(text, type = 'default') {
        return `<span class="tool-badge tool-badge-${type}">${this.escapeHtml(text)}</span>`;
    },

    /**
     * Create an inline diff preview
     * @param {string} oldText - Text being replaced
     * @param {string} newText - Replacement text
     * @returns {string} HTML string
     */
    inlineDiff(oldText, newText) {
        const oldPreview = this.truncate(oldText, 60);
        const newPreview = this.truncate(newText, 60);
        return `
            <div class="tool-inline-diff">
                <div class="diff-line diff-remove">- ${this.escapeHtml(oldPreview)}</div>
                <div class="diff-line diff-add">+ ${this.escapeHtml(newPreview)}</div>
            </div>
        `;
    },

    /**
     * Create a simple tool card (non-expandable)
     * @param {Object} options - Card options
     * @returns {string} HTML string
     */
    simpleCard(options) {
        const { icon, color, primary, secondary = '', badges = [] } = options;
        const badgeHtml = badges.map(b => this.badge(b.text, b.type)).join('');

        return `
            <div class="tool-card tool-card-simple" style="--tool-color: ${color}">
                <div class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary">${primary}</span>
                    ${badgeHtml}
                </div>
                ${secondary ? `<div class="tool-card-secondary">${secondary}</div>` : ''}
            </div>
        `;
    },

    /**
     * Create an expandable tool card
     * @param {Object} options - Card options
     * @returns {string} HTML string
     */
    expandableCard(options) {
        const { icon, color, primary, secondary = '', badges = [], expandable = '' } = options;
        const badgeHtml = badges.map(b => this.badge(b.text, b.type)).join('');

        return `
            <details class="tool-card tool-card-expandable" style="--tool-color: ${color}">
                <summary class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary">${primary}</span>
                    ${badgeHtml}
                    <span class="tool-card-expand">${ToolIcons.chevronDown}</span>
                </summary>
                ${secondary ? `<div class="tool-card-secondary">${secondary}</div>` : ''}
                ${expandable ? `<div class="tool-card-body">${expandable}</div>` : ''}
            </details>
        `;
    },

    /**
     * Format a file path for display (truncate middle if too long)
     * @param {string} path - File path
     * @param {number} maxLength - Maximum display length
     * @returns {string} Formatted path
     */
    formatPath(path, maxLength = 50) {
        if (!path || path.length <= maxLength) return path;

        const parts = path.split('/');
        const fileName = parts.pop();

        // If just the filename is too long, truncate it
        if (fileName.length > maxLength - 6) {
            return '.../' + fileName.substring(0, maxLength - 6) + '...';
        }

        // Otherwise, truncate the directory part
        let dir = parts.join('/');
        const availableLength = maxLength - fileName.length - 4; // 4 for ".../"

        if (dir.length > availableLength) {
            dir = '...' + dir.substring(dir.length - availableLength);
        }

        return dir + '/' + fileName;
    },

    /**
     * Format a parameter for display
     * @param {string} key - Parameter name
     * @param {*} value - Parameter value
     * @returns {string} HTML string
     */
    formatParam(key, value) {
        let displayValue = value;

        if (typeof value === 'string') {
            displayValue = this.truncate(value, 100);
        } else if (typeof value === 'object') {
            try {
                const json = JSON.stringify(value, null, 2);
                displayValue = this.truncate(json, 100);
            } catch {
                displayValue = '[object]';
            }
        }

        return `
            <div class="tool-param-row">
                <span class="tool-param-key">${this.escapeHtml(key)}:</span>
                <span class="tool-param-value">${this.escapeHtml(String(displayValue))}</span>
            </div>
        `;
    },

    /**
     * Format multiple parameters for the expandable body
     * @param {Object} params - Parameters object
     * @param {string[]} exclude - Keys to exclude
     * @returns {string} HTML string
     */
    formatParams(params, exclude = []) {
        if (!params || typeof params !== 'object') return '';

        const keys = Object.keys(params).filter(k => !exclude.includes(k));
        if (keys.length === 0) return '';

        return keys.map(k => this.formatParam(k, params[k])).join('');
    },

    /**
     * Check if a tool should use the default (legacy) renderer
     * @param {string} toolName - The tool name
     * @returns {boolean} True if should use default renderer
     */
    shouldUseDefault(toolName) {
        // These tools should keep existing behavior
        const defaultTools = ['TaskCreate', 'TaskUpdate', 'TaskGet', 'TaskList', 'TaskStop', 'TaskOutput'];
        return defaultTools.includes(toolName);
    }
};
