/**
 * Collapsible Section Molecule - Expandable content section with header
 * @module components/molecules/collapsible-section
 */
import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';

class CollapsibleSection extends LitElement {
    static properties = {
        title: { type: String },
        expanded: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true }
    };

    static styles = css`
        :host {
            display: block;
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
        }

        .section {
            border-radius: var(--radius-md, 6px);
            overflow: hidden;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            background: var(--bg-tertiary, #2d2d2d);
            border: none;
            width: 100%;
            cursor: pointer;
            transition: background 0.15s ease;
        }

        .header:hover {
            background: var(--bg-hover, #2a2d2e);
        }

        .header:focus-visible {
            outline: none;
            box-shadow: inset 0 0 0 2px var(--accent-color, #007acc);
        }

        .title {
            font-size: var(--font-size-sm, 12px);
            font-weight: 600;
            color: var(--text-primary, #cccccc);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .chevron {
            color: var(--text-muted, #6e7681);
            transition: transform 0.25s ease;
            flex-shrink: 0;
        }

        :host([expanded]) .chevron {
            transform: rotate(180deg);
        }

        .content-wrapper {
            display: grid;
            grid-template-rows: 0fr;
            transition: grid-template-rows 0.25s ease;
        }

        :host([expanded]) .content-wrapper {
            grid-template-rows: 1fr;
        }

        .content {
            overflow: hidden;
        }

        .content-inner {
            padding: var(--spacing-md, 12px);
            background: var(--bg-secondary, #252526);
            border-top: 1px solid var(--border-color, #3c3c3c);
        }
    `;

    constructor() {
        super();
        this.title = '';
        this.expanded = false;
        this.disabled = false;
    }

    _handleToggle() {
        this.expanded = !this.expanded;
        this.dispatchEvent(new CustomEvent('toggle', {
            detail: { expanded: this.expanded },
            bubbles: true,
            composed: true
        }));
    }

    _handleKeyDown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._handleToggle();
        }
    }

    render() {
        return html`
            <div class="section">
                <button
                    class="header"
                    role="button"
                    aria-expanded="${this.expanded}"
                    ?disabled="${this.disabled}"
                    @click="${this._handleToggle}"
                    @keydown="${this._handleKeyDown}"
                >
                    <span class="title">${this.title}</span>
                    <dash-icon class="chevron" name="chevron-down" size="14"></dash-icon>
                </button>
                <div class="content-wrapper">
                    <div class="content">
                        <div class="content-inner">
                            <slot></slot>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('collapsible-section', CollapsibleSection);
export { CollapsibleSection };
