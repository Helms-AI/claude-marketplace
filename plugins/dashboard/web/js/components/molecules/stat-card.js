/**
 * StatCard Molecule - Icon + value + label
 * @module components/molecules/stat-card
 */
import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';

class DashStatCard extends LitElement {
    static properties = {
        value: { type: String },
        label: { type: String },
        icon: { type: String },
        trend: { type: String },      // 'up' | 'down' | 'neutral'
        trendValue: { type: String, attribute: 'trend-value' },
        size: { type: String },       // 'sm' | 'md' | 'lg'
        variant: { type: String }     // 'default' | 'filled'
    };

    static styles = css`
        :host {
            display: block;
        }

        .card {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-md, 12px);
            border-radius: var(--radius-md, 6px);
            background: var(--bg-primary, #ffffff);
            border: 1px solid var(--border-color, #e5e7eb);
        }

        .card.filled {
            background: var(--bg-secondary, #f3f4f6);
            border-color: transparent;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: var(--radius-sm, 4px);
            background: var(--accent-bg, rgba(59, 130, 246, 0.1));
            color: var(--accent-color, #3b82f6);
        }

        .trend {
            display: flex;
            align-items: center;
            gap: 2px;
            font-size: var(--font-size-xs, 11px);
            font-weight: 500;
        }

        .trend.up {
            color: var(--success-color, #22c55e);
        }

        .trend.down {
            color: var(--danger-color, #ef4444);
        }

        .trend.neutral {
            color: var(--text-muted, #9ca3af);
        }

        .value {
            font-size: var(--font-size-2xl, 24px);
            font-weight: 700;
            color: var(--text-primary, #1f2937);
            line-height: 1;
        }

        .sm .value {
            font-size: var(--font-size-lg, 16px);
        }

        .lg .value {
            font-size: var(--font-size-3xl, 30px);
        }

        .label {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-secondary, #6b7280);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
    `;

    constructor() {
        super();
        this.value = '0';
        this.label = '';
        this.icon = '';
        this.trend = '';
        this.trendValue = '';
        this.size = 'md';
        this.variant = 'default';
    }

    render() {
        const classes = [this.size, this.variant];

        return html`
            <div class="card ${classes.join(' ')}">
                <div class="header">
                    ${this.icon ? html`
                        <div class="icon">
                            <dash-icon name="${this.icon}" size="18"></dash-icon>
                        </div>
                    ` : ''}

                    ${this.trend ? html`
                        <div class="trend ${this.trend}">
                            ${this.trend === 'up' ? html`
                                <dash-icon name="chevron-up" size="12"></dash-icon>
                            ` : this.trend === 'down' ? html`
                                <dash-icon name="chevron-down" size="12"></dash-icon>
                            ` : ''}
                            ${this.trendValue}
                        </div>
                    ` : ''}
                </div>

                <div class="value">${this.value}</div>
                <div class="label">${this.label}</div>
            </div>
        `;
    }
}

customElements.define('dash-stat-card', DashStatCard);
export { DashStatCard };
