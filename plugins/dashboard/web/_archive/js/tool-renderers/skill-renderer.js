/**
 * Skill Renderer - Skill invocation operations
 * Shows skill with slash prefix and optional args
 */

const SkillRenderer = {
    /**
     * Render a Skill tool call
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    render(tool) {
        const input = tool.input || {};
        const skill = input.skill || 'unknown';
        const args = input.args || '';

        const icon = ToolIcons.slash;
        const color = ToolColors.skill;

        if (args) {
            return `
                <div class="tool-card tool-card-skill tool-card-simple" style="--tool-color: ${color}">
                    <div class="tool-card-header">
                        <span class="tool-card-icon">${icon}</span>
                        <span class="tool-card-primary tool-skill-name">/${BaseRenderer.escapeHtml(skill)}</span>
                    </div>
                    <div class="tool-card-secondary tool-skill-args">${BaseRenderer.escapeHtml(BaseRenderer.truncate(args, 80))}</div>
                </div>
            `;
        }

        return `
            <div class="tool-card tool-card-skill tool-card-simple" style="--tool-color: ${color}">
                <div class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary tool-skill-name">/${BaseRenderer.escapeHtml(skill)}</span>
                </div>
            </div>
        `;
    },

    /**
     * Compact preview for streaming indicator
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string for compact preview
     */
    renderPreview(tool) {
        const input = tool.input || {};
        const skill = input.skill || 'skill';
        const args = input.args || '';

        const icon = ToolIcons.slash;
        const color = ToolColors.skill;

        const argsPreview = args ? ` ${BaseRenderer.truncate(args, 15)}` : '';

        return `
            <div class="streaming-tool-preview streaming-tool-skill" style="--tool-color: ${color}">
                <span class="preview-icon">${icon}</span>
                <span class="preview-text">/${BaseRenderer.escapeHtml(skill)}${argsPreview}</span>
            </div>
        `;
    }
};

// Register the renderer
ToolRendererRegistry.register('Skill', SkillRenderer);
