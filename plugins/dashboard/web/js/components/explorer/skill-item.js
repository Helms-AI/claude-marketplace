/**
 * Skill Item Component - Displays a single skill in tree
 * @module components/explorer/skill-item
 */

import { LitElement, html, css } from 'lit';
import { treeItemBaseStyles } from './tree-item-base.js';

class SkillItem extends LitElement {
    static properties = {
        skill: { type: Object },
        selected: { type: Boolean, reflect: true }
    };

    static styles = [treeItemBaseStyles, css`
        .item-icon.skill { color: var(--success-color, #28a745); }
        .item-icon.orchestrator { color: var(--warning-color, #ffc107); }
        .skill-name { font-family: var(--font-mono, 'IBM Plex Mono', monospace); }
    `];

    constructor() {
        super();
        this.skill = null;
        this.selected = false;
    }

    _getDomainClass() {
        const domain = this.skill?.domain || this.skill?.plugin || '';
        return domain ? `domain-${domain}` : '';
    }

    _handleClick(e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('skill-select', { detail: { skill: this.skill }, bubbles: true, composed: true }));
    }

    _handleDoubleClick(e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('skill-open', { detail: { skill: this.skill }, bubbles: true, composed: true }));
    }

    _isOrchestrator() {
        const name = (this.skill?.name || '').toLowerCase();
        return name.includes('orchestrator');
    }

    render() {
        if (!this.skill) return '';
        const { name, description } = this.skill;
        const domainClass = this._getDomainClass();

        return html`
            <div class="tree-item ${this.selected ? 'selected' : ''}" @click=${this._handleClick} @dblclick=${this._handleDoubleClick}>
                <span class="expand-icon"></span>
                <span class="item-icon ${this._isOrchestrator() ? 'orchestrator' : 'skill'} ${domainClass}">
                    ${this._isOrchestrator() ? html`
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
                        </svg>
                    ` : html`
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                            <polyline points="2 17 12 22 22 17"></polyline>
                            <polyline points="2 12 12 17 22 12"></polyline>
                        </svg>
                    `}
                </span>
                <div class="item-content">
                    <div class="item-name skill-name ${domainClass}">/${name}</div>
                    ${description ? html`<div class="item-description">${description}</div>` : ''}
                </div>
            </div>
        `;
    }
}

customElements.define('skill-item', SkillItem);
export { SkillItem };
