/**
 * DropdownMenu Molecule - Button + dropdown panel
 * @module components/molecules/dropdown-menu
 */
import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';
import '../atoms/button.js';

class DashDropdownMenu extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        label: { type: String },
        icon: { type: String },
        items: { type: Array },       // [{ id, label, icon?, disabled?, danger? }]
        align: { type: String },      // 'left' | 'right'
        triggerVariant: { type: String, attribute: 'trigger-variant' }
    };

    static styles = css`
        :host {
            position: relative;
            display: inline-block;
        }

        .trigger {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
        }

        .dropdown {
            position: absolute;
            top: 100%;
            margin-top: 4px;
            min-width: 160px;
            max-height: 300px;
            overflow-y: auto;
            background: var(--bg-primary, #ffffff);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: var(--radius-md, 6px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-4px);
            transition: opacity 0.15s, transform 0.15s, visibility 0.15s;
        }

        :host([open]) .dropdown {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .align-left { left: 0; }
        .align-right { right: 0; }

        .menu-item {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            width: 100%;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border: none;
            background: transparent;
            font-family: inherit;
            font-size: var(--font-size-sm, 12px);
            color: var(--text-primary, #1f2937);
            text-align: left;
            cursor: pointer;
            transition: background 0.1s;
        }

        .menu-item:hover:not(:disabled) {
            background: var(--bg-hover, #f3f4f6);
        }

        .menu-item:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .menu-item.danger {
            color: var(--danger-color, #dc2626);
        }

        .menu-item.danger:hover:not(:disabled) {
            background: var(--danger-bg, #fef2f2);
        }

        .divider {
            height: 1px;
            margin: var(--spacing-xs, 4px) 0;
            background: var(--border-color, #e5e7eb);
        }

        .section-header {
            padding: var(--spacing-xs, 4px) var(--spacing-md, 12px);
            font-size: var(--font-size-xs, 11px);
            font-weight: 600;
            color: var(--text-muted, #9ca3af);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
    `;

    constructor() {
        super();
        this.open = false;
        this.label = '';
        this.icon = '';
        this.items = [];
        this.align = 'left';
        this.triggerVariant = 'ghost';
    }

    connectedCallback() {
        super.connectedCallback();
        this._handleClickOutside = this._handleClickOutside.bind(this);
        document.addEventListener('click', this._handleClickOutside);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this._handleClickOutside);
    }

    render() {
        return html`
            <dash-button
                class="trigger"
                variant="${this.triggerVariant}"
                icon="${this.icon}"
                icon-right="chevron-down"
                @click="${this._toggleDropdown}"
            >
                ${this.label}
            </dash-button>

            <div class="dropdown align-${this.align}">
                ${this.items.map(item => this._renderItem(item))}
                <slot></slot>
            </div>
        `;
    }

    _renderItem(item) {
        if (item.type === 'divider') {
            return html`<div class="divider"></div>`;
        }
        if (item.type === 'header') {
            return html`<div class="section-header">${item.label}</div>`;
        }

        const classes = [];
        if (item.danger) classes.push('danger');

        return html`
            <button
                class="menu-item ${classes.join(' ')}"
                ?disabled="${item.disabled}"
                @click="${() => this._handleSelect(item)}"
            >
                ${item.icon ? html`<dash-icon name="${item.icon}" size="14"></dash-icon>` : ''}
                ${item.label}
            </button>
        `;
    }

    _toggleDropdown(e) {
        e.stopPropagation();
        this.open = !this.open;
    }

    _handleClickOutside(e) {
        if (!this.contains(e.target)) {
            this.open = false;
        }
    }

    _handleSelect(item) {
        if (item.disabled) return;
        this.open = false;
        this.dispatchEvent(new CustomEvent('dash-select', {
            detail: { id: item.id, item },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('dash-dropdown-menu', DashDropdownMenu);
export { DashDropdownMenu };
