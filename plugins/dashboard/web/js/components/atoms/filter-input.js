/**
 * FilterInput Atom - Specialized input for filtering lists
 * @module components/atoms/filter-input
 *
 * Usage:
 * <dash-filter-input
 *   placeholder="Filter agents..."
 *   @dash-input="${(e) => filterList(e.detail.value)}"
 * ></dash-filter-input>
 */
import { LitElement, html, css } from 'lit';
import './icon.js';

class DashFilterInput extends LitElement {
    static properties = {
        /** Current filter value */
        value: { type: String },
        /** Placeholder text */
        placeholder: { type: String },
        /** Disable the input */
        disabled: { type: Boolean, reflect: true },
        /** Debounce delay in ms (0 = no debounce) */
        debounce: { type: Number }
    };

    static styles = css`
        :host {
            display: block;
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
        }

        .filter-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }

        input {
            width: 100%;
            height: 32px;
            padding: 0 32px 0 10px;
            border: 1px solid var(--border-color, #3d3d3d);
            border-radius: var(--radius-sm, 4px);
            background: var(--bg-tertiary, #2d2d2d);
            color: var(--text-primary, #e0e0e0);
            font-family: inherit;
            font-size: 13px;
            outline: none;
            transition: border-color 0.15s, background 0.15s;
        }

        input::placeholder {
            color: var(--text-muted, #808080);
        }

        input:focus {
            border-color: var(--accent-color, #4a90d9);
            background: var(--bg-secondary, #252526);
        }

        .clear-btn {
            position: absolute;
            right: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            border: none;
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            color: var(--text-muted, #808080);
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.15s, background 0.15s;
        }

        .filter-wrapper:hover .clear-btn.visible,
        input:focus ~ .clear-btn.visible {
            opacity: 1;
        }

        .clear-btn:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.1));
            color: var(--text-secondary, #b0b0b0);
        }
    `;

    constructor() {
        super();
        this.value = '';
        this.placeholder = 'Filter...';
        this.disabled = false;
        this.debounce = 0;
        this._debounceTimer = null;
    }

    render() {
        return html`
            <div class="filter-wrapper">
                <input
                    type="text"
                    .value="${this.value}"
                    placeholder="${this.placeholder}"
                    ?disabled="${this.disabled}"
                    @input="${this._handleInput}"
                    @keydown="${this._handleKeydown}"
                />
                <button
                    class="clear-btn ${this.value ? 'visible' : ''}"
                    @click="${this._handleClear}"
                    type="button"
                    tabindex="-1"
                >
                    <dash-icon name="x" size="14"></dash-icon>
                </button>
            </div>
        `;
    }

    _handleInput(e) {
        this.value = e.target.value;

        if (this.debounce > 0) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => {
                this._emitInput();
            }, this.debounce);
        } else {
            this._emitInput();
        }
    }

    _emitInput() {
        this.dispatchEvent(new CustomEvent('dash-input', {
            detail: { value: this.value },
            bubbles: true,
            composed: true
        }));
    }

    _handleKeydown(e) {
        if (e.key === 'Escape') {
            if (this.value) {
                this._handleClear();
            } else {
                this.dispatchEvent(new CustomEvent('dash-escape', {
                    bubbles: true,
                    composed: true
                }));
            }
        }
    }

    _handleClear() {
        this.value = '';
        clearTimeout(this._debounceTimer);
        this._emitInput();
        this.dispatchEvent(new CustomEvent('dash-clear', {
            bubbles: true,
            composed: true
        }));
        this.shadowRoot.querySelector('input')?.focus();
    }

    focus() {
        this.shadowRoot.querySelector('input')?.focus();
    }

    clear() {
        this._handleClear();
    }
}

customElements.define('dash-filter-input', DashFilterInput);
export { DashFilterInput };
