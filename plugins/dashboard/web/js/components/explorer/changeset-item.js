/**
 * Changeset Item Component - Displays a single changeset in tree
 * @module components/explorer/changeset-item
 */

import { LitElement, html, css } from 'lit';
import { treeItemBaseStyles } from './tree-item-base.js';
import '../common/changeset-name.js';

class ChangesetItem extends LitElement {
    static properties = {
        changeset: { type: Object },
        selected: { type: Boolean, reflect: true },
        expanded: { type: Boolean, reflect: true }
    };

    static styles = [treeItemBaseStyles, css`
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        .status-dot.active { background: var(--success-color, #28a745); animation: pulse 2s infinite; }
        .status-dot.completed { background: var(--accent-color, #4a90d9); }
        .status-dot.pending { background: var(--warning-color, #ffc107); }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .item-icon.changeset { color: var(--warning-color, #ffc107); }
        .artifact-item { padding-left: var(--spacing-lg, 24px); }
        .artifact-icon { color: var(--text-muted, #999); }
        .handoff-count {
            font-size: 10px;
            padding: 1px 5px;
            border-radius: 10px;
            background: var(--bg-tertiary, #e9ecef);
            color: var(--text-muted, #999);
        }
    `];

    constructor() {
        super();
        this.changeset = null;
        this.selected = false;
        this.expanded = false;
    }

    _handleClick(e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('changeset-select', { detail: { changeset: this.changeset }, bubbles: true, composed: true }));
    }

    _handleExpand(e) {
        e.stopPropagation();
        this.expanded = !this.expanded;
    }

    _handleDoubleClick(e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('changeset-open', { detail: { changeset: this.changeset }, bubbles: true, composed: true }));
    }

    _handleArtifactClick(artifact, e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('artifact-open', { detail: { changeset: this.changeset, artifact }, bubbles: true, composed: true }));
    }

    _getStatusClass() {
        if (!this.changeset) return '';
        if (this.changeset.status === 'active') return 'active';
        if (this.changeset.status === 'completed') return 'completed';
        return 'pending';
    }

    _formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    render() {
        if (!this.changeset) return '';
        const { id, name, task, artifacts, handoffs } = this.changeset;
        const hasArtifacts = artifacts?.length > 0;
        const rawName = name || task || id;

        return html`
            <div class="tree-item ${this.selected ? 'selected' : ''}" @click=${this._handleClick} @dblclick=${this._handleDoubleClick}>
                <span class="expand-icon ${this.expanded ? 'expanded' : ''}" @click=${this._handleExpand}>
                    ${hasArtifacts ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>` : ''}
                </span>
                <span class="item-icon changeset">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="18" cy="18" r="3"></circle>
                        <circle cx="6" cy="6" r="3"></circle>
                        <path d="M6 21V9a9 9 0 0 0 9 9"></path>
                    </svg>
                </span>
                <div class="item-content">
                    <changeset-name class="item-name" .name=${rawName}></changeset-name>
                </div>
                ${handoffs?.length ? html`<span class="handoff-count">${handoffs.length}</span>` : ''}
            </div>
            ${this.expanded && hasArtifacts ? html`
                <div class="children">
                    ${artifacts.map(artifact => html`
                        <div class="tree-item artifact-item" @click=${(e) => this._handleArtifactClick(artifact, e)}>
                            <span class="expand-icon"></span>
                            <span class="item-icon artifact-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                            </span>
                            <div class="item-content">
                                <div class="item-name">${artifact.name || artifact}</div>
                            </div>
                        </div>
                    `)}
                </div>
            ` : ''}
        `;
    }
}

customElements.define('changeset-item', ChangesetItem);
export { ChangesetItem };
