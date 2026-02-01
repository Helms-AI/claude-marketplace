/**
 * Icon Button Atom - Icon-only button with variants and states
 * @module components/atoms/icon-button
 */
import { LitElement, html, css } from 'lit';

class DashIconButton extends LitElement {
    static properties = {
        icon: { type: String },           // Icon name from registry
        size: { type: String },           // 'sm' | 'md' | 'lg'
        variant: { type: String },        // 'ghost' | 'filled' | 'outlined'
        disabled: { type: Boolean, reflect: true },
        active: { type: Boolean, reflect: true },
        loading: { type: Boolean },
        tooltip: { type: String }
    };

    static styles = css`
        :host {
            display: inline-flex;
        }

        :host([disabled]) {
            pointer-events: none;
        }

        button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid transparent;
            border-radius: var(--radius-md, 6px);
            cursor: pointer;
            transition: all 0.15s ease;
            padding: 0;
            background: transparent;
            color: var(--text-secondary, #8b949e);
        }

        /* Sizes - visual size with larger touch target */
        button.sm {
            width: 24px;
            height: 24px;
            min-width: 44px;
            min-height: 44px;
        }

        button.sm dash-icon {
            --icon-size: 14px;
        }

        button.md {
            width: 32px;
            height: 32px;
            min-width: 44px;
            min-height: 44px;
        }

        button.md dash-icon {
            --icon-size: 16px;
        }

        button.lg {
            width: 40px;
            height: 40px;
            min-width: 44px;
            min-height: 44px;
        }

        button.lg dash-icon {
            --icon-size: 20px;
        }

        /* Ghost variant (default) */
        button.ghost {
            background: transparent;
            color: var(--text-secondary, #8b949e);
        }

        button.ghost:hover:not(:disabled) {
            background: var(--bg-hover, rgba(255, 255, 255, 0.1));
            color: var(--text-primary, #cccccc);
        }

        button.ghost:active:not(:disabled) {
            background: var(--bg-active, rgba(255, 255, 255, 0.15));
            transform: scale(0.95);
        }

        /* Filled variant */
        button.filled {
            background: var(--accent-color, #007acc);
            color: white;
        }

        button.filled:hover:not(:disabled) {
            background: var(--accent-hover, #0098ff);
        }

        button.filled:active:not(:disabled) {
            background: var(--accent-active, #005a9e);
            transform: scale(0.95);
        }

        /* Outlined variant */
        button.outlined {
            background: transparent;
            border-color: var(--border-color, #3c3c3c);
            color: var(--text-secondary, #8b949e);
        }

        button.outlined:hover:not(:disabled) {
            background: var(--bg-hover, rgba(255, 255, 255, 0.1));
            border-color: var(--text-muted, #6e7681);
            color: var(--text-primary, #cccccc);
        }

        /* Active state */
        :host([active]) button.ghost,
        :host([active]) button.outlined {
            background: var(--accent-color, #007acc);
            color: white;
            border-color: var(--accent-color, #007acc);
        }

        /* Disabled state */
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* Loading state */
        button.loading {
            position: relative;
        }

        button.loading dash-icon {
            visibility: hidden;
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

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Focus state */
        button:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px var(--bg-primary, #1e1e1e), 0 0 0 4px var(--accent-color, #007acc);
        }
    `;

    constructor() {
        super();
        this.icon = '';
        this.size = 'md';
        this.variant = 'ghost';
        this.disabled = false;
        this.active = false;
        this.loading = false;
        this.tooltip = '';
    }

    render() {
        const classes = [this.variant, this.size];
        if (this.loading) classes.push('loading');

        return html`
            <button
                class="${classes.join(' ')}"
                ?disabled="${this.disabled || this.loading}"
                title="${this.tooltip}"
                @click="${this._handleClick}"
            >
                ${this.loading ? html`<span class="spinner"></span>` : ''}
                <dash-icon name="${this.icon}"></dash-icon>
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

customElements.define('dash-icon-button', DashIconButton);
export { DashIconButton };
