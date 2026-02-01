/**
 * TokenMeter Organism - Token usage display and tracking
 * @module components/organisms/token-meter
 */
import { LitElement, html, css } from 'lit';
import { signal, computed } from '@preact/signals-core';
import '../atoms/icon.js';
import '../atoms/progress-bar.js';

/**
 * Cost rates per 1M tokens (Claude 3.5 Sonnet defaults)
 */
const DEFAULT_RATES = {
    input: 3.00,   // $3 per 1M input tokens
    output: 15.00  // $15 per 1M output tokens
};

/**
 * @fires dash-reset - When tokens are reset
 * @fires dash-settings - When settings are requested
 */
class DashTokenMeter extends LitElement {
    static properties = {
        inputTokens: { type: Number, attribute: 'input-tokens' },
        outputTokens: { type: Number, attribute: 'output-tokens' },
        budgetEnabled: { type: Boolean, attribute: 'budget-enabled' },
        budgetLimit: { type: Number, attribute: 'budget-limit' },
        inputRate: { type: Number, attribute: 'input-rate' },
        outputRate: { type: Number, attribute: 'output-rate' },
        expanded: { type: Boolean, reflect: true },
        compact: { type: Boolean, reflect: true }
    };

    static styles = css`
        :host {
            position: relative;
            display: inline-flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            font-size: var(--font-size-xs, 11px);
            color: var(--text-secondary, #6b7280);
            cursor: pointer;
        }

        .meter-icon {
            display: flex;
            color: var(--text-muted, #9ca3af);
        }

        .token-count {
            font-weight: 500;
        }

        .token-count.warning { color: var(--warning-color, #f59e0b); }
        .token-count.critical { color: var(--danger-color, #ef4444); }

        .token-cost {
            color: var(--text-muted, #9ca3af);
        }

        .budget-bar {
            width: 40px;
            height: 4px;
            background: var(--bg-tertiary, #e5e7eb);
            border-radius: 2px;
            overflow: hidden;
        }

        .budget-fill {
            height: 100%;
            background: var(--accent-color, #3b82f6);
            transition: width 0.3s ease;
        }

        .budget-fill.warning { background: var(--warning-color, #f59e0b); }
        .budget-fill.critical { background: var(--danger-color, #ef4444); }

        /* Panel styles */
        .panel {
            position: absolute;
            bottom: 100%;
            right: 0;
            margin-bottom: 8px;
            width: 280px;
            background: var(--bg-primary, #ffffff);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: var(--radius-md, 6px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            display: none;
        }

        :host([expanded]) .panel {
            display: block;
        }

        .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .panel-title {
            font-size: var(--font-size-sm, 12px);
            font-weight: 600;
            color: var(--text-primary, #1f2937);
        }

        .close-btn {
            display: flex;
            padding: 4px;
            border: none;
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            color: var(--text-muted, #9ca3af);
            cursor: pointer;
        }

        .close-btn:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
        }

        .panel-body {
            padding: var(--spacing-md, 12px);
        }

        .row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-xs, 4px) 0;
        }

        .row-label {
            color: var(--text-secondary, #6b7280);
        }

        .row-value {
            font-weight: 500;
            color: var(--text-primary, #1f2937);
        }

        .row-cost {
            font-size: 10px;
            color: var(--text-muted, #9ca3af);
            margin-left: var(--spacing-sm, 8px);
        }

        .row.total {
            margin-top: var(--spacing-sm, 8px);
            padding-top: var(--spacing-sm, 8px);
            border-top: 1px solid var(--border-color, #e5e7eb);
            font-weight: 600;
        }

        .budget-section {
            margin-top: var(--spacing-md, 12px);
            padding-top: var(--spacing-md, 12px);
            border-top: 1px solid var(--border-color, #e5e7eb);
        }

        .budget-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: var(--spacing-sm, 8px);
            font-size: var(--font-size-xs, 11px);
        }

        .budget-track {
            height: 6px;
            background: var(--bg-tertiary, #e5e7eb);
            border-radius: 3px;
            overflow: hidden;
        }

        .budget-progress {
            height: 100%;
            background: var(--accent-color, #3b82f6);
            transition: width 0.3s;
        }

        .budget-remaining {
            margin-top: var(--spacing-xs, 4px);
            font-size: 10px;
            color: var(--text-muted, #9ca3af);
            text-align: right;
        }

        .panel-actions {
            display: flex;
            gap: var(--spacing-sm, 8px);
            margin-top: var(--spacing-md, 12px);
        }

        .action-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-sm, 8px);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            font-size: var(--font-size-xs, 11px);
            color: var(--text-secondary, #6b7280);
            cursor: pointer;
            transition: all 0.15s;
        }

        .action-btn:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
            color: var(--text-primary, #1f2937);
        }

        .panel-footer {
            padding: var(--spacing-xs, 4px) var(--spacing-md, 12px);
            background: var(--bg-secondary, #f9fafb);
            border-top: 1px solid var(--border-color, #e5e7eb);
            font-size: 10px;
            color: var(--text-muted, #9ca3af);
            border-radius: 0 0 var(--radius-md, 6px) var(--radius-md, 6px);
        }
    `;

