/**
 * Tool Card Base Component - Base class for all tool cards
 * @module components/tool-cards/tool-card-base
 */

import { LitElement, html, css } from 'lit';

export const ToolStatus = { PENDING: 'pending', RUNNING: 'running', SUCCESS: 'success', ERROR: 'error', WARNING: 'warning' };

export const toolCardBaseStyles = css`
    :host { display: block; margin: var(--spacing-sm, 8px) 0; font-family: var(--font-sans, 'IBM Plex Sans', sans-serif); }
    .tool-card { border: 1px solid var(--border-color, #e0e0e0); border-radius: var(--radius-md, 8px); background: var(--bg-primary, white); overflow: hidden; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
    .tool-card:hover { border-color: var(--border-hover, #ccc); }
    :host([status="running"]) .tool-card { border-color: var(--info-color, #17a2b8); }
    :host([status="success"]) .tool-card { border-color: var(--success-color, #28a745); }
    :host([status="error"]) .tool-card { border-color: var(--error-color, #dc3545); }
    :host([status="warning"]) .tool-card { border-color: var(--warning-color, #ffc107); }
    .tool-header { display: flex; align-items: center; gap: var(--spacing-sm, 8px); padding: var(--spacing-sm, 8px) var(--spacing-md, 12px); background: var(--bg-secondary, #f8f9fa); border-bottom: 1px solid var(--border-color, #e0e0e0); cursor: pointer; user-select: none; }
    .tool-header:hover { background: var(--bg-tertiary, #e9ecef); }
    .expand-icon { width: 16px; height: 16px; color: var(--text-muted, #999); transition: transform 0.2s ease; flex-shrink: 0; }
    :host([expanded]) .expand-icon { transform: rotate(90deg); }
    .tool-icon { width: 18px; height: 18px; flex-shrink: 0; color: var(--text-secondary, #666); }
    :host([status="running"]) .tool-icon { color: var(--info-color, #17a2b8); animation: spin 1s linear infinite; }
    :host([status="success"]) .tool-icon { color: var(--success-color, #28a745); }
    :host([status="error"]) .tool-icon { color: var(--error-color, #dc3545); }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .tool-title { flex: 1; font-size: var(--font-size-sm, 13px); font-weight: 500; color: var(--text-primary, #333); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tool-subtitle { font-size: var(--font-size-xs, 11px); color: var(--text-muted, #999); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tool-badges { display: flex; gap: var(--spacing-xs, 4px); }
    .badge { display: inline-flex; align-items: center; padding: 2px 6px; font-size: 10px; font-weight: 500; border-radius: var(--radius-sm, 4px); background: var(--bg-tertiary, #e9ecef); color: var(--text-secondary, #666); }
    .badge-success { background: var(--success-bg, #d4edda); color: var(--success-color, #28a745); }
    .badge-error { background: var(--error-bg, #f8d7da); color: var(--error-color, #dc3545); }
    .badge-warning { background: var(--warning-bg, #fff3cd); color: var(--warning-text, #856404); }
    .badge-info { background: var(--info-bg, #d1ecf1); color: var(--info-color, #17a2b8); }
    .status-indicator { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .status-indicator.running { background: var(--info-color, #17a2b8); animation: pulse 1.5s ease-in-out infinite; }
    .status-indicator.success { background: var(--success-color, #28a745); }
    .status-indicator.error { background: var(--error-color, #dc3545); }
    @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
    .tool-content { display: none; padding: var(--spacing-md, 12px); max-height: 400px; overflow: auto; }
    :host([expanded]) .tool-content { display: block; animation: slideDown 0.2s ease-out; }
    @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 400px; } }
    .code-block { font-family: var(--font-mono, 'IBM Plex Mono', monospace); font-size: var(--font-size-xs, 11px); background: var(--code-bg, #1e1e1e); color: var(--code-color, #d4d4d4); padding: var(--spacing-sm, 8px); border-radius: var(--radius-sm, 4px); overflow-x: auto; white-space: pre; line-height: 1.5; }
    .code-block.light { background: var(--bg-tertiary, #f5f5f5); color: var(--text-primary, #333); }
    .file-path { font-family: var(--font-mono, 'IBM Plex Mono', monospace); font-size: var(--font-size-xs, 11px); color: var(--accent-color, #4a90d9); word-break: break-all; }
    .output-section { margin-bottom: var(--spacing-md, 12px); }
    .output-section:last-child { margin-bottom: 0; }
    .output-label { font-size: var(--font-size-xs, 11px); font-weight: 500; color: var(--text-muted, #999); margin-bottom: var(--spacing-xs, 4px); text-transform: uppercase; letter-spacing: 0.5px; }
    .error-message { padding: var(--spacing-sm, 8px); background: var(--error-bg, #f8d7da); border: 1px solid var(--error-color, #dc3545); border-radius: var(--radius-sm, 4px); color: var(--error-color, #dc3545); font-size: var(--font-size-sm, 13px); }
    .copy-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; border: none; border-radius: var(--radius-sm, 4px); background: transparent; color: var(--text-muted, #999); cursor: pointer; transition: all 0.15s ease; }
    .copy-btn:hover { background: var(--bg-secondary, #f8f9fa); color: var(--text-primary, #333); }
    .copy-btn svg { width: 14px; height: 14px; }
    .copy-btn.copied { color: var(--success-color, #28a745); }
`;

