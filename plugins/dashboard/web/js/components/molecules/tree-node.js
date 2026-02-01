/**
 * TreeNode Molecule - Chevron + icon + label + badge
 * @module components/molecules/tree-node
 */
import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';
import '../atoms/dot.js';

class DashTreeNode extends LitElement {
    static properties = {
        label: { type: String },
        icon: { type: String },
        expanded: { type: Boolean, reflect: true },
        selected: { type: Boolean, reflect: true },
        active: { type: Boolean, reflect: true },
        hasChildren: { type: Boolean, attribute: 'has-children' },
        count: { type: Number },
        depth: { type: Number },
        domainColor: { type: String, attribute: 'domain-color' }
    };

    static styles = css`
        :host {
            display: block;
        }

        .node {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            border-radius: var(--radius-sm, 4px);
            cursor: pointer;
            user-select: none;
            transition: background 0.1s;
        }

        .node:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
        }

        :host([selected]) .node {
            background: var(--accent-bg, rgba(59, 130, 246, 0.1));
        }

        .chevron {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            flex-shrink: 0;
            color: var(--text-muted, #9ca3af);
            transition: transform 0.15s;
        }

        :host([expanded]) .chevron {
            transform: rotate(90deg);
        }

        .chevron-placeholder {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
        }

        .domain-accent {
            width: 3px;
            height: 14px;
            border-radius: 1px;
            flex-shrink: 0;
        }

        .icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            flex-shrink: 0;
            color: var(--text-secondary, #6b7280);
        }

        .label {
            flex: 1;
            min-width: 0;
            font-size: var(--font-size-xs, 11px);
            color: var(--text-primary, #1f2937);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .count {
            flex-shrink: 0;
            padding: 0 4px;
            min-width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 500;
            color: var(--text-muted, #9ca3af);
            background: var(--bg-tertiary, #e5e7eb);
            border-radius: var(--radius-sm, 4px);
        }

        .active-dot {
            flex-shrink: 0;
        }

        .children {
            padding-left: 16px;
        }

        :host(:not([expanded])) .children {
            display: none;
        }
    `;

    constructor() {
        super();
        this.label = '';
        this.icon = '';
        this.expanded = false;
        this.selected = false;
        this.active = false;
        this.hasChildren = false;
        this.count = null;
        this.depth = 0;
        this.domainColor = '';
    }

    render() {
        const indent = this.depth * 16;

        return html`
            <div
                class="node"
                style="padding-left: ${8 + indent}px"
                @click="${this._handleClick}"
                @dblclick="${this._handleDoubleClick}"
            >
                ${this.hasChildren ? html`
                    <span class="chevron" @click="${this._handleToggle}">
                        <dash-icon name="chevron-right" size="12"></dash-icon>
                    </span>
                ` : html`
                    <span class="chevron-placeholder"></span>
                `}

                ${this.domainColor ? html`
                    <span class="domain-accent" style="background: ${this.domainColor}"></span>
                ` : ''}

                ${this.icon ? html`
                    <span class="icon-wrapper">
                        <dash-icon name="${this.icon}" size="14"></dash-icon>
                    </span>
                ` : ''}

                <span class="label">${this.label}</span>

                ${this.active ? html`
                    <dash-dot class="active-dot" status="success" size="xs" pulse></dash-dot>
                ` : ''}

                ${this.count !== null ? html`
                    <span class="count">${this.count}</span>
                ` : ''}
            </div>

            ${this.hasChildren ? html`
                <div class="children">
                    <slot></slot>
                </div>
            ` : ''}
        `;
    }

    _handleClick(e) {
        this.dispatchEvent(new CustomEvent('dash-select', {
            bubbles: true,
            composed: true
        }));
    }

    _handleDoubleClick(e) {
        this.dispatchEvent(new CustomEvent('dash-open', {
            bubbles: true,
            composed: true
        }));
    }

    _handleToggle(e) {
        e.stopPropagation();
        this.expanded = !this.expanded;
        this.dispatchEvent(new CustomEvent('dash-toggle', {
            detail: { expanded: this.expanded },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('dash-tree-node', DashTreeNode);
export { DashTreeNode };
