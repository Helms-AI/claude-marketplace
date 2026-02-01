/**
 * Skill Tree Component - Store-connected tree view of skills grouped by domain
 * @module components/explorer/skill-tree
 */

import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions, filteredSkills, skillsByDomain } from '../../store/app-state.js';
import { SkillService } from '../../services/skill-service.js';
import './skill-item.js';

class SkillTree extends SignalWatcher(LitElement) {
    static properties = {
        // Props can still be passed for flexibility, but store is primary source
        skills: { type: Array },
        selectedId: { type: String, attribute: 'selected-id' },
        filter: { type: String },
        groupByDomain: { type: Boolean, attribute: 'group-by-domain' },
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
        .empty-icon { width: 48px; height: 48px; margin-bottom: var(--spacing-sm, 8px); opacity: 0.3; }
        .empty-icon svg { width: 100%; height: 100%; }
        .empty-title { font-size: var(--font-size-sm, 13px); font-weight: 500; color: var(--text-secondary, #666); margin-bottom: var(--spacing-xs, 4px); }
        .empty-text { font-size: var(--font-size-xs, 11px); }
        .loading-state { display: flex; align-items: center; justify-content: center; padding: var(--spacing-lg, 24px); }
        .loading-spinner { width: 24px; height: 24px; border: 2px solid var(--border-color, #e0e0e0); border-top-color: var(--accent-color, #4a90d9); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .group-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            cursor: pointer;
            border-radius: var(--radius-sm, 4px);
            transition: background 0.15s ease;
        }
        .group-header:hover { background: var(--bg-secondary, #f8f9fa); }
        .expand-icon {
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted, #999);
            transition: transform 0.15s ease;
        }
        .expand-icon.expanded { transform: rotate(90deg); }
        .expand-icon svg { width: 10px; height: 10px; }
        .group-icon { width: 16px; height: 16px; color: var(--success-color, #28a745); }
        .group-icon svg { width: 14px; height: 14px; }
        .group-name { flex: 1; font-size: var(--font-size-sm, 13px); font-weight: 500; color: var(--text-primary, #333); text-transform: capitalize; }
        /* Domain-colored group names and icons */
        .group-name.domain-architecture, .group-icon.domain-architecture { color: var(--domain-architecture, #a78bfa); }
        .group-name.domain-backend, .group-icon.domain-backend { color: var(--domain-backend, #4ade80); }
        .group-name.domain-data, .group-icon.domain-data { color: var(--domain-data, #60a5fa); }
        .group-name.domain-devops, .group-icon.domain-devops { color: var(--domain-devops, #fb923c); }
        .group-name.domain-documentation, .group-icon.domain-documentation { color: var(--domain-documentation, #a3e635); }
        .group-name.domain-frontend, .group-icon.domain-frontend { color: var(--domain-frontend, #22d3ee); }
        .group-name.domain-pm, .group-icon.domain-pm { color: var(--domain-pm, #6366f1); }
        .group-name.domain-security, .group-icon.domain-security { color: var(--domain-security, #f87171); }
        .group-name.domain-testing, .group-icon.domain-testing { color: var(--domain-testing, #facc15); }
        .group-name.domain-user-experience, .group-icon.domain-user-experience { color: var(--domain-user-experience, #f472b6); }
        .group-name.domain-external, .group-icon.domain-external { color: var(--text-muted, #999); }
        .group-count { font-size: var(--font-size-xs, 11px); color: var(--text-muted, #999); padding: 1px 6px; background: var(--bg-tertiary, #e9ecef); border-radius: 10px; }
        .group-items { margin-left: var(--spacing-md, 12px); }
    `;

    constructor() {
        super();
        this.skills = [];
        this.selectedId = null;
        this.filter = '';
        this.groupByDomain = true;
        this.loading = false;
        this.useStore = true; // Default to store-connected mode
        this._localExpandedGroups = {};
    }

    connectedCallback() {
        super.connectedCallback();

        if (this.useStore) {
            // Watch store signals for reactive updates
            this.watchSignals([
                AppStore.skills,
                AppStore.loadingSkills,
                AppStore.skillFilter,
                AppStore.selectedSkill,
                AppStore.skillExpandedGroups
            ]);

            // Load skills if store is empty
            if (AppStore.skills.value.length === 0 && !AppStore.loadingSkills.value) {
                SkillService.fetchSkills();
            }
        }
    }

    // Get skills from store or props
    _getSkills() {
        if (!this.useStore) {
            return this.skills;
        }
        // Use store's filtered skills if filter is active
        return AppStore.skillFilter.value
            ? filteredSkills.value
            : AppStore.skills.value;
    }

    // Get selected ID from store or props
    _getSelectedId() {
        if (!this.useStore) {
            return this.selectedId;
        }
        const selected = AppStore.selectedSkill.value;
        return selected?.id || selected?.name || null;
    }

    // Check loading state
    _isLoading() {
        if (!this.useStore) {
            return this.loading;
        }
        return AppStore.loadingSkills.value;
    }

    // Get current filter
    _getFilter() {
        if (!this.useStore) {
            return this.filter;
        }
        return AppStore.skillFilter.value;
    }

    // Filter skills (for prop mode)
    _getFilteredSkills() {
        const skills = this._getSkills();
        const filter = this._getFilter();

        if (!filter) return skills;

        const lowerFilter = filter.toLowerCase();
        return skills.filter(skill => {
            const name = (skill.name || '').toLowerCase();
            const description = (skill.description || '').toLowerCase();
            const domain = (skill.domain || skill.plugin || '').toLowerCase();
            return name.includes(lowerFilter) || description.includes(lowerFilter) || domain.includes(lowerFilter);
        });
    }

    // Group skills by domain
    _groupSkills(skills) {
        // If using store and no filter, use computed value for efficiency
        if (this.useStore && !this._getFilter()) {
            return skillsByDomain.value;
        }

        // Manual grouping for filtered or prop-based data
        const groups = {};
        skills.forEach(skill => {
            const group = skill.domain || skill.plugin || 'Other';
            if (!groups[group]) groups[group] = [];
            groups[group].push(skill);
        });
        return Object.entries(groups).sort(([a], [b]) =>
            a === 'external' ? 1 : b === 'external' ? -1 : a.localeCompare(b)
        );
    }

    // Toggle group expansion
    _toggleGroup(groupName) {
        if (this.useStore) {
            Actions.toggleSkillGroup(groupName);
        } else {
            this._localExpandedGroups = {
                ...this._localExpandedGroups,
                [groupName]: !this._isGroupExpanded(groupName)
            };
            this.requestUpdate();
        }
    }

    // Check if group is expanded
    _isGroupExpanded(groupName) {
        if (this.useStore) {
            return AppStore.skillExpandedGroups.value[groupName] !== false;
        }
        return this._localExpandedGroups[groupName] !== false;
    }

    // Handle skill selection
    _handleSkillSelect(e) {
        const skill = e.detail.skill;

        if (this.useStore) {
            Actions.setSelectedSkill(skill);
        } else {
            this.selectedId = skill?.id || skill?.name;
        }

        // Always dispatch event for parent components
        this.dispatchEvent(new CustomEvent('skill-select', {
            detail: { skill },
            bubbles: true,
            composed: true
        }));
    }

    _handleSkillOpen(e) {
        this.dispatchEvent(new CustomEvent('skill-open', { detail: e.detail, bubbles: true, composed: true }));
    }

    _renderEmpty() {
        const filter = this._getFilter();
        return html`
            <div class="empty-state">
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                </div>
                <div class="empty-title">No skills found</div>
                <div class="empty-text">${filter ? 'Try a different search term' : 'Skills will appear here'}</div>
            </div>
        `;
    }

    _renderGroup(groupName, skills) {
        const isExpanded = this._isGroupExpanded(groupName);
        const selectedId = this._getSelectedId();
        const domainClass = `domain-${groupName}`;

        return html`
            <div class="group">
                <div class="group-header" @click=${() => this._toggleGroup(groupName)}>
                    <span class="expand-icon ${isExpanded ? 'expanded' : ''}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </span>
                    <span class="group-icon ${domainClass}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                            <polyline points="2 17 12 22 22 17"></polyline>
                            <polyline points="2 12 12 17 22 12"></polyline>
                        </svg>
                    </span>
                    <span class="group-name ${domainClass}">${groupName}</span>
                    <span class="group-count">${skills.length}</span>
                </div>
                ${isExpanded ? html`
                    <div class="group-items">
                        ${repeat(skills, s => s.id || s.name, s => html`
                            <skill-item
                                .skill=${s}
                                ?selected=${(s.id || s.name) === selectedId}
                                @skill-select=${this._handleSkillSelect}
                                @skill-open=${this._handleSkillOpen}
                            ></skill-item>
                        `)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    render() {
        if (this._isLoading()) {
            return html`<div class="loading-state"><div class="loading-spinner"></div></div>`;
        }

        const filtered = this._getFilteredSkills();
        if (!filtered.length) return this._renderEmpty();

        const selectedId = this._getSelectedId();

        if (this.groupByDomain) {
            const groups = this._groupSkills(filtered);
            return html`<div class="tree-container">${groups.map(([name, skills]) => this._renderGroup(name, skills))}</div>`;
        }

        return html`
            <div class="tree-container">
                ${repeat(filtered, s => s.id || s.name, s => html`
                    <skill-item
                        .skill=${s}
                        ?selected=${(s.id || s.name) === selectedId}
                        @skill-select=${this._handleSkillSelect}
                        @skill-open=${this._handleSkillOpen}
                    ></skill-item>
                `)}
            </div>
        `;
    }
}

customElements.define('skill-tree', SkillTree);
export { SkillTree };
