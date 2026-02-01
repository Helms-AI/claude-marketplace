/**
 * Web Tool Card Component - Displays WebFetch/WebSearch operations
 * @module components/tool-cards/web-tool-card
 */

import { html, css } from 'lit';
import { ToolCardBase, ToolStatus, toolCardBaseStyles } from './tool-card-base.js';

class WebToolCard extends ToolCardBase {
    static properties = { ...ToolCardBase.properties, url: { type: String }, query: { type: String }, prompt: { type: String }, content: { type: String }, isSearch: { type: Boolean } };

    static styles = [toolCardBaseStyles, css`
        .url-display { display: flex; align-items: center; gap: var(--spacing-sm, 8px); padding: var(--spacing-sm, 8px); background: var(--bg-tertiary, #f5f5f5); border-radius: var(--radius-sm, 4px); margin-bottom: var(--spacing-sm, 8px); }
        .url-icon { width: 16px; height: 16px; color: var(--accent-color, #4a90d9); flex-shrink: 0; }
        .url-text { flex: 1; font-family: var(--font-mono, 'IBM Plex Mono', monospace); font-size: var(--font-size-sm, 13px); color: var(--accent-color, #4a90d9); word-break: break-all; }
        .url-text a { color: inherit; text-decoration: none; }
        .url-text a:hover { text-decoration: underline; }
        .query-display { display: flex; align-items: center; gap: var(--spacing-sm, 8px); padding: var(--spacing-sm, 8px); background: var(--info-bg, #e7f3ff); border: 1px solid var(--info-color, #17a2b8); border-radius: var(--radius-sm, 4px); margin-bottom: var(--spacing-sm, 8px); }
        .query-text { font-size: var(--font-size-sm, 13px); color: var(--text-primary, #333); }
        .content-section { padding: var(--spacing-sm, 8px); background: var(--bg-secondary, #f8f9fa); border: 1px solid var(--border-color, #e0e0e0); border-radius: var(--radius-sm, 4px); max-height: 300px; overflow: auto; font-size: var(--font-size-sm, 13px); line-height: 1.5; }
        .prompt-label { font-size: var(--font-size-xs, 11px); font-weight: 500; color: var(--text-muted, #999); margin-bottom: var(--spacing-xs, 4px); text-transform: uppercase; }
    `];

    constructor() { super(); this.toolName = 'Web'; this.url = ''; this.query = ''; this.prompt = ''; this.content = ''; this.isSearch = false; }

    _updateFromTool() {
        if (!this.tool) return;
        const { input, result, error } = this.tool;
        this.isSearch = this.tool.name === 'WebSearch';
        if (input?.url) this.url = input.url;
        if (input?.query) { this.query = input.query; this.isSearch = true; }
        if (input?.prompt) this.prompt = input.prompt;
        if (result) this.content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        if (error) this.status = ToolStatus.ERROR;
        else if (this.tool.status === 'running') this.status = ToolStatus.RUNNING;
        else if (result !== undefined) this.status = ToolStatus.SUCCESS;
    }

    _renderToolIcon() { return html`<svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`; }
    _renderTitle() { if (this.isSearch) return html`<span class="tool-title">Web Search</span>`; const domain = this.url ? new URL(this.url).hostname : 'Web Fetch'; return html`<span class="tool-title" title="${this.url}">${domain}</span>`; }
    _renderBadges() { return this.isSearch ? html`<span class="badge badge-info">Search</span>` : html`<span class="badge">Fetch</span>`; }

    _renderContent() {
        return html`<div class="tool-content">
            ${this.isSearch && this.query ? html`<div class="query-display"><svg class="url-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg><span class="query-text">${this.query}</span></div>` : ''}
            ${this.url ? html`<div class="url-display"><svg class="url-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg><span class="url-text"><a href="${this.url}" target="_blank" rel="noopener">${this.url}</a></span></div>` : ''}
            ${this.prompt ? html`<div class="prompt-label">Prompt</div><div class="content-section" style="margin-bottom: var(--spacing-sm, 8px);">${this.prompt}</div>` : ''}
            ${this.content ? html`<div class="prompt-label">Response</div><div class="content-section">${this.content.length > 3000 ? this.content.substring(0, 3000) + '\n... (truncated)' : this.content}</div>` : ''}
        </div>`;
    }
}

customElements.define('web-tool-card', WebToolCard);
export { WebToolCard };
