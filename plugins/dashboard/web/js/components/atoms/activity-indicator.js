/**
 * Activity Indicator Atom - Status indicator with semantic activity states
 * @module components/atoms/activity-indicator
 *
 * Enhanced status indicator for tool activities with spinning animation
 * for running state and clear icons for completion states.
 *
 * Icons:
 * - Running: loader (spinning clockwise)
 * - Success: check-circle (green)
 * - Error: x-circle (red)
 * - Pending: clock (orange)
 * - Idle: circle (gray)
 */
import { LitElement, html, css } from 'lit';
import './icon.js';

/**
 * Activity status types
 */
const ActivityIndicatorStatus = {
    PENDING: 'pending',
    RUNNING: 'running',
    SUCCESS: 'success',
    ERROR: 'error',
    IDLE: 'idle'
};

class ActivityIndicator extends LitElement {
    static properties = {
        status: { type: String },     // ActivityIndicatorStatus value
        size: { type: String },       // 'xs' | 'sm' | 'md' | 'lg'
        showLabel: { type: Boolean, attribute: 'show-label' },
        labelPosition: { type: String, attribute: 'label-position' } // 'right' | 'bottom'
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
        }

        :host([label-position="bottom"]) {
            flex-direction: column;
        }

        .indicator-wrapper {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        /* Size variants */
        .indicator-wrapper.xs {
            width: 12px;
            height: 12px;
        }

        .indicator-wrapper.sm {
            width: 16px;
            height: 16px;
        }

        .indicator-wrapper.md {
            width: 20px;
            height: 20px;
        }

        .indicator-wrapper.lg {
            width: 24px;
            height: 24px;
        }

        /* Status colors */
        .indicator-wrapper.running {
            color: var(--accent-color, #3b82f6);
        }

        .indicator-wrapper.success {
            color: var(--success-color, #22c55e);
        }

        .indicator-wrapper.error {
            color: var(--danger-color, #ef4444);
        }

        .indicator-wrapper.pending {
            color: var(--warning-color, #f59e0b);
        }

        .indicator-wrapper.idle {
            color: var(--text-muted, #9ca3af);
        }

        /* Spinning animation for running state - clockwise */
        .indicator-wrapper.running dash-icon {
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }

        .label {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #9ca3af);
            text-transform: capitalize;
        }

        .label.running {
            color: var(--accent-color, #3b82f6);
        }

        .label.success {
            color: var(--success-color, #22c55e);
        }

        .label.error {
            color: var(--danger-color, #ef4444);
        }

        .label.pending {
            color: var(--warning-color, #f59e0b);
        }
    `;

    constructor() {
        super();
        this.status = ActivityIndicatorStatus.IDLE;
        this.size = 'sm';
        this.showLabel = false;
        this.labelPosition = 'right';
    }

    /**
     * Get icon name for status
     * @private
     */
    _getIconName() {
        switch (this.status) {
            case ActivityIndicatorStatus.RUNNING:
                return 'loader';         // Circle with gap - spins clockwise
            case ActivityIndicatorStatus.SUCCESS:
                return 'check-circle';   // Checkmark in circle
            case ActivityIndicatorStatus.ERROR:
                return 'x-circle';       // X in circle
            case ActivityIndicatorStatus.PENDING:
                return 'clock';          // Clock icon
            case ActivityIndicatorStatus.IDLE:
            default:
                return 'circle';         // Empty circle
        }
    }

    /**
     * Get icon size based on indicator size
     * @private
     */
    _getIconSize() {
        switch (this.size) {
            case 'xs': return 12;
            case 'sm': return 16;
            case 'md': return 20;
            case 'lg': return 24;
            default: return 16;
        }
    }

    /**
     * Get label text for status
     * @private
     */
    _getLabelText() {
        switch (this.status) {
            case ActivityIndicatorStatus.RUNNING:
                return 'Running';
            case ActivityIndicatorStatus.SUCCESS:
                return 'Done';
            case ActivityIndicatorStatus.ERROR:
                return 'Error';
            case ActivityIndicatorStatus.PENDING:
                return 'Pending';
            case ActivityIndicatorStatus.IDLE:
            default:
                return 'Idle';
        }
    }

    render() {
        const wrapperClass = `indicator-wrapper ${this.size} ${this.status}`;

        return html`
            <span
                class="${wrapperClass}"
                role="status"
                aria-label="${this._getLabelText()}"
            >
                <dash-icon
                    name="${this._getIconName()}"
                    size="${this._getIconSize()}"
                ></dash-icon>
            </span>
            ${this.showLabel ? html`
                <span class="label ${this.status}">${this._getLabelText()}</span>
            ` : ''}
        `;
    }
}

customElements.define('activity-indicator', ActivityIndicator);
export { ActivityIndicator, ActivityIndicatorStatus };
