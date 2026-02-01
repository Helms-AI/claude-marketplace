/**
 * Slider Atom - Range slider with value display
 * @module components/atoms/slider
 */
import { LitElement, html, css } from 'lit';

class DashSlider extends LitElement {
    static properties = {
        min: { type: Number },
        max: { type: Number },
        value: { type: Number },
        step: { type: Number },
        disabled: { type: Boolean, reflect: true },
        showValue: { type: Boolean, attribute: 'show-value' }
    };

    static styles = css`
        :host {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            width: 100%;
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
        }

        .slider-container {
            flex: 1;
            position: relative;
            display: flex;
            align-items: center;
        }

        input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 4px;
            background: var(--bg-tertiary, #2d2d2d);
            border-radius: 2px;
            cursor: pointer;
            margin: 0;
        }

        /* Track - filled portion */
        input[type="range"]::-webkit-slider-runnable-track {
            width: 100%;
            height: 4px;
            background: linear-gradient(
                to right,
                var(--accent-color, #007acc) 0%,
                var(--accent-color, #007acc) var(--fill-percent, 0%),
                var(--bg-tertiary, #2d2d2d) var(--fill-percent, 0%),
                var(--bg-tertiary, #2d2d2d) 100%
            );
            border-radius: 2px;
        }

        input[type="range"]::-moz-range-track {
            width: 100%;
            height: 4px;
            background: var(--bg-tertiary, #2d2d2d);
            border-radius: 2px;
        }

        input[type="range"]::-moz-range-progress {
            background: var(--accent-color, #007acc);
            height: 4px;
            border-radius: 2px;
        }

        /* Thumb */
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 14px;
            height: 14px;
            background: var(--text-primary, #cccccc);
            border-radius: 50%;
            cursor: pointer;
            margin-top: -5px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        input[type="range"]::-moz-range-thumb {
            width: 14px;
            height: 14px;
            background: var(--text-primary, #cccccc);
            border-radius: 50%;
            border: none;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        input[type="range"]:hover::-webkit-slider-thumb {
            transform: scale(1.1);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        input[type="range"]:hover::-moz-range-thumb {
            transform: scale(1.1);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        input[type="range"]:focus-visible {
            outline: none;
        }

        input[type="range"]:focus-visible::-webkit-slider-thumb {
            box-shadow: 0 0 0 3px var(--accent-color-alpha, rgba(0, 122, 204, 0.3));
        }

        input[type="range"]:focus-visible::-moz-range-thumb {
            box-shadow: 0 0 0 3px var(--accent-color-alpha, rgba(0, 122, 204, 0.3));
        }

        .value-display {
            min-width: 40px;
            text-align: right;
            font-family: var(--font-mono, 'IBM Plex Mono', monospace);
            font-size: var(--font-size-sm, 12px);
            color: var(--text-secondary, #8b949e);
            flex-shrink: 0;
        }
    `;

    constructor() {
        super();
        this.min = 0;
        this.max = 100;
        this.value = 50;
        this.step = 1;
        this.disabled = false;
        this.showValue = true;
    }

    get _fillPercent() {
        const range = this.max - this.min;
        if (range === 0) return 0;
        return ((this.value - this.min) / range) * 100;
    }

    _handleInput(e) {
        const newValue = Number(e.target.value);
        this.value = newValue;
        this.dispatchEvent(new CustomEvent('dash-change', {
            detail: { value: newValue },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        return html`
            <div class="slider-container">
                <input
                    type="range"
                    .min="${this.min}"
                    .max="${this.max}"
                    .value="${this.value}"
                    .step="${this.step}"
                    ?disabled="${this.disabled}"
                    style="--fill-percent: ${this._fillPercent}%"
                    @input="${this._handleInput}"
                />
            </div>
            ${this.showValue ? html`
                <span class="value-display">${this.value}</span>
            ` : ''}
        `;
    }
}

customElements.define('dash-slider', DashSlider);
export { DashSlider };
