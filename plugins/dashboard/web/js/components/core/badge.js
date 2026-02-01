/**
 * Badge Component - A small status indicator or count badge
 * @module components/core/badge
 */

import { LitElement, html, css } from 'lit';

class StatusBadge extends LitElement {
    static properties = {
        variant: { type: String },
        count: { type: Number },
        size: { type: String },
        pulse: { type: Boolean },
        dot: { type: Boolean },
        pill: { type: Boolean }
    };

    static styles = css`
        :host { display: inline-flex; align-items: center; justify-content: center; --badge-bg: var(--bg-secondary); --badge-color: var(--text-secondary); --badge-size: 20px; --badge-font-size: 11px; --badge-padding: 0 6px; --badge-radius: 4px; }
        :host([size="sm"]) { --badge-size: 16px; --badge-font-size: 10px; --badge-padding: 0 4px; }
        :host([size="lg"]) { --badge-size: 24px; --badge-font-size: 12px; --badge-padding: 0 8px; }
        :host([variant="primary"]) { --badge-bg: var(--accent-color, #4a90d9); --badge-color: white; }
        :host([variant="success"]) { --badge-bg: var(--success-color, #28a745); --badge-color: white; }
        :host([variant="warning"]) { --badge-bg: var(--warning-color, #ffc107); --badge-color: var(--text-primary, #333); }
        :host([variant="error"]) { --badge-bg: var(--error-color, #dc3545); --badge-color: white; }
        :host([variant="info"]) { --badge-bg: var(--info-color, #17a2b8); --badge-color: white; }
        :host([variant="muted"]) { --badge-bg: var(--bg-tertiary, #e9ecef); --badge-color: var(--text-muted, #6c757d); }
        :host([pill]) { --badge-radius: 999px; }
        :host([dot]) { --badge-size: 8px; --badge-padding: 0; }
        :host([dot][size="sm"]) { --badge-size: 6px; }
        :host([dot][size="lg"]) { --badge-size: 10px; }
        .badge { display: inline-flex; align-items: center; justify-content: center; min-width: var(--badge-size); height: var(--badge-size); padding: var(--badge-padding); background: var(--badge-bg); color: var(--badge-color); font-size: var(--badge-font-size); font-weight: 500; line-height: 1; border-radius: var(--badge-radius); white-space: nowrap; }
        :host([dot]) .badge { width: var(--badge-size); height: var(--badge-size); min-width: unset; border-radius: 50%; }
        :host([pulse]) .badge { position: relative; }
        :host([pulse]) .badge::before { content: ''; position: absolute; inset: 0; border-radius: inherit; background: inherit; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0; } }
        .count { font-variant-numeric: tabular-nums; }
        :host(:empty:not([count]):not([dot])) { display: none; }
    `;

    constructor() { super(); this.variant = 'default'; this.size = 'md'; this.count = undefined; this.pulse = false; this.dot = false; this.pill = false; }

    render() {
        if (this.dot) return html`<span class="badge"></span>`;
        if (this.count !== undefined) { const displayCount = this.count > 99 ? '99+' : String(this.count); return html`<span class="badge"><span class="count">${displayCount}</span></span>`; }
        return html`<span class="badge"><slot></slot></span>`;
    }
}

customElements.define('status-badge', StatusBadge);
export { StatusBadge };
