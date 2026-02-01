/**
 * Spinner Atom - Loading spinner component
 * @module components/atoms/spinner
 */
import { LitElement, html, css } from 'lit';

class DashSpinner extends LitElement {
    static properties = {
        size: { type: String },  // 'xs' | 'sm' | 'md' | 'lg'
        color: { type: String }
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .spinner {
            border-radius: 50%;
            border-style: solid;
            border-color: currentColor;
            border-right-color: transparent;
            animation: spin 0.6s linear infinite;
        }

        .xs {
            width: 12px;
            height: 12px;
            border-width: 1.5px;
        }

        .sm {
            width: 16px;
            height: 16px;
            border-width: 2px;
        }

        .md {
            width: 24px;
            height: 24px;
            border-width: 2.5px;
        }

        .lg {
            width: 32px;
            height: 32px;
            border-width: 3px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;

    constructor() {
        super();
        this.size = 'md';
        this.color = 'currentColor';
    }

    render() {
        return html`
            <div
                class="spinner ${this.size}"
                style="color: ${this.color};"
            ></div>
        `;
    }
}

customElements.define('dash-spinner', DashSpinner);
export { DashSpinner };
