/**
 * Status Bar Component - Bottom status display
 * @module components/layout/status-bar
 */

import { LitElement, html, css } from 'lit';

class StatusBar extends LitElement {
    static properties = {
        connected: { type: Boolean, reflect: true },
        pmStatus: { type: String, attribute: 'pm-status' },
        domainCount: { type: Number, attribute: 'domain-count' },
        tokenCount: { type: Number, attribute: 'token-count' },
        tokenCost: { type: Number, attribute: 'token-cost' },
        tasksDone: { type: Number, attribute: 'tasks-done' },
        tasksTotal: { type: Number, attribute: 'tasks-total' },
        theme: { type: String, reflect: true },
        version: { type: String }
    };

    static styles = css`
        :host {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 24px;
            padding: 0 var(--spacing-sm, 8px);
            background: var(--bg-tertiary, #e9ecef);
            border-top: 1px solid var(--border-color, #e0e0e0);
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #999);
        }
        .section { display: flex; align-items: center; gap: var(--spacing-md, 12px); }
        .item {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: 0 var(--spacing-xs, 4px);
        }
        .item.clickable { cursor: pointer; border-radius: var(--radius-sm, 4px); }
        .item.clickable:hover { background: var(--bg-secondary, rgba(0, 0, 0, 0.05)); }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; }
        .status-dot.connected { background: var(--success-color, #28a745); animation: pulse 2s infinite; }
        .status-dot.disconnected { background: var(--error-color, #dc3545); }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .item svg { width: 12px; height: 12px; }
        .token-meter {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: 2px var(--spacing-sm, 8px);
            background: var(--bg-secondary, rgba(0, 0, 0, 0.03));
            border-radius: var(--radius-sm, 4px);
        }
        .token-cost { color: var(--accent-color, #4a90d9); font-weight: 500; }
        .theme-toggle { cursor: pointer; font-size: 12px; }
    `;

    constructor() {
        super();
        this.connected = false;
        this.pmStatus = 'Idle';
        this.domainCount = 0;
        this.tokenCount = 0;
        this.tokenCost = 0;
        this.tasksDone = 0;
        this.tasksTotal = 0;
        this.theme = 'dark';
        this.version = 'v2.3.0';
    }

    _handleConnectionClick() {
        this.dispatchEvent(new CustomEvent('connection-click', { bubbles: true, composed: true }));
    }

    _handleTokenMeterClick() {
        this.dispatchEvent(new CustomEvent('token-meter-click', { bubbles: true, composed: true }));
    }

    _handleTasksClick() {
        this.dispatchEvent(new CustomEvent('tasks-click', { bubbles: true, composed: true }));
    }

    _handleThemeClick() {
        this.dispatchEvent(new CustomEvent('theme-toggle', { bubbles: true, composed: true }));
    }

    _formatCost(cost) {
        return `$${cost.toFixed(2)}`;
    }

    _formatTokens(count) {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    }

    render() {
        return html`
            <div class="section">
                <div class="item clickable" @click=${this._handleConnectionClick}>
                    <span class="status-dot ${this.connected ? 'connected' : 'disconnected'}"></span>
                    <span>${this.connected ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div class="item">
                    <span>PM: ${this.pmStatus}</span>
                </div>
            </div>
            <div class="section">
                <div class="item">
                    <span>Domains: ${this.domainCount}</span>
                </div>
                <div class="item clickable token-meter" @click=${this._handleTokenMeterClick}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v6l4 2"></path>
                    </svg>
                    <span class="token-count">${this._formatTokens(this.tokenCount)}</span>
                    <span class="token-cost">${this._formatCost(this.tokenCost)}</span>
                </div>
            </div>
            <div class="section">
                <div class="item clickable" @click=${this._handleTasksClick}>
                    <span>Tasks: ${this.tasksDone}/${this.tasksTotal}</span>
                </div>
                <div class="item clickable theme-toggle" @click=${this._handleThemeClick}>
                    <span>${this.theme === 'dark' ? '☽' : '☀'}</span>
                </div>
                <div class="item">
                    <span>${this.version}</span>
                </div>
            </div>
        `;
    }
}

customElements.define('status-bar', StatusBar);
export { StatusBar };
