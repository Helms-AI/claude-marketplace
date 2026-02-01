/**
 * Resizable Panel Component - A panel that can be resized by dragging
 * @module components/core/resizable-panel
 */

import { LitElement, html, css } from 'lit';

class ResizablePanel extends LitElement {
    static properties = {
        direction: { type: String },
        handlePosition: { type: String, attribute: 'handle-position' },
        minSize: { type: Number, attribute: 'min-size' },
        maxSize: { type: Number, attribute: 'max-size' },
        size: { type: Number, reflect: true },
        collapsed: { type: Boolean, reflect: true },
        _preCollapseSize: { type: Number, state: true },
        _isResizing: { type: Boolean, state: true }
    };

    static styles = css`
        :host { display: flex; position: relative; --handle-size: 4px; --handle-color: transparent; --handle-color-hover: var(--border-color, #e0e0e0); --handle-color-active: var(--accent-color, #4a90d9); }
        :host([direction="horizontal"]) { flex-direction: row; height: 100%; }
        :host([direction="vertical"]) { flex-direction: column; width: 100%; }
        :host([collapsed]) { --panel-size: 0 !important; }
        .panel { display: flex; flex-direction: column; overflow: hidden; transition: width 0.2s ease, height 0.2s ease; }
        :host([direction="horizontal"]) .panel { width: var(--panel-size); height: 100%; }
        :host([direction="vertical"]) .panel { height: var(--panel-size); width: 100%; }
        :host([collapsed]) .panel { width: 0; height: 0; }
        :host([resizing]) .panel { transition: none; }
        .handle { position: absolute; z-index: 10; background: var(--handle-color); transition: background 0.15s ease; }
        :host([direction="horizontal"]) .handle { width: var(--handle-size); height: 100%; cursor: col-resize; }
        :host([direction="vertical"]) .handle { height: var(--handle-size); width: 100%; cursor: row-resize; }
        :host([direction="horizontal"][handle-position="start"]) .handle { left: 0; }
        :host([direction="horizontal"][handle-position="end"]) .handle { right: 0; }
        :host([direction="vertical"][handle-position="start"]) .handle { top: 0; }
        :host([direction="vertical"][handle-position="end"]) .handle { bottom: 0; }
        .handle:hover, :host([resizing]) .handle { background: var(--handle-color-hover); }
        :host([resizing]) .handle { background: var(--handle-color-active); }
        .handle::before { content: ''; position: absolute; }
        :host([direction="horizontal"]) .handle::before { top: 0; bottom: 0; left: -4px; right: -4px; }
        :host([direction="vertical"]) .handle::before { left: 0; right: 0; top: -4px; bottom: -4px; }
        .content { flex: 1; overflow: auto; }
        .collapse-indicator { display: none; position: absolute; align-items: center; justify-content: center; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px; cursor: pointer; z-index: 11; }
        :host([collapsed]) .collapse-indicator { display: flex; }
        :host([direction="horizontal"]) .collapse-indicator { top: 50%; transform: translateY(-50%); }
        :host([direction="horizontal"][handle-position="end"]) .collapse-indicator { right: 0; }
        :host([direction="horizontal"][handle-position="start"]) .collapse-indicator { left: 0; }
        :host([direction="vertical"]) .collapse-indicator { left: 50%; transform: translateX(-50%); }
        :host([direction="vertical"][handle-position="end"]) .collapse-indicator { bottom: 0; }
        :host([direction="vertical"][handle-position="start"]) .collapse-indicator { top: 0; }
        .collapse-indicator svg { width: 16px; height: 16px; color: var(--text-secondary); }
        .collapse-indicator:hover svg { color: var(--text-primary); }
    `;

    constructor() {
        super(); this.direction = 'horizontal'; this.handlePosition = 'end'; this.minSize = 100; this.maxSize = 800; this.size = 280; this.collapsed = false; this._preCollapseSize = 280; this._isResizing = false;
        this._onMouseMove = this._onMouseMove.bind(this); this._onMouseUp = this._onMouseUp.bind(this);
    }

    connectedCallback() { super.connectedCallback(); this._updateCSSProperty(); }
    updated(changedProperties) { if (changedProperties.has('size')) this._updateCSSProperty(); }
    _updateCSSProperty() { this.style.setProperty('--panel-size', `${this.size}px`); }

    _onMouseDown(e) {
        if (this.collapsed) return;
        e.preventDefault(); this._isResizing = true; this.setAttribute('resizing', '');
        this._startPos = this.direction === 'horizontal' ? e.clientX : e.clientY; this._startSize = this.size;
        document.addEventListener('mousemove', this._onMouseMove); document.addEventListener('mouseup', this._onMouseUp);
        document.body.style.userSelect = 'none'; document.body.style.cursor = this.direction === 'horizontal' ? 'col-resize' : 'row-resize';
        this.dispatchEvent(new CustomEvent('resize-start', { detail: { size: this.size } }));
    }

    _onMouseMove(e) {
        if (!this._isResizing) return;
        const currentPos = this.direction === 'horizontal' ? e.clientX : e.clientY;
        const delta = currentPos - this._startPos;
        const adjustedDelta = this.handlePosition === 'end' ? delta : -delta;
        let newSize = Math.max(this.minSize, Math.min(this.maxSize, this._startSize + adjustedDelta));
        if (newSize !== this.size) { this.size = newSize; this.dispatchEvent(new CustomEvent('resize', { detail: { size: newSize }, bubbles: true, composed: true })); }
    }

    _onMouseUp() {
        if (!this._isResizing) return;
        this._isResizing = false; this.removeAttribute('resizing');
        document.removeEventListener('mousemove', this._onMouseMove); document.removeEventListener('mouseup', this._onMouseUp);
        document.body.style.userSelect = ''; document.body.style.cursor = '';
        this.dispatchEvent(new CustomEvent('resize-end', { detail: { size: this.size }, bubbles: true, composed: true }));
    }

    _onDoubleClick() { this.toggle(); }
    toggle() { if (this.collapsed) this.expand(); else this.collapse(); }
    collapse() { if (this.collapsed) return; this._preCollapseSize = this.size; this.collapsed = true; this.dispatchEvent(new CustomEvent('collapse', { bubbles: true, composed: true })); }
    expand() { if (!this.collapsed) return; this.collapsed = false; this.size = this._preCollapseSize; this.dispatchEvent(new CustomEvent('expand', { bubbles: true, composed: true })); }

    _renderExpandIcon() {
        if (this.direction === 'horizontal') {
            return this.handlePosition === 'end' ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>` : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
        } else {
            return this.handlePosition === 'end' ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>` : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        }
    }

    render() {
        return html`<div class="panel"><div class="content"><slot></slot></div></div><div class="handle" @mousedown=${this._onMouseDown} @dblclick=${this._onDoubleClick}></div><div class="collapse-indicator" @click=${this.expand}>${this._renderExpandIcon()}</div>`;
    }
}

customElements.define('resizable-panel', ResizablePanel);
export { ResizablePanel };
