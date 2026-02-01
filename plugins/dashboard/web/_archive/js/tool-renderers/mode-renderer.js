/**
 * Mode Renderer - EnterPlanMode and ExitPlanMode operations
 * Shows plan mode transitions with badges for allowed prompts
 */

const ModeRenderer = {
    /**
     * Render an EnterPlanMode tool call
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderEnter(tool) {
        const icon = ToolIcons.lightbulb;
        const color = ToolColors.planning;

        return `
            <div class="tool-card tool-card-mode tool-card-simple" style="--tool-color: ${color}">
                <div class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary tool-mode-action">Entering plan mode</span>
                </div>
            </div>
        `;
    },

    /**
     * Render an ExitPlanMode tool call
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderExit(tool) {
        const input = tool.input || {};
        const allowedPrompts = input.allowedPrompts || [];
        const pushToRemote = input.pushToRemote;
        const remoteSessionTitle = input.remoteSessionTitle;

        const icon = ToolIcons.lightbulb;
        const color = ToolColors.planning;

        // Build badges
        const badges = [];
        if (allowedPrompts.length > 0) {
            badges.push({ text: `${allowedPrompts.length} prompts`, type: 'accent' });
        }
        if (pushToRemote) {
            badges.push({ text: 'remote', type: 'muted' });
        }

        const badgeHtml = badges.map(b => BaseRenderer.badge(b.text, b.type)).join('');

        if (allowedPrompts.length > 0) {
            const promptsList = allowedPrompts.map(p =>
                `<div class="tool-prompt-item">${BaseRenderer.escapeHtml(p.prompt || p)}</div>`
            ).join('');

            return `
                <details class="tool-card tool-card-mode" style="--tool-color: ${color}">
                    <summary class="tool-card-header">
                        <span class="tool-card-icon">${icon}</span>
                        <span class="tool-card-primary tool-mode-action">Exiting plan mode</span>
                        ${badgeHtml}
                        <span class="tool-card-expand">${ToolIcons.chevronDown}</span>
                    </summary>
                    ${remoteSessionTitle ? `<div class="tool-card-secondary">${BaseRenderer.escapeHtml(remoteSessionTitle)}</div>` : ''}
                    <div class="tool-card-body">
                        <div class="tool-prompts-label">Allowed prompts:</div>
                        ${promptsList}
                    </div>
                </details>
            `;
        }

        return `
            <div class="tool-card tool-card-mode tool-card-simple" style="--tool-color: ${color}">
                <div class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary tool-mode-action">Exiting plan mode</span>
                    ${badgeHtml}
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
            case 'EnterPlanMode': return this.renderEnter(tool);
            case 'ExitPlanMode': return this.renderExit(tool);
            default: return ToolRendererRegistry.renderDefault(tool);
        }
    },

    /**
     * Compact preview for streaming indicator
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string for compact preview
     */
    renderPreview(tool) {
        const name = tool.name;
        const input = tool.input || {};

        const icon = ToolIcons.lightbulb;
        const color = ToolColors.planning;

        const isEntering = name === 'EnterPlanMode';
        const text = isEntering ? 'Entering plan mode' : 'Exiting plan mode';

        // Badge for prompts count on exit
        const allowedPrompts = input.allowedPrompts || [];
        const badgeHtml = !isEntering && allowedPrompts.length > 0
            ? `<span class="preview-badge">${allowedPrompts.length} prompts</span>`
            : '';

        return `
            <div class="streaming-tool-preview streaming-tool-mode" style="--tool-color: ${color}">
                <span class="preview-icon">${icon}</span>
                <span class="preview-text">${text}</span>
                ${badgeHtml}
            </div>
        `;
    }
};

// Register the renderers
ToolRendererRegistry.register('EnterPlanMode', ModeRenderer);
ToolRendererRegistry.register('ExitPlanMode', ModeRenderer);