    constructor() {
        super();
        this.inputTokens = 0;
        this.outputTokens = 0;
        this.budgetEnabled = false;
        this.budgetLimit = 100000;
        this.inputRate = DEFAULT_RATES.input;
        this.outputRate = DEFAULT_RATES.output;
        this.expanded = false;
        this.compact = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this._handleClickOutside = this._handleClickOutside.bind(this);
        document.addEventListener('click', this._handleClickOutside);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this._handleClickOutside);
    }

    get totalTokens() {
        return this.inputTokens + this.outputTokens;
    }

    get inputCost() {
        return (this.inputTokens / 1000000) * this.inputRate;
    }

    get outputCost() {
        return (this.outputTokens / 1000000) * this.outputRate;
    }

    get totalCost() {
        return this.inputCost + this.outputCost;
    }

    get budgetPercentage() {
        if (!this.budgetEnabled || this.budgetLimit <= 0) return 0;
        return (this.totalTokens / this.budgetLimit) * 100;
    }

    get budgetStatus() {
        const pct = this.budgetPercentage;
        if (pct >= 100) return 'critical';
        if (pct >= 80) return 'warning';
        return '';
    }

    render() {
        return html`
            <span class="meter-icon">
                <dash-icon name="clock" size="12"></dash-icon>
            </span>
            <span class="token-count ${this.budgetStatus}">${this._formatNumber(this.totalTokens)}</span>
            <span class="token-cost">${this._formatCost(this.totalCost)}</span>

            ${this.budgetEnabled ? html`
                <span class="budget-bar">
                    <span class="budget-fill ${this.budgetStatus}"
                          style="width: ${Math.min(this.budgetPercentage, 100)}%"></span>
                </span>
            ` : ''}

            <div class="panel">
                <div class="panel-header">
                    <span class="panel-title">Token Usage</span>
                    <button class="close-btn" @click="${this._handleClose}">
                        <dash-icon name="x" size="14"></dash-icon>
                    </button>
                </div>

                <div class="panel-body">
                    <div class="row">
                        <span class="row-label">Input Tokens</span>
                        <span>
                            <span class="row-value">${this._formatNumber(this.inputTokens)}</span>
                            <span class="row-cost">$${this.inputCost.toFixed(4)}</span>
                        </span>
                    </div>
                    <div class="row">
                        <span class="row-label">Output Tokens</span>
                        <span>
                            <span class="row-value">${this._formatNumber(this.outputTokens)}</span>
                            <span class="row-cost">$${this.outputCost.toFixed(4)}</span>
                        </span>
                    </div>
                    <div class="row total">
                        <span class="row-label">Total</span>
                        <span>
                            <span class="row-value">${this._formatNumber(this.totalTokens)}</span>
                            <span class="row-cost">$${this.totalCost.toFixed(2)}</span>
                        </span>
                    </div>

                    ${this.budgetEnabled ? html`
                        <div class="budget-section">
                            <div class="budget-header">
                                <span>Budget: ${this._formatNumber(this.budgetLimit)} tokens</span>
                                <span>${this.budgetPercentage.toFixed(1)}%</span>
                            </div>
                            <div class="budget-track">
                                <div class="budget-progress ${this.budgetStatus}"
                                     style="width: ${Math.min(this.budgetPercentage, 100)}%"></div>
                            </div>
                            <div class="budget-remaining">
                                ${this.budgetLimit - this.totalTokens > 0
                                    ? `${this._formatNumber(this.budgetLimit - this.totalTokens)} remaining`
                                    : `${this._formatNumber(this.totalTokens - this.budgetLimit)} over budget`
                                }
                            </div>
                        </div>
                    ` : ''}

                    <div class="panel-actions">
                        <button class="action-btn" @click="${this._handleReset}">
                            <dash-icon name="refresh-cw" size="12"></dash-icon>
                            Reset
                        </button>
                        <button class="action-btn" @click="${this._handleSettings}">
                            <dash-icon name="settings" size="12"></dash-icon>
                            Settings
                        </button>
                    </div>
                </div>

                <div class="panel-footer">
                    Rates: $${this.inputRate}/M in, $${this.outputRate}/M out
                </div>
            </div>
        `;
    }

    _formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    _formatCost(cost) {
        if (cost < 0.01) return '<$0.01';
        return '$' + cost.toFixed(2);
    }

    _handleClickOutside(e) {
        if (this.expanded && !this.contains(e.target)) {
            this.expanded = false;
        }
    }

    _handleClose(e) {
        e.stopPropagation();
        this.expanded = false;
    }

    _handleReset(e) {
        e.stopPropagation();
        this.inputTokens = 0;
        this.outputTokens = 0;
        this.dispatchEvent(new CustomEvent('dash-reset', { bubbles: true, composed: true }));
    }

    _handleSettings(e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('dash-settings', { bubbles: true, composed: true }));
    }

    /**
     * Add tokens from a message
     * @param {Object} message - Message with usage info
     * @param {'user' | 'assistant'} role
     */
    addTokens(message, role) {
        if (message.usage) {
            if (message.usage.input_tokens) {
                this.inputTokens += message.usage.input_tokens;
            }
            if (message.usage.output_tokens) {
                this.outputTokens += message.usage.output_tokens;
            }
        } else {
            const estimated = this._estimateTokens(message.text || '');
            if (role === 'user') {
                this.inputTokens += estimated;
            } else {
                this.outputTokens += estimated;
            }
        }
    }

    _estimateTokens(text) {
        if (!text) return 0;
        const words = text.split(/\s+/).filter(w => w).length;
        const chars = text.length;
        return Math.round((Math.ceil(words * 1.3) + Math.ceil(chars / 4)) / 2);
    }

    toggle() {
        this.expanded = !this.expanded;
    }

    reset() {
        this.inputTokens = 0;
        this.outputTokens = 0;
    }
}

customElements.define('dash-token-meter', DashTokenMeter);
export { DashTokenMeter };