class ToolCardBase extends LitElement {
    static properties = {
        tool: { type: Object },
        status: { type: String, reflect: true },
        expanded: { type: Boolean, reflect: true },
        toolName: { type: String, attribute: 'tool-name' },
        autoExpandOnError: { type: Boolean, attribute: 'auto-expand-error' }
    };

    static styles = toolCardBaseStyles;

    constructor() { super(); this.tool = null; this.status = ToolStatus.PENDING; this.expanded = false; this.toolName = 'Tool'; this.autoExpandOnError = true; }

    updated(changedProperties) {
        if (changedProperties.has('tool') && this.tool) this._updateFromTool();
        if (changedProperties.has('status') && this.autoExpandOnError && this.status === ToolStatus.ERROR && !this.expanded) this.expanded = true;
    }

    _updateFromTool() {
        if (this.tool.error) this.status = ToolStatus.ERROR;
        else if (this.tool.result !== undefined) this.status = ToolStatus.SUCCESS;
        else if (this.tool.status === 'running') this.status = ToolStatus.RUNNING;
    }

    _toggleExpanded() { this.expanded = !this.expanded; }

    async _copyToClipboard(text, buttonRef) {
        try { await navigator.clipboard.writeText(text); if (buttonRef) { buttonRef.classList.add('copied'); setTimeout(() => buttonRef.classList.remove('copied'), 2000); } }
        catch (error) { console.error('Failed to copy:', error); }
    }

    _renderExpandIcon() { return html`<svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`; }
    _renderToolIcon() { return html`<svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect></svg>`; }
    _renderStatusIndicator() { if (this.status === ToolStatus.PENDING) return ''; return html`<span class="status-indicator ${this.status}"></span>`; }
    _renderTitle() { return html`<span class="tool-title">${this.toolName}</span>`; }
    _renderSubtitle() { return ''; }
    _renderBadges() { return ''; }
    _renderContent() { return html`<div class="tool-content">Tool content goes here</div>`; }
    _renderHeader() { return html`<div class="tool-header" @click=${this._toggleExpanded}>${this._renderExpandIcon()}${this._renderToolIcon()}${this._renderTitle()}${this._renderSubtitle()}<div class="tool-badges">${this._renderBadges()}</div>${this._renderStatusIndicator()}</div>`; }

    render() { return html`<div class="tool-card">${this._renderHeader()}${this._renderContent()}</div>`; }
}

customElements.define('tool-card-base', ToolCardBase);
export { ToolCardBase };
