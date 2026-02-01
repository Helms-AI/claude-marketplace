/**
 * Input Toolbar Molecule - Action buttons for terminal input
 * @module components/molecules/input-toolbar
 */
import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';
import './model-toggle.js';

class InputToolbar extends LitElement {
    static properties = {
        model: { type: String },          // Current model for model-toggle
        streaming: { type: Boolean },     // Show interrupt vs send
        disabled: { type: Boolean, reflect: true },
        canSubmit: { type: Boolean, attribute: 'can-submit' },
        showAttachment: { type: Boolean, attribute: 'show-attachment' },
        showSettings: { type: Boolean, attribute: 'show-settings' },
        showModel: { type: Boolean, attribute: 'show-model' },  // Show model toggle
        compact: { type: Boolean, reflect: true }  // Compact mode for inline toolbar
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            gap: 2px;
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
        }

        /* Compact mode - tighter spacing, smaller buttons */
        :host([compact]) {
            gap: 0;
        }

        :host([compact]) .tool-btn {
            width: 28px;
            height: 28px;
            min-width: 28px;
            min-height: 28px;
            border-radius: var(--radius-sm, 4px);
        }

        :host([compact]) .tool-btn dash-icon {
            --icon-size: 14px;
        }

        :host([compact]) .submit-btn {
            width: 28px;
            height: 28px;
            min-width: 28px;
            min-height: 28px;
            border-radius: var(--radius-md, 6px);
        }

        :host([compact]) model-toggle {
            --toggle-size: 28px;
        }

        /* Base button styles for tools */
        .tool-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            min-width: 32px;
            min-height: 32px;
            padding: 0;
            border: none;
            border-radius: var(--radius-md, 6px);
            background: transparent;
            color: var(--text-muted, #6e7681);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .tool-btn:hover:not(:disabled) {
            background: var(--bg-hover, rgba(255, 255, 255, 0.08));
            color: var(--text-secondary, #8b949e);
        }

        .tool-btn:active:not(:disabled) {
            transform: scale(0.95);
        }

        .tool-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        /* Submit button - prominent action */
        .submit-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            min-width: 32px;
            min-height: 32px;
            padding: 0;
            border: none;
            border-radius: var(--radius-md, 6px);
            background: var(--accent-color, #007acc);
            color: white;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .submit-btn:hover:not(:disabled) {
            background: var(--accent-hover, #0098ff);
        }

        .submit-btn:active:not(:disabled) {
            transform: scale(0.95);
        }

        .submit-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        /* Interrupt button - danger action */
        .submit-btn.interrupt {
            background: var(--danger-color, #dc2626);
        }

        .submit-btn.interrupt:hover:not(:disabled) {
            background: var(--danger-hover, #ef4444);
        }
    `;

    constructor() {
        super();
        this.model = 'sonnet';
        this.streaming = false;
        this.disabled = false;
        this.canSubmit = false;
        this.showAttachment = true;
        this.showSettings = true;
        this.showModel = true;
        this.compact = false;
    }

    _handleAttachment() {
        this.dispatchEvent(new CustomEvent('attachment', { bubbles: true, composed: true }));
    }

    _handleSettings() {
        this.dispatchEvent(new CustomEvent('settings', { bubbles: true, composed: true }));
    }

    _handleSubmit() {
        this.dispatchEvent(new CustomEvent('submit', { bubbles: true, composed: true }));
    }

    _handleInterrupt() {
        this.dispatchEvent(new CustomEvent('interrupt', { bubbles: true, composed: true }));
    }

    _handleModelChange(e) {
        this.model = e.detail.model;
        this.dispatchEvent(new CustomEvent('model-change', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }

    render() {
        const iconSize = this.compact ? 14 : 16;

        return html`
            ${this.streaming ? html`
                <button
                    class="submit-btn interrupt"
                    title="Stop (Ctrl+C)"
                    @click="${this._handleInterrupt}"
                >
                    <dash-icon name="square" size="${iconSize}"></dash-icon>
                </button>
            ` : html`
                <button
                    class="submit-btn"
                    title="Send (Enter)"
                    ?disabled="${this.disabled || !this.canSubmit}"
                    @click="${this._handleSubmit}"
                >
                    <dash-icon name="arrow-up" size="${iconSize}"></dash-icon>
                </button>
            `}

            ${this.showAttachment ? html`
                <button
                    class="tool-btn"
                    title="Attach file"
                    ?disabled="${this.disabled}"
                    @click="${this._handleAttachment}"
                >
                    <dash-icon name="paperclip" size="${iconSize}"></dash-icon>
                </button>
            ` : ''}

            ${this.showModel ? html`
                <model-toggle
                    .model="${this.model}"
                    ?disabled="${this.disabled}"
                    ?compact="${this.compact}"
                    @model-change="${this._handleModelChange}"
                ></model-toggle>
            ` : ''}

            ${this.showSettings ? html`
                <button
                    class="tool-btn"
                    title="Agent tools"
                    ?disabled="${this.disabled}"
                    @click="${this._handleSettings}"
                >
                    <dash-icon name="sliders-horizontal" size="${iconSize}"></dash-icon>
                </button>
            ` : ''}
        `;
    }
}

customElements.define('input-toolbar', InputToolbar);
export { InputToolbar };
