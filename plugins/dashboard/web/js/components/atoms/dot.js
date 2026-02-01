/**
 * Dot Atom - Status dot indicator
 * @module components/atoms/dot
 */
import { LitElement, html, css } from 'lit';

class DashDot extends LitElement {
    static properties = {
        status: { type: String },     // 'success' | 'warning' | 'error' | 'info' | 'neutral'
        size: { type: String },       // 'xs' | 'sm' | 'md' | 'lg'
        pulse: { type: Boolean },     // Animate with pulse effect
        color: { type: String }       // Custom color override
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .dot {
            border-radius: 50%;
            flex-shrink: 0;
        }

        /* Sizes */
        .xs { width: 6px; height: 6px; }
        .sm { width: 8px; height: 8px; }
        .md { width: 10px; height: 10px; }
        .lg { width: 12px; height: 12px; }

        /* Status colors */
        .success { background: var(--success-color, #22c55e); }
        .warning { background: var(--warning-color, #f59e0b); }
        .error { background: var(--danger-color, #ef4444); }
        .info { background: var(--accent-color, #3b82f6); }
        .neutral { background: var(--text-muted, #9ca3af); }

        /* Pulse animation */
        .pulse {
            position: relative;
        }

        .pulse::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: inherit;
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0;
                transform: scale(2);
            }
        }
    `;

    constructor() {
        super();
        this.status = 'neutral';
        this.size = 'sm';
        this.pulse = false;
        this.color = '';
    }

    render() {
        const classes = [this.size, this.status];
        if (this.pulse) classes.push('pulse');

        const style = this.color ? `background: ${this.color};` : '';

        return html`
            <span
                class="dot ${classes.join(' ')}"
                style="${style}"
            ></span>
        `;
    }
}

customElements.define('dash-dot', DashDot);
export { DashDot };
