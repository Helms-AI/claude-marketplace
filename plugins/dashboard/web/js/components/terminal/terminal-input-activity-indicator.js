/**
 * Terminal Input Activity Indicator - "Claude is thinking..." visual feedback
 *
 * Displays a subtle, breathing animation indicator when Claude is processing.
 * Designed to be non-intrusive while providing clear feedback that work is happening.
 *
 * @module components/terminal/terminal-input-activity-indicator
 */

import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';

class TerminalInputActivityIndicator extends LitElement {
    static properties = {
        /** Whether the indicator is visible/active */
        active: { type: Boolean, reflect: true },
        /** Custom message to display (default: "Claude is thinking...") */
        message: { type: String }
    };

    static styles = css`
        :host {
            display: block;
        }

        :host(:not([active])) {
            display: none;
        }

        .activity-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            height: 28px;
            padding: 0 var(--spacing-sm, 8px) 0 12px;
            background: var(--bg-secondary, #252526);
            border-bottom: 1px solid var(--border-color, #3c3c3c);
            font-family: var(--font-mono, 'IBM Plex Mono', 'Consolas', monospace);
            font-size: var(--font-size-xs, 12px);
            color: var(--text-muted, #6e7681);
        }

        .spinner {
            display: flex;
            align-items: center;
            justify-content: center;
            animation: spin 1s linear infinite;
            color: var(--accent-color, #007acc);
        }

        .thinking-text {
            animation: breathe 2s ease-in-out infinite alternate;
        }

        @keyframes breathe {
            from { opacity: 0.5; }
            to { opacity: 1.0; }
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* Accessibility: Respect reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
            .thinking-text {
                animation: none;
                opacity: 1;
            }

            .spinner {
                animation: pulse 2s ease-in-out infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        }
    `;

    constructor() {
        super();
        this.active = false;
        this.message = 'Claude is thinking...';
    }

    render() {
        if (!this.active) {
            return null;
        }

        return html`
            <div class="activity-indicator"
                 role="status"
                 aria-live="polite"
                 aria-label="Claude is processing your message">
                <div class="spinner">
                    <dash-icon name="loader" size="14"></dash-icon>
                </div>
                <span class="thinking-text">${this.message}</span>
            </div>
        `;
    }
}

customElements.define('terminal-input-activity-indicator', TerminalInputActivityIndicator);

export { TerminalInputActivityIndicator };
