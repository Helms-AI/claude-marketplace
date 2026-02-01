/**
 * Input Atom - Text input component
 * @module components/atoms/input
 */
import { LitElement, html, css } from 'lit';

class DashInput extends LitElement {
    static properties = {
        value: { type: String },
        placeholder: { type: String },
        type: { type: String },       // 'text' | 'password' | 'email' | 'number' | 'search'
        size: { type: String },       // 'sm' | 'md' | 'lg'
        disabled: { type: Boolean, reflect: true },
        readonly: { type: Boolean },
        error: { type: Boolean },
        icon: { type: String },       // Left icon name
        clearable: { type: Boolean },
        autofocus: { type: Boolean }
    };

    static styles = css`
        :host {
            display: block;
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
        }

        .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }

        input {
            width: 100%;
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: var(--radius-md, 6px);
            background: var(--bg-primary, #ffffff);
            color: var(--text-primary, #1f2937);
            font-family: inherit;
            font-size: var(--font-size-sm, 12px);
            outline: none;
            transition: border-color 0.15s, box-shadow 0.15s;
        }

        input::placeholder {
            color: var(--text-muted, #9ca3af);
        }

        input:focus {
            border-color: var(--accent-color, #3b82f6);
            box-shadow: 0 0 0 3px var(--accent-color-alpha, rgba(59, 130, 246, 0.15));
        }

        :host([error]) input {
            border-color: var(--danger-color, #ef4444);
        }

        :host([error]) input:focus {
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }

        /* Sizes */
        input.sm {
            height: 28px;
            padding: 0 var(--spacing-sm, 8px);
            font-size: var(--font-size-xs, 11px);
        }

        input.md {
            height: 34px;
            padding: 0 var(--spacing-md, 12px);
        }

        input.lg {
            height: 42px;
            padding: 0 var(--spacing-lg, 16px);
            font-size: var(--font-size-base, 13px);
        }

        /* With icon */
        .has-icon input {
            padding-left: 32px;
        }

        .has-icon.sm input {
            padding-left: 28px;
        }

        .icon {
            position: absolute;
            left: 10px;
            color: var(--text-muted, #9ca3af);
            pointer-events: none;
        }

        .sm .icon {
            left: 8px;
        }

        /* Clear button */
        .has-clear input {
            padding-right: 32px;
        }

        .clear-btn {
            position: absolute;
            right: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            border: none;
            border-radius: 50%;
            background: var(--bg-tertiary, #e5e7eb);
            color: var(--text-muted, #9ca3af);
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.15s;
        }

        .input-wrapper:hover .clear-btn,
        input:focus ~ .clear-btn {
            opacity: 1;
        }

        .clear-btn:hover {
            background: var(--bg-hover, #d1d5db);
            color: var(--text-secondary, #6b7280);
        }
    `;

    constructor() {
        super();
        this.value = '';
        this.placeholder = '';
        this.type = 'text';
        this.size = 'md';
        this.disabled = false;
        this.readonly = false;
        this.error = false;
        this.icon = '';
        this.clearable = false;
        this.autofocus = false;
    }

    firstUpdated() {
        if (this.autofocus) {
            this.shadowRoot.querySelector('input')?.focus();
        }
    }

    render() {
        const wrapperClasses = [];
        if (this.icon) wrapperClasses.push('has-icon');
        if (this.clearable && this.value) wrapperClasses.push('has-clear');
        wrapperClasses.push(this.size);

        return html`
            <div class="input-wrapper ${wrapperClasses.join(' ')}">
                ${this.icon ? html`
                    <dash-icon class="icon" name="${this.icon}" size="14"></dash-icon>
                ` : ''}
                <input
                    class="${this.size}"
                    type="${this.type}"
                    .value="${this.value}"
                    placeholder="${this.placeholder}"
                    ?disabled="${this.disabled}"
                    ?readonly="${this.readonly}"
                    @input="${this._handleInput}"
                    @change="${this._handleChange}"
                    @keydown="${this._handleKeydown}"
                />
                ${this.clearable && this.value ? html`
                    <button class="clear-btn" @click="${this._handleClear}" type="button">
                        <dash-icon name="x" size="12"></dash-icon>
                    </button>
                ` : ''}
            </div>
        `;
    }

    _handleInput(e) {
        this.value = e.target.value;
        this.dispatchEvent(new CustomEvent('dash-input', {
            detail: { value: this.value },
            bubbles: true,
            composed: true
        }));
    }

    _handleChange(e) {
        this.dispatchEvent(new CustomEvent('dash-change', {
            detail: { value: this.value },
            bubbles: true,
            composed: true
        }));
    }

    _handleKeydown(e) {
        if (e.key === 'Enter') {
            this.dispatchEvent(new CustomEvent('dash-submit', {
                detail: { value: this.value },
                bubbles: true,
                composed: true
            }));
        }
        if (e.key === 'Escape') {
            this.dispatchEvent(new CustomEvent('dash-escape', {
                bubbles: true,
                composed: true
            }));
        }
    }

    _handleClear() {
        this.value = '';
        this.dispatchEvent(new CustomEvent('dash-input', {
            detail: { value: '' },
            bubbles: true,
            composed: true
        }));
        this.dispatchEvent(new CustomEvent('dash-clear', {
            bubbles: true,
            composed: true
        }));
        this.shadowRoot.querySelector('input')?.focus();
    }

    focus() {
        this.shadowRoot.querySelector('input')?.focus();
    }

    blur() {
        this.shadowRoot.querySelector('input')?.blur();
    }
}

customElements.define('dash-input', DashInput);
export { DashInput };
