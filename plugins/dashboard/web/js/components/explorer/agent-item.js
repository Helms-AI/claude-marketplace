/**
 * Agent Item Component - Displays a single agent in tree
 * @module components/explorer/agent-item
 */

import { LitElement, html, css } from 'lit';
import { treeItemBaseStyles } from './tree-item-base.js';

class AgentItem extends LitElement {
    static properties = {
        agent: { type: Object },
        selected: { type: Boolean, reflect: true }
    };

    static styles = [treeItemBaseStyles, css`
        .item-icon.agent { color: var(--accent-color, #4a90d9); }
    `];

    constructor() {
        super();
        this.agent = null;
        this.selected = false;
    }

    _getDomainClass() {
        const domain = this.agent?.domain || this.agent?.plugin || '';
        return domain ? `domain-${domain}` : '';
    }

    _handleClick(e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('agent-select', { detail: { agent: this.agent }, bubbles: true, composed: true }));
    }

    _handleDoubleClick(e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('agent-open', { detail: { agent: this.agent }, bubbles: true, composed: true }));
    }

    render() {
        if (!this.agent) return '';
        const { name, role } = this.agent;
        const domainClass = this._getDomainClass();

        return html`
            <div class="tree-item ${this.selected ? 'selected' : ''}" @click=${this._handleClick} @dblclick=${this._handleDoubleClick}>
                <span class="expand-icon"></span>
                <span class="item-icon agent ${domainClass}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </span>
                <div class="item-content">
                    <div class="item-name ${domainClass}">${name}</div>
                    ${role ? html`<div class="item-description">${role}</div>` : ''}
                </div>
            </div>
        `;
    }
}

customElements.define('agent-item', AgentItem);
export { AgentItem };
