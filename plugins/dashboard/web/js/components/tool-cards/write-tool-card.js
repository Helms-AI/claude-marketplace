/**
 * Write Tool Card Component - Displays file write operations
 * @module components/tool-cards/write-tool-card
 */

import { html, css } from 'lit';
import { ToolCardBase, ToolStatus, toolCardBaseStyles } from './tool-card-base.js';

class WriteToolCard extends ToolCardBase {
    static properties = { ...ToolCardBase.properties, filePath: { type: String, attribute: 'file-path' }, content: { type: String }, bytesWritten: { type: Number } };

    static styles = [toolCardBaseStyles, css`
        .file-info { display: flex; align-items: center; gap: var(--spacing-sm, 8px); padding: var(--spacing-sm, 8px); background: var(--success-bg, #e6ffed); border: 1px solid var(--success-color, #28a745); border-radius: var(--radius-sm, 4px); margin-bottom: var(--spacing-sm, 8px); }
        .file-icon { width: 16px; height: 16px; color: var(--success-color, #28a745); }
        .file-path-display { flex: 1; font-family: var(--font-mono, 'IBM Plex Mono', monospace); font-size: var(--font-size-sm, 13px); color: var(--success-color, #28a745); word-break: break-all; }
        .code-container { position: relative; background: var(--code-bg, #1e1e1e); border-radius: var(--radius-sm, 4px); overflow: hidden; }
        .code-header { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px); background: rgba(255, 255, 255, 0.05); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        .code-content { padding: var(--spacing-sm, 8px); max-height: 300px; overflow: auto; font-family: var(--font-mono, 'IBM Plex Mono', monospace); font-size: var(--font-size-xs, 11px); color: var(--code-color, #d4d4d4); line-height: 1.5; white-space: pre-wrap; word-break: break-all; }
        .created-badge { display: inline-flex; align-items: center; gap: var(--spacing-xs, 4px); padding: 2px 6px; background: var(--success-color, #28a745); color: white; border-radius: var(--radius-sm, 4px); font-size: 10px; font-weight: 500; }
    `];

    constructor() { super(); this.toolName = 'Write'; this.filePath = ''; this.content = ''; this.bytesWritten = 0; }

    _updateFromTool() {
        if (!this.tool) return;
        const { input, result, error } = this.tool;
        if (input?.file_path) this.filePath = input.file_path;
        if (input?.content) this.content = input.content;
        if (result && typeof result === 'object' && result.bytes_written) this.bytesWritten = result.bytes_written;
        if (error) this.status = ToolStatus.ERROR;
        else if (this.tool.status === 'running') this.status = ToolStatus.RUNNING;
        else if (result !== undefined) this.status = ToolStatus.SUCCESS;
    }

    _getFilename() { return this.filePath.split('/').pop() || this.filePath; }
    _getLineCount() { if (!this.content) return 0; return this.content.split('\n').length; }

    _renderToolIcon() { return html`<svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>`; }
    _renderTitle() { return html`<span class="tool-title" title="${this.filePath}">${this._getFilename() || 'Write File'}</span>`; }
    _renderBadges() { const badges = [html`<span class="created-badge">Created</span>`]; const lineCount = this._getLineCount(); if (lineCount > 0) badges.push(html`<span class="badge">${lineCount} lines</span>`); return badges; }

    _renderContent() {
        return html`<div class="tool-content">
            <div class="file-info"><svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg><span class="file-path-display">${this.filePath}</span></div>
            ${this.content ? html`<div class="code-container"><div class="code-header"><span style="font-size: 11px; color: var(--text-muted);">Content Preview</span><button class="copy-btn" @click=${(e) => { e.stopPropagation(); this._copyToClipboard(this.content, e.currentTarget); }} title="Copy content"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button></div><div class="code-content">${this.content.length > 2000 ? this.content.substring(0, 2000) + '\n... (truncated)' : this.content}</div></div>` : ''}
        </div>`;
    }
}

customElements.define('write-tool-card', WriteToolCard);
export { WriteToolCard };
