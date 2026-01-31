/**
 * Resizable Panel Component
 *
 * A panel that can be resized by dragging its edge.
 * Supports horizontal (sidebar) and vertical (bottom panel) orientations.
 *
 * @module components/core/resizable-panel
 *
 * @example
 * <resizable-panel direction="horizontal" min-size="200" max-size="500">
 *   <div slot="content">Panel content</div>
 * </resizable-panel>
 */

import { LitElement, html, css } from 'lit';

/**
 * Resizable Panel Web Component
 *
 * @fires resize - When the panel is resized
 * @fires resize-start - When resize begins
 * @fires resize-end - When resize ends
 */
class ResizablePanel extends LitElement {
    static properties = {
        /** Resize direction: horizontal or vertical */
        direction: { type: String },

        /** Position of resize handle: start or end */
        handlePosition: { type: String, attribute: 'handle-position' },

        /** Minimum size in pixels */
        minSize: { type: Number, attribute: 'min-size' },

        /** Maximum size in pixels */
        maxSize: { type: Number, attribute: 'max-size' },

        /** Initial/current size in pixels */
        size: { type: Number, reflect: true },

        /** Whether the panel is collapsed */
        collapsed: { type: Boolean, reflect: true },

        /** Size before collapse (to restore) */
        _preCollapseSize: { type: Number, state: true },

        /** Whether currently resizing */
        _isResizing: { type: Boolean, state: true }
    };

    static styles = css`
        :host {
            display: flex;
            position: relative;
            --handle-size: 4px;
            --handle-color: transparent;
            --handle-color-hover: var(--border-color, #e0e0e0);
            --handle-color-active: var(--accent-color, #4a90d9);
        }

        :host([direction="horizontal"]) {
            flex-direction: row;
            height: 100%;
        }

        :host([direction="vertical"]) {
            flex-direction: column;
            width: 100%;
        }

        :host([collapsed]) {
            --panel-size: 0 !important;
        }

        .panel {
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: width 0.2s ease, height 0.2s ease;
        }

        :host([direction="horizontal"]) .panel {
            width: var(--panel-size);
            height: 100%;
        }

        :host([direction="vertical"]) .panel {
            height: var(--panel-size);
            width: 100%;
        }

        :host([collapsed]) .panel {
            width: 0;
            height: 0;
        }

        /* Disable transition during resize */
        :host([resizing]) .panel {
            transition: none;
        }

        .handle {
            position: absolute;
            z-index: 10;
            background: var(--handle-color);
            transition: background 0.15s ease;
        }

        :host([direction="horizontal"]) .handle {
            width: var(--handle-size);
            height: 100%;
            cursor: col-resize;
        }

        :host([direction="vertical"]) .handle {
            height: var(--handle-size);
            width: 100%;
            cursor: row-resize;
        }

        :host([direction="horizontal"][handle-position="start"]) .handle {
            left: 0;
        }

        :host([direction="horizontal"][handle-position="end"]) .handle {
            right: 0;
        }

        :host([direction="vertical"][handle-position="start"]) .handle {
            top: 0;
        }

        :host([direction="vertical"][handle-position="end"]) .handle {
            bottom: 0;
        }

        .handle:hover,
        :host([resizing]) .handle {
            background: var(--handle-color-hover);
        }

        :host([resizing]) .handle {
            background: var(--handle-color-active);
        }

        /* Expand hit area for easier grabbing */
        .handle::before {
            content: '';
            position: absolute;
        }

        :host([direction="horizontal"]) .handle::before {
            top: 0;
            bottom: 0;
            left: -4px;
            right: -4px;
        }

        :host([direction="vertical"]) .handle::before {
            left: 0;
            right: 0;
            top: -4px;
            bottom: -4px;
        }

        /* Content slot */
        .content {
            flex: 1;
            overflow: auto;
        }

        /* Collapse indicator */
        .collapse-indicator {
            display: none;
            position: absolute;
            align-items: center;
            justify-content: center;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 4px;
            cursor: pointer;
            z-index: 11;
        }

        :host([collapsed]) .collapse-indicator {
            display: flex;
        }

        :host([direction="horizontal"]) .collapse-indicator {
            top: 50%;
            transform: translateY(-50%);
        }

        :host([direction="horizontal"][handle-position="end"]) .collapse-indicator {
            right: 0;
        }

        :host([direction="horizontal"][handle-position="start"]) .collapse-indicator {
            left: 0;
        }

        :host([direction="vertical"]) .collapse-indicator {
            left: 50%;
            transform: translateX(-50%);
        }

        :host([direction="vertical"][handle-position="end"]) .collapse-indicator {
            bottom: 0;
        }

        :host([direction="vertical"][handle-position="start"]) .collapse-indicator {
            top: 0;
        }

        .collapse-indicator svg {
            width: 16px;
            height: 16px;
            color: var(--text-secondary);
        }

        .collapse-indicator:hover svg {
            color: var(--text-primary);
        }
    `;

