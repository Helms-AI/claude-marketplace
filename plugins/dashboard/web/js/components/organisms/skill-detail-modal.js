/**
 * Skill Detail Modal Organism
 * @module components/organisms/skill-detail-modal
 *
 * Displays detailed information about a skill in a modal.
 * Includes backing agent link, handoff flow visualization,
 * stats, and invocation history.
 */
import { LitElement, html, css } from 'lit';
import { formatRelativeTime } from '../../services/formatters.js';
import '../atoms/avatar.js';
import '../atoms/tag.js';
import '../atoms/empty-state.js';
import '../molecules/modal-identity.js';
import '../molecules/modal-section.js';
import '../molecules/tag-list.js';
import '../molecules/activity-list.js';

class SkillDetailModal extends LitElement {
    static properties = {
        skill: { type: Object },
        invocations: { type: Array },
        backingAgent: { type: Object },   // Optional resolved agent object
        loading: { type: Boolean },
        open: { type: Boolean, reflect: true }
    };

    static styles = css`
        :host {
            display: block;
        }

        .modal-container {
            background: var(--bg-primary, #ffffff);
            border-radius: var(--radius-lg, 8px);
            overflow: hidden;
            max-width: 520px;
            width: 100%;
            box-shadow: var(--shadow-lg);
        }

        /* Domain accent bar */
        .domain-accent {
            height: 4px;
            background: var(--accent-color);
        }

        .domain-accent.domain-pm { background: var(--domain-pm, #6366f1); }
        .domain-accent.domain-user-experience { background: var(--domain-user-experience, #f472b6); }
        .domain-accent.domain-frontend { background: var(--domain-frontend, #22d3ee); }
        .domain-accent.domain-architecture { background: var(--domain-architecture, #a78bfa); }
        .domain-accent.domain-backend { background: var(--domain-backend, #4ade80); }
        .domain-accent.domain-testing { background: var(--domain-testing, #facc15); }
        .domain-accent.domain-devops { background: var(--domain-devops, #fb923c); }
        .domain-accent.domain-data { background: var(--domain-data, #60a5fa); }
        .domain-accent.domain-security { background: var(--domain-security, #f87171); }
        .domain-accent.domain-documentation { background: var(--domain-documentation, #a3e635); }

        .modal-body {
            max-height: 70vh;
            overflow-y: auto;
        }

        /* Backing agent card */
        .agent-link {
            display: flex;
            align-items: center;
            gap: var(--spacing-md, 12px);
            padding: var(--spacing-md, 12px);
            background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
            border-radius: var(--radius-md, 6px);
            cursor: pointer;
            transition: all var(--transition-fast, 150ms ease);
            border: 1px solid transparent;
        }

        .agent-link:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.04));
            border-color: var(--border-color, #e5e7eb);
        }

        .agent-link:focus {
            outline: 2px solid var(--accent-color);
            outline-offset: 2px;
        }

        .agent-link-info {
            flex: 1;
            min-width: 0;
        }

        .agent-link-name {
            font-size: var(--font-size-sm, 12px);
            font-weight: 600;
            color: var(--text-primary, #1f2937);
        }

        .agent-link-role {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #9ca3af);
        }

        .agent-link-arrow {
            color: var(--text-muted, #9ca3af);
            font-size: 16px;
        }

        /* Handoff flow */
        .handoff-flow {
            display: flex;
            align-items: stretch;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-sm, 8px) 0;
        }

        .handoff-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs, 4px);
        }

        .handoff-label {
            font-size: var(--font-size-xs, 11px);
            font-weight: 600;
            color: var(--text-muted, #9ca3af);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: var(--spacing-xs, 4px);
        }

        .handoff-node {
            display: inline-flex;
            align-items: center;
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: var(--radius-sm, 4px);
            font-size: var(--font-size-xs, 11px);
            font-family: var(--font-mono);
            color: var(--text-secondary, #6b7280);
            cursor: pointer;
            transition: all var(--transition-fast, 150ms ease);
        }

        .handoff-node:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.04));
            border-color: var(--accent-color);
            color: var(--accent-color);
        }

        .handoff-node:focus {
            outline: 2px solid var(--accent-color);
            outline-offset: 2px;
        }

        .handoff-node.current {
            background: var(--accent-color);
            border-color: var(--accent-color);
            color: white;
            cursor: default;
            font-weight: 600;
        }

        .handoff-node.current.domain-pm { background: var(--domain-pm); border-color: var(--domain-pm); }
        .handoff-node.current.domain-user-experience { background: var(--domain-user-experience); border-color: var(--domain-user-experience); }
        .handoff-node.current.domain-frontend { background: var(--domain-frontend); border-color: var(--domain-frontend); color: #1e1e1e; }
        .handoff-node.current.domain-architecture { background: var(--domain-architecture); border-color: var(--domain-architecture); }
        .handoff-node.current.domain-backend { background: var(--domain-backend); border-color: var(--domain-backend); color: #1e1e1e; }
        .handoff-node.current.domain-testing { background: var(--domain-testing); border-color: var(--domain-testing); color: #1e1e1e; }
        .handoff-node.current.domain-devops { background: var(--domain-devops); border-color: var(--domain-devops); }
        .handoff-node.current.domain-data { background: var(--domain-data); border-color: var(--domain-data); }
        .handoff-node.current.domain-security { background: var(--domain-security); border-color: var(--domain-security); }
        .handoff-node.current.domain-documentation { background: var(--domain-documentation); border-color: var(--domain-documentation); color: #1e1e1e; }

        /* Stats grid */
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--spacing-md, 12px);
        }

        .stat-card {
            padding: var(--spacing-md, 12px);
            background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
            border-radius: var(--radius-md, 6px);
            text-align: center;
        }

        .stat-value {
            font-size: var(--font-size-xl, 16px);
            font-weight: 600;
            color: var(--accent-color, #3b82f6);
        }

        .stat-label {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #9ca3af);
            margin-top: var(--spacing-xs, 4px);
        }

        /* Loading state */
        .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xl, 24px);
        }
    `;

