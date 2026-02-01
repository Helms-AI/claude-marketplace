/**
 * Select Atom - Dropdown select component
 * @module components/atoms/select
 */
import { LitElement, html, css } from 'lit';

class DashSelect extends LitElement {
    static properties = {
        value: { type: String },
        options: { type: Array },     // [{ value: string, label: string, disabled?: boolean }]
        placeholder: { type: String },
        size: { type: String },       // 'sm' | 'md' | 'lg'
        disabled: { type: Boolean, reflect: true },
        fullWidth: { type: Boolean, attribute: 'full-width' }
    };

    static styles = css`
        :host {
            display: inline-block;
        }

        :host([full-width]) {
            display: block;
            width: 100%;
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
        }

        .select-wrapper {
            position: relative;
            display: inline-flex;
            width: 100%;
        }

        select {
            width: 100%;
            appearance: none;
            -webkit-appearance: none;
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: var(--radius-md, 6px);
            background: var(--bg-primary, #ffffff);
            color: var(--text-primary, #1f2937);
            font-family: inherit;
            font-size: var(--font-size-sm, 12px);
            cursor: pointer;
            outline: none;
            transition: border-color 0.15s, box-shadow 0.15s;
            padding-right: 32px;
        }

        select:focus {
            border-color: var(--accent-color, #3b82f6);
            box-shadow: 0 0 0 3px var(--accent-color-alpha, rgba(59, 130, 246, 0.15));
        }

        /* Sizes */
        select.sm {
            height: 28px;
            padding: 0 var(--spacing-sm, 8px);
            font-size: var(--font-size-xs, 11px);
        }

        select.md {
            height: 34px;
            padding: 0 var(--spacing-md, 12px);
        }

        select.lg {
            height: 42px;
            padding: 0 var(--spacing-lg, 16px);
            font-size: var(--font-size-base, 13px);
        }

        .chevron {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
            color: var(--text-muted, #9ca3af);
        }

        option:disabled {
            color: var(--text-muted, #9ca3af);
        }
    `;

    constructor() {
        super();
        this.value = '';
        this.options = [];
        this.placeholder = '';
        this.size = 'md';
        this.disabled = false;
        this.fullWidth = false;
    }

    render() {
        return html`
            <div class="select-wrapper">
                <select
                    class="${this.size}"
                    .value="${this.value}"
                    ?disabled="${this.disabled}"
                    @change="${this._handleChange}"
                >
                    ${this.placeholder ? html`
                        <option value="" disabled ?selected="${!this.value}">
                            ${this.placeholder}
                        </option>
                    ` : ''}
                    ${this.options.map(opt => html`
                        <option
                            value="${opt.value}"
                            ?disabled="${opt.disabled}"
                            ?selected="${opt.value === this.value}"
                        >
                            ${opt.label}
                        </option>
                    `)}
                </select>
                <dash-icon class="chevron" name="chevron-down" size="14"></dash-icon>
            </div>
        `;
    }

    _handleChange(e) {
        this.value = e.target.value;
        this.dispatchEvent(new CustomEvent('dash-change', {
            detail: { value: this.value },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('dash-select', DashSelect);
export { DashSelect };