    constructor() {
        super();
        this.direction = 'horizontal';
        this.handlePosition = 'end';
        this.minSize = 100;
        this.maxSize = 800;
        this.size = 280;
        this.collapsed = false;
        this._preCollapseSize = 280;
        this._isResizing = false;

        // Bind methods
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        this._updateCSSProperty();
    }

    updated(changedProperties) {
        if (changedProperties.has('size')) {
            this._updateCSSProperty();
        }
    }

    _updateCSSProperty() {
        this.style.setProperty('--panel-size', `${this.size}px`);
    }

    _onMouseDown(e) {
        if (this.collapsed) return;

        e.preventDefault();
        this._isResizing = true;
        this.setAttribute('resizing', '');

        // Store initial position and size
        this._startPos = this.direction === 'horizontal' ? e.clientX : e.clientY;
        this._startSize = this.size;

        // Add global listeners
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);

        // Prevent text selection
        document.body.style.userSelect = 'none';
        document.body.style.cursor = this.direction === 'horizontal' ? 'col-resize' : 'row-resize';

        this.dispatchEvent(new CustomEvent('resize-start', {
            detail: { size: this.size }
        }));
    }

    _onMouseMove(e) {
        if (!this._isResizing) return;

        const currentPos = this.direction === 'horizontal' ? e.clientX : e.clientY;
        const delta = currentPos - this._startPos;

        // Adjust delta based on handle position
        const adjustedDelta = this.handlePosition === 'end' ? delta : -delta;

        let newSize = this._startSize + adjustedDelta;

        // Clamp to min/max
        newSize = Math.max(this.minSize, Math.min(this.maxSize, newSize));

        if (newSize !== this.size) {
            this.size = newSize;
            this.dispatchEvent(new CustomEvent('resize', {
                detail: { size: newSize },
                bubbles: true,
                composed: true
            }));
        }
    }

    _onMouseUp() {
        if (!this._isResizing) return;

        this._isResizing = false;
        this.removeAttribute('resizing');

        // Remove global listeners
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);

        // Restore normal behavior
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        this.dispatchEvent(new CustomEvent('resize-end', {
            detail: { size: this.size },
            bubbles: true,
            composed: true
        }));
    }

    _onDoubleClick() {
        // Double-click to collapse/expand
        this.toggle();
    }

    /**
     * Toggle collapsed state
     */
    toggle() {
        if (this.collapsed) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    /**
     * Collapse the panel
     */
    collapse() {
        if (this.collapsed) return;
        this._preCollapseSize = this.size;
        this.collapsed = true;
        this.dispatchEvent(new CustomEvent('collapse', { bubbles: true, composed: true }));
    }

    /**
     * Expand the panel
     */
    expand() {
        if (!this.collapsed) return;
        this.collapsed = false;
        this.size = this._preCollapseSize;
        this.dispatchEvent(new CustomEvent('expand', { bubbles: true, composed: true }));
    }

    _renderExpandIcon() {
        if (this.direction === 'horizontal') {
            const pointing = this.handlePosition === 'end' ? 'left' : 'right';
            return pointing === 'left'
                ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>`
                : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>`;
        } else {
            const pointing = this.handlePosition === 'end' ? 'up' : 'down';
            return pointing === 'up'
                ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>`
                : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>`;
        }
    }

    render() {
        return html`
            <div class="panel">
                <div class="content">
                    <slot></slot>
                </div>
            </div>
            <div
                class="handle"
                @mousedown=${this._onMouseDown}
                @dblclick=${this._onDoubleClick}
            ></div>
            <div class="collapse-indicator" @click=${this.expand}>
                ${this._renderExpandIcon()}
            </div>
        `;
    }
}

customElements.define('resizable-panel', ResizablePanel);
export { ResizablePanel };
