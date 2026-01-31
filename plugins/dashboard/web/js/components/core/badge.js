/**
 * Badge Component
 *
 * A small status indicator or count badge with multiple variants.
 * Uses Shadow DOM for style encapsulation.
 *
 * @module components/core/badge
 *
 * @example
 * <status-badge variant="success">Active</status-badge>
 * <status-badge variant="warning" count="5"></status-badge>
 * <status-badge variant="error" pulse></status-badge>
 */

import { LitElement, html, css } from 'lit';

/**
 * Badge variants for different status types
 */
const VARIANTS = {
    default: { bg: 'var(--bg-secondary)', color: 'var(--text-secondary)' },
    primary: { bg: 'var(--accent-color)', color: 'white' },
    success: { bg: 'var(--success-color, #28a745)', color: 'white' },
    warning: { bg: 'var(--warning-color, #ffc107)', color: 'var(--text-primary, #333)' },
    error: { bg: 'var(--error-color, #dc3545)', color: 'white' },
    info: { bg: 'var(--info-color, #17a2b8)', color: 'white' },
    muted: { bg: 'var(--bg-tertiary)', color: 'var(--text-muted)' }
};

/**
 * Status Badge Web Component
 */
class StatusBadge extends LitElement {
    static properties = {
        /** Badge variant: default, primary, success, warning, error, info, muted */
        variant: { type: String },

        /** Optional count to display (replaces slot content) */
        count: { type: Number },

        /** Size: sm, md, lg */
        size: { type: String },

        /** Whether the badge should pulse (for attention) */
        pulse: { type: Boolean },

        /** Dot mode - just a colored dot with no text */
        dot: { type: Boolean },

        /** Pill shape (fully rounded) */
        pill: { type: Boolean }
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            --badge-bg: var(--bg-secondary);
            --badge-color: var(--text-secondary);
            --badge-size: 20px;
            --badge-font-size: 11px;
            --badge-padding: 0 6px;
            --badge-radius: 4px;
        }

        /* Sizes */
        :host([size="sm"]) {
            --badge-size: 16px;
            --badge-font-size: 10px;
            --badge-padding: 0 4px;
        }

        :host([size="lg"]) {
            --badge-size: 24px;
            --badge-font-size: 12px;
            --badge-padding: 0 8px;
        }

        /* Variants */
        :host([variant="primary"]) {
            --badge-bg: var(--accent-color, #4a90d9);
            --badge-color: white;
        }

        :host([variant="success"]) {
            --badge-bg: var(--success-color, #28a745);
            --badge-color: white;
        }

        :host([variant="warning"]) {
            --badge-bg: var(--warning-color, #ffc107);
            --badge-color: var(--text-primary, #333);
        }

        :host([variant="error"]) {
            --badge-bg: var(--error-color, #dc3545);
            --badge-color: white;
        }

        :host([variant="info"]) {
            --badge-bg: var(--info-color, #17a2b8);
            --badge-color: white;
        }

        :host([variant="muted"]) {
            --badge-bg: var(--bg-tertiary, #e9ecef);
            --badge-color: var(--text-muted, #6c757d);
        }

        /* Pill shape */
        :host([pill]) {
            --badge-radius: 999px;
        }

        /* Dot mode */
        :host([dot]) {
            --badge-size: 8px;
            --badge-padding: 0;
        }

        :host([dot][size="sm"]) {
            --badge-size: 6px;
        }

        :host([dot][size="lg"]) {
            --badge-size: 10px;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: var(--badge-size);
            height: var(--badge-size);
            padding: var(--badge-padding);
            background: var(--badge-bg);
            color: var(--badge-color);
            font-size: var(--badge-font-size);
            font-weight: 500;
            line-height: 1;
            border-radius: var(--badge-radius);
            white-space: nowrap;
        }

        :host([dot]) .badge {
            width: var(--badge-size);
            height: var(--badge-size);
            min-width: unset;
            border-radius: 50%;
        }

        /* Pulse animation */
        :host([pulse]) .badge {
            position: relative;
        }

        :host([pulse]) .badge::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background: inherit;
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.5);
                opacity: 0;
            }
        }

        /* Count display */
        .count {
            font-variant-numeric: tabular-nums;
        }

        /* Empty state - hide if no content and no count */
        :host(:empty:not([count]):not([dot])) {
            display: none;
        }
    `;

    constructor() {
        super();
        this.variant = 'default';
        this.size = 'md';
        this.count = undefined;
        this.pulse = false;
        this.dot = false;
        this.pill = false;
    }

    render() {
        // Dot mode - just a colored dot
        if (this.dot) {
            return html`<span class="badge"></span>`;
        }

        // Count mode
        if (this.count !== undefined) {
            const displayCount = this.count > 99 ? '99+' : String(this.count);
            return html`<span class="badge"><span class="count">${displayCount}</span></span>`;
        }

        // Text content via slot
        return html`<span class="badge"><slot></slot></span>`;
    }
}

customElements.define('status-badge', StatusBadge);
export { StatusBadge };
