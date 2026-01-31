/**
 * Connection Status Component
 *
 * Displays the current connection state with visual feedback.
 * Shows connection status, error messages, and reconnection attempts.
 *
 * @module components/indicators/connection-status
 *
 * @example
 * <connection-status
 *   state="connected"
 *   text="Connected"
 * ></connection-status>
 */

import { LitElement, html, css } from 'lit';

/**
 * Connection states
 */
export const ConnectionState = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error'
};

/**
 * Connection Status Web Component
 */
class ConnectionStatus extends LitElement {
    static properties = {
        /** Current connection state */
        state: { type: String, reflect: true },

        /** Status text to display */
        text: { type: String },

        /** Number of reconnection attempts */
        attempts: { type: Number },

        /** Whether to show as compact (dot only) */
        compact: { type: Boolean },

        /** Whether to pulse when connecting */
        animate: { type: Boolean }
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            font-size: var(--font-size-xs, 11px);
            color: var(--text-secondary, #666);
        }

        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--dot-color, #999);
            transition: background 0.2s ease;
        }

        /* State colors */
        :host([state="connected"]) .dot {
            background: var(--success-color, #28a745);
        }

        :host([state="connecting"]) .dot {
            background: var(--warning-color, #ffc107);
        }

        :host([state="disconnected"]) .dot {
            background: var(--text-muted, #999);
        }

        :host([state="error"]) .dot {
            background: var(--error-color, #dc3545);
        }

        /* Pulse animation for connecting state */
        :host([state="connecting"][animate]) .dot {
            animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(0.8);
                opacity: 0.6;
            }
            50% {
                transform: scale(1.2);
                opacity: 1;
            }
        }

        .text {
            transition: color 0.2s ease;
        }

        :host([state="connected"]) .text {
            color: var(--success-color, #28a745);
        }

        :host([state="error"]) .text {
            color: var(--error-color, #dc3545);
        }

        /* Attempts badge */
        .attempts {
            padding: 1px 6px;
            background: var(--bg-tertiary, #e9ecef);
            border-radius: 10px;
            font-size: 10px;
            color: var(--text-muted, #999);
        }

        /* Compact mode hides text */
        :host([compact]) .text,
        :host([compact]) .attempts {
            display: none;
        }

        /* Clickable for retry */
        :host([state="disconnected"]),
        :host([state="error"]) {
            cursor: pointer;
        }

        :host([state="disconnected"]:hover) .text,
        :host([state="error"]:hover) .text {
            text-decoration: underline;
        }

        /* Tooltip wrapper */
        .wrapper {
            position: relative;
            display: inline-flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
        }

        .tooltip {
            position: absolute;
            bottom: calc(100% + 8px);
            left: 50%;
            transform: translateX(-50%);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            background: var(--tooltip-bg, #333);
            color: var(--tooltip-color, white);
            font-size: 11px;
            white-space: nowrap;
            border-radius: var(--radius-sm, 4px);
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

        :host([compact]:hover) .tooltip {
            opacity: 1;
            visibility: visible;
        }
    `;

    constructor() {
        super();
        this.state = ConnectionState.DISCONNECTED;
        this.text = '';
        this.attempts = 0;
        this.compact = false;
        this.animate = true;
    }

    /**
     * Get default text for state
     */
    _getDefaultText() {
        switch (this.state) {
            case ConnectionState.CONNECTED:
                return 'Connected';
            case ConnectionState.CONNECTING:
                return 'Connecting...';
            case ConnectionState.DISCONNECTED:
                return 'Disconnected';
            case ConnectionState.ERROR:
                return 'Connection Error';
            default:
                return 'Unknown';
        }
    }

    /**
     * Handle click for retry
     */
    _handleClick() {
        if (this.state === ConnectionState.DISCONNECTED || this.state === ConnectionState.ERROR) {
            this.dispatchEvent(new CustomEvent('retry', {
                bubbles: true,
                composed: true
            }));
        }
    }

    render() {
        const displayText = this.text || this._getDefaultText();
        const showAttempts = this.attempts > 0 && this.state === ConnectionState.CONNECTING;

        return html`
            <div class="wrapper" @click=${this._handleClick}>
                <span class="dot"></span>
                <span class="text">${displayText}</span>
                ${showAttempts ? html`<span class="attempts">#${this.attempts}</span>` : ''}

                ${this.compact ? html`
                    <span class="tooltip">
                        ${displayText}
                        ${showAttempts ? ` (attempt ${this.attempts})` : ''}
                    </span>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('connection-status', ConnectionStatus);
export { ConnectionStatus };
