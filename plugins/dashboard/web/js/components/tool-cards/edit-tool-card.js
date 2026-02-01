/**
 * Edit Tool Card Component - Displays file edit operations
 * @module components/tool-cards/edit-tool-card
 */

import { html, css } from 'lit';
import { ToolCardBase, ToolStatus, toolCardBaseStyles } from './tool-card-base.js';

class EditToolCard extends ToolCardBase {
    static properties = { ...ToolCardBase.properties, filePath: { type: String, attribute: 'file-path' }, oldString: { type: String }, newString: { type: String }, linesChanged: { type: Number } };

    static styles = [toolCardBaseStyles, css`
        .file-info { display: flex; align-items: center; gap: var(--spacing-sm, 8px); padding: var(--spacing-sm, 8px); background: var(--bg-tertiary, #f5f5f5); border-radius: var(--radius-sm, 4px); margin-bottom: var(--spacing-sm, 8px); }
        .file-path-display { flex: 1; font-family: var(--font-mono, 'IBM Plex Mono', monospace); font-size: var(--font-size-sm, 13px); color: var(--accent-color, #4a90d9); word-break: break-all; }
        .diff-container { border-radius: var(--radius-sm, 4px); overflow: hidden; border: 1px solid var(--border-color, #e0e0e0); }
        .diff-header { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px); background: var(--bg-secondary, #f8f9fa); border-bottom: 1px solid var(--border-color, #e0e0e0); font-size: var(--font-size-xs, 11px); color: var(--text-muted, #999); }
        .diff-section { padding: var(--spacing-sm, 8px); font-family: var(--font-mono, 'IBM Plex Mono', monospace); font-size: var(--font-size-xs, 11px); line-height: 1.5; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow: auto; }
        .diff-old { background: var(--error-bg, #ffeef0); color: var(--error-color, #dc3545); border-bottom: 1px solid var(--border-color, #e0e0e0); }
        .diff-new { background: var(--success-bg, #e6ffed); color: var(--success-color, #28a745); }
        .diff-label { display: inline-flex; align-items: center; gap: var(--spacing-xs, 4px); padding: 2px 6px; border-radius: var(--radius-sm, 4px); font-weight: 500; }
        .diff-label.removed { background: var(--error-color, #dc3545); color: white; }
        .diff-label.added { background: var(--success-color, #28a745); color: white; }
    `];

    constructor() { super(); this.toolName = 'Edit'; this.filePath = ''; this.oldString = ''; this.newString = ''; this.linesChanged = 0; }

    _updateFromTool() {
        if (!this.tool) return;
        const { input, result, error } = this.tool;
        if (input?.file_path) this.filePath = input.file_path;
        if (input?.old_string) this.oldString = input.old_string;
        if (input?.new_string) this.newString = input.new_string;
        if (result && typeof result === 'object' && result.lines_changed) this.linesChanged = result.lines_changed;
        if (error) this.status = ToolStatus.ERROR;
        else if (this.tool.status === 'running') this.status = ToolStatus.RUNNING;
        else if (result !== undefined) this.status = ToolStatus.SUCCESS;
    }

    _getFilename() { return this.filePath.split('/').pop() || this.filePath; }
    _renderToolIcon() { return html`<svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`; }
    _renderTitle() { return html`<span class="tool-title" title="${this.filePath}">${this._getFilename() || 'Edit File'}</span>`; }
    _renderBadges() { const badges = []; if (this.linesChanged) badges.push(html`<span class="badge">${this.linesChanged} lines</span>`); return badges; }

    _renderContent() {
        return html`<div class="tool-content">
            <div class="file-info"><svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg><span class="file-path-display">${this.filePath}</span></div>
            <div class="diff-container">
                <div class="diff-header"><span class="diff-label removed">- Removed</span></div>
                <div class="diff-section diff-old">${this.oldString || '(empty)'}</div>
                <div class="diff-header"><span class="diff-label added">+ Added</span></div>
                <div class="diff-section diff-new">${this.newString || '(empty)'}</div>
            </div>
        </div>`;
    }
}

customElements.define('edit-tool-card', EditToolCard);
export { EditToolCard };
