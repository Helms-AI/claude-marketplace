/**
 * Web Renderer - WebFetch and WebSearch operations
 * Shows web operations with URL, prompt preview, and domain filters
 */

const WebRenderer = {
    /**
     * Render a WebFetch tool call
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderWebFetch(tool) {
        const input = tool.input || {};
        const url = input.url || '';
        const prompt = input.prompt || '';

        const icon = ToolIcons.globe;
        const color = ToolColors.web;

        // Format URL for display
        let displayUrl = url;
        try {
            const urlObj = new URL(url);
            displayUrl = urlObj.hostname + urlObj.pathname;
            if (displayUrl.length > 50) {
                displayUrl = displayUrl.substring(0, 47) + '...';
            }
        } catch {
            displayUrl = BaseRenderer.truncate(url, 50);
        }

        const promptPreview = BaseRenderer.truncate(prompt, 60);

        return `
            <details class="tool-card tool-card-web" style="--tool-color: ${color}">
                <summary class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary">Fetching <span class="tool-web-url">${BaseRenderer.escapeHtml(displayUrl)}</span></span>
                    <span class="tool-card-expand">${ToolIcons.chevronDown}</span>
                </summary>
                <div class="tool-card-secondary">"${BaseRenderer.escapeHtml(promptPreview)}"</div>
                <div class="tool-card-body">
                    <div class="tool-web-full-url">${BaseRenderer.escapeHtml(url)}</div>
                    <div class="tool-web-full-prompt">${BaseRenderer.escapeHtml(prompt)}</div>
                </div>
            </details>
        `;
    },

    /**
     * Render a WebSearch tool call
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderWebSearch(tool) {
        const input = tool.input || {};
        const query = input.query || '';
        const allowedDomains = input.allowed_domains || [];
        const blockedDomains = input.blocked_domains || [];

        const icon = ToolIcons.globeSearch;
        const color = ToolColors.web;

        // Build badges for domain filters
        const badges = [];
        allowedDomains.slice(0, 3).forEach(domain => {
            badges.push({ text: `+${domain}`, type: 'accent' });
        });
        if (allowedDomains.length > 3) {
            badges.push({ text: `+${allowedDomains.length - 3} more`, type: 'muted' });
        }
        blockedDomains.slice(0, 2).forEach(domain => {
            badges.push({ text: `-${domain}`, type: 'muted' });
        });
        if (blockedDomains.length > 2) {
            badges.push({ text: `-${blockedDomains.length - 2} more`, type: 'muted' });
        }

        const badgeHtml = badges.map(b => BaseRenderer.badge(b.text, b.type)).join('');

        const hasDomainFilters = allowedDomains.length > 0 || blockedDomains.length > 0;

        if (hasDomainFilters) {
            return `
                <details class="tool-card tool-card-web" style="--tool-color: ${color}">
                    <summary class="tool-card-header">
                        <span class="tool-card-icon">${icon}</span>
                        <span class="tool-card-primary">Searching web for <span class="tool-search-pattern">"${BaseRenderer.escapeHtml(BaseRenderer.truncate(query, 40))}"</span></span>
                        ${badgeHtml}
                        <span class="tool-card-expand">${ToolIcons.chevronDown}</span>
                    </summary>
                    <div class="tool-card-body">
                        ${allowedDomains.length > 0 ? `<div class="tool-domain-list"><strong>Allowed:</strong> ${allowedDomains.join(', ')}</div>` : ''}
                        ${blockedDomains.length > 0 ? `<div class="tool-domain-list"><strong>Blocked:</strong> ${blockedDomains.join(', ')}</div>` : ''}
                    </div>
                </details>
            `;
        }

        // Simple card for basic search
        return `
            <div class="tool-card tool-card-web tool-card-simple" style="--tool-color: ${color}">
                <div class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary">Searching web for <span class="tool-search-pattern">"${BaseRenderer.escapeHtml(BaseRenderer.truncate(query, 50))}"</span></span>
                </div>
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
            case 'WebFetch': return this.renderWebFetch(tool);
            case 'WebSearch': return this.renderWebSearch(tool);
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
            case 'WebFetch': return this.renderWebFetchPreview(tool);
            case 'WebSearch': return this.renderWebSearchPreview(tool);
            default: return ToolRendererRegistry.renderDefaultPreview(tool);
        }
    },

    /**
     * Compact preview for WebFetch operation
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderWebFetchPreview(tool) {
        const input = tool.input || {};
        const url = input.url || '';

        const icon = ToolIcons.globe;
        const color = ToolColors.web;

        // Format URL for compact display
        let displayUrl = url;
        try {
            const urlObj = new URL(url);
            displayUrl = urlObj.hostname;
        } catch {
            displayUrl = BaseRenderer.truncate(url, 25);
        }

        return `
            <div class="streaming-tool-preview streaming-tool-web" style="--tool-color: ${color}">
                <span class="preview-icon">${icon}</span>
                <span class="preview-text">${BaseRenderer.escapeHtml(displayUrl)}</span>
            </div>
        `;
    },

    /**
     * Compact preview for WebSearch operation
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderWebSearchPreview(tool) {
        const input = tool.input || {};
        const query = input.query || '';
        const allowedDomains = input.allowed_domains || [];

        const icon = ToolIcons.globeSearch;
        const color = ToolColors.web;

        const displayQuery = BaseRenderer.truncate(query, 25);

        // Show domain filter badge if present
        const badgeHtml = allowedDomains.length > 0
            ? `<span class="preview-badge">+${allowedDomains.length}</span>`
            : '';

        return `
            <div class="streaming-tool-preview streaming-tool-web" style="--tool-color: ${color}">
                <span class="preview-icon">${icon}</span>
                <span class="preview-text">"${BaseRenderer.escapeHtml(displayQuery)}"</span>
                ${badgeHtml}
            </div>
        `;
    }
};

// Register the renderers
ToolRendererRegistry.register('WebFetch', WebRenderer);
ToolRendererRegistry.register('WebSearch', WebRenderer);
