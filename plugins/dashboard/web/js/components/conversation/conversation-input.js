/**
 * Conversation Input Component - Passthrough Mode
 *
 * A simplified input component for sending commands through the passthrough
 * queue to the parent Claude Code session. Replaces terminal-input for
 * changeset viewers in passthrough mode.
 *
 * @module components/conversation/conversation-input
 */

import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions } from '../../store/app-state.js';
import { CommandService } from '../../services/command-service.js';

class ConversationInput extends SignalWatcher(LitElement) {
    static properties = {
        contextId: { type: String, attribute: 'context-id' },
        placeholder: { type: String },
        disabled: { type: Boolean },
        _inputValue: { type: String, state: true },
        _isPending: { type: Boolean, state: true },
        _isActive: { type: Boolean, state: true }
    };

    static styles = css`
        :host {
            display: block;
            border-top: 1px solid var(--border-color, #e0e0e0);
            background: var(--bg-secondary, #f8f9fa);
        }

        .input-container {
            display: flex;
            flex-direction: column;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            gap: var(--spacing-xs, 4px);
        }

        .input-row {
            display: flex;
            align-items: flex-end;
            gap: var(--spacing-sm, 8px);
        }

        .input-wrapper {
            flex: 1;
            display: flex;
            align-items: center;
            background: var(--bg-primary, white);
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: var(--radius-md, 6px);
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .input-wrapper:focus-within {
            border-color: var(--accent-color, #007acc);
            box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.1);
        }

        .input-wrapper.disabled {
            background: var(--bg-tertiary, #f0f0f0);
            opacity: 0.7;
        }

        .input-wrapper.pending {
            border-color: var(--warning-color, #f59e0b);
        }

        textarea {
            flex: 1;
            border: none;
            background: transparent;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            font-family: inherit;
            font-size: var(--font-size-md, 13px);
            line-height: 1.5;
            resize: none;
            min-height: 40px;
            max-height: 120px;
            color: var(--text-primary, #1e1e1e);
        }

        textarea:focus {
            outline: none;
        }

        textarea::placeholder {
            color: var(--text-muted, #8b8b8b);
        }

        textarea:disabled {
            cursor: not-allowed;
        }

        /* Send Button */
        .send-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border: none;
            border-radius: var(--radius-md, 6px);
            background: var(--accent-color, #007acc);
            color: white;
            cursor: pointer;
            transition: all 0.15s ease;
            flex-shrink: 0;
        }

        .send-btn:hover:not(:disabled) {
            background: var(--accent-hover, #0066b3);
            transform: translateY(-1px);
        }

        .send-btn:active:not(:disabled) {
            transform: translateY(0);
        }

        .send-btn:disabled {
            background: var(--bg-tertiary, #e0e0e0);
            color: var(--text-muted, #999);
            cursor: not-allowed;
        }

        .send-btn svg {
            width: 18px;
            height: 18px;
        }

        /* Cancel Button */
        .cancel-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border: 1px solid var(--warning-color, #f59e0b);
            border-radius: var(--radius-md, 6px);
            background: var(--warning-bg, #fffbeb);
            color: var(--warning-color, #f59e0b);
            cursor: pointer;
            transition: all 0.15s ease;
            flex-shrink: 0;
        }

        .cancel-btn:hover {
            background: var(--warning-color, #f59e0b);
            color: white;
        }

        .cancel-btn svg {
            width: 16px;
            height: 16px;
        }

        /* Pending State */
        .pending-indicator {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            font-size: var(--font-size-xs, 11px);
            color: var(--warning-color, #f59e0b);
            background: var(--warning-bg, #fffbeb);
            border-radius: var(--radius-sm, 4px);
        }

        .pending-spinner {
            width: 12px;
            height: 12px;
            border: 2px solid var(--warning-color, #f59e0b);
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Status Bar */
        .status-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #8b8b8b);
            padding: 0 var(--spacing-xs, 4px);
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
        }

        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--text-muted, #ccc);
        }

        .status-dot.active {
            background: var(--success-color, #4ade80);
        }

        .status-dot.inactive {
            background: var(--text-muted, #ccc);
        }

        .keyboard-hint {
            opacity: 0.7;
        }

        .keyboard-hint kbd {
            display: inline-block;
            padding: 1px 4px;
            font-family: var(--font-mono, monospace);
            font-size: 10px;
            background: var(--bg-tertiary, #e0e0e0);
            border-radius: 3px;
            border: 1px solid var(--border-color, #ccc);
        }
    `;

