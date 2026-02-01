/**
 * Session Controls Component - Controls for terminal session management
 * @module components/terminal/session-controls
 */

import { LitElement, html, css } from 'lit';
import { ConversationStorage } from '../../conversation-storage.js';
import '../atoms/icon.js';

class SessionControls extends LitElement {
    static properties = {
        sessionId: { type: String, attribute: 'session-id' },
        connected: { type: Boolean, reflect: true },
        streaming: { type: Boolean, reflect: true },
        sessions: { type: Array },
        _loading: { type: Boolean, state: true }
    };

    static styles = css`
        :host { display: flex; align-items: center; justify-content: center; gap: var(--spacing-md, 12px); }

        .session-selector {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .session-select {
            appearance: none;
            padding: var(--spacing-xs, 4px) var(--spacing-lg, 24px) var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            font-size: var(--font-size-xs, 11px);
            font-family: var(--font-mono, 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace);
            font-weight: 500;
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: var(--radius-sm, 4px);
            background: var(--bg-primary, white);
            color: var(--text-secondary, #666);
            cursor: pointer;
            transition: all 0.15s ease;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 6px center;
            width: auto;
        }

        .session-select:hover:not(:disabled) {
            background-color: var(--bg-secondary, #f8f9fa);
            border-color: var(--text-muted, #999);
        }

        .session-select:focus {
            outline: none;
            border-color: var(--accent-color, #0066cc);
            box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
        }

        .session-select:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .session-select option {
            padding: var(--spacing-xs, 4px);
            font-family: var(--font-mono, 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace);
        }

        .control-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            font-size: var(--font-size-xs, 11px);
            font-weight: 500;
            font-family: inherit;
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: var(--radius-sm, 4px);
            background: var(--bg-primary, white);
            color: var(--text-secondary, #666);
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .control-btn:hover:not(:disabled) { background: var(--bg-secondary, #f8f9fa); border-color: var(--text-muted, #999); }
        .control-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .control-btn dash-icon { flex-shrink: 0; }
        .status {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            font-size: var(--font-size-xs, 11px);
            border-radius: var(--radius-sm, 4px);
        }
        .status.connected { background: var(--success-bg, #e6f7e6); color: var(--success-color, #28a745); }
        .status.disconnected { background: var(--error-bg, #ffe6e6); color: var(--error-color, #dc3545); }
        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
        }
        .status.connected .status-dot { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    `;

    constructor() {
        super();
        this.sessionId = null;
        this.connected = false;
        this.streaming = false;
        this.sessions = [];
        this._loading = false;
    }

    connectedCallback() {
        super.connectedCallback();
        // Fetch sessions when component is first connected
        if (this.connected) {
            this._fetchSessions();
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        // Fetch sessions when connection status changes to connected
        if (changedProperties.has('connected') && this.connected && !changedProperties.get('connected')) {
            this._fetchSessions();
        }
    }

    async _fetchSessions() {
        if (this._loading) return;

        this._loading = true;
        try {
            // Initialize storage if needed and fetch sessions from IndexedDB
            await ConversationStorage.init();
            this.sessions = await ConversationStorage.getSessionIds();
            console.log('[SessionControls] Fetched sessions from IndexedDB:', this.sessions.length);
        } catch (error) {
            console.error('[SessionControls] Failed to fetch sessions:', error);
            this.sessions = [];
        } finally {
            this._loading = false;
        }
    }

    _handleSessionChange(e) {
        const newSessionId = e.target.value;
        if (newSessionId && newSessionId !== this.sessionId) {
            this.dispatchEvent(new CustomEvent('session-select', {
                detail: { sessionId: newSessionId },
                bubbles: true,
                composed: true
            }));
        }
    }

    _handleNewSession() {
        this.dispatchEvent(new CustomEvent('new-session', { bubbles: true, composed: true }));
    }

    _handleReconnect() {
        this.dispatchEvent(new CustomEvent('reconnect', { bubbles: true, composed: true }));
    }

    _formatSessionId(sessionId, isCurrent = false) {
        if (!sessionId) return 'Unknown';
        return isCurrent ? `${sessionId} (current)` : sessionId;
    }

    _renderSessionSelector() {
        if (!this.connected) return null;

        return html`
            <div class="session-selector">
                <select
                    class="session-select"
                    .value=${this.sessionId || ''}
                    @change=${this._handleSessionChange}
                    ?disabled=${this.streaming || this._loading}
                    title="Select session"
                >
                    ${this.sessions.length === 0 && !this.sessionId ? html`
                        <option value="" disabled selected>No sessions</option>
                    ` : ''}
                    ${this.sessionId && !this.sessions.includes(this.sessionId) ? html`
                        <option value=${this.sessionId} selected>
                            ${this._formatSessionId(this.sessionId, true)}
                        </option>
                    ` : ''}
                    ${this.sessions.map(session => html`
                        <option
                            value=${session}
                            ?selected=${session === this.sessionId}
                        >
                            ${this._formatSessionId(session, session === this.sessionId)}
                        </option>
                    `)}
                </select>
            </div>
        `;
    }

    render() {
        return html`
            ${this._renderSessionSelector()}
            ${this.connected ? html`
                <button class="control-btn" @click=${this._handleNewSession} ?disabled=${this.streaming} title="New Session">
                    <dash-icon name="plus" size="12"></dash-icon>
                    New
                </button>
            ` : html`
                <button class="control-btn" @click=${this._handleReconnect} title="Reconnect">
                    <dash-icon name="refresh-cw" size="12"></dash-icon>
                    Reconnect
                </button>
            `}
        `;
    }
}

customElements.define('session-controls', SessionControls);
export { SessionControls };
