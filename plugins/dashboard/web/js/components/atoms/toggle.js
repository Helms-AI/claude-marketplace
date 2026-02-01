/**
 * Toggle Atom - Toggle switch component
 * @module components/atoms/toggle
 */
import { LitElement, html, css } from 'lit';

class DashToggle extends LitElement {
    static properties = {
        checked: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
        size: { type: String },       // 'sm' | 'md' | 'lg'
        label: { type: String }
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
        }

        .toggle {
            position: relative;
            display: inline-flex;
            cursor: pointer;
        }

        input {
            position: absolute;
            opacity: 0;
            width: 0;
            height: 0;
        }

        .track {
            border-radius: 999px;
            background: var(--bg-tertiary, #d1d5db);
            transition: background 0.2s;
        }

        .thumb {
            position: absolute;
            top: 2px;
            left: 2px;
            border-radius: 50%;
            background: white;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
            transition: transform 0.2s;
        }

        /* Checked state */
        input:checked + .track {
            background: var(--accent-color, #3b82f6);
        }

        /* Sizes */
        .sm .track {
            width: 28px;
            height: 16px;
        }

        .sm .thumb {
            width: 12px;
            height: 12px;
        }

        .sm input:checked + .track .thumb {
            transform: translateX(12px);
        }

        .md .track {
            width: 36px;
            height: 20px;
        }

        .md .thumb {
            width: 16px;
            height: 16px;
        }

        .md input:checked + .track .thumb {
            transform: translateX(16px);
        }

        .lg .track {
            width: 44px;
            height: 24px;
        }

        .lg .thumb {
            width: 20px;
            height: 20px;
        }

        .lg input:checked + .track .thumb {
            transform: translateX(20px);
        }

        /* Focus state */
        input:focus-visible + .track {
            box-shadow: 0 0 0 3px var(--accent-color-alpha, rgba(59, 130, 246, 0.15));
        }

        .label {
            font-size: var(--font-size-sm, 12px);
            color: var(--text-primary, #1f2937);
            user-select: none;
        }
    `;

    constructor() {
        super();
        this.checked = false;
        this.disabled = false;
        this.size = 'md';
        this.label = '';
    }

    render() {
        return html`
            <label class="toggle ${this.size}">
                <input
                    type="checkbox"
                    .checked="${this.checked}"
                    ?disabled="${this.disabled}"
                    @change="${this._handleChange}"
                />
                <span class="track">
                    <span class="thumb"></span>
                </span>
            </label>
            ${this.label ? html`<span class="label">${this.label}</span>` : ''}
        `;
    }

    _handleChange(e) {
        this.checked = e.target.checked;
        this.dispatchEvent(new CustomEvent('dash-change', {
            detail: { checked: this.checked },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('dash-toggle', DashToggle);
export { DashToggle };