    constructor() {
        super();
        this.skill = null;
        this.invocations = [];
        this.backingAgent = null;
        this.loading = false;
        this.open = false;
    }

    _getDomainClass() {
        return this.skill?.domain ? `domain-${this.skill.domain}` : '';
    }

    _getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    _handleAgentClick() {
        if (!this.skill?.backing_agent) return;

        this.dispatchEvent(new CustomEvent('agent-click', {
            bubbles: true,
            composed: true,
            detail: { agentName: this.skill.backing_agent }
        }));
    }

    _handleSkillClick(skillId) {
        this.dispatchEvent(new CustomEvent('skill-click', {
            bubbles: true,
            composed: true,
            detail: { skillId }
        }));
    }

    _renderBackingAgent() {
        if (!this.skill?.backing_agent) return html``;

        const agentRole = this.backingAgent?.role || 'Agent';
        const initials = this._getInitials(this.skill.backing_agent);
        const domainClass = this._getDomainClass();

        return html`
            <dash-modal-section title="Powered By" icon="bot" no-padding>
                <div style="padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);">
                    <div
                        class="agent-link"
                        tabindex="0"
                        @click="${this._handleAgentClick}"
                        @keydown="${(e) => e.key === 'Enter' && this._handleAgentClick()}"
                    >
                        <dash-avatar
                            name="${this.skill.backing_agent}"
                            domain="${this.skill.domain || ''}"
                            size="md"
                        ></dash-avatar>
                        <div class="agent-link-info">
                            <div class="agent-link-name">${this.skill.backing_agent}</div>
                            <div class="agent-link-role">${agentRole}</div>
                        </div>
                        <span class="agent-link-arrow">→</span>
                    </div>
                </div>
            </dash-modal-section>
        `;
    }

