/**
 * Changeset Tree Component - Store-connected tree view of changesets
 * @module components/explorer/changeset-tree
 */

import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions, filteredChangesets, activeChangesets, completedChangesets } from '../../store/app-state.js';
import { ChangesetService } from '../../services/changeset-service.js';
import './changeset-item.js';

class ChangesetTree extends SignalWatcher(LitElement) {
    static properties = {
        // Props can still be passed for flexibility, but store is primary source
        changesets: { type: Array },
        selectedId: { type: String, attribute: 'selected-id' },
        filter: { type: String },
        loading: { type: Boolean, reflect: true },
        useStore: { type: Boolean, attribute: 'use-store' }
    };

    static styles = css`
        :host { display: block; height: 100%; overflow-y: auto; }
        .tree-container { padding: var(--spacing-xs, 4px); }
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xl, 32px) var(--spacing-md, 12px);
            text-align: center;
            color: var(--text-muted, #999);
        }
        .empty-icon {
            width: 48px;
            height: 48px;
            margin-bottom: var(--spacing-sm, 8px);
            opacity: 0.3;
        }
        .empty-icon svg { width: 100%; height: 100%; }
        .empty-title { font-size: var(--font-size-sm, 13px); font-weight: 500; color: var(--text-secondary, #666); margin-bottom: var(--spacing-xs, 4px); }
        .empty-text { font-size: var(--font-size-xs, 11px); }
        .loading-state {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-lg, 24px);
        }
        .loading-spinner {
            width: 24px;
            height: 24px;
            border: 2px solid var(--border-color, #e0e0e0);
            border-top-color: var(--accent-color, #4a90d9);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .group-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            font-size: var(--font-size-xs, 11px);
            font-weight: 600;
            color: var(--text-muted, #999);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: var(--spacing-sm, 8px);
        }
        .group-header:first-child { margin-top: 0; }
        .group-count { opacity: 0.7; }
    `;

    constructor() {
        super();
        this.changesets = [];
        this.selectedId = null;
        this.filter = '';
        this.loading = false;
        this.useStore = true; // Default to store-connected mode
    }

    connectedCallback() {
        super.connectedCallback();

        if (this.useStore) {
            // Watch store signals for reactive updates
            this.watchSignals([
                AppStore.changesets,
                AppStore.loadingChangesets,
                AppStore.changesetFilter,
                AppStore.selectedChangeset,
                AppStore.changesetExpandedItems
            ]);

            // Load changesets if store is empty
            if (AppStore.changesets.value.length === 0 && !AppStore.loadingChangesets.value) {
                ChangesetService.fetchChangesets();
            }
        }
    }

    // Get changesets from store or props
    _getChangesets() {
        if (!this.useStore) {
            return this.changesets;
        }
        // Use store's filtered changesets if filter is active
        return AppStore.changesetFilter.value
            ? filteredChangesets.value
            : AppStore.changesets.value;
    }

    // Get selected ID from store or props
    _getSelectedId() {
        if (!this.useStore) {
            return this.selectedId;
        }
        return AppStore.selectedChangeset.value?.id || null;
    }

    // Check loading state
    _isLoading() {
        if (!this.useStore) {
            return this.loading;
        }
        return AppStore.loadingChangesets.value;
    }

    // Get current filter
    _getFilter() {
        if (!this.useStore) {
            return this.filter;
        }
        return AppStore.changesetFilter.value;
    }

    // Filter changesets (for prop mode)
    _getFilteredChangesets() {
        const changesets = this._getChangesets();
        const filter = this._getFilter();

        if (!filter) return changesets;

        const lowerFilter = filter.toLowerCase();
        return changesets.filter(cs => {
            const name = (cs.name || cs.task || cs.id || '').toLowerCase();
            return name.includes(lowerFilter);
        });
    }

    // Group changesets into active and recent
    _groupChangesets(changesets) {
        // If using store, use computed values for efficiency
        if (this.useStore && !this._getFilter()) {
            return {
                active: activeChangesets.value,
                recent: completedChangesets.value
            };
        }

        // Manual grouping for filtered or prop-based data
        const active = changesets.filter(cs => cs.status === 'active' || cs.phase === 'active');
        const recent = changesets.filter(cs => cs.status !== 'active' && cs.phase !== 'active');
        return { active, recent };
    }

    // Handle changeset selection
    _handleChangesetSelect(e) {
        const changeset = e.detail.changeset;

        if (this.useStore) {
            ChangesetService.select(changeset, { loadConversation: true, watch: true });
        } else {
            this.selectedId = changeset?.id;
        }

        // Always dispatch event for parent components
        this.dispatchEvent(new CustomEvent('changeset-select', {
            detail: { changeset },
            bubbles: true,
            composed: true
        }));
    }

    _handleChangesetOpen(e) {
        this.dispatchEvent(new CustomEvent('changeset-open', { detail: e.detail, bubbles: true, composed: true }));
    }

    _handleArtifactOpen(e) {
        this.dispatchEvent(new CustomEvent('artifact-open', { detail: e.detail, bubbles: true, composed: true }));
    }

    _renderEmpty() {
        const filter = this._getFilter();
        return html`
            <div class="empty-state">
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="18" cy="18" r="3"></circle>
                        <circle cx="6" cy="6" r="3"></circle>
                        <path d="M6 21V9a9 9 0 0 0 9 9"></path>
                    </svg>
                </div>
                <div class="empty-title">No changesets</div>
                <div class="empty-text">${filter ? 'Try a different search term' : 'Active changesets will appear here'}</div>
            </div>
        `;
    }

    _renderGroup(title, changesets) {
        if (!changesets.length) return '';
        const selectedId = this._getSelectedId();

        return html`
            <div class="group-header">
                <span>${title}</span>
                <span class="group-count">(${changesets.length})</span>
            </div>
            ${repeat(changesets, cs => cs.id, cs => html`
                <changeset-item
                    .changeset=${cs}
                    ?selected=${selectedId === cs.id}
                    @changeset-select=${this._handleChangesetSelect}
                    @changeset-open=${this._handleChangesetOpen}
                    @artifact-open=${this._handleArtifactOpen}
                ></changeset-item>
            `)}
        `;
    }

    render() {
        if (this._isLoading()) {
            return html`<div class="loading-state"><div class="loading-spinner"></div></div>`;
        }

        const filtered = this._getFilteredChangesets();
        if (!filtered.length) return this._renderEmpty();

        const { active, recent } = this._groupChangesets(filtered);
        return html`
            <div class="tree-container">
                ${this._renderGroup('Active', active)}
                ${this._renderGroup('Recent', recent)}
            </div>
        `;
    }
}

customElements.define('changeset-tree', ChangesetTree);
export { ChangesetTree };
