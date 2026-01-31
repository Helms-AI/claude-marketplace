/**
 * Bash Renderer - Terminal-style command display
 * Shows commands with $ prefix, description, and badges for options
 */

const BashRenderer = {
    /**
     * Render a Bash tool call
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    render(tool) {
        const input = tool.input || {};
        const command = input.command || '';
        const description = input.description || '';
        const timeout = input.timeout;
        const runInBackground = input.run_in_background;

        const icon = ToolIcons.terminal;
        const color = ToolColors.command;

        // Format command for display (truncate if very long)
        const displayCommand = command.length > 120
            ? command.substring(0, 120) + '...'
            : command;

        // Build badges
        const badges = [];
        if (runInBackground) {
            badges.push({ text: 'background', type: 'accent' });
        }
        if (timeout && timeout !== 120000) {
            const seconds = Math.round(timeout / 1000);
            badges.push({ text: `${seconds}s`, type: 'muted' });
        }

        const badgeHtml = badges.map(b =>
            BaseRenderer.badge(b.text, b.type)
        ).join('');

        // Determine if we need expandable version
        const needsExpand = command.length > 120 || (description && description.length > 100);

        if (needsExpand) {
            // Expandable card for long commands
            return `
                <details class="tool-card tool-card-bash" style="--tool-color: ${color}">
                    <summary class="tool-card-header">
                        <span class="tool-card-icon">${icon}</span>
                        <span class="tool-card-primary tool-bash-command">$ ${BaseRenderer.escapeHtml(displayCommand)}</span>
                        ${badgeHtml}
                        <span class="tool-card-expand">${ToolIcons.chevronDown}</span>
                    </summary>
                    ${description ? `<div class="tool-card-secondary tool-bash-description">${BaseRenderer.escapeHtml(description)}</div>` : ''}
                    <div class="tool-card-body">
                        <pre class="tool-bash-full-command">${BaseRenderer.escapeHtml(command)}</pre>
                    </div>
                </details>
            `;
        }

        // Simple card for short commands
        return `
            <div class="tool-card tool-card-bash tool-card-simple" style="--tool-color: ${color}">
                <div class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary tool-bash-command">$ ${BaseRenderer.escapeHtml(displayCommand)}</span>
                    ${badgeHtml}
                </div>
                ${description ? `<div class="tool-card-secondary tool-bash-description">${BaseRenderer.escapeHtml(BaseRenderer.truncate(description, 100))}</div>` : ''}
            </div>
        `;
    }
};

// Register the renderer
ToolRendererRegistry.register('Bash', BashRenderer);