    _renderHandoffFlow() {
        const inputs = this.skill?.handoff_inputs || [];
        const outputs = this.skill?.handoff_outputs || [];
        const domainClass = this._getDomainClass();

        if (inputs.length === 0 && outputs.length === 0) {
            return html`
                <dash-modal-section title="Handoff Flow" icon="arrow-right-left" no-padding>
                    <div style="padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);">
                        <dash-empty-state
                            title="No handoff relationships defined"
                            variant="inline"
                        ></dash-empty-state>
                    </div>
                </dash-modal-section>
            `;
        }

        return html`
            <dash-modal-section title="Handoff Flow" icon="arrow-right-left" no-padding>
                <div style="padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);">
                    <div class="handoff-flow">
                        <div class="handoff-column">
                            <div class="handoff-label">Receives From</div>
                            ${inputs.length > 0
                                ? inputs.map(s => html`
                                    <div
                                        class="handoff-node"
                                        tabindex="0"
                                        @click="${() => this._handleSkillClick(s)}"
                                        @keydown="${(e) => e.key === 'Enter' && this._handleSkillClick(s)}"
                                    >/${s}</div>
                                `)
                                : html`<dash-empty-state title="No upstream skills" variant="inline"></dash-empty-state>`
                            }
                        </div>
                        <div class="handoff-column">
                            <div class="handoff-label">Current Skill</div>
                            <div class="handoff-node current ${domainClass}">/${this.skill.id}</div>
                        </div>
                        <div class="handoff-column">
                            <div class="handoff-label">Hands Off To</div>
                            ${outputs.length > 0
                                ? outputs.map(s => html`
                                    <div
                                        class="handoff-node"
                                        tabindex="0"
                                        @click="${() => this._handleSkillClick(s)}"
                                        @keydown="${(e) => e.key === 'Enter' && this._handleSkillClick(s)}"
                                    >/${s}</div>
                                `)
                                : html`<dash-empty-state title="Terminal skill" variant="inline"></dash-empty-state>`
                            }
                        </div>
                    </div>
                </div>
            </dash-modal-section>
        `;
    }

    _renderStats() {
        const lastInvoked = this.skill?.last_invoked
            ? formatRelativeTime(new Date(this.skill.last_invoked))
            : 'Never';

        return html`
            <dash-modal-section title="Statistics" icon="bar-chart-2" no-padding>
                <div style="padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${this.skill?.invocation_count || 0}</div>
                            <div class="stat-label">Invocations</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${lastInvoked}</div>
                            <div class="stat-label">Last Invoked</div>
                        </div>
                    </div>
                </div>
            </dash-modal-section>
        `;
    }

    _renderInvocations() {
        // Transform invocations to activity format
        const activityItems = this.invocations.map(inv => ({
            timestamp: inv.timestamp,
            event_type: inv.content?.tool || inv.event_type || 'invocation',
            icon: 'play'
        }));

        return html`
            <dash-modal-section title="Recent Invocations" icon="history" no-padding>
                <dash-activity-list
                    .items="${activityItems}"
                    max-items="8"
                    empty-message="No invocations recorded"
                    empty-icon="clock"
                    compact
                ></dash-activity-list>
            </dash-modal-section>
        `;
    }

    render() {
        if (!this.skill) {
            return html``;
        }

        if (this.loading) {
            return html`
                <div class="modal-container">
                    <div class="loading-container">
                        <dash-spinner size="lg"></dash-spinner>
                    </div>
                </div>
            `;
        }

        const domainClass = this._getDomainClass();

        return html`
            <div class="modal-container">
                <div class="domain-accent ${domainClass}"></div>

                <dash-modal-identity
                    name="${this.skill.id}"
                    role="${this.skill.name || ''}"
                    domain="${this.skill.domain || ''}"
                    description="${this.skill.description || ''}"
                    prefix="/"
                ></dash-modal-identity>

                <div class="modal-body">
                    ${this._renderBackingAgent()}
                    ${this._renderHandoffFlow()}
                    ${this._renderStats()}
                    ${this._renderInvocations()}
                </div>
            </div>
        `;
    }
}

customElements.define('skill-detail-modal', SkillDetailModal);
export { SkillDetailModal };
