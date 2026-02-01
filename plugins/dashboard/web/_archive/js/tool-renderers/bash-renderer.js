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
    },

    /**
     * Render a compact preview for streaming indicator
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string for compact preview
     */
    renderPreview(tool) {
        const input = tool.input || {};
        const command = input.command || '';
        const description = input.description || '';
        const runInBackground = input.run_in_background;
        const timeout = input.timeout;

        const icon = ToolIcons.terminal;
        const color = ToolColors.command;

        // Use description if available, otherwise truncate command
        const displayText = description
            ? BaseRenderer.truncate(description, 35)
            : `$ ${BaseRenderer.truncate(command, 30)}`;

        // Build compact badges
        const badges = [];
        if (runInBackground) {
            badges.push('bg');
        }
        if (timeout && timeout !== 120000) {
            badges.push(`${Math.round(timeout / 1000)}s`);
        }

        const badgeHtml = badges.length > 0
            ? badges.map(b => `<span class="preview-badge">${b}</span>`).join('')
            : '';

        return `
            <div class="streaming-tool-preview streaming-tool-bash" style="--tool-color: ${color}">
                <span class="preview-icon">${icon}</span>
                <span class="preview-text">${BaseRenderer.escapeHtml(displayText)}</span>
                ${badgeHtml}
            </div>
        `;
    }
};

// Register the renderer
ToolRendererRegistry.register('Bash', BashRenderer);
