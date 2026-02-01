/**
 * Slider Row Molecule - Slider with label and bounds display
 * @module components/molecules/slider-row
 */
import { LitElement, html, css } from 'lit';
import '../atoms/slider.js';
import '../atoms/icon.js';

class SliderRow extends LitElement {
    static properties = {
        label: { type: String },
        description: { type: String },
        min: { type: Number },
        max: { type: Number },
        value: { type: Number },
        step: { type: Number },
        disabled: { type: Boolean, reflect: true },
        icon: { type: String },
        unit: { type: String }
    };

    static styles = css`
        :host {
            display: block;
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
        }

        .container {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-xs, 4px) 0;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--spacing-md, 12px);
        }

        .label-row {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
        }

        .icon {
            color: var(--text-muted, #6e7681);
            flex-shrink: 0;
        }

        .label {
            font-size: var(--font-size-sm, 12px);
            font-weight: 500;
            color: var(--text-primary, #cccccc);
        }

        .value-display {
            font-family: var(--font-mono, 'IBM Plex Mono', monospace);
            font-size: var(--font-size-sm, 12px);
            color: var(--accent-color, #007acc);
            font-weight: 500;
        }

        .slider-container {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
        }

        .bound {
            font-family: var(--font-mono, 'IBM Plex Mono', monospace);
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #6e7681);
            min-width: 32px;
            flex-shrink: 0;
        }

        .bound.min {
            text-align: right;
        }

        .bound.max {
            text-align: left;
        }

        dash-slider {
            flex: 1;
        }

        .description {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #6e7681);
            line-height: 1.4;
        }
    `;

    constructor() {
        super();
        this.label = '';
        this.description = '';
        this.min = 0;
        this.max = 100;
        this.value = 50;
        this.step = 1;
        this.disabled = false;
        this.icon = '';
        this.unit = '';
    }

    _handleChange(e) {
        this.value = e.detail.value;
        this.dispatchEvent(new CustomEvent('change', {
            detail: { value: this.value },
            bubbles: true,
            composed: true
        }));
    }

    get _formattedValue() {
        return this.unit ? `${this.value}${this.unit}` : String(this.value);
    }

    get _formattedMin() {
        return this.unit ? `${this.min}${this.unit}` : String(this.min);
    }

    get _formattedMax() {
        return this.unit ? `${this.max}${this.unit}` : String(this.max);
    }

    render() {
        const hasIcon = Boolean(this.icon);

        return html`
            <div class="container">
                <div class="header">
                    <div class="label-row">
                        ${hasIcon ? html`
                            <dash-icon class="icon" name="${this.icon}" size="16"></dash-icon>
                        ` : ''}
                        <span class="label">${this.label}</span>
                    </div>
                    <span class="value-display">${this._formattedValue}</span>
                </div>
                <div class="slider-container">
                    <span class="bound min">${this._formattedMin}</span>
                    <dash-slider
                        .min="${this.min}"
                        .max="${this.max}"
                        .value="${this.value}"
                        .step="${this.step}"
                        ?disabled="${this.disabled}"
                        ?show-value="${false}"
                        @dash-change="${this._handleChange}"
                    ></dash-slider>
                    <span class="bound max">${this._formattedMax}</span>
                </div>
                ${this.description ? html`
                    <div class="description">${this.description}</div>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('slider-row', SliderRow);
export { SliderRow };
