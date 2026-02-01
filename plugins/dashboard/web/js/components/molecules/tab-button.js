/**
 * TabButton Molecule - Button + badge + active state
 * @module components/molecules/tab-button
 */
import { LitElement, html, css } from 'lit';
import '../atoms/badge.js';

class DashTabButton extends LitElement {
    static properties = {
        active: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
        count: { type: Number },
        icon: { type: String },
        closable: { type: Boolean },
        variant: { type: String }  // 'default' | 'pill' | 'underline'
    };

    static styles = css`
        :host {
            display: inline-flex;
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
        }

        button {
            display: inline-flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            border: none;
            background: transparent;
            font-family: inherit;
            font-size: var(--font-size-xs, 11px);
            font-weight: 500;
            color: var(--text-secondary, #6b7280);
            cursor: pointer;
            transition: all 0.15s;
            white-space: nowrap;
        }

        /* Default variant */
        button.default {
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            border-radius: var(--radius-sm, 4px);
        }

        button.default:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
            color: var(--text-primary, #1f2937);
        }

        :host([active]) button.default {
            background: var(--bg-secondary, #f3f4f6);
            color: var(--text-primary, #1f2937);
        }

        /* Pill variant */
        button.pill {
            padding: var(--spacing-xs, 4px) var(--spacing-md, 12px);
            border-radius: 999px;
        }

        button.pill:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
        }

        :host([active]) button.pill {
            background: var(--accent-color, #3b82f6);
            color: white;
        }

        /* Underline variant */
        button.underline {
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border-bottom: 2px solid transparent;
            border-radius: 0;
        }

        button.underline:hover {
            color: var(--text-primary, #1f2937);
            border-bottom-color: var(--border-color, #e5e7eb);
        }

        :host([active]) button.underline {
            color: var(--accent-color, #3b82f6);
            border-bottom-color: var(--accent-color, #3b82f6);
        }

        /* Count badge */
        .count {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 16px;
            height: 16px;
            padding: 0 4px;
            border-radius: 999px;
            background: var(--bg-tertiary, #e5e7eb);
            font-size: 10px;
            font-weight: 600;
        }

        :host([active]) button.pill .count {
            background: rgba(255, 255, 255, 0.2);
            color: white;
        }

        /* Close button */
        .close {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            margin-left: 2px;
            border-radius: var(--radius-sm, 4px);
            color: var(--text-muted, #9ca3af);
            transition: all 0.15s;
        }

        .close:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.1));
            color: var(--text-primary, #1f2937);
        }
    `;

    constructor() {
        super();
        this.active = false;
        this.disabled = false;
        this.count = null;
        this.icon = '';
        this.closable = false;
        this.variant = 'default';
    }

    render() {
        return html`
            <button
                class="${this.variant}"
                ?disabled="${this.disabled}"
                @click="${this._handleClick}"
            >
                ${this.icon ? html`<dash-icon name="${this.icon}" size="14"></dash-icon>` : ''}
                <slot></slot>
                ${this.count !== null ? html`
                    <span class="count">${this.count}</span>
                ` : ''}
                ${this.closable ? html`
                    <span class="close" @click="${this._handleClose}">
                        <dash-icon name="x" size="10"></dash-icon>
                    </span>
                ` : ''}
            </button>
        `;
    }

    _handleClick(e) {
        if (this.disabled) return;
        this.dispatchEvent(new CustomEvent('dash-select', {
            bubbles: true,
            composed: true
        }));
    }

    _handleClose(e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('dash-close', {
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('dash-tab-button', DashTabButton);
export { DashTabButton };
