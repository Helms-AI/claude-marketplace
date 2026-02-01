/**
 * Model Selector Component - Dropdown for selecting Claude model
 * @module components/terminal/model-selector
 */

import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';

const MODELS = [
    { id: 'sonnet', name: 'Sonnet', description: 'Fast and efficient', default: true },
    { id: 'opus', name: 'Opus', description: 'Most capable' },
    { id: 'haiku', name: 'Haiku', description: 'Fastest responses' }
];

class ModelSelector extends LitElement {
    static properties = {
        value: { type: String, reflect: true },
        disabled: { type: Boolean, reflect: true },
        compact: { type: Boolean, reflect: true }
    };

    static styles = css`
        :host { display: inline-flex; align-items: center; gap: var(--spacing-xs, 4px); }
        .label {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #999);
            font-weight: 500;
        }
        :host([compact]) .label { display: none; }
        .select-wrapper { position: relative; }
        .select {
            appearance: none;
            padding: var(--spacing-xs, 4px) var(--spacing-lg, 24px) var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            font-size: var(--font-size-xs, 11px);
            font-family: inherit;
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: var(--radius-sm, 4px);
            background: var(--bg-primary, white);
            color: var(--text-primary, #333);
            cursor: pointer;
            outline: none;
            transition: all 0.15s ease;
        }
        .select:hover:not(:disabled) { border-color: var(--accent-color, #4a90d9); }
        .select:focus { border-color: var(--accent-color, #4a90d9); box-shadow: 0 0 0 2px var(--accent-bg, rgba(74, 144, 217, 0.1)); }
        .select:disabled { opacity: 0.6; cursor: not-allowed; }
        .arrow {
            position: absolute;
            right: var(--spacing-xs, 4px);
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
            color: var(--text-muted, #999);
        }
        .arrow dash-icon { display: block; }
    `;

    constructor() {
        super();
        this.value = 'sonnet';
        this.disabled = false;
        this.compact = false;
    }

    _handleChange(e) {
        this.value = e.target.value;
        this.dispatchEvent(new CustomEvent('model-change', { detail: { model: this.value }, bubbles: true, composed: true }));
    }

    render() {
        return html`
            <label class="label" for="model-select">Model:</label>
            <div class="select-wrapper">
                <select id="model-select" class="select" .value=${this.value} ?disabled=${this.disabled} @change=${this._handleChange}>
                    ${MODELS.map(model => html`<option value=${model.id} ?selected=${model.id === this.value}>${model.name}</option>`)}
                </select>
                <span class="arrow">
                    <dash-icon name="chevron-down" size="12"></dash-icon>
                </span>
            </div>
        `;
    }
}

customElements.define('model-selector', ModelSelector);
export { ModelSelector };
