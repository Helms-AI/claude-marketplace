/**
 * Tree Item Base Component - Shared base for tree items
 * @module components/explorer/tree-item-base
 */

import { LitElement, html, css } from 'lit';

const treeItemBaseStyles = css`
    :host { display: block; }
    .tree-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm, 8px);
        padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
        cursor: pointer;
        border-radius: var(--radius-sm, 4px);
        transition: all 0.15s ease;
        user-select: none;
    }
    .tree-item:hover { background: var(--bg-secondary, #f8f9fa); }
    .expand-icon {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: var(--text-muted, #999);
        transition: transform 0.15s ease;
    }
    .expand-icon.expanded { transform: rotate(90deg); }
    .expand-icon svg { width: 10px; height: 10px; }
    .item-icon {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .item-icon svg { width: 14px; height: 14px; }
    .item-content { flex: 1; min-width: 0; overflow: hidden; }
    .item-name {
        font-size: var(--font-size-sm, 13px);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    /* Domain-colored item names */
    .item-name.domain-architecture { color: var(--domain-architecture, #a78bfa); }
    .item-name.domain-backend { color: var(--domain-backend, #4ade80); }
    .item-name.domain-data { color: var(--domain-data, #60a5fa); }
    .item-name.domain-devops { color: var(--domain-devops, #fb923c); }
    .item-name.domain-documentation { color: var(--domain-documentation, #a3e635); }
    .item-name.domain-frontend { color: var(--domain-frontend, #22d3ee); }
    .item-name.domain-pm { color: var(--domain-pm, #6366f1); }
    .item-name.domain-security { color: var(--domain-security, #f87171); }
    .item-name.domain-testing { color: var(--domain-testing, #facc15); }
    .item-name.domain-user-experience { color: var(--domain-user-experience, #f472b6); }
    .item-name.domain-external { color: var(--text-muted, #999); }
    /* Domain-colored item icons */
    .item-icon.domain-architecture { color: var(--domain-architecture, #a78bfa); }
    .item-icon.domain-backend { color: var(--domain-backend, #4ade80); }
    .item-icon.domain-data { color: var(--domain-data, #60a5fa); }
    .item-icon.domain-devops { color: var(--domain-devops, #fb923c); }
    .item-icon.domain-documentation { color: var(--domain-documentation, #a3e635); }
    .item-icon.domain-frontend { color: var(--domain-frontend, #22d3ee); }
    .item-icon.domain-pm { color: var(--domain-pm, #6366f1); }
    .item-icon.domain-security { color: var(--domain-security, #f87171); }
    .item-icon.domain-testing { color: var(--domain-testing, #facc15); }
    .item-icon.domain-user-experience { color: var(--domain-user-experience, #f472b6); }
    .item-icon.domain-external { color: var(--text-muted, #999); }
    .item-description {
        font-size: var(--font-size-xs, 11px);
        color: var(--text-muted, #999);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .item-badge {
        padding: 1px 6px;
        font-size: 10px;
        font-weight: 500;
        border-radius: 10px;
        background: var(--bg-tertiary, #e9ecef);
        color: var(--text-secondary, #666);
        flex-shrink: 0;
    }
    .item-badge.domain { background: var(--accent-bg, #e7f3ff); color: var(--accent-color, #4a90d9); }
    .children { margin-left: var(--spacing-lg, 24px); }
    :host([indent="1"]) .tree-item { padding-left: var(--spacing-lg, 24px); }
    :host([indent="2"]) .tree-item { padding-left: calc(var(--spacing-lg, 24px) * 2); }
`;

class TreeItemBase extends LitElement {
    static properties = {
        name: { type: String },
        description: { type: String },
        selected: { type: Boolean, reflect: true },
        expanded: { type: Boolean, reflect: true },
        hasChildren: { type: Boolean, attribute: 'has-children' },
        indent: { type: Number, reflect: true }
    };

    static styles = [treeItemBaseStyles];

    constructor() {
        super();
        this.name = '';
        this.description = '';
        this.selected = false;
        this.expanded = false;
        this.hasChildren = false;
        this.indent = 0;
    }

    _handleClick(e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('item-select', { detail: { item: this }, bubbles: true, composed: true }));
    }

    _handleExpand(e) {
        e.stopPropagation();
        this.expanded = !this.expanded;
        this.dispatchEvent(new CustomEvent('item-expand', { detail: { expanded: this.expanded }, bubbles: true, composed: true }));
    }

    _handleDoubleClick(e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('item-open', { detail: { item: this }, bubbles: true, composed: true }));
    }

    _renderExpandIcon() {
        if (!this.hasChildren) return html`<span class="expand-icon"></span>`;
        return html`<span class="expand-icon ${this.expanded ? 'expanded' : ''}" @click=${this._handleExpand}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></span>`;
    }

    _renderIcon() { return html`<span class="item-icon"></span>`; }
    _renderBadge() { return ''; }

    render() {
        return html`
            <div class="tree-item ${this.selected ? 'selected' : ''}" @click=${this._handleClick} @dblclick=${this._handleDoubleClick}>
                ${this._renderExpandIcon()}
                ${this._renderIcon()}
                <div class="item-content">
                    <div class="item-name">${this.name}</div>
                    ${this.description ? html`<div class="item-description">${this.description}</div>` : ''}
                </div>
                ${this._renderBadge()}
            </div>
            ${this.expanded && this.hasChildren ? html`<div class="children"><slot></slot></div>` : ''}
        `;
    }
}

export { TreeItemBase, treeItemBaseStyles };
