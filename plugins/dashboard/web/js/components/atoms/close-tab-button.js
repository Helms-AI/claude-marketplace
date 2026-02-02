/**
 * Close Tab Button Atom - Small close button for tabs
 * @module components/atoms/close-tab-button
 *
 * A compact close button designed specifically for tab interfaces.
 * Emits 'close-tab' event when clicked.
 *
 * @example
 * ```html
 * <close-tab-button @close-tab="${this._handleClose}"></close-tab-button>
 * <close-tab-button size="sm" visible-on-hover></close-tab-button>
 * ```
 */
import { LitElement, html, css } from 'lit';
import './icon.js';

class CloseTabButton extends LitElement {
    static properties = {
        size: { type: String },              // 'sm' | 'md'
        visibleOnHover: { type: Boolean, attribute: 'visible-on-hover' },
        disabled: { type: Boolean, reflect: true }
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.3;
        }

        :host([visible-on-hover]) button {
            opacity: 0;
            transition: opacity 0.15s ease;
        }

        :host([visible-on-hover]:hover) button,
        :host([visible-on-hover][data-parent-hover]) button {
            opacity: 1;
        }

        button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: none;
            border-radius: var(--radius-sm, 4px);
            cursor: pointer;
            background: transparent;
            color: var(--text-muted, #6e7681);
            padding: 0;
            transition: all 0.15s ease;
        }

        /* Size: sm */
        button.sm {
            width: 16px;
            height: 16px;
        }

        button.sm dash-icon {
            --icon-size: 12px;
        }

        /* Size: md */
        button.md {
            width: 20px;
            height: 20px;
        }

        button.md dash-icon {
            --icon-size: 14px;
        }

        /* Hover and active states */
        button:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.1));
            color: var(--text-primary, #cccccc);
        }

        button:active {
            background: var(--bg-active, rgba(255, 255, 255, 0.15));
            transform: scale(0.9);
        }

        /* Danger hover for close action */
        button:hover {
            color: var(--danger-color, #ef4444);
            background: rgba(239, 68, 68, 0.1);
        }

        button:active {
            background: rgba(239, 68, 68, 0.2);
        }

        /* Focus state */
        button:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px var(--accent-color, #007acc);
        }
    `;

    constructor() {
        super();
        this.size = 'sm';
        this.visibleOnHover = false;
        this.disabled = false;
    }

    render() {
        return html`
            <button
                class="${this.size}"
                ?disabled="${this.disabled}"
                @click="${this._handleClick}"
                @mousedown="${this._preventFocus}"
                title="Close"
                aria-label="Close tab"
            >
                <dash-icon name="x" size="${this.size === 'sm' ? 12 : 14}"></dash-icon>
            </button>
        `;
    }

    _handleClick(e) {
        e.stopPropagation(); // Prevent tab selection when closing
        if (this.disabled) return;

        this.dispatchEvent(new CustomEvent('close-tab', {
            bubbles: true,
            composed: true
        }));
    }

    _preventFocus(e) {
        // Prevent focus shift when clicking close button
        e.preventDefault();
    }

    /**
     * Show the button (for parent hover state)
     */
    show() {
        this.setAttribute('data-parent-hover', '');
    }

    /**
     * Hide the button (for parent hover state)
     */
    hide() {
        this.removeAttribute('data-parent-hover');
    }
}

customElements.define('close-tab-button', CloseTabButton);
export { CloseTabButton };