    constructor() {
        super();
        this.contextId = 'main';
        this.placeholder = 'Send a message...';
        this.disabled = false;
        this._inputValue = '';
        this._isPending = false;
        this._isActive = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.watchSignals([
            AppStore.pendingCommand,
            AppStore.passthroughActive
        ]);

        // Start monitoring passthrough status
        CommandService.startStatusMonitoring();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // Note: Don't stop monitoring as other components may need it
    }

    willUpdate(changedProperties) {
        super.willUpdate && super.willUpdate(changedProperties);

        // Update pending state from store
        const pending = AppStore.pendingCommand?.value;
        this._isPending = pending && pending.contextId === this.contextId;

        // Update active state from store
        this._isActive = AppStore.passthroughActive?.value || false;
    }

    _handleInput(e) {
        this._inputValue = e.target.value;
        this._autoResize(e.target);
    }

    _autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    _handleKeyDown(e) {
        // Cmd/Ctrl+Enter to send
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            this._handleSend();
        }
        // Escape to cancel
        if (e.key === 'Escape' && this._isPending) {
            e.preventDefault();
            this._handleCancel();
        }
    }

    async _handleSend() {
        const message = this._inputValue.trim();
        if (!message || this._isPending || this.disabled) return;

        try {
            await CommandService.sendCommand(message, {
                contextId: this.contextId
            });

            // Clear input on success
            this._inputValue = '';

            // Reset textarea height
            const textarea = this.shadowRoot?.querySelector('textarea');
            if (textarea) {
                textarea.style.height = 'auto';
            }

            // Dispatch event for parent components
            this.dispatchEvent(new CustomEvent('command-sent', {
                detail: { message, contextId: this.contextId },
                bubbles: true,
                composed: true
            }));
        } catch (error) {
            console.error('[ConversationInput] Error sending command:', error);
        }
    }

    _handleCancel() {
        CommandService.cancelByContextId(this.contextId);

        this.dispatchEvent(new CustomEvent('command-cancelled', {
            detail: { contextId: this.contextId },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        const canSend = this._inputValue.trim() && !this._isPending && !this.disabled;
        const statusText = this._isActive ? 'Parent session active' : 'Waiting for parent session...';

        return html`
            <div class="input-container">
                ${this._isPending ? html`
                    <div class="pending-indicator">
                        <div class="pending-spinner"></div>
                        <span>Processing command...</span>
                    </div>
                ` : ''}

                <div class="input-row">
                    <div class="input-wrapper ${this._isPending ? 'pending' : ''} ${this.disabled ? 'disabled' : ''}">
                        <textarea
                            .value=${this._inputValue}
                            @input=${this._handleInput}
                            @keydown=${this._handleKeyDown}
                            placeholder=${this.placeholder}
                            ?disabled=${this._isPending || this.disabled}
                            rows="1"
                        ></textarea>
                    </div>

                    ${this._isPending ? html`
                        <button
                            class="cancel-btn"
                            @click=${this._handleCancel}
                            title="Cancel command (Esc)"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    ` : html`
                        <button
                            class="send-btn"
                            @click=${this._handleSend}
                            ?disabled=${!canSend}
                            title="Send (Cmd+Enter)"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"/>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                        </button>
                    `}
                </div>

                <div class="status-bar">
                    <div class="status-indicator">
                        <div class="status-dot ${this._isActive ? 'active' : 'inactive'}"></div>
                        <span>${statusText}</span>
                    </div>
                    <div class="keyboard-hint">
                        <kbd>⌘</kbd>+<kbd>Enter</kbd> to send
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('conversation-input', ConversationInput);
export { ConversationInput };
