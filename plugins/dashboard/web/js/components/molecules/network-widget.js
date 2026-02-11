/**
 * Network Widget Component - Statusbar connectivity indicator
 * @module components/molecules/network-widget
 *
 * Displays:
 * - Connection status dot (green/yellow/red/gray)
 * - Pulse animation when events arrive
 * - Events/second rate display
 * - Hover tooltip with detailed metrics
 * - Click emits network-click event
 */

import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, ConnectionState } from '../../store/app-state.js';
import '../atoms/icon.js';

class NetworkWidget extends SignalWatcher(LitElement) {
    static properties = {
        _showTooltip: { type: Boolean, state: true },
        _pulseActive: { type: Boolean, state: true }
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            position: relative;
        }

        .widget {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: 2px var(--spacing-sm, 8px);
            border-radius: var(--radius-sm, 4px);
            cursor: pointer;
            transition: background-color var(--transition-fast, 150ms ease);
        }

        .widget:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
        }

        /* Status dot */
        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            transition: background-color var(--transition-fast, 150ms ease);
        }

        .status-dot.connected {
            background: var(--success-color, #22c55e);
        }

        .status-dot.connecting {
            background: var(--warning-color, #f59e0b);
            animation: statusPulse 1s infinite;
        }

        .status-dot.disconnected {
            background: var(--text-muted, #6b7280);
        }

        .status-dot.error {
            background: var(--error-color, #ef4444);
        }

        /* Pulse animation for activity */
        .status-dot.pulse {
            animation: activityPulse 0.3s ease-out;
        }

        @keyframes statusPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        @keyframes activityPulse {
            0% {
                box-shadow: 0 0 0 0 var(--success-color, rgba(34, 197, 94, 0.7));
            }
            100% {
                box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
            }
        }

        /* Rate display */
        .rate {
            font-size: var(--font-size-xs, 10px);
            color: var(--text-muted, #9ca3af);
            font-variant-numeric: tabular-nums;
            min-width: 32px;
        }

        .rate.active {
            color: var(--success-color, #22c55e);
        }

        /* Icon */
        .icon {
            color: var(--text-muted, #6b7280);
        }

        /* Tooltip */
        .tooltip {
            position: absolute;
            bottom: 100%;
            right: 0;
            margin-bottom: 8px;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            background: var(--bg-primary, #1e1e1e);
            border: 1px solid var(--border-color, #3c3c3c);
            border-radius: var(--radius-md, 8px);
            box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.3));
            min-width: 180px;
            z-index: 1000;
            display: none;
            animation: tooltipFadeIn 0.15s ease-out;
        }

        .tooltip.visible {
            display: block;
        }

        @keyframes tooltipFadeIn {
            from {
                opacity: 0;
                transform: translateY(4px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .tooltip-title {
            font-size: var(--font-size-xs, 11px);
            font-weight: 600;
            color: var(--text-primary, #e0e0e0);
            margin-bottom: var(--spacing-xs, 4px);
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
        }

        .tooltip-row {
            display: flex;
            justify-content: space-between;
            font-size: var(--font-size-xs, 10px);
            color: var(--text-muted, #9ca3af);
            padding: 2px 0;
        }

        .tooltip-row .value {
            color: var(--text-secondary, #b0b0b0);
            font-variant-numeric: tabular-nums;
        }

        .tooltip-divider {
            height: 1px;
            background: var(--border-color, #3c3c3c);
            margin: var(--spacing-xs, 4px) 0;
        }

        /* Arrow */
        .tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            right: 12px;
            border: 6px solid transparent;
            border-top-color: var(--border-color, #3c3c3c);
        }
    `;

    constructor() {
        super();
        this._showTooltip = false;
        this._pulseActive = false;
        this._lastEventTime = null;
        this._pulseTimeout = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.watchSignals([
            AppStore.connectionState,
            AppStore.sseEventsPerSecond,
            AppStore.sseEventCount,
            AppStore.sseLastEventTime,
            AppStore.sseEvents
        ]);

        // Watch for new events to trigger pulse
        this._unsubscribe = this._watchForNewEvents();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._unsubscribe) {
            this._unsubscribe();
        }
        if (this._pulseTimeout) {
            clearTimeout(this._pulseTimeout);
        }
    }

    /**
     * Watch for new events and trigger pulse animation
     * @private
     */
    _watchForNewEvents() {
        // Simple polling to detect new events
        let lastCount = AppStore.sseEventCount.value;

        const checkInterval = setInterval(() => {
            const currentCount = AppStore.sseEventCount.value;
            if (currentCount > lastCount) {
                this._triggerPulse();
                lastCount = currentCount;
            }
        }, 100);

        return () => clearInterval(checkInterval);
    }

    /**
     * Trigger pulse animation
     * @private
     */
    _triggerPulse() {
        this._pulseActive = true;

        if (this._pulseTimeout) {
            clearTimeout(this._pulseTimeout);
        }

        this._pulseTimeout = setTimeout(() => {
            this._pulseActive = false;
        }, 300);
    }

    /**
     * Get connection status class
     * @private
     */
    _getStatusClass() {
        const state = AppStore.connectionState.value;
        switch (state) {
            case ConnectionState.CONNECTED:
                return 'connected';
            case ConnectionState.CONNECTING:
                return 'connecting';
            case ConnectionState.ERROR:
                return 'error';
            default:
                return 'disconnected';
        }
    }

    /**
     * Get connection status text
     * @private
     */
    _getStatusText() {
        const state = AppStore.connectionState.value;
        switch (state) {
            case ConnectionState.CONNECTED:
                return 'Connected';
            case ConnectionState.CONNECTING:
                return 'Connecting...';
            case ConnectionState.ERROR:
                return 'Error';
            default:
                return 'Disconnected';
        }
    }

    /**
     * Handle mouse enter
     * @private
     */
    _handleMouseEnter() {
        this._showTooltip = true;
    }

    /**
     * Handle mouse leave
     * @private
     */
    _handleMouseLeave() {
        this._showTooltip = false;
    }

    /**
     * Handle click
     * @private
     */
    _handleClick() {
        this.dispatchEvent(new CustomEvent('network-click', {
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Format rate display
     * @private
     */
    _formatRate(rate) {
        if (rate === 0) return '0/s';
        if (rate < 1) return '<1/s';
        return `${Math.round(rate)}/s`;
    }

    /**
     * Format time since last event
     * @private
     */
    _formatTimeSince(timestamp) {
        if (!timestamp) return 'Never';

        const diff = Date.now() - timestamp;
        if (diff < 1000) return 'Just now';
        if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        return `${Math.floor(diff / 3600000)}h ago`;
    }

    render() {
        const rate = AppStore.sseEventsPerSecond.value;
        const totalEvents = AppStore.sseEventCount.value;
        const bufferedEvents = AppStore.sseEvents.value.length;
        const bufferSize = AppStore.sseEventBufferSize.value;
        const lastEventTime = AppStore.sseLastEventTime.value;
        const statusClass = this._getStatusClass();
        const statusText = this._getStatusText();

        return html`
            <div
                class="widget"
                @mouseenter=${this._handleMouseEnter}
                @mouseleave=${this._handleMouseLeave}
                @click=${this._handleClick}
                role="button"
                aria-label="SSE connection status"
            >
                <div class="status-dot ${statusClass} ${this._pulseActive ? 'pulse' : ''}"></div>
                <span class="rate ${rate > 0 ? 'active' : ''}">${this._formatRate(rate)}</span>
                <dash-icon class="icon" name="radio" size="12"></dash-icon>
            </div>

            <div class="tooltip ${this._showTooltip ? 'visible' : ''}">
                <div class="tooltip-title">
                    <div class="status-dot ${statusClass}"></div>
                    SSE ${statusText}
                </div>
                <div class="tooltip-divider"></div>
                <div class="tooltip-row">
                    <span>Events/sec</span>
                    <span class="value">${rate}</span>
                </div>
                <div class="tooltip-row">
                    <span>Total received</span>
                    <span class="value">${totalEvents.toLocaleString()}</span>
                </div>
                <div class="tooltip-row">
                    <span>Buffer</span>
                    <span class="value">${bufferedEvents} / ${bufferSize}</span>
                </div>
                <div class="tooltip-row">
                    <span>Last event</span>
                    <span class="value">${this._formatTimeSince(lastEventTime)}</span>
                </div>
            </div>
        `;
    }
}

customElements.define('network-widget', NetworkWidget);
export { NetworkWidget };
