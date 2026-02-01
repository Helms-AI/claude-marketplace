/**
 * Model Toggle Molecule - Brain icon toggle for Opus/Sonnet
 * @module components/molecules/model-toggle
 */
import { LitElement, html, css } from 'lit';
import '../atoms/brain-icon.js';

class ModelToggle extends LitElement {
    static properties = {
        model: { type: String },          // 'sonnet' | 'opus' | 'haiku'
        disabled: { type: Boolean, reflect: true },
        showLabel: { type: Boolean, attribute: 'show-label' },
        compact: { type: Boolean, reflect: true }  // Compact mode for inline toolbar
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
        }

        .toggle-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: var(--toggle-size, 32px);
            height: var(--toggle-size, 32px);
            min-width: var(--toggle-size, 32px);
            min-height: var(--toggle-size, 32px);
            padding: 0;
            border: none;
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        :host([compact]) .toggle-btn {
            width: 28px;
            height: 28px;
            min-width: 28px;
            min-height: 28px;
        }

        .toggle-btn:hover:not(:disabled) {
            background: var(--bg-hover, rgba(255, 255, 255, 0.08));
        }

        .toggle-btn:active:not(:disabled) {
            transform: scale(0.95);
        }

        .toggle-btn:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px var(--bg-primary, #1e1e1e), 0 0 0 4px var(--accent-color, #007acc);
        }

        /* Opus highlighted state */
        .toggle-btn.opus {
            background: var(--opus-gold-bg, rgba(212, 168, 83, 0.15));
        }

        .toggle-btn.opus:hover {
            background: var(--opus-gold-bg-hover, rgba(212, 168, 83, 0.25));
        }

        .label {
            font-size: var(--font-size-xs, 11px);
            font-weight: 500;
            color: var(--text-muted, #8b949e);
            text-transform: capitalize;
        }

        .label.opus {
            color: var(--opus-gold, #d4a853);
        }
    `;

    constructor() {
        super();
        this.model = 'sonnet';
        this.disabled = false;
        this.showLabel = false;
        this.compact = false;
    }

    _handleClick() {
        // Toggle between sonnet and opus
        const previousModel = this.model;
        this.model = this.model === 'opus' ? 'sonnet' : 'opus';

        this.dispatchEvent(new CustomEvent('model-change', {
            detail: { model: this.model, previousModel },
            bubbles: true,
            composed: true
        }));
    }

    _getTooltip() {
        const modelNames = {
            'sonnet': 'Sonnet (Fast)',
            'opus': 'Opus (Most capable)',
            'haiku': 'Haiku (Fastest)'
        };
        return `Model: ${modelNames[this.model] || this.model}. Click to toggle.`;
    }

    render() {
        const isOpus = this.model === 'opus';
        const iconSize = this.compact ? 14 : 18;

        return html`
            <button
                class="toggle-btn ${isOpus ? 'opus' : ''}"
                ?disabled="${this.disabled}"
                title="${this._getTooltip()}"
                @click="${this._handleClick}"
                aria-label="Toggle model: currently ${this.model}"
            >
                <brain-icon ?highlighted="${isOpus}" size="${iconSize}"></brain-icon>
            </button>
            ${this.showLabel ? html`
                <span class="label ${isOpus ? 'opus' : ''}">${this.model}</span>
            ` : ''}
        `;
    }
}

customElements.define('model-toggle', ModelToggle);
export { ModelToggle };
