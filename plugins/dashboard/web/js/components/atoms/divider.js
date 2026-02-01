/**
 * Divider Atom - Section separator
 * @module components/atoms/divider
 *
 * Displays a horizontal or vertical divider line with optional label.
 */
import { LitElement, html, css } from 'lit';

class DashDivider extends LitElement {
    static properties = {
        orientation: { type: String },  // 'horizontal' | 'vertical'
        spacing: { type: String },      // 'xs' | 'sm' | 'md' | 'lg'
        label: { type: String }         // Optional center label
    };

    static styles = css`
        :host {
            display: block;
        }

        :host([orientation="vertical"]) {
            display: inline-block;
            height: 100%;
        }

        .divider {
            display: flex;
            align-items: center;
            color: var(--text-muted, #9ca3af);
            font-family: var(--font-sans);
            font-size: var(--font-size-xs, 11px);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        /* Horizontal */
        .horizontal {
            flex-direction: row;
            width: 100%;
        }

        .horizontal .line {
            flex: 1;
            height: 1px;
            background: var(--border-color, #e5e7eb);
        }

        .horizontal .label {
            padding: 0 var(--spacing-sm, 8px);
            white-space: nowrap;
        }

        /* Vertical */
        .vertical {
            flex-direction: column;
            height: 100%;
            width: auto;
        }

        .vertical .line {
            flex: 1;
            width: 1px;
            background: var(--border-color, #e5e7eb);
        }

        .vertical .label {
            padding: var(--spacing-xs, 4px) 0;
            writing-mode: vertical-rl;
            text-orientation: mixed;
        }

        /* Spacing - horizontal */
        .horizontal.spacing-xs { margin: var(--spacing-xs, 4px) 0; }
        .horizontal.spacing-sm { margin: var(--spacing-sm, 8px) 0; }
        .horizontal.spacing-md { margin: var(--spacing-md, 12px) 0; }
        .horizontal.spacing-lg { margin: var(--spacing-lg, 16px) 0; }

        /* Spacing - vertical */
        .vertical.spacing-xs { margin: 0 var(--spacing-xs, 4px); }
        .vertical.spacing-sm { margin: 0 var(--spacing-sm, 8px); }
        .vertical.spacing-md { margin: 0 var(--spacing-md, 12px); }
        .vertical.spacing-lg { margin: 0 var(--spacing-lg, 16px); }
    `;

    constructor() {
        super();
        this.orientation = 'horizontal';
        this.spacing = 'md';
        this.label = '';
    }

    render() {
        const classes = [this.orientation, `spacing-${this.spacing}`];

        return html`
            <div class="divider ${classes.join(' ')}" role="separator">
                <span class="line"></span>
                ${this.label ? html`<span class="label">${this.label}</span>` : ''}
                ${this.label ? html`<span class="line"></span>` : ''}
            </div>
        `;
    }
}

customElements.define('dash-divider', DashDivider);
export { DashDivider };
