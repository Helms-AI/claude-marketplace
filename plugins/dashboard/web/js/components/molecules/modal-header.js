/**
 * ModalHeader Molecule - Title + close button
 * @module components/molecules/modal-header
 */
import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';

class DashModalHeader extends LitElement {
    static properties = {
        title: { type: String },
        subtitle: { type: String },
        icon: { type: String },
        closable: { type: Boolean }
    };

    static styles = css`
        :host {
            display: block;
        }

        .header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--spacing-md, 12px);
            padding: var(--spacing-lg, 16px);
            border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .title-section {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            flex: 1;
            min-width: 0;
        }

        .icon {
            flex-shrink: 0;
            color: var(--text-secondary, #6b7280);
        }

        .text {
            flex: 1;
            min-width: 0;
        }

        .title {
            margin: 0;
            font-size: var(--font-size-lg, 16px);
            font-weight: 600;
            color: var(--text-primary, #1f2937);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .subtitle {
            margin: var(--spacing-xs, 4px) 0 0;
            font-size: var(--font-size-sm, 12px);
            color: var(--text-secondary, #6b7280);
        }

        .close-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border: none;
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            color: var(--text-muted, #9ca3af);
            cursor: pointer;
            transition: all 0.15s;
            flex-shrink: 0;
        }

        .close-btn:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
            color: var(--text-primary, #1f2937);
        }
    `;

    constructor() {
        super();
        this.title = '';
        this.subtitle = '';
        this.icon = '';
        this.closable = true;
    }

    render() {
        return html`
            <div class="header">
                <div class="title-section">
                    ${this.icon ? html`
                        <dash-icon class="icon" name="${this.icon}" size="20"></dash-icon>
                    ` : ''}
                    <div class="text">
                        <h2 class="title">${this.title}</h2>
                        ${this.subtitle ? html`
                            <p class="subtitle">${this.subtitle}</p>
                        ` : ''}
                    </div>
                </div>
                ${this.closable ? html`
                    <button class="close-btn" @click="${this._handleClose}" title="Close">
                        <dash-icon name="x" size="18"></dash-icon>
                    </button>
                ` : ''}
            </div>
        `;
    }

    _handleClose() {
        this.dispatchEvent(new CustomEvent('dash-close', {
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('dash-modal-header', DashModalHeader);
export { DashModalHeader };
