/**
 * Token Meter Module
 * Tracks and displays token usage with cost estimates.
 * Provides real-time visibility into API consumption.
 */

const TokenMeter = {
    // Token counts
    inputTokens: 0,
    outputTokens: 0,

    // Cost rates (per 1M tokens) - Claude 3.5 Sonnet default rates
    rates: {
        input: 3.00,    // $3 per 1M input tokens
        output: 15.00   // $15 per 1M output tokens
    },

    // Budget settings
    budget: {
        enabled: false,
        limit: 100000,  // tokens
        alertThreshold: 0.8  // 80%
    },

    // DOM element references
    statusElement: null,
    panelElement: null,

    // Alert state
    alertShown: false,

    /**
     * Initialize the token meter.
     */
    init() {
        this.statusElement = document.getElementById('tokenMeterStatus');
        this.panelElement = document.getElementById('tokenMeterPanel');
        this.loadSettings();
        this.render();

        // Bind click handler for status bar meter
        if (this.statusElement) {
            this.statusElement.addEventListener('click', () => this.togglePanel());
        }

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.panelElement &&
                this.panelElement.classList.contains('open') &&
                !this.panelElement.contains(e.target) &&
                !this.statusElement.contains(e.target)) {
                this.panelElement.classList.remove('open');
            }
        });
    },

    /**
     * Load settings from localStorage.
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('tokenMeterSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                if (settings.rates) this.rates = settings.rates;
                if (settings.budget) this.budget = settings.budget;
            }
        } catch (e) {
            console.warn('Failed to load token meter settings:', e);
        }
    },

    /**
     * Save settings to localStorage.
     */
    saveSettings() {
        try {
            localStorage.setItem('tokenMeterSettings', JSON.stringify({
                rates: this.rates,
                budget: this.budget
            }));
        } catch (e) {
            console.warn('Failed to save token meter settings:', e);
        }
    },

    /**
     * Add tokens from a message.
     * @param {Object} message - Message object with potential token info
     * @param {string} role - 'user' or 'assistant'
     */
    addTokens(message, role) {
        // Try to extract token counts from message metadata
        if (message.usage) {
            // Direct usage info (ideal case)
            if (message.usage.input_tokens) {
                this.inputTokens += message.usage.input_tokens;
            }
            if (message.usage.output_tokens) {
                this.outputTokens += message.usage.output_tokens;
            }
        } else {
            // Estimate tokens from content
            const text = message.text || '';
            const estimatedTokens = this.estimateTokens(text);

            if (role === 'user') {
                this.inputTokens += estimatedTokens;
            } else if (role === 'assistant') {
                this.outputTokens += estimatedTokens;

                // Also count tool calls as output
                if (message.tool_calls) {
                    message.tool_calls.forEach(tool => {
                        const toolText = JSON.stringify(tool.input || {});
                        this.outputTokens += this.estimateTokens(toolText);
                    });
                }
            }
        }

        this.render();
        this.checkBudget();
    },

    /**
     * Estimate token count from text.
     * Rough approximation: ~1.3 tokens per word, ~4 chars per token.
     * @param {string} text - Text to estimate
     * @returns {number} Estimated token count
     */
    estimateTokens(text) {
        if (!text) return 0;
        // Average of word-based and char-based estimates
        const words = text.split(/\s+/).filter(w => w).length;
        const chars = text.length;
        const wordEstimate = Math.ceil(words * 1.3);
        const charEstimate = Math.ceil(chars / 4);
        return Math.round((wordEstimate + charEstimate) / 2);
    },

    /**
     * Get total tokens.
     * @returns {number} Total tokens
     */
    getTotalTokens() {
        return this.inputTokens + this.outputTokens;
    },

    /**
     * Calculate estimated cost.
     * @returns {number} Cost in dollars
     */
    getEstimatedCost() {
        const inputCost = (this.inputTokens / 1000000) * this.rates.input;
        const outputCost = (this.outputTokens / 1000000) * this.rates.output;
        return inputCost + outputCost;
    },

    /**
     * Get budget percentage used.
     * @returns {number} Percentage (0-100+)
     */
    getBudgetPercentage() {
        if (!this.budget.enabled || this.budget.limit <= 0) return 0;
        return (this.getTotalTokens() / this.budget.limit) * 100;
    },

    /**
     * Check budget and show alert if threshold exceeded.
     */
    checkBudget() {
        if (!this.budget.enabled) return;

        const percentage = this.getBudgetPercentage();

        if (percentage >= this.budget.alertThreshold * 100 && !this.alertShown) {
            this.alertShown = true;
            this.showBudgetAlert(percentage);
        }
    },

    /**
     * Show budget alert notification.
     * @param {number} percentage - Current usage percentage
     */
    showBudgetAlert(percentage) {
        // Desktop notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Token Budget Alert', {
                body: `You've used ${percentage.toFixed(0)}% of your token budget`,
                icon: '/favicon.ico'
            });
        }

        // Visual indicator
        if (this.statusElement) {
            this.statusElement.classList.add('budget-warning');
        }
    },

    /**
     * Reset token counts.
     */
    reset() {
        this.inputTokens = 0;
        this.outputTokens = 0;
        this.alertShown = false;
        if (this.statusElement) {
            this.statusElement.classList.remove('budget-warning');
        }
        this.render();
    },

    /**
     * Toggle the expanded panel.
     */
    togglePanel() {
        if (this.panelElement) {
            this.panelElement.classList.toggle('open');
            if (this.panelElement.classList.contains('open')) {
                this.renderPanel();
            }
        }
    },

    /**
     * Render the status bar meter.
     */
    render() {
        if (!this.statusElement) return;

        const total = this.getTotalTokens();
        const cost = this.getEstimatedCost();
        const percentage = this.getBudgetPercentage();

        // Format numbers
        const totalFormatted = this.formatNumber(total);
        const costFormatted = cost < 0.01 ? '<$0.01' : `$${cost.toFixed(2)}`;

        // Determine color based on budget
        let colorClass = '';
        if (this.budget.enabled) {
            if (percentage >= 100) colorClass = 'critical';
            else if (percentage >= 80) colorClass = 'warning';
            else if (percentage >= 50) colorClass = 'moderate';
        }

        this.statusElement.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
            </svg>
            <span class="token-count ${colorClass}">${totalFormatted}</span>
            <span class="token-cost">${costFormatted}</span>
            ${this.budget.enabled ? `
                <span class="token-budget-bar ${colorClass}">
                    <span class="token-budget-fill" style="width: ${Math.min(percentage, 100)}%"></span>
                </span>
            ` : ''}
        `;

        // Update panel if open
        if (this.panelElement && this.panelElement.classList.contains('open')) {
            this.renderPanel();
        }
    },

    /**
     * Render the expanded panel.
     */
    renderPanel() {
        if (!this.panelElement) return;

        const inputCost = (this.inputTokens / 1000000) * this.rates.input;
        const outputCost = (this.outputTokens / 1000000) * this.rates.output;
        const totalCost = inputCost + outputCost;
        const percentage = this.getBudgetPercentage();

        this.panelElement.innerHTML = `
            <div class="token-panel-header">
                <span class="token-panel-title">Token Usage</span>
                <button class="token-panel-close" onclick="TokenMeter.togglePanel()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="token-panel-body">
                <div class="token-row">
                    <span class="token-label">Input Tokens</span>
                    <span class="token-value">${this.formatNumber(this.inputTokens)}</span>
                    <span class="token-cost-small">$${inputCost.toFixed(4)}</span>
                </div>
                <div class="token-row">
                    <span class="token-label">Output Tokens</span>
                    <span class="token-value">${this.formatNumber(this.outputTokens)}</span>
                    <span class="token-cost-small">$${outputCost.toFixed(4)}</span>
                </div>
                <div class="token-row token-total">
                    <span class="token-label">Total</span>
                    <span class="token-value">${this.formatNumber(this.getTotalTokens())}</span>
                    <span class="token-cost-small">$${totalCost.toFixed(2)}</span>
                </div>
                ${this.budget.enabled ? `
                    <div class="token-budget-section">
                        <div class="token-budget-header">
                            <span>Budget: ${this.formatNumber(this.budget.limit)} tokens</span>
                            <span class="token-budget-percent">${percentage.toFixed(1)}%</span>
                        </div>
                        <div class="token-budget-track">
                            <div class="token-budget-progress ${percentage >= 100 ? 'critical' : percentage >= 80 ? 'warning' : ''}"
                                 style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                        <div class="token-budget-remaining">
                            ${this.budget.limit - this.getTotalTokens() > 0
                                ? `${this.formatNumber(this.budget.limit - this.getTotalTokens())} remaining`
                                : `${this.formatNumber(this.getTotalTokens() - this.budget.limit)} over budget`
                            }
                        </div>
                    </div>
                ` : ''}
                <div class="token-panel-actions">
                    <button class="token-action-btn" onclick="TokenMeter.reset()">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 4v6h-6"></path>
                            <path d="M1 20v-6h6"></path>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                        Reset
                    </button>
                    <button class="token-action-btn" onclick="TokenMeter.showSettings()">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        Settings
                    </button>
                </div>
            </div>
            <div class="token-panel-rates">
                <span>Rates: $${this.rates.input}/M in, $${this.rates.output}/M out</span>
            </div>
        `;
    },

    /**
     * Show settings dialog.
     */
    showSettings() {
        // Create a simple settings form
        const currentBudget = this.budget.limit;
        const budgetEnabled = this.budget.enabled;

        const newBudget = prompt(
            `Token Budget Settings\n\nCurrent budget: ${budgetEnabled ? this.formatNumber(currentBudget) : 'Disabled'}\n\nEnter new budget (0 to disable):`,
            budgetEnabled ? currentBudget : '50000'
        );

        if (newBudget !== null) {
            const budget = parseInt(newBudget, 10);
            if (!isNaN(budget)) {
                this.budget.enabled = budget > 0;
                this.budget.limit = budget > 0 ? budget : 100000;
                this.alertShown = false;
                this.saveSettings();
                this.render();
            }
        }
    },

    /**
     * Format large numbers with K/M suffixes.
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
};
