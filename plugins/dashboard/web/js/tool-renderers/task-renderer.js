/**
 * Task Renderer - Task (subagent) spawning operations
 * Shows agent type, description, model, and expandable prompt
 *
 * NOTE: TaskCreate, TaskUpdate, TaskGet, TaskList use default renderer
 */

const TaskAgentRenderer = {
    /**
     * Render a Task (subagent) tool call
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    render(tool) {
        const input = tool.input || {};
        const subagentType = input.subagent_type || 'Agent';
        const description = input.description || '';
        const prompt = input.prompt || '';
        const model = input.model;
        const runInBackground = input.run_in_background;
        const resume = input.resume;

        const icon = ToolIcons.agent;
        const color = ToolColors.agent;

        // Format agent type for display
        const agentName = this.formatAgentType(subagentType);

        // Build badges
        const badges = [];
        if (model) {
            badges.push({ text: model, type: 'accent' });
        }
        if (runInBackground) {
            badges.push({ text: 'background', type: 'muted' });
        }
        if (resume) {
            badges.push({ text: 'resuming', type: 'muted' });
        }

        const badgeHtml = badges.map(b => BaseRenderer.badge(b.text, b.type)).join('');

        // Determine if we need expandable
        const needsExpand = prompt.length > 100;

        if (needsExpand) {
            return `
                <details class="tool-card tool-card-task" style="--tool-color: ${color}">
                    <summary class="tool-card-header">
                        <span class="tool-card-icon">${icon}</span>
                        <span class="tool-card-primary">Spawning <span class="tool-agent-type">${BaseRenderer.escapeHtml(agentName)}</span> agent</span>
                        ${badgeHtml}
                        <span class="tool-card-expand">${ToolIcons.chevronDown}</span>
                    </summary>
                    <div class="tool-card-secondary">"${BaseRenderer.escapeHtml(description)}"</div>
                    <div class="tool-card-body">
                        <div class="tool-task-prompt">${BaseRenderer.escapeHtml(BaseRenderer.truncate(prompt, 500))}</div>
                    </div>
                </details>
            `;
        }

        // Simple card
        return `
            <div class="tool-card tool-card-task tool-card-simple" style="--tool-color: ${color}">
                <div class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary">Spawning <span class="tool-agent-type">${BaseRenderer.escapeHtml(agentName)}</span> agent</span>
                    ${badgeHtml}
                </div>
                ${description ? `<div class="tool-card-secondary">"${BaseRenderer.escapeHtml(BaseRenderer.truncate(description, 80))}"</div>` : ''}
            </div>
        `;
    },

    /**
     * Format agent type into a display name
     * @param {string} type - Agent type (e.g., "frontend-lead" or "Explore")
     * @returns {string} Formatted name
     */
    formatAgentType(type) {
        if (!type) return 'Agent';

        // Already formatted (starts with uppercase)
        if (/^[A-Z]/.test(type) && !type.includes('-')) {
            return type;
        }

        // Convert kebab-case or colon-separated to Title Case
        return type.split(/[-:_]/).map(w =>
            w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join(' ');
    }
};

// Register the renderer (only for Task, not TaskCreate/Update/etc)
ToolRendererRegistry.register('Task', TaskAgentRenderer);
