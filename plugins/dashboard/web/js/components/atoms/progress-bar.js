/**
 * ProgressBar Atom - Progress indicator component
 * @module components/atoms/progress-bar
 */
import { LitElement, html, css } from 'lit';

class DashProgressBar extends LitElement {
    static properties = {
        value: { type: Number },      // 0-100
        max: { type: Number },
        size: { type: String },       // 'xs' | 'sm' | 'md'
        variant: { type: String },    // 'default' | 'success' | 'warning' | 'error'
        indeterminate: { type: Boolean },
        showLabel: { type: Boolean, attribute: 'show-label' },
        label: { type: String }
    };

    static styles = css`
        :host {
            display: block;
            width: 100%;
        }

        .container {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs, 4px);
        }

        .label-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .label {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-secondary, #6b7280);
        }

        .percentage {
            font-size: var(--font-size-xs, 11px);
            font-weight: 500;
            color: var(--text-primary, #1f2937);
            font-variant-numeric: tabular-nums;
        }

        .track {
            width: 100%;
            background: var(--bg-tertiary, #e5e7eb);
            border-radius: 999px;
            overflow: hidden;
        }

        /* Sizes */
        .xs .track { height: 4px; }
        .sm .track { height: 6px; }
        .md .track { height: 8px; }

        .fill {
            height: 100%;
            border-radius: 999px;
            transition: width 0.3s ease;
        }

        /* Variants */
        .default .fill { background: var(--accent-color, #3b82f6); }
        .success .fill { background: var(--success-color, #22c55e); }
        .warning .fill { background: var(--warning-color, #f59e0b); }
        .error .fill { background: var(--danger-color, #ef4444); }

        /* Indeterminate */
        .indeterminate .fill {
            width: 30% !important;
            animation: indeterminate 1.5s ease-in-out infinite;
        }

        @keyframes indeterminate {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
        }
    `;

    constructor() {
        super();
        this.value = 0;
        this.max = 100;
        this.size = 'sm';
        this.variant = 'default';
        this.indeterminate = false;
        this.showLabel = false;
        this.label = '';
    }

    get percentage() {
        if (this.indeterminate) return null;
        return Math.min(100, Math.max(0, (this.value / this.max) * 100));
    }

    render() {
        const classes = [this.size, this.variant];
        if (this.indeterminate) classes.push('indeterminate');

        return html`
            <div class="container ${classes.join(' ')}">
                ${this.showLabel || this.label ? html`
                    <div class="label-row">
                        <span class="label">${this.label}</span>
                        ${!this.indeterminate ? html`
                            <span class="percentage">${Math.round(this.percentage)}%</span>
                        ` : ''}
                    </div>
                ` : ''}
                <div class="track">
                    <div
                        class="fill"
                        style="width: ${this.indeterminate ? '30%' : `${this.percentage}%`}"
                    ></div>
                </div>
            </div>
        `;
    }
}

customElements.define('dash-progress-bar', DashProgressBar);
export { DashProgressBar };
