/**
 * KeyboardShortcut Molecule - kbd + description
 * @module components/molecules/keyboard-shortcut
 */
import { LitElement, html, css } from 'lit';
import '../atoms/kbd.js';

class DashKeyboardShortcut extends LitElement {
    static properties = {
        keys: { type: String },
        description: { type: String },
        inline: { type: Boolean }
    };

    static styles = css`
        :host {
            display: block;
        }

        :host([inline]) {
            display: inline-flex;
        }

        .shortcut {
            display: flex;
            align-items: center;
            gap: var(--spacing-md, 12px);
        }

        :host([inline]) .shortcut {
            gap: var(--spacing-sm, 8px);
        }

        .keys {
            flex-shrink: 0;
        }

        .description {
            font-size: var(--font-size-sm, 12px);
            color: var(--text-primary, #1f2937);
        }

        :host([inline]) .description {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-secondary, #6b7280);
        }
    `;

    constructor() {
        super();
        this.keys = '';
        this.description = '';
        this.inline = false;
    }

    render() {
        return html`
            <div class="shortcut">
                <dash-kbd class="keys" keys="${this.keys}"></dash-kbd>
                <span class="description">${this.description}</span>
            </div>
        `;
    }
}

customElements.define('dash-keyboard-shortcut', DashKeyboardShortcut);
export { DashKeyboardShortcut };
