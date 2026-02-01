/**
 * Tab Atom - Individual tab button with icon + label
 * @module components/atoms/tab
 *
 * Usage:
 * <dash-tab name="work" icon="clipboard" active>Work</dash-tab>
 * <dash-tab name="agents" icon="users" count="58">Agents</dash-tab>
 * <dash-tab name="session-1" icon="terminal" closable modified>Session 1</dash-tab>
 */
import { LitElement, html, css } from 'lit';
import './icon.js';

class DashTab extends LitElement {
    static properties = {
        /** Unique tab name/identifier */
        name: { type: String, reflect: true },
        /** Icon name (optional) */
        icon: { type: String },
        /** Whether this tab is active */
        active: { type: Boolean, reflect: true },
        /** Disable the tab */
        disabled: { type: Boolean, reflect: true },
        /** Show close button */
        closable: { type: Boolean, reflect: true },
        /** Show modified indicator (dot) */
        modified: { type: Boolean, reflect: true },
        /** Count badge (e.g., number of items) */
        count: { type: Number },
        /** Tab variant: 'underline' (default) | 'segment' */
        variant: { type: String, reflect: true }
    };

    static styles = css`
        :host {
            display: inline-block;
            height: 100%;
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
        }

        button {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 0 12px;
            height: 100%;
            border: none;
            background: transparent;
            font-size: 13px;
            font-family: inherit;
            color: var(--text-muted, #808080);
            cursor: pointer;
            transition: all 0.15s ease;
            border-right: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
            white-space: nowrap;
            max-width: 200px;
            position: relative;
        }

        /* Underline variant (default) */
        :host(:not([variant="segment"])) button {
            border-bottom: 2px solid transparent;
            margin-bottom: -1px;
        }

        :host(:not([variant="segment"])[active]) button {
            color: var(--text-primary, #e0e0e0);
            border-bottom-color: var(--accent-color, #4a90d9);
        }

        /* Segment variant */
        :host([variant="segment"]) button {
            border-radius: 0;
        }

        :host([variant="segment"][active]) button {
            background: var(--bg-primary, #1e1e1e);
            color: var(--text-primary, #e0e0e0);
        }

        button:hover {
            color: var(--text-secondary, #b0b0b0);
            background: var(--bg-hover, rgba(255, 255, 255, 0.04));
        }

        button:focus {
            outline: none;
            box-shadow: none;
        }

        button:focus-visible {
            /* Subtle inner glow instead of box outline */
            box-shadow: inset 0 0 0 1px var(--accent-color, #4a90d9);
        }

        .tab-icon {
            display: flex;
            align-items: center;
            flex-shrink: 0;
        }

        .tab-title {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .tab-count {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 18px;
            height: 18px;
            padding: 0 5px;
            border-radius: 9px;
            background: var(--bg-tertiary, rgba(255, 255, 255, 0.08));
            font-size: 10px;
            font-weight: 600;
            color: var(--text-muted, #808080);
        }

        :host([active]) .tab-count {
            background: var(--accent-color-dim, rgba(74, 144, 217, 0.2));
            color: var(--accent-color, #4a90d9);
        }

        .tab-modified {
            width: 8px;
            height: 8px;
            background: var(--accent-color, #4a90d9);
            border-radius: 50%;
            flex-shrink: 0;
        }

        .tab-close {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            border: none;
            border-bottom: none !important;
            background: transparent;
            border-radius: var(--radius-sm, 4px);
            color: var(--text-muted, #808080);
            cursor: pointer;
            opacity: 0;
            transition: all 0.15s ease;
            flex-shrink: 0;
            padding: 0;
            margin: 0;
        }

        .tab-close:focus {
            outline: none;
        }

        button:hover .tab-close {
            opacity: 1;
        }

        .tab-close:hover {
            background: var(--bg-tertiary, rgba(255, 255, 255, 0.1));
            color: var(--error-color, #f85149);
        }

        /* Show modified dot in place of close button when not hovering */
        :host([modified][closable]) .tab-modified {
            position: absolute;
            right: 10px;
            transition: opacity 0.15s ease;
        }

        :host([modified][closable]) button:hover .tab-modified {
            opacity: 0;
        }
    `;

    constructor() {
        super();
        this.name = '';
        this.icon = '';
        this.active = false;
        this.disabled = false;
        this.closable = false;
        this.modified = false;
        this.count = null;
        this.variant = 'underline';
    }

    render() {
        return html`
            <button
                role="tab"
                aria-selected="${this.active}"
                ?disabled="${this.disabled}"
                @click="${this._handleClick}"
            >
                ${this.icon ? html`
                    <span class="tab-icon">
                        <dash-icon name="${this.icon}" size="14"></dash-icon>
                    </span>
                ` : ''}
                <span class="tab-title"><slot></slot></span>
                ${this.count !== null && this.count !== undefined ? html`
                    <span class="tab-count">${this.count}</span>
                ` : ''}
                ${this.modified && (!this.closable || !this._isHovering) ? html`
                    <span class="tab-modified"></span>
                ` : ''}
                ${this.closable ? html`
                    <button class="tab-close" @click="${this._handleClose}" title="Close">
                        <dash-icon name="x" size="10"></dash-icon>
                    </button>
                ` : ''}
            </button>
        `;
    }

    _handleClick(e) {
        // Don't trigger tab click if clicking the close button
        if (e.target.closest('.tab-close')) return;
        if (this.disabled) return;
        this.dispatchEvent(new CustomEvent('tab-click', {
            bubbles: true,
            composed: true,
            detail: { name: this.name }
        }));
    }

    _handleClose(e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('tab-close', {
            bubbles: true,
            composed: true,
            detail: { name: this.name }
        }));
    }
}

customElements.define('dash-tab', DashTab);
export { DashTab };
