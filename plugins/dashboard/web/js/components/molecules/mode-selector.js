/**
 * Mode Selector Molecule - Build/Plan mode dropdown
 * @module components/molecules/mode-selector
 */
import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';

class ModeSelector extends LitElement {
    static properties = {
        mode: { type: String },           // 'build' | 'plan'
        disabled: { type: Boolean, reflect: true },
        compact: { type: Boolean },
        _open: { type: Boolean, state: true }
    };

    static styles = css`
        :host {
            display: inline-flex;
            position: relative;
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
        }

        .trigger {
            display: inline-flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            background: var(--bg-secondary, #2d2d2d);
            border: 1px solid var(--border-color, #3c3c3c);
            border-radius: var(--radius-md, 6px);
            color: var(--text-primary, #cccccc);
            font-family: inherit;
            font-size: var(--font-size-sm, 12px);
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            min-width: 90px;
        }

        .trigger:hover:not(:disabled) {
            background: var(--bg-hover, #363636);
            border-color: var(--text-muted, #6e7681);
        }

        .trigger:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px var(--accent-color, #007acc);
        }

        .trigger.open {
            border-color: var(--accent-color, #007acc);
        }

        .mode-icon {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
        }

        .mode-label {
            flex: 1;
            text-align: left;
        }

        :host([compact]) .mode-label {
            display: none;
        }

        .chevron {
            color: var(--text-muted, #6e7681);
            transition: transform 0.15s ease;
        }

        .trigger.open .chevron {
            transform: rotate(180deg);
        }

        dash-icon.chevron,
        dash-icon.checkmark {
            display: inline-flex;
        }

        /* Dropdown menu */
        .menu {
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            min-width: 240px;
            background: var(--bg-secondary, #252526);
            border: 1px solid var(--border-color, #3c3c3c);
            border-radius: var(--radius-md, 6px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 100;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-8px);
            transition: all 0.15s ease;
        }

        .menu.open {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .menu-item {
            display: flex;
            align-items: flex-start;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            cursor: pointer;
            transition: background 0.1s ease;
        }

        .menu-item:first-child {
            border-radius: var(--radius-md, 6px) var(--radius-md, 6px) 0 0;
        }

        .menu-item:last-child {
            border-radius: 0 0 var(--radius-md, 6px) var(--radius-md, 6px);
        }

        .menu-item:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.05));
        }

        .menu-item.selected {
            background: var(--bg-active, rgba(0, 122, 204, 0.1));
        }

        .item-icon {
            width: 20px;
            height: 20px;
            margin-top: 2px;
            flex-shrink: 0;
        }

        .item-content {
            flex: 1;
            min-width: 0;
        }

        .item-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
        }

        .item-label {
            font-size: var(--font-size-sm, 13px);
            font-weight: 500;
            color: var(--text-primary, #cccccc);
        }

        .item-badge {
            padding: 1px 6px;
            font-size: 10px;
            font-weight: 600;
            background: linear-gradient(135deg, #f97316, #ea580c);
            color: white;
            border-radius: 4px;
        }

        .item-description {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #8b949e);
            margin-top: 2px;
        }

        .checkmark {
            width: 16px;
            height: 16px;
            color: var(--accent-color, #007acc);
            margin-left: auto;
            flex-shrink: 0;
            opacity: 0;
        }

        .menu-item.selected .checkmark {
            opacity: 1;
        }

        /* Mode-specific icon colors */
        .build-icon { color: var(--mode-build-color, #007acc); }
        .plan-icon { color: var(--mode-plan-color, #f59e0b); }
    `;

    static modes = [
        {
            value: 'build',
            label: 'Build',
            description: 'Make, test, iterate',
            icon: 'box',
            iconClass: 'build-icon'
        },
        {
            value: 'plan',
            label: 'Plan',
            description: 'Ask questions, plan your work',
            icon: 'file-text',
            iconClass: 'plan-icon',
            badge: 'Core'
        }
    ];

    constructor() {
        super();
        this.mode = 'build';
        this.disabled = false;
        this.compact = false;
        this._open = false;
        this._handleOutsideClick = this._handleOutsideClick.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('click', this._handleOutsideClick);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this._handleOutsideClick);
    }

    _handleOutsideClick(e) {
        if (this._open && !this.contains(e.target)) {
            this._open = false;
        }
    }

    _toggleMenu(e) {
        e.stopPropagation();
        this._open = !this._open;
    }

    _selectMode(value) {
        if (value === this.mode) {
            this._open = false;
            return;
        }

        const previousMode = this.mode;
        this.mode = value;
        this._open = false;

        this.dispatchEvent(new CustomEvent('mode-change', {
            detail: { mode: value, previousMode },
            bubbles: true,
            composed: true
        }));
    }

    _getCurrentMode() {
        return ModeSelector.modes.find(m => m.value === this.mode) || ModeSelector.modes[0];
    }

    render() {
        const current = this._getCurrentMode();

        return html`
            <button
                class="trigger ${this._open ? 'open' : ''}"
                ?disabled="${this.disabled}"
                @click="${this._toggleMenu}"
                aria-haspopup="listbox"
                aria-expanded="${this._open}"
            >
                <span class="mode-icon ${current.iconClass}">
                    <dash-icon name="${current.icon}" size="16" stroke-width="1.5"></dash-icon>
                </span>
                <span class="mode-label">${current.label}</span>
                <dash-icon class="chevron" name="chevron-down" size="12"></dash-icon>
            </button>

            <div class="menu ${this._open ? 'open' : ''}" role="listbox">
                ${ModeSelector.modes.map(m => html`
                    <div
                        class="menu-item ${m.value === this.mode ? 'selected' : ''}"
                        role="option"
                        aria-selected="${m.value === this.mode}"
                        @click="${() => this._selectMode(m.value)}"
                    >
                        <span class="item-icon ${m.iconClass}">
                            <dash-icon name="${m.icon}" size="20" stroke-width="1.5"></dash-icon>
                        </span>
                        <div class="item-content">
                            <div class="item-header">
                                <span class="item-label">${m.label}</span>
                                ${m.badge ? html`<span class="item-badge">${m.badge}</span>` : ''}
                            </div>
                            <div class="item-description">${m.description}</div>
                        </div>
                        <dash-icon class="checkmark" name="check" size="16"></dash-icon>
                    </div>
                `)}
            </div>
        `;
    }
}

customElements.define('mode-selector', ModeSelector);
export { ModeSelector };
