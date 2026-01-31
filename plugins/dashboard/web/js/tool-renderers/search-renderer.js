/**
 * Search Renderer - Grep and Glob operations
 * Shows search patterns with path, badges for flags, and expandable options
 */

const SearchRenderer = {
    /**
     * Render a Grep tool call
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderGrep(tool) {
        const input = tool.input || {};
        const pattern = input.pattern || '';
        const path = input.path || '.';
        const glob = input.glob;
        const type = input.type;
        const outputMode = input.output_mode || 'files_with_matches';
        const caseInsensitive = input['-i'];
        const multiline = input.multiline;
        const contextA = input['-A'];
        const contextB = input['-B'];
        const contextC = input['-C'];
        const headLimit = input.head_limit;

        const icon = ToolIcons.search;
        const color = ToolColors.search;

        // Build badges for active flags
        const badges = [];
        if (caseInsensitive) badges.push({ text: '-i', type: 'muted' });
        if (multiline) badges.push({ text: 'multiline', type: 'muted' });
        if (outputMode !== 'files_with_matches') {
            badges.push({ text: outputMode.replace('_', ' '), type: 'accent' });
        }
        if (glob) badges.push({ text: glob, type: 'accent' });
        if (type) badges.push({ text: `.${type}`, type: 'accent' });

        const badgeHtml = badges.map(b => BaseRenderer.badge(b.text, b.type)).join('');

        // Build secondary info
        const displayPath = path !== '.' ? ` in ${BaseRenderer.formatPath(path, 30)}` : '';

        // Check if we have extra options to show
        const hasExtras = contextA || contextB || contextC || headLimit;

        if (hasExtras) {
            const extras = [];
            if (contextA) extras.push(`-A ${contextA}`);
            if (contextB) extras.push(`-B ${contextB}`);
            if (contextC) extras.push(`-C ${contextC}`);
            if (headLimit) extras.push(`limit: ${headLimit}`);

            return `
                <details class="tool-card tool-card-search" style="--tool-color: ${color}">
                    <summary class="tool-card-header">
                        <span class="tool-card-icon">${icon}</span>
                        <span class="tool-card-primary">Searching for <span class="tool-search-pattern">"${BaseRenderer.escapeHtml(BaseRenderer.truncate(pattern, 40))}"</span></span>
                        ${badgeHtml}
                        <span class="tool-card-expand">${ToolIcons.chevronDown}</span>
                    </summary>
                    <div class="tool-card-secondary">${BaseRenderer.escapeHtml(displayPath)}</div>
                    <div class="tool-card-body">
                        <div class="tool-grep-options">${extras.join(' · ')}</div>
                        ${pattern.length > 40 ? `<pre class="tool-pattern-full">${BaseRenderer.escapeHtml(pattern)}</pre>` : ''}
                    </div>
                </details>
            `;
        }

        // Simple card for basic grep
        return `
            <div class="tool-card tool-card-search tool-card-simple" style="--tool-color: ${color}">
                <div class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary">Searching for <span class="tool-search-pattern">"${BaseRenderer.escapeHtml(BaseRenderer.truncate(pattern, 50))}"</span></span>
                    ${badgeHtml}
                </div>
                ${displayPath ? `<div class="tool-card-secondary">${BaseRenderer.escapeHtml(displayPath)}</div>` : ''}
            </div>
        `;
    },

    /**
     * Render a Glob tool call
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderGlob(tool) {
        const input = tool.input || {};
        const pattern = input.pattern || '';
        const path = input.path;

        const icon = ToolIcons.glob;
        const color = ToolColors.search;

        const displayPath = path ? ` in ${BaseRenderer.formatPath(path, 30)}` : '';

        return `
            <div class="tool-card tool-card-search tool-card-simple" style="--tool-color: ${color}">
                <div class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary">Finding files matching <span class="tool-search-pattern">${BaseRenderer.escapeHtml(pattern)}</span></span>
                </div>
                ${displayPath ? `<div class="tool-card-secondary">${BaseRenderer.escapeHtml(displayPath)}</div>` : ''}
            </div>
        `;
    },

    /**
     * Main render dispatcher
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    render(tool) {
        const name = tool.name;
        switch (name) {
            case 'Grep': return this.renderGrep(tool);
            case 'Glob': return this.renderGlob(tool);
            default: return ToolRendererRegistry.renderDefault(tool);
        }
    },

    /**
     * Preview dispatcher for streaming indicator
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string for compact preview
     */
    renderPreview(tool) {
        const name = tool.name;
        switch (name) {
            case 'Grep': return this.renderGrepPreview(tool);
            case 'Glob': return this.renderGlobPreview(tool);
            default: return ToolRendererRegistry.renderDefaultPreview(tool);
        }
    },

    /**
     * Compact preview for Grep operation
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderGrepPreview(tool) {
        const input = tool.input || {};
        const pattern = input.pattern || '';
        const path = input.path || '.';
        const glob = input.glob;
        const type = input.type;
        const caseInsensitive = input['-i'];

        const icon = ToolIcons.search;
        const color = ToolColors.search;

        // Compact pattern display
        const displayPattern = BaseRenderer.truncate(pattern, 20);

        // Build compact badges
        const badges = [];
        if (caseInsensitive) badges.push('-i');
        if (glob) badges.push(glob);
        if (type) badges.push(`.${type}`);

        const badgeHtml = badges.length > 0
            ? badges.map(b => `<span class="preview-badge">${BaseRenderer.escapeHtml(b)}</span>`).join('')
            : '';

        const pathDisplay = path !== '.' ? ` in ${BaseRenderer.formatPath(path, 15)}` : '';

        return `
            <div class="streaming-tool-preview streaming-tool-search" style="--tool-color: ${color}">
                <span class="preview-icon">${icon}</span>
                <span class="preview-text">"${BaseRenderer.escapeHtml(displayPattern)}"${pathDisplay}</span>
                ${badgeHtml}
            </div>
        `;
    },

    /**
     * Compact preview for Glob operation
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderGlobPreview(tool) {
        const input = tool.input || {};
        const pattern = input.pattern || '';
        const path = input.path;

        const icon = ToolIcons.glob;
        const color = ToolColors.search;

        const displayPattern = BaseRenderer.truncate(pattern, 25);
        const pathDisplay = path ? ` in ${BaseRenderer.formatPath(path, 15)}` : '';

        return `
            <div class="streaming-tool-preview streaming-tool-search" style="--tool-color: ${color}">
                <span class="preview-icon">${icon}</span>
                <span class="preview-text">${BaseRenderer.escapeHtml(displayPattern)}${pathDisplay}</span>
            </div>
        `;
    }
};

// Register the renderers
ToolRendererRegistry.register('Grep', SearchRenderer);
ToolRendererRegistry.register('Glob', SearchRenderer);
