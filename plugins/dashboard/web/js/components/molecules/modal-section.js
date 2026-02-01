/**
 * Modal Section Molecule - Reusable modal content section
 * @module components/molecules/modal-section
 *
 * Displays a section within a modal with a title and content.
 * Optionally supports collapsible behavior.
 */
import { LitElement, html, css } from 'lit';

class DashModalSection extends LitElement {
    static properties = {
        title: { type: String },
        icon: { type: String },
        collapsible: { type: Boolean },
        expanded: { type: Boolean },
        noPadding: { type: Boolean, attribute: 'no-padding' }
    };

    static styles = css`
        :host {
            display: block;
        }

        .modal-section {
            border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .modal-section:last-child {
            border-bottom: none;
        }

        .section-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);
            background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
        }

        .section-header.collapsible {
            cursor: pointer;
            user-select: none;
            transition: background var(--transition-fast, 150ms ease);
        }

        .section-header.collapsible:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.04));
        }

        .section-icon {
            display: flex;
            align-items: center;
            color: var(--text-muted, #9ca3af);
        }

        .section-title {
            flex: 1;
            font-size: var(--font-size-xs, 11px);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary, #6b7280);
        }

        .expand-icon {
            display: flex;
            align-items: center;
            color: var(--text-muted, #9ca3af);
            transition: transform var(--transition-fast, 150ms ease);
        }

        .expand-icon.collapsed {
            transform: rotate(-90deg);
        }

        .section-content {
            padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);
        }

        .section-content.no-padding {
            padding: 0;
        }

        .section-content.collapsed {
            display: none;
        }
    `;

    constructor() {
        super();
        this.title = '';
        this.icon = '';
        this.collapsible = false;
        this.expanded = true;
        this.noPadding = false;
    }

    _handleToggle() {
        if (!this.collapsible) return;

        this.expanded = !this.expanded;
        this.dispatchEvent(new CustomEvent('dash-toggle', {
            bubbles: true,
            composed: true,
            detail: { expanded: this.expanded }
        }));
    }

    render() {
        const headerClasses = this.collapsible ? 'section-header collapsible' : 'section-header';
        const contentClasses = [
            'section-content',
            this.noPadding ? 'no-padding' : '',
            (!this.expanded && this.collapsible) ? 'collapsed' : ''
        ].filter(Boolean).join(' ');

        return html`
            <div class="modal-section">
                <div
                    class="${headerClasses}"
                    @click="${this._handleToggle}"
                    role="${this.collapsible ? 'button' : 'heading'}"
                    aria-expanded="${this.expanded}"
                >
                    ${this.icon ? html`
                        <span class="section-icon">
                            <dash-icon name="${this.icon}" size="14"></dash-icon>
                        </span>
                    ` : ''}
                    <span class="section-title">${this.title}</span>
                    ${this.collapsible ? html`
                        <span class="expand-icon ${this.expanded ? '' : 'collapsed'}">
                            <dash-icon name="chevron-down" size="14"></dash-icon>
                        </span>
                    ` : ''}
                </div>
                <div class="${contentClasses}">
                    <slot></slot>
                </div>
            </div>
        `;
    }
}

customElements.define('dash-modal-section', DashModalSection);
export { DashModalSection };
