/**
 * ProcessManager Organism - Dashboard process management modal
 * @module components/organisms/process-manager
 */
import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import '../atoms/icon.js';
import '../atoms/spinner.js';

/**
 * @fires dash-close - When the modal is closed
 * @fires dash-process-kill - When a process is killed
 */
class DashProcessManager extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        processes: { type: Array },
        currentPid: { type: Number, attribute: 'current-pid' },
        loading: { type: Boolean },
        error: { type: String }
    };

    static styles = css`
        :host {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        :host([open]) {
            display: flex;
        }

        .modal {
            width: 480px;
            max-width: 90vw;
            max-height: 80vh;
            background: var(--bg-primary, #ffffff);
            border-radius: var(--radius-lg, 8px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);
            border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .title {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            font-size: var(--font-size-md, 14px);
            font-weight: 600;
            color: var(--text-primary, #1f2937);
        }

        .close-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border: none;
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            color: var(--text-muted, #9ca3af);
            cursor: pointer;
        }

        .close-btn:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
            color: var(--text-primary, #1f2937);
        }

        .body {
            flex: 1;
            overflow-y: auto;
            padding: var(--spacing-md, 12px);
        }

        .process-list {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm, 8px);
        }

        .process-item {
            display: flex;
            align-items: center;
            gap: var(--spacing-md, 12px);
            padding: var(--spacing-md, 12px);
            background: var(--bg-secondary, #f9fafb);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: var(--radius-md, 6px);
            transition: all 0.15s;
        }

        .process-item.current {
            border-color: var(--accent-color, #3b82f6);
            background: var(--accent-bg, #eff6ff);
        }

        .process-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            color: var(--text-muted, #9ca3af);
        }

        .process-item.current .process-icon {
            color: var(--accent-color, #3b82f6);
        }

        .process-info {
            flex: 1;
            min-width: 0;
        }

        .process-pid {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            font-size: var(--font-size-sm, 12px);
            font-weight: 600;
            color: var(--text-primary, #1f2937);
        }

        .current-badge {
            padding: 1px 6px;
            font-size: 10px;
            font-weight: 500;
            color: var(--accent-color, #3b82f6);
            background: white;
            border: 1px solid var(--accent-color, #3b82f6);
            border-radius: 10px;
        }

        .process-started {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #9ca3af);
            margin-top: 2px;
        }

        .process-command {
            font-size: 10px;
            color: var(--text-muted, #9ca3af);
            font-family: var(--font-mono, monospace);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-top: 4px;
        }

        .kill-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border: none;
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            color: var(--text-muted, #9ca3af);
            cursor: pointer;
            transition: all 0.15s;
        }

        .kill-btn:hover:not(:disabled) {
            background: var(--danger-bg, #fef2f2);
            color: var(--danger-color, #ef4444);
        }

        .kill-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        .empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xl, 24px);
            color: var(--text-muted, #9ca3af);
            text-align: center;
        }

        .empty-icon {
            font-size: 32px;
            margin-bottom: var(--spacing-sm, 8px);
            opacity: 0.5;
        }

        .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xl, 24px);
            color: var(--text-muted, #9ca3af);
            gap: var(--spacing-sm, 8px);
        }

        .error {
            padding: var(--spacing-md, 12px);
            background: var(--danger-bg, #fef2f2);
            border: 1px solid var(--danger-color, #ef4444);
            border-radius: var(--radius-md, 6px);
            color: var(--danger-color, #ef4444);
            font-size: var(--font-size-sm, 12px);
        }

        .footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-sm, 8px) var(--spacing-lg, 16px);
            background: var(--bg-secondary, #f9fafb);
            border-top: 1px solid var(--border-color, #e5e7eb);
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #9ca3af);
        }

        .refresh-btn {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: 4px 8px;
            border: none;
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            font-size: var(--font-size-xs, 11px);
            color: var(--text-secondary, #6b7280);
            cursor: pointer;
            transition: all 0.15s;
        }

        .refresh-btn:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
            color: var(--text-primary, #1f2937);
        }
    `;

    constructor() {
        super();
        this.open = false;
        this.processes = [];
        this.currentPid = null;
        this.loading = false;
        this.error = null;
    }

    render() {
        return html`
            <div class="modal" @click="${e => e.stopPropagation()}">
                <div class="header">
                    <div class="title">
                        <dash-icon name="cpu" size="18"></dash-icon>
                        Process Manager
                    </div>
                    <button class="close-btn" @click="${this._handleClose}">
                        <dash-icon name="x" size="16"></dash-icon>
                    </button>
                </div>

                <div class="body">
                    ${this._renderContent()}
                </div>

                <div class="footer">
                    <span>${this.processes.length} process${this.processes.length !== 1 ? 'es' : ''}</span>
                    <button class="refresh-btn" @click="${this._handleRefresh}">
                        <dash-icon name="refresh-cw" size="12"></dash-icon>
                        Refresh
                    </button>
                </div>
            </div>
        `;
    }

    _renderContent() {
        if (this.loading) {
            return html`
                <div class="loading">
                    <dash-spinner size="md"></dash-spinner>
                    <span>Loading processes...</span>
                </div>
            `;
        }

        if (this.error) {
            return html`<div class="error">${this.error}</div>`;
        }

        if (this.processes.length === 0) {
            return html`
                <div class="empty">
                    <span class="empty-icon">⚙️</span>
                    <span>No dashboard processes found</span>
                </div>
            `;
        }

        return html`
            <div class="process-list">
                ${repeat(
                    this.processes,
                    proc => proc.pid,
                    proc => this._renderProcess(proc)
                )}
            </div>
        `;
    }

    _renderProcess(proc) {
        const isCurrent = proc.pid === this.currentPid || proc.current;
        const canKill = !isCurrent || this.processes.length > 1;

        return html`
            <div class="process-item ${isCurrent ? 'current' : ''}">
                <div class="process-icon">
                    <dash-icon name="cpu" size="24"></dash-icon>
                </div>
                <div class="process-info">
                    <div class="process-pid">
                        PID ${proc.pid}
                        ${isCurrent ? html`<span class="current-badge">Current</span>` : ''}
                    </div>
                    <div class="process-started">${proc.started}</div>
                    <div class="process-command" title="${proc.command}">${proc.command}</div>
                </div>
                <button
                    class="kill-btn"
                    ?disabled="${!canKill}"
                    @click="${() => this._handleKill(proc.pid, isCurrent)}"
                    title="${canKill ? 'Kill process' : 'Cannot kill the only running process'}"
                >
                    <dash-icon name="x" size="14"></dash-icon>
                </button>
            </div>
        `;
    }

    _handleClose() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('dash-close', {
            bubbles: true,
            composed: true
        }));
    }

    _handleRefresh() {
        this.dispatchEvent(new CustomEvent('dash-refresh', {
            bubbles: true,
            composed: true
        }));
    }

    async _handleKill(pid, isCurrent) {
        const confirmed = isCurrent
            ? confirm(`Kill the current process (PID ${pid})? The dashboard may become unresponsive.`)
            : confirm(`Kill process ${pid}?`);

        if (!confirmed) return;

        this.dispatchEvent(new CustomEvent('dash-process-kill', {
            bubbles: true,
            composed: true,
            detail: { pid, isCurrent }
        }));
    }

    /**
     * Load processes from API
     * @param {string} apiEndpoint
     */
    async loadProcesses(apiEndpoint = '/api/processes') {
        this.loading = true;
        this.error = null;

        try {
            const response = await fetch(apiEndpoint);
            if (!response.ok) throw new Error('Failed to load processes');

            const data = await response.json();
            this.processes = data.processes || [];
            this.currentPid = data.current_pid;
        } catch (e) {
            this.error = e.message;
        } finally {
            this.loading = false;
        }
    }

    /**
     * Show the modal and load processes
     */
    show() {
        this.open = true;
        this.loadProcesses();
    }

    /**
     * Hide the modal
     */
    hide() {
        this.open = false;
    }
}

customElements.define('dash-process-manager', DashProcessManager);
export { DashProcessManager };
