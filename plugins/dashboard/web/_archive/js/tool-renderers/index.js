/**
 * Tool Renderer Registry - Factory for tool-specific renderers
 * Provides semantic, conversation-centric tool visualizations
 */

const ToolRendererRegistry = {
    renderers: {},

    /**
     * Register a renderer for a tool
     * @param {string} toolName - The tool name
     * @param {Object} renderer - Renderer object with render(tool) method
     */
    register(toolName, renderer) {
        this.renderers[toolName] = renderer;
    },

    /**
     * Get the renderer for a tool
     * @param {string} toolName - The tool name
     * @returns {Object|null} Renderer or null if not registered
     */
    get(toolName) {
        return this.renderers[toolName] || null;
    },

    /**
     * Check if a tool has a custom renderer
     * @param {string} toolName - The tool name
     * @returns {boolean} True if custom renderer exists
     */
    has(toolName) {
        return toolName in this.renderers;
    },

    /**
     * Render a tool call using the appropriate renderer
     * @param {Object} tool - Tool call object with name and input
     * @returns {string} HTML string
     */
    render(tool) {
        const name = tool.name || 'Unknown Tool';
        const input = tool.input || {};

        // Check if we should use default (legacy) renderer
        if (BaseRenderer.shouldUseDefault(name)) {
            return this.renderDefault(tool);
        }

        // Try custom renderer
        const renderer = this.get(name);
        if (renderer && typeof renderer.render === 'function') {
            try {
                return renderer.render(tool);
            } catch (e) {
                console.warn(`Tool renderer error for ${name}:`, e);
                return this.renderDefault(tool);
            }
        }

        // Fall back to default renderer
        return this.renderDefault(tool);
    },

    /**
     * Render a compact preview for streaming indicator context
     * Used by terminal-conversation.js during tool execution
     * @param {Object} tool - Tool call object with name and input
     * @returns {string} HTML string for compact preview
     */
    renderPreview(tool) {
        const name = tool.name || 'Unknown Tool';

        // Check if we should use default preview
        if (BaseRenderer.shouldUseDefault(name)) {
            return this.renderDefaultPreview(tool);
        }

        // Try custom preview renderer
        const renderer = this.get(name);
        if (renderer && typeof renderer.renderPreview === 'function') {
            try {
                return renderer.renderPreview(tool);
            } catch (e) {
                console.warn(`Preview renderer error for ${name}:`, e);
            }
        }

        // Fall back to default preview
        return this.renderDefaultPreview(tool);
    },

    /**
     * Default compact preview for tools without custom preview renderers
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string for compact preview
     */
    renderDefaultPreview(tool) {
        const name = tool.name || 'Unknown Tool';
        const input = tool.input || {};
        const icon = getToolIcon(name);
        const color = getToolColor(name);

        // Try to extract a meaningful preview text
        let previewText = name;
        const keys = typeof input === 'object' ? Object.keys(input) : [];

        if (keys.length === 1) {
            const val = input[keys[0]];
            if (typeof val === 'string') {
                previewText = BaseRenderer.truncate(val, 40);
            }
        } else if (keys.length > 1) {
            previewText = `${name} (${keys.length} params)`;
        }

        return `
            <div class="streaming-tool-preview" style="--tool-color: ${color}">
                <span class="preview-icon">${icon}</span>
                <span class="preview-text">${BaseRenderer.escapeHtml(previewText)}</span>
            </div>
        `;
    },

    /**
     * Default renderer for tools without custom renderers
     * Maintains backward compatibility with existing behavior
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderDefault(tool) {
        const name = tool.name || 'Unknown Tool';
        const input = tool.input || {};
        const keys = typeof input === 'object' ? Object.keys(input) : [];
        const paramCount = keys.length;
        const icon = getToolIcon(name);
        const color = getToolColor(name);

        // For single parameter tools, show the value inline in the header
        let headerContent = '';
        let showExpandable = true;

        if (paramCount === 1) {
            const key = keys[0];
            let val = input[key];
            if (typeof val === 'string') {
                val = val.length > 80 ? val.substring(0, 80) + '...' : val;
                headerContent = `<span class="tool-inline-param">${BaseRenderer.escapeHtml(val)}</span>`;
            } else if (typeof val === 'object') {
                headerContent = `<span class="tool-param-count">1 param</span>`;
            } else {
                headerContent = `<span class="tool-inline-param">${BaseRenderer.escapeHtml(String(val))}</span>`;
            }
            showExpandable = typeof val === 'object' || (typeof input[key] === 'string' && input[key].length > 80);
        } else if (paramCount > 1) {
            headerContent = `<span class="tool-param-count">${paramCount} params</span>`;
        }

        // Format full input details for expandable body
        let inputDetails = '';
        if (paramCount > 0) {
            inputDetails = keys.map(k => {
                let val = input[k];
                if (typeof val === 'string') {
                    val = val.length > 500 ? val.substring(0, 500) + '...' : val;
                } else if (typeof val === 'object') {
                    try {
                        val = JSON.stringify(val, null, 2);
                        if (val.length > 500) val = val.substring(0, 500) + '...';
                    } catch {
                        val = '[object]';
                    }
                }
                return `<div class="tool-param-row"><span class="tool-param-key">${BaseRenderer.escapeHtml(k)}:</span> <span class="tool-param-value">${BaseRenderer.escapeHtml(String(val))}</span></div>`;
            }).join('');
        }

        // For single simple params that aren't truncated, don't make it expandable
        if (paramCount === 1 && !showExpandable) {
            return `
                <div class="tool-call-card tool-call-simple" style="--tool-color: ${color}">
                    <div class="tool-call-header">
                        <span class="tool-icon">${icon}</span>
                        <span class="tool-name">${BaseRenderer.escapeHtml(name)}</span>
                        ${headerContent}
                    </div>
                </div>
            `;
        }

        // Expandable version for multiple params or complex single params
        return `
            <details class="tool-call-card" style="--tool-color: ${color}">
                <summary class="tool-call-header">
                    <span class="tool-icon">${icon}</span>
                    <span class="tool-name">${BaseRenderer.escapeHtml(name)}</span>
                    ${headerContent}
                    <span class="tool-expand-icon">${ToolIcons.chevronDown}</span>
                </summary>
                ${inputDetails ? `<div class="tool-call-body">${inputDetails}</div>` : '<div class="tool-call-body tool-call-empty">No parameters</div>'}
            </details>
        `;
    }
};
