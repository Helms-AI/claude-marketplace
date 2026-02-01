/**
 * Toggle Row Molecule - Toggle switch with label and description
 * @module components/molecules/toggle-row
 */
import { LitElement, html, css } from 'lit';
import '../atoms/toggle.js';
import '../atoms/icon.js';

class ToggleRow extends LitElement {
    static properties = {
        label: { type: String },
        description: { type: String },
        checked: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
        icon: { type: String }
    };

    static styles = css`
        :host {
            display: block;
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
        }

        .row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--spacing-md, 12px);
            padding: var(--spacing-xs, 4px) 0;
        }

        .content {
            flex: 1;
            min-width: 0;
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
            line-height: 1.4;
        }

        .description {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #6e7681);
            line-height: 1.4;
            margin-top: var(--spacing-xs, 4px);
            padding-left: ${24 + 8}px; /* icon size + gap */
        }

        :host(:not([icon])) .description {
            padding-left: 0;
        }

        .toggle-wrapper {
            flex-shrink: 0;
            padding-top: 2px;
        }
    `;

    constructor() {
        super();
        this.label = '';
        this.description = '';
        this.checked = false;
        this.disabled = false;
        this.icon = '';
    }

    _handleChange(e) {
        this.checked = e.detail.checked;
        this.dispatchEvent(new CustomEvent('change', {
            detail: { checked: this.checked },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        const hasIcon = Boolean(this.icon);

        return html`
            <div class="row">
                <div class="content">
                    <div class="label-row">
                        ${hasIcon ? html`
                            <dash-icon class="icon" name="${this.icon}" size="16"></dash-icon>
                        ` : ''}
                        <span class="label">${this.label}</span>
                    </div>
                    ${this.description ? html`
                        <div class="description" style="${hasIcon ? '' : 'padding-left: 0'}">${this.description}</div>
                    ` : ''}
                </div>
                <div class="toggle-wrapper">
                    <dash-toggle
                        .checked="${this.checked}"
                        ?disabled="${this.disabled}"
                        size="sm"
                        @dash-change="${this._handleChange}"
                    ></dash-toggle>
                </div>
            </div>
        `;
    }
}

customElements.define('toggle-row', ToggleRow);
export { ToggleRow };
