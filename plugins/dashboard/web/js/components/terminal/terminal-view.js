/**
 * Terminal View Component - Main container for SDK terminal interactions
 * @module components/terminal/terminal-view
 */

import { LitElement, html, css } from 'lit';
import '../conversation/conversation-stream.js';
import './terminal-input.js';
import './session-controls.js';

class TerminalView extends LitElement {
    static properties = {
        messages: { type: Array },
        streaming: { type: Boolean, reflect: true },
        streamingContent: { type: String, attribute: 'streaming-content' },
        connected: { type: Boolean, reflect: true },
        model: { type: String },
        sessionId: { type: String, attribute: 'session-id' },
        inputHistory: { type: Array, attribute: 'input-history' }
    };

    static styles = css`
        :host { display: flex; flex-direction: column; height: 100%; background: var(--bg-primary, white); }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border-bottom: 1px solid var(--border-color, #e0e0e0);
            background: var(--bg-secondary, #f8f9fa);
        }
        .header-left { display: flex; align-items: center; gap: var(--spacing-sm, 8px); }
        .title {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            font-size: var(--font-size-sm, 13px);
            font-weight: 500;
            color: var(--text-primary, #333);
        }
        .connection-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--error-color, #dc3545);
            flex-shrink: 0;
        }
        .connection-indicator.connected {
            background: var(--success-color, #4ade80);
            animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
            50% { opacity: 0.8; box-shadow: 0 0 0 4px rgba(74, 222, 128, 0); }
        }
        .header-right { display: flex; align-items: center; gap: var(--spacing-md, 12px); }
        .content { flex: 1; overflow: hidden; }
        conversation-stream { height: 100%; }
        terminal-input { flex-shrink: 0; }
    `;

    constructor() {
        super();
        this.messages = [];
        this.streaming = false;
        this.streamingContent = '';
        this.connected = false;
        this.model = 'sonnet';
        this.sessionId = null;
        this.inputHistory = [];
    }

    _handleSend(e) {
        const { message } = e.detail;
        this.dispatchEvent(new CustomEvent('send-message', { detail: { message, model: this.model }, bubbles: true, composed: true }));
    }

    _handleInterrupt() {
        this.dispatchEvent(new CustomEvent('interrupt', { bubbles: true, composed: true }));
    }

    _handleClear() {
        this.dispatchEvent(new CustomEvent('clear-messages', { bubbles: true, composed: true }));
    }

    _handleModelChange(e) {
        this.model = e.detail.model;
        this.dispatchEvent(new CustomEvent('model-change', { detail: { model: this.model }, bubbles: true, composed: true }));
    }

    _handleNewSession() {
        this.dispatchEvent(new CustomEvent('new-session', { bubbles: true, composed: true }));
    }

    _handleReconnect() {
        this.dispatchEvent(new CustomEvent('reconnect', { bubbles: true, composed: true }));
    }

    _handleSessionSelect(e) {
        const { sessionId } = e.detail;
        this.dispatchEvent(new CustomEvent('session-select', {
            detail: { sessionId },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        return html`
            <div class="header">
                <div class="header-left">
                    <div class="title">
                        <span class="connection-indicator ${this.connected ? 'connected' : ''}"></span>
                        <span>Claude SDK Terminal</span>
                    </div>
                </div>
                <div class="header-right">
                    <session-controls
                        .sessionId=${this.sessionId}
                        ?connected=${this.connected}
                        ?streaming=${this.streaming}
                        @new-session=${this._handleNewSession}
                        @reconnect=${this._handleReconnect}
                        @session-select=${this._handleSessionSelect}
                    ></session-controls>
                </div>
            </div>
            <div class="content">
                <conversation-stream
                    .messages=${this.messages}
                    ?streaming=${this.streaming}
                    .streamingContent=${this.streamingContent}
                    auto-scroll
                ></conversation-stream>
            </div>
            <terminal-input
                .history=${this.inputHistory}
                .model=${this.model}
                ?streaming=${this.streaming}
                ?disabled=${!this.connected}
                placeholder=${this.connected ? 'Ask Claude something...' : 'Connecting to SDK...'}
                @send=${this._handleSend}
                @interrupt=${this._handleInterrupt}
                @clear=${this._handleClear}
                @model-change=${this._handleModelChange}
            ></terminal-input>
        `;
    }
}

customElements.define('terminal-view', TerminalView);
export { TerminalView };
