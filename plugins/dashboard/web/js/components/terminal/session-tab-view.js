/**
 * Session Tab View - Interactive transcript viewer for active Claude Code CLI sessions
 * @module components/terminal/session-tab-view
 */
import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions } from '../../store/app-state.js';
import '../conversation/conversation-stream.js';
import '../atoms/icon.js';
import './terminal-input.js';

class SessionTabView extends SignalWatcher(LitElement) {
    static properties = {
        sessionId: { type: String, attribute: 'session-id' },
        pid: { type: Number },
        cwd: { type: String },
        name: { type: String },
        entrypoint: { type: String },
        alive: { type: Boolean, reflect: true }
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow: hidden;
            background: var(--bg-primary, #1e1e1e);
        }

        .session-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-xs, 4px) var(--spacing-md, 12px);
            background: var(--bg-tertiary, rgba(255, 255, 255, 0.03));
            border-bottom: 1px solid var(--border-primary, #2d2d2d);
            font-size: var(--font-size-xs, 11px);
            color: var(--text-secondary, #a0a0a0);
            flex-shrink: 0;
            min-height: 28px;
        }

        .alive-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        :host([alive]) .alive-dot {
            background: var(--color-success, #4ade80);
            animation: pulse 2s ease-in-out infinite;
        }

        :host(:not([alive])) .alive-dot {
            background: var(--color-error, #ef4444);
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }

        .session-label {
            font-weight: 600;
            color: var(--text-primary, #e0e0e0);
        }

        .session-meta {
            opacity: 0.7;
        }

        .session-meta-separator {
            opacity: 0.3;
        }

        .session-badge {
            padding: 1px 6px;
            border-radius: var(--radius-full, 100px);
            background: var(--bg-secondary, rgba(255, 255, 255, 0.06));
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        :host([alive]) .session-badge {
            color: var(--color-success, #4ade80);
        }

        :host(:not([alive])) .session-badge {
            color: var(--color-error, #ef4444);
        }

        .spacer {
            flex: 1;
        }

        .message-count {
            opacity: 0.5;
        }

        .content {
            flex: 1;
            overflow: hidden;
        }

        conversation-stream {
            height: 100%;
        }

        terminal-input {
            flex-shrink: 0;
        }
    `;

    constructor() {
        super();
        this.alive = true;
    }

    connectedCallback() {
        super.connectedCallback();
        this.watchSignals([AppStore.conversations, AppStore.activeStreamingId]);
    }

    get _conversationId() {
        return { type: 'session', id: this.sessionId };
    }

    get _conversation() {
        return Actions.getConversation(this._conversationId);
    }

    get _messages() {
        return this._conversation?.messages || [];
    }

    get _cwdBasename() {
        if (!this.cwd) return '';
        const parts = this.cwd.split('/');
        return parts[parts.length - 1] || this.cwd;
    }

    get _isStreaming() {
        const activeId = AppStore.activeStreamingId.value;
        if (activeId && activeId.type === 'session' && activeId.id === this.sessionId) {
            return true;
        }
        // Also show thinking when session is alive and last message was from user
        if (!this.alive) return false;
        const messages = this._messages;
        if (messages.length === 0) return false;
        const lastMsg = messages[messages.length - 1];
        return lastMsg.role === 'user';
    }

    get _streamingContent() {
        const conv = this._conversation;
        return conv?.streamingContent || '';
    }

    _handleSend(e) {
        const { message, model, settings, attachments } = e.detail;
        this.dispatchEvent(new CustomEvent('send-message', {
            detail: {
                message,
                model: model || 'sonnet',
                settings,
                attachments,
                sessionId: this.sessionId,
                sessionAlive: this.alive,
                conversationId: this._conversationId
            },
            bubbles: true,
            composed: true
        }));
    }

    _handleInterrupt() {
        this.dispatchEvent(new CustomEvent('interrupt', { bubbles: true, composed: true }));
    }

    render() {
        const messages = this._messages;

        return html`
            <div class="session-header">
                <span class="alive-dot"></span>
                <span class="session-label">${this.name || 'CLI Session'}</span>
                ${this.pid ? html`
                    <span class="session-meta-separator">|</span>
                    <span class="session-meta">PID ${this.pid}</span>
                ` : ''}
                <span class="session-meta-separator">|</span>
                <span class="session-meta">${this._cwdBasename}</span>
                <span class="session-meta-separator">|</span>
                <span class="session-meta">${this.entrypoint || 'cli'}</span>
                <span class="session-badge">${this.alive ? 'live' : 'resume'}</span>
                <span class="spacer"></span>
                <span class="message-count">${messages.length} messages</span>
            </div>
            <div class="content">
                <conversation-stream
                    .messages=${messages}
                    ?streaming=${this._isStreaming}
                    .streamingContent=${this._streamingContent}
                    auto-scroll
                ></conversation-stream>
            </div>
            <terminal-input
                ?streaming=${this._isStreaming}
                placeholder=${this.alive ? 'Send a message to this session...' : 'Send a message to resume this session...'}
                @send=${this._handleSend}
                @interrupt=${this._handleInterrupt}
            ></terminal-input>
        `;
    }
}

customElements.define('session-tab-view', SessionTabView);
export { SessionTabView };
