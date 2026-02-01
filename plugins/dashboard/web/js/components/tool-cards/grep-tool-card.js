/**
 * Grep Tool Card Component - Displays text search results
 * @module components/tool-cards/grep-tool-card
 */

import { html, css } from 'lit';
import { ToolCardBase, ToolStatus, toolCardBaseStyles } from './tool-card-base.js';

class GrepToolCard extends ToolCardBase {
    static properties = { ...ToolCardBase.properties, pattern: { type: String }, path: { type: String }, matches: { type: Array }, matchCount: { type: Number } };

    static styles = [toolCardBaseStyles, css`
        .search-info { display: flex; align-items: center; gap: var(--spacing-sm, 8px); padding: var(--spacing-sm, 8px); background: var(--bg-tertiary, #f5f5f5); border-radius: var(--radius-sm, 4px); margin-bottom: var(--spacing-sm, 8px); flex-wrap: wrap; }
        .pattern-text { font-family: var(--font-mono, 'IBM Plex Mono', monospace); font-size: var(--font-size-sm, 13px); color: var(--accent-color, #4a90d9); background: var(--bg-primary, white); padding: 2px 6px; border-radius: var(--radius-sm, 4px); border: 1px solid var(--border-color, #e0e0e0); }
        .results-container { max-height: 400px; overflow: auto; border: 1px solid var(--border-color, #e0e0e0); border-radius: var(--radius-sm, 4px); }
        .result-group { border-bottom: 1px solid var(--border-color, #e0e0e0); }
        .result-group:last-child { border-bottom: none; }
        .result-file { display: flex; align-items: center; gap: var(--spacing-sm, 8px); padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px); background: var(--bg-secondary, #f8f9fa); font-family: var(--font-mono, 'IBM Plex Mono', monospace); font-size: var(--font-size-xs, 11px); color: var(--accent-color, #4a90d9); cursor: pointer; }
        .result-file:hover { background: var(--bg-tertiary, #e9ecef); }
        .result-line { display: flex; padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px); font-family: var(--font-mono, 'IBM Plex Mono', monospace); font-size: var(--font-size-xs, 11px); line-height: 1.5; }
        .result-line:hover { background: var(--bg-secondary, #f8f9fa); }
        .line-number { color: var(--text-muted, #999); min-width: 40px; text-align: right; padding-right: var(--spacing-sm, 8px); user-select: none; }
        .line-content { flex: 1; white-space: pre-wrap; word-break: break-all; }
        .highlight { background: var(--warning-bg, #fff3cd); color: var(--warning-text, #856404); padding: 0 2px; border-radius: 2px; }
        .no-results { padding: var(--spacing-md, 12px); text-align: center; color: var(--text-muted, #999); font-size: var(--font-size-sm, 13px); }
    `];

    constructor() { super(); this.toolName = 'Grep'; this.pattern = ''; this.path = ''; this.matches = []; this.matchCount = 0; }

    _updateFromTool() {
        if (!this.tool) return;
        const { input, result, error } = this.tool;
        if (input?.pattern) this.pattern = input.pattern;
        if (input?.path) this.path = input.path;
        if (result) {
            if (Array.isArray(result)) { this.matches = result; this.matchCount = result.length; }
            else if (typeof result === 'string') { this.matches = result.split('\n').filter(Boolean).map(line => ({ content: line })); this.matchCount = this.matches.length; }
            else if (typeof result === 'object') { this.matches = result.matches || []; this.matchCount = result.count || this.matches.length; }
        }
        if (error) this.status = ToolStatus.ERROR;
        else if (this.tool.status === 'running') this.status = ToolStatus.RUNNING;
        else if (result !== undefined) this.status = ToolStatus.SUCCESS;
    }

    _renderToolIcon() { return html`<svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`; }
    _renderTitle() { return html`<span class="tool-title">Search: ${this.pattern || 'pattern'}</span>`; }
    _renderBadges() { return this.matchCount > 0 ? html`<span class="badge badge-success">${this.matchCount} matches</span>` : html`<span class="badge">0 matches</span>`; }

    _highlightMatch(text, pattern) {
        if (!pattern) return text;
        try {
            const regex = new RegExp(`(${pattern})`, 'gi');
            return text.replace(regex, '<span class="highlight">$1</span>');
        } catch { return text; }
    }

    _renderContent() {
        return html`<div class="tool-content">
            <div class="search-info"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg><span class="pattern-text">${this.pattern}</span>${this.path ? html`<span style="color: var(--text-muted); font-size: 11px;">in ${this.path}</span>` : ''}</div>
            ${this.matches.length > 0 ? html`<div class="results-container">${this.matches.slice(0, 100).map(match => html`<div class="result-line">${match.lineNumber ? html`<span class="line-number">${match.lineNumber}</span>` : ''}<span class="line-content">${typeof match === 'string' ? match : match.content || match.line || JSON.stringify(match)}</span></div>`)}</div>` : html`<div class="no-results">No matches found</div>`}
        </div>`;
    }
}

customElements.define('grep-tool-card', GrepToolCard);
export { GrepToolCard };
