/**
 * Icon Button Component
 *
 * A reusable button with an icon, optional tooltip, and various states.
 * Uses Shadow DOM for style encapsulation.
 *
 * @module components/core/icon-button
 *
 * @example
 * <icon-button icon="refresh" tooltip="Refresh data"></icon-button>
 * <icon-button icon="close" variant="danger" size="sm"></icon-button>
 */

import { LitElement, html, css } from 'lit';

/**
 * Common SVG icons used throughout the dashboard
 */
const ICONS = {
    close: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`,

    refresh: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M23 4v6h-6"></path>
        <path d="M1 20v-6h6"></path>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>`,

    plus: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>`,

    minus: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>`,

    search: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.35-4.35"></path>
    </svg>`,

    menu: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>`,

    settings: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>`,

    chevronDown: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>`,

    chevronRight: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>`,

    maximize: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 3 21 3 21 9"></polyline>
        <polyline points="9 21 3 21 3 15"></polyline>
        <line x1="21" y1="3" x2="14" y2="10"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
    </svg>`,

    minimize: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="4 14 10 14 10 20"></polyline>
        <polyline points="20 10 14 10 14 4"></polyline>
        <line x1="14" y1="10" x2="21" y2="3"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
    </svg>`,

    folder: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>`,

    file: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
        <polyline points="13 2 13 9 20 9"></polyline>
    </svg>`,

    terminal: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="4 17 10 11 4 5"></polyline>
        <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>`,

    message: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>`,

    user: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>`,

    bot: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="10" rx="2"></rect>
        <circle cx="12" cy="5" r="2"></circle>
        <line x1="12" y1="7" x2="12" y2="11"></line>
        <circle cx="8" cy="16" r="1"></circle>
        <circle cx="16" cy="16" r="1"></circle>
    </svg>`,

    stop: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="4" y="4" width="16" height="16" rx="2"></rect>
    </svg>`,

    send: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>`,

    copy: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>`,

    check: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`,

    error: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>`,

    warning: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>`,

    info: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>`
};

/**
 * Icon Button Web Component
 *
 * @fires click - When the button is clicked
 */
class IconButton extends LitElement {
    static properties = {
        /** Icon name from the ICONS map */
        icon: { type: String },

        /** Tooltip text */
        tooltip: { type: String },

        /** Button variant: default, primary, danger, ghost */
        variant: { type: String },

        /** Button size: sm, md, lg */
        size: { type: String },

        /** Disabled state */
        disabled: { type: Boolean, reflect: true },

        /** Active/pressed state */
        active: { type: Boolean, reflect: true },

        /** Loading state */
        loading: { type: Boolean, reflect: true }
    };

    static styles = css`
        :host {
            display: inline-flex;
            --btn-size: 32px;
            --icon-size: 16px;
            --btn-radius: var(--radius-sm, 4px);
            --btn-bg: transparent;
            --btn-bg-hover: var(--bg-hover, rgba(0, 0, 0, 0.05));
            --btn-color: var(--text-secondary, #666);
            --btn-color-hover: var(--text-primary, #333);
        }

        :host([size="sm"]) {
            --btn-size: 24px;
            --icon-size: 14px;
        }

        :host([size="lg"]) {
            --btn-size: 40px;
            --icon-size: 20px;
        }

        :host([variant="primary"]) {
            --btn-bg: var(--accent-color, #4a90d9);
            --btn-bg-hover: var(--accent-hover, #3a7bc8);
            --btn-color: white;
            --btn-color-hover: white;
        }

        :host([variant="danger"]) {
            --btn-color: var(--error-color, #dc3545);
            --btn-color-hover: var(--error-color, #dc3545);
            --btn-bg-hover: var(--error-bg, rgba(220, 53, 69, 0.1));
        }

        :host([variant="ghost"]) {
            --btn-bg-hover: transparent;
            opacity: 0.7;
        }

        :host([variant="ghost"]:hover) {
            opacity: 1;
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
        }

        :host([active]) button {
            background: var(--btn-bg-hover);
            color: var(--btn-color-hover);
        }

        button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: var(--btn-size);
            height: var(--btn-size);
            padding: 0;
            border: none;
            border-radius: var(--btn-radius);
            background: var(--btn-bg);
            color: var(--btn-color);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        button:hover {
            background: var(--btn-bg-hover);
            color: var(--btn-color-hover);
        }

        button:focus-visible {
            outline: 2px solid var(--focus-color, #4a90d9);
            outline-offset: 2px;
        }

        button:active {
            transform: scale(0.95);
        }

        svg {
            width: var(--icon-size);
            height: var(--icon-size);
            flex-shrink: 0;
        }

        .loading-spinner {
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* Tooltip */
        :host {
            position: relative;
        }

        .tooltip {
            position: absolute;
            bottom: calc(100% + 8px);
            left: 50%;
            transform: translateX(-50%);
            padding: 4px 8px;
            background: var(--tooltip-bg, #333);
            color: var(--tooltip-color, white);
            font-size: 12px;
            white-space: nowrap;
            border-radius: 4px;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.15s, visibility 0.15s;
            pointer-events: none;
            z-index: 1000;
        }

        .tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 5px solid transparent;
            border-top-color: var(--tooltip-bg, #333);
        }

        :host(:hover) .tooltip {
            opacity: 1;
            visibility: visible;
        }
    `;

    constructor() {
        super();
        this.icon = 'close';
        this.tooltip = '';
        this.variant = 'default';
        this.size = 'md';
        this.disabled = false;
        this.active = false;
        this.loading = false;
    }

    render() {
        const iconContent = this.loading
            ? html`<svg class="loading-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
              </svg>`
            : ICONS[this.icon] || ICONS.close;

        return html`
            <button
                ?disabled=${this.disabled}
                aria-label=${this.tooltip || this.icon}
                @click=${this._handleClick}
            >
                ${iconContent}
            </button>
            ${this.tooltip ? html`<span class="tooltip">${this.tooltip}</span>` : ''}
        `;
    }

    _handleClick(e) {
        if (this.disabled || this.loading) {
            e.stopPropagation();
            return;
        }
        this.dispatchEvent(new CustomEvent('click', {
            bubbles: true,
            composed: true
        }));
    }
}

// Export the ICONS map for use in other components
export { ICONS };

customElements.define('icon-button', IconButton);
export { IconButton };
