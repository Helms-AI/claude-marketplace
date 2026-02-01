/**
 * Glob Tool Card Component - Displays file pattern matching results
 * @module components/tool-cards/glob-tool-card
 */

import { html, css } from 'lit';
import { ToolCardBase, ToolStatus, toolCardBaseStyles } from './tool-card-base.js';

class GlobToolCard extends ToolCardBase {
    static properties = { ...ToolCardBase.properties, pattern: { type: String }, path: { type: String }, matches: { type: Array } };

    static styles = [toolCardBaseStyles, css`
        .pattern-display { display: flex; align-items: center; gap: var(--spacing-sm, 8px); padding: var(--spacing-sm, 8px); background: var(--bg-tertiary, #f5f5f5); border-radius: var(--radius-sm, 4px); margin-bottom: var(--spacing-sm, 8px); }
        .pattern-text { font-family: var(--font-mono, 'IBM Plex Mono', monospace); font-size: var(--font-size-sm, 13px); color: var(--accent-color, #4a90d9); }
        .matches-list { max-height: 300px; overflow: auto; border: 1px solid var(--border-color, #e0e0e0); border-radius: var(--radius-sm, 4px); }
        .match-item { display: flex; align-items: center; gap: var(--spacing-sm, 8px); padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px); border-bottom: 1px solid var(--border-color, #e0e0e0); font-family: var(--font-mono, 'IBM Plex Mono', monospace); font-size: var(--font-size-xs, 11px); color: var(--text-primary, #333); }
        .match-item:last-child { border-bottom: none; }
        .match-item:hover { background: var(--bg-secondary, #f8f9fa); }
        .match-icon { width: 14px; height: 14px; color: var(--text-muted, #999); flex-shrink: 0; }
        .match-path { word-break: break-all; }
        .no-matches { padding: var(--spacing-md, 12px); text-align: center; color: var(--text-muted, #999); font-size: var(--font-size-sm, 13px); }
    `];

    constructor() { super(); this.toolName = 'Glob'; this.pattern = ''; this.path = ''; this.matches = []; }

    _updateFromTool() {
        if (!this.tool) return;
        const { input, result, error } = this.tool;
        if (input?.pattern) this.pattern = input.pattern;
        if (input?.path) this.path = input.path;
        if (result) { if (Array.isArray(result)) this.matches = result; else if (typeof result === 'string') this.matches = result.split('\n').filter(Boolean); }
        if (error) this.status = ToolStatus.ERROR;
        else if (this.tool.status === 'running') this.status = ToolStatus.RUNNING;
        else if (result !== undefined) this.status = ToolStatus.SUCCESS;
    }

    _renderToolIcon() { return html`<svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>`; }
    _renderTitle() { return html`<span class="tool-title">${this.pattern || 'Glob Search'}</span>`; }
    _renderBadges() { return this.matches.length > 0 ? html`<span class="badge badge-success">${this.matches.length} files</span>` : html`<span class="badge">0 files</span>`; }

    _renderContent() {
        return html`<div class="tool-content">
            <div class="pattern-display"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg><span class="pattern-text">${this.pattern}</span>${this.path ? html`<span style="color: var(--text-muted); font-size: 11px;">in ${this.path}</span>` : ''}</div>
            ${this.matches.length > 0 ? html`<div class="matches-list">${this.matches.map(match => html`<div class="match-item"><svg class="match-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg><span class="match-path">${match}</span></div>`)}</div>` : html`<div class="no-matches">No files matched the pattern</div>`}
        </div>`;
    }
}

customElements.define('glob-tool-card', GlobToolCard);
export { GlobToolCard };
