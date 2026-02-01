/**
 * Detail Section Molecule - Section for detail views
 * @module components/molecules/detail-section
 *
 * Displays a section in a detail view (agent/skill detail tabs)
 * with a title header and content slot.
 */
import { LitElement, html, css } from 'lit';

class DashDetailSection extends LitElement {
    static properties = {
        title: { type: String },
        icon: { type: String },
        collapsible: { type: Boolean },
        expanded: { type: Boolean }
    };

    static styles = css`
        :host {
            display: block;
            margin-bottom: var(--spacing-lg, 16px);
        }

        :host(:last-child) {
            margin-bottom: 0;
        }

        .detail-section {
            background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
            border-radius: var(--radius-md, 6px);
            border: 1px solid var(--border-color, #e5e7eb);
            overflow: hidden;
        }

        .section-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            background: var(--bg-tertiary, rgba(0, 0, 0, 0.04));
            border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .section-header.collapsible {
            cursor: pointer;
            user-select: none;
            transition: background var(--transition-fast, 150ms ease);
        }

        .section-header.collapsible:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.06));
        }

        .section-icon {
            display: flex;
            align-items: center;
            color: var(--text-muted, #9ca3af);
        }

        .section-title {
            flex: 1;
            font-size: var(--font-size-sm, 12px);
            font-weight: 600;
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
            padding: var(--spacing-md, 12px);
        }

        .section-content.collapsed {
            display: none;
        }

        /* Slot styling */
        ::slotted(p) {
            margin: 0;
            font-size: var(--font-size-sm, 12px);
            color: var(--text-primary, #1f2937);
            line-height: 1.6;
        }

        ::slotted(.detail-muted) {
            color: var(--text-muted, #9ca3af);
            font-style: italic;
        }

        ::slotted(.detail-stat) {
            font-size: var(--font-size-xl, 16px);
            font-weight: 600;
            color: var(--accent-color, #3b82f6);
        }
    `;

    constructor() {
        super();
        this.title = '';
        this.icon = '';
        this.collapsible = false;
        this.expanded = true;
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
        const contentClasses = (!this.expanded && this.collapsible) ? 'section-content collapsed' : 'section-content';

        return html`
            <div class="detail-section">
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

customElements.define('dash-detail-section', DashDetailSection);
export { DashDetailSection };
