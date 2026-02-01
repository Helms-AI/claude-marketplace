/**
 * Task Tool Card Component - Displays subagent task execution
 * @module components/tool-cards/task-tool-card
 */

import { html, css } from 'lit';
import { ToolCardBase, ToolStatus, toolCardBaseStyles } from './tool-card-base.js';

class TaskToolCard extends ToolCardBase {
    static properties = { ...ToolCardBase.properties, description: { type: String }, agentType: { type: String }, prompt: { type: String }, result: { type: String } };

    static styles = [toolCardBaseStyles, css`
        .task-header { display: flex; align-items: center; gap: var(--spacing-sm, 8px); padding: var(--spacing-sm, 8px); background: var(--info-bg, #e7f3ff); border: 1px solid var(--info-color, #17a2b8); border-radius: var(--radius-sm, 4px); margin-bottom: var(--spacing-sm, 8px); }
        .task-icon { width: 20px; height: 20px; color: var(--info-color, #17a2b8); }
        .task-info { flex: 1; }
        .task-description { font-weight: 500; color: var(--text-primary, #333); font-size: var(--font-size-sm, 13px); }
        .task-agent { font-size: var(--font-size-xs, 11px); color: var(--info-color, #17a2b8); }
        .prompt-section { margin-bottom: var(--spacing-sm, 8px); }
        .section-label { font-size: var(--font-size-xs, 11px); font-weight: 500; color: var(--text-muted, #999); margin-bottom: var(--spacing-xs, 4px); text-transform: uppercase; }
        .prompt-content { padding: var(--spacing-sm, 8px); background: var(--bg-tertiary, #f5f5f5); border-radius: var(--radius-sm, 4px); font-size: var(--font-size-sm, 13px); line-height: 1.5; max-height: 150px; overflow: auto; }
        .result-section { padding: var(--spacing-sm, 8px); background: var(--code-bg, #1e1e1e); border-radius: var(--radius-sm, 4px); color: var(--code-color, #d4d4d4); font-family: var(--font-mono, 'IBM Plex Mono', monospace); font-size: var(--font-size-xs, 11px); line-height: 1.5; max-height: 300px; overflow: auto; white-space: pre-wrap; }
        .running-indicator { display: flex; align-items: center; gap: var(--spacing-sm, 8px); padding: var(--spacing-sm, 8px); color: var(--info-color, #17a2b8); font-size: var(--font-size-sm, 13px); }
        .spinner { width: 16px; height: 16px; border: 2px solid var(--bg-tertiary, #e9ecef); border-top-color: var(--info-color, #17a2b8); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `];

    constructor() { super(); this.toolName = 'Task'; this.description = ''; this.agentType = ''; this.prompt = ''; this.result = ''; }

    _updateFromTool() {
        if (!this.tool) return;
        const { input, result, error } = this.tool;
        if (input?.description) this.description = input.description;
        if (input?.subagent_type) this.agentType = input.subagent_type;
        if (input?.prompt) this.prompt = input.prompt;
        if (result) this.result = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        if (error) this.status = ToolStatus.ERROR;
        else if (this.tool.status === 'running') this.status = ToolStatus.RUNNING;
        else if (result !== undefined) this.status = ToolStatus.SUCCESS;
    }

    _renderToolIcon() { return html`<svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`; }
    _renderTitle() { return html`<span class="tool-title">${this.description || 'Subagent Task'}</span>`; }
    _renderBadges() { const badges = []; if (this.agentType) badges.push(html`<span class="badge badge-info">${this.agentType}</span>`); if (this.status === ToolStatus.RUNNING) badges.push(html`<span class="badge badge-warning">Running</span>`); return badges; }

    _renderContent() {
        return html`<div class="tool-content">
            <div class="task-header"><svg class="task-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg><div class="task-info"><div class="task-description">${this.description}</div>${this.agentType ? html`<div class="task-agent">Agent: ${this.agentType}</div>` : ''}</div></div>
            ${this.prompt ? html`<div class="prompt-section"><div class="section-label">Prompt</div><div class="prompt-content">${this.prompt.length > 500 ? this.prompt.substring(0, 500) + '...' : this.prompt}</div></div>` : ''}
            ${this.status === ToolStatus.RUNNING ? html`<div class="running-indicator"><div class="spinner"></div><span>Agent is working...</span></div>` : ''}
            ${this.result ? html`<div class="section-label">Result</div><div class="result-section">${this.result}</div>` : ''}
        </div>`;
    }
}

customElements.define('task-tool-card', TaskToolCard);
export { TaskToolCard };
