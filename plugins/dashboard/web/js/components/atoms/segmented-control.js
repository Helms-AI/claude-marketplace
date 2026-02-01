/**
 * Segmented Control Atom - Multi-option toggle like iOS
 * @module components/atoms/segmented-control
 */
import { LitElement, html, css } from 'lit';

class SegmentedControl extends LitElement {
    static properties = {
        options: { type: Array },         // [{ value, label, disabled? }]
        value: { type: String },          // Currently selected value
        size: { type: String },           // 'sm' | 'md' | 'lg'
        disabled: { type: Boolean, reflect: true },
        fullWidth: { type: Boolean, attribute: 'full-width' }
    };

    static styles = css`
        :host {
            display: inline-flex;
        }

        :host([full-width]) {
            display: flex;
            width: 100%;
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
        }

        .container {
            display: inline-flex;
            background: var(--segmented-bg, #2d2d2d);
            border-radius: var(--radius-md, 6px);
            padding: 2px;
            gap: 2px;
        }

        :host([full-width]) .container {
            width: 100%;
        }

        .option {
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: transparent;
            color: var(--text-secondary, #8b949e);
            font-family: inherit;
            font-weight: 500;
            cursor: pointer;
            border-radius: var(--radius-sm, 4px);
            transition: all 0.15s ease;
            white-space: nowrap;
        }

        :host([full-width]) .option {
            flex: 1;
        }

        .option:hover:not(:disabled):not(.active) {
            color: var(--text-primary, #cccccc);
            background: var(--bg-hover, rgba(255, 255, 255, 0.05));
        }

        .option.active {
            background: var(--segmented-active-bg, #3c3c3c);
            color: var(--text-primary, #cccccc);
            box-shadow: var(--segmented-active-shadow, 0 1px 3px rgba(0, 0, 0, 0.2));
        }

        .option:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .option:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px var(--accent-color, #007acc);
        }

        /* Sizes */
        .sm .option {
            height: 24px;
            padding: 0 var(--spacing-sm, 8px);
            font-size: var(--font-size-xs, 11px);
        }

        .md .option {
            height: 28px;
            padding: 0 var(--spacing-md, 12px);
            font-size: var(--font-size-sm, 12px);
        }

        .lg .option {
            height: 34px;
            padding: 0 var(--spacing-lg, 16px);
            font-size: var(--font-size-base, 13px);
        }
    `;

    constructor() {
        super();
        this.options = [];
        this.value = '';
        this.size = 'md';
        this.disabled = false;
        this.fullWidth = false;
    }

    render() {
        return html`
            <div class="container ${this.size}" role="radiogroup">
                ${this.options.map(opt => html`
                    <button
                        class="option ${opt.value === this.value ? 'active' : ''}"
                        role="radio"
                        aria-checked="${opt.value === this.value}"
                        ?disabled="${this.disabled || opt.disabled}"
                        @click="${() => this._handleSelect(opt.value)}"
                    >
                        ${opt.label}
                    </button>
                `)}
            </div>
        `;
    }

    _handleSelect(value) {
        if (value === this.value) return;

        const previousValue = this.value;
        this.value = value;

        this.dispatchEvent(new CustomEvent('dash-change', {
            detail: { value, previousValue },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('segmented-control', SegmentedControl);
export { SegmentedControl };
