/**
 * Spawn Session Dialog - Form for launching new headless Claude Code sessions
 * @module components/terminal/spawn-session-dialog
 */
import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';

class SpawnSessionDialog extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        _loading: { type: Boolean, state: true },
        _error: { type: String, state: true }
    };

    static styles = css`
        :host {
            display: none;
        }

        :host([open]) {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 1000;
        }

        .backdrop {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(2px);
        }

        .dialog {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 480px;
            max-height: 80vh;
            background: var(--bg-primary, #1e1e1e);
            border: 1px solid var(--border-primary, #2d2d2d);
            border-radius: var(--radius-lg, 12px);
            box-shadow: var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.4));
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .dialog-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);
            border-bottom: 1px solid var(--border-primary, #2d2d2d);
        }

        .dialog-title {
            font-size: var(--font-size-md, 14px);
            font-weight: 600;
            color: var(--text-primary, #e0e0e0);
        }

        .close-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            color: var(--text-muted, #808080);
            border-radius: var(--radius-sm, 4px);
        }

        .close-btn:hover {
            background: var(--bg-secondary, rgba(255, 255, 255, 0.06));
            color: var(--text-primary, #e0e0e0);
        }

        .dialog-body {
            padding: var(--spacing-lg, 16px);
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md, 12px);
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs, 4px);
        }

        .form-label {
            font-size: var(--font-size-xs, 11px);
            font-weight: 500;
            color: var(--text-secondary, #a0a0a0);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        textarea, input[type="text"], input[type="number"], select {
            background: var(--bg-secondary, rgba(255, 255, 255, 0.06));
            border: 1px solid var(--border-primary, #2d2d2d);
            border-radius: var(--radius-sm, 4px);
            color: var(--text-primary, #e0e0e0);
            padding: var(--spacing-sm, 8px);
            font-size: var(--font-size-sm, 13px);
            font-family: inherit;
            outline: none;
            transition: border-color 0.15s;
        }

        textarea:focus, input:focus, select:focus {
            border-color: var(--accent-color, #4a90d9);
        }

        textarea {
            resize: vertical;
            min-height: 80px;
        }

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
        }

        .checkbox-group label {
            font-size: var(--font-size-sm, 13px);
            color: var(--text-primary, #e0e0e0);
            cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
            accent-color: var(--accent-color, #4a90d9);
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--spacing-md, 12px);
        }

        .dialog-footer {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);
            border-top: 1px solid var(--border-primary, #2d2d2d);
        }

        .btn {
            padding: var(--spacing-xs, 4px) var(--spacing-md, 12px);
            border-radius: var(--radius-sm, 4px);
            font-size: var(--font-size-sm, 13px);
            cursor: pointer;
            border: 1px solid var(--border-primary, #2d2d2d);
            background: var(--bg-secondary, rgba(255, 255, 255, 0.06));
            color: var(--text-primary, #e0e0e0);
            min-height: 32px;
        }

        .btn:hover {
            background: var(--bg-tertiary, rgba(255, 255, 255, 0.1));
        }

        .btn-primary {
            background: var(--accent-color, #4a90d9);
            border-color: var(--accent-color, #4a90d9);
            color: white;
        }

        .btn-primary:hover {
            opacity: 0.9;
        }

        .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .error {
            color: var(--color-error, #ef4444);
            font-size: var(--font-size-xs, 11px);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            background: rgba(239, 68, 68, 0.1);
            border-radius: var(--radius-sm, 4px);
        }

        .form-hint {
            font-size: 10px;
            color: var(--text-muted, #808080);
            margin-top: 2px;
        }
    `;

    constructor() {
        super();
        this.open = false;
        this._loading = false;
        this._error = '';
    }

    _close() {
        this.open = false;
        this._error = '';
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    async _handleSubmit(e) {
        e.preventDefault();
        this._loading = true;
        this._error = '';

        const form = this.shadowRoot.querySelector('form');
        const formData = new FormData(form);

        const payload = {
            prompt: formData.get('prompt') || '',
            model: formData.get('model') || 'sonnet',
            max_turns: parseInt(formData.get('max_turns')) || 50,
            continue_conversation: formData.get('continue_conversation') === 'on',
            dangerously_skip_permissions: formData.get('skip_permissions') !== null
                ? formData.get('skip_permissions') === 'on'
                : true
        };

        try {
            const response = await fetch('/api/sessions/spawn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                this._error = result.error || 'Failed to spawn session';
                return;
            }

            console.log('[SpawnDialog] Session spawned:', result);
            this._close();
        } catch (err) {
            this._error = err.message;
        } finally {
            this._loading = false;
        }
    }

    render() {
        if (!this.open) return html``;

        return html`
            <div class="backdrop" @click=${this._close}></div>
            <div class="dialog">
                <div class="dialog-header">
                    <span class="dialog-title">New Claude Session</span>
                    <button class="close-btn" @click=${this._close}>
                        <dash-icon name="x" size="16"></dash-icon>
                    </button>
                </div>
                <form @submit=${this._handleSubmit}>
                    <div class="dialog-body">
                        <div class="form-group">
                            <span class="form-label">Prompt</span>
                            <textarea name="prompt" placeholder="Enter initial prompt for Claude..."></textarea>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <span class="form-label">Model</span>
                                <select name="model">
                                    <option value="sonnet">Sonnet</option>
                                    <option value="opus">Opus</option>
                                    <option value="haiku">Haiku</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <span class="form-label">Max Turns</span>
                                <input type="number" name="max_turns" value="50" min="1" max="500">
                            </div>
                        </div>

                        <div class="form-group">
                            <div class="checkbox-group">
                                <input type="checkbox" id="skip_permissions" name="skip_permissions" checked>
                                <label for="skip_permissions">Skip permissions</label>
                            </div>
                            <span class="form-hint">--dangerously-skip-permissions: Bypass all permission checks</span>
                        </div>

                        <div class="form-group">
                            <div class="checkbox-group">
                                <input type="checkbox" id="continue_conversation" name="continue_conversation">
                                <label for="continue_conversation">Continue previous conversation</label>
                            </div>
                            <span class="form-hint">--continue: Resume the most recent conversation in this directory</span>
                        </div>

                        ${this._error ? html`<div class="error">${this._error}</div>` : ''}
                    </div>
                    <div class="dialog-footer">
                        <button type="button" class="btn" @click=${this._close}>Cancel</button>
                        <button type="submit" class="btn btn-primary" ?disabled=${this._loading}>
                            ${this._loading ? 'Spawning...' : 'Launch Session'}
                        </button>
                    </div>
                </form>
            </div>
        `;
    }
}

customElements.define('spawn-session-dialog', SpawnSessionDialog);
export { SpawnSessionDialog };
