/**
 * Button Atom - Base button with variants
 * @module components/atoms/button
 */
import { LitElement, html, css } from 'lit';

class DashButton extends LitElement {
    static properties = {
        variant: { type: String },    // 'primary' | 'secondary' | 'ghost' | 'danger'
        size: { type: String },       // 'sm' | 'md' | 'lg'
        disabled: { type: Boolean, reflect: true },
        loading: { type: Boolean },
        icon: { type: String },       // Icon name (left)
        iconRight: { type: String, attribute: 'icon-right' },
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
        }

        button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: var(--spacing-xs, 4px);
            border: 1px solid transparent;
            border-radius: var(--radius-md, 6px);
            font-family: inherit;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            white-space: nowrap;
        }

        :host([full-width]) button {
            width: 100%;
        }

        /* Sizes */
        button.sm {
            height: 28px;
            padding: 0 var(--spacing-sm, 8px);
            font-size: var(--font-size-xs, 11px);
        }

        button.md {
            height: 34px;
            padding: 0 var(--spacing-md, 12px);
            font-size: var(--font-size-sm, 12px);
        }

        button.lg {
            height: 42px;
            padding: 0 var(--spacing-lg, 16px);
            font-size: var(--font-size-base, 13px);
        }

        /* Variants */
        button.primary {
            background: var(--accent-color, #2563eb);
            color: white;
            border-color: var(--accent-color, #2563eb);
        }

        button.primary:hover:not(:disabled) {
            background: var(--accent-hover, #1d4ed8);
            border-color: var(--accent-hover, #1d4ed8);
        }

        button.primary:active:not(:disabled) {
            background: var(--accent-active, #1e40af);
        }

        button.secondary {
            background: var(--bg-secondary, #f3f4f6);
            color: var(--text-primary, #1f2937);
            border-color: var(--border-color, #e5e7eb);
        }

        button.secondary:hover:not(:disabled) {
            background: var(--bg-tertiary, #e5e7eb);
        }

        button.ghost {
            background: transparent;
            color: var(--text-secondary, #6b7280);
            border-color: transparent;
        }

        button.ghost:hover:not(:disabled) {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
            color: var(--text-primary, #1f2937);
        }

        button.danger {
            background: var(--danger-color, #dc2626);
            color: white;
            border-color: var(--danger-color, #dc2626);
        }

        button.danger:hover:not(:disabled) {
            background: var(--danger-hover, #b91c1c);
            border-color: var(--danger-hover, #b91c1c);
        }

        /* Disabled state */
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* Loading state */
        button.loading {
            position: relative;
            color: transparent !important;
        }

        .spinner {
            position: absolute;
            width: 16px;
            height: 16px;
            border: 2px solid currentColor;
            border-right-color: transparent;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
        }

        button.primary .spinner {
            border-color: white;
            border-right-color: transparent;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Icon styles */
        ::slotted(dash-icon),
        dash-icon {
            flex-shrink: 0;
        }
    `;

    constructor() {
        super();
        this.variant = 'secondary';
        this.size = 'md';
        this.disabled = false;
        this.loading = false;
        this.icon = '';
        this.iconRight = '';
        this.fullWidth = false;
    }

    render() {
        const classes = [this.variant, this.size];
        if (this.loading) classes.push('loading');

        return html`
            <button
                class="${classes.join(' ')}"
                ?disabled="${this.disabled || this.loading}"
                @click="${this._handleClick}"
            >
                ${this.loading ? html`<span class="spinner"></span>` : ''}
                ${this.icon ? html`<dash-icon name="${this.icon}" size="14"></dash-icon>` : ''}
                <slot></slot>
                ${this.iconRight ? html`<dash-icon name="${this.iconRight}" size="14"></dash-icon>` : ''}
            </button>
        `;
    }

    _handleClick(e) {
        if (this.disabled || this.loading) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        this.dispatchEvent(new CustomEvent('dash-click', { bubbles: true, composed: true }));
    }
}

customElements.define('dash-button', DashButton);
export { DashButton };
