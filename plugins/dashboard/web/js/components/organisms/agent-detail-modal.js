/**
 * Agent Detail Modal Organism
 * @module components/organisms/agent-detail-modal
 *
 * Displays detailed information about an agent in a modal.
 * Uses dash-modal-identity, dash-modal-section, dash-tag-list,
 * and dash-activity-list molecules.
 */
import { LitElement, html, css } from 'lit';
import '../atoms/avatar.js';
import '../atoms/tag.js';
import '../atoms/empty-state.js';
import '../molecules/modal-identity.js';
import '../molecules/modal-section.js';
import '../molecules/tag-list.js';
import '../molecules/activity-list.js';

class AgentDetailModal extends LitElement {
    static properties = {
        agent: { type: Object },
        activity: { type: Array },
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
            max-width: 480px;
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

        /* Key phrases styling */
        .phrases-list {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm, 8px);
        }

        .phrase-item {
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
            border-radius: var(--radius-sm, 4px);
            font-size: var(--font-size-sm, 12px);
            color: var(--text-secondary, #6b7280);
            font-style: italic;
            border-left: 3px solid var(--accent-color);
        }

        .phrase-item.domain-pm { border-left-color: var(--domain-pm, #6366f1); }
        .phrase-item.domain-user-experience { border-left-color: var(--domain-user-experience, #f472b6); }
        .phrase-item.domain-frontend { border-left-color: var(--domain-frontend, #22d3ee); }
        .phrase-item.domain-architecture { border-left-color: var(--domain-architecture, #a78bfa); }
        .phrase-item.domain-backend { border-left-color: var(--domain-backend, #4ade80); }
        .phrase-item.domain-testing { border-left-color: var(--domain-testing, #facc15); }
        .phrase-item.domain-devops { border-left-color: var(--domain-devops, #fb923c); }
        .phrase-item.domain-data { border-left-color: var(--domain-data, #60a5fa); }
        .phrase-item.domain-security { border-left-color: var(--domain-security, #f87171); }
        .phrase-item.domain-documentation { border-left-color: var(--domain-documentation, #a3e635); }

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
        this.agent = null;
        this.activity = [];
        this.loading = false;
        this.open = false;
    }

    _getDomainClass() {
        return this.agent?.domain ? `domain-${this.agent.domain}` : '';
    }

    _renderTools() {
        const tools = this.agent?.tools || [];
        if (tools.length === 0) {
            return html`
                <dash-empty-state
                    title="No tools configured"
                    variant="inline"
                ></dash-empty-state>
            `;
        }

        return html`
            <dash-tag-list
                .items="${tools}"
                tag-variant="default"
                tag-size="sm"
            ></dash-tag-list>
        `;
    }

    _renderKeyPhrases() {
        const phrases = this.agent?.key_phrases || [];
        if (phrases.length === 0) {
            return html`
                <dash-empty-state
                    title="No key phrases defined"
                    variant="inline"
                ></dash-empty-state>
            `;
        }

        const domainClass = this._getDomainClass();
        return html`
            <div class="phrases-list">
                ${phrases.map(phrase => html`
                    <div class="phrase-item ${domainClass}">"${phrase}"</div>
                `)}
            </div>
        `;
    }

    _renderActivity() {
        return html`
            <dash-activity-list
                .items="${this.activity}"
                max-items="10"
                empty-message="No recent activity"
                empty-icon="clock"
                compact
            ></dash-activity-list>
        `;
    }

    render() {
        if (!this.agent) {
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
                    name="${this.agent.name}"
                    role="${this.agent.role || ''}"
                    domain="${this.agent.domain || ''}"
                    description="${this.agent.description || ''}"
                ></dash-modal-identity>

                <div class="modal-body">
                    <dash-modal-section title="Tools" icon="wrench" no-padding>
                        <div style="padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);">
                            ${this._renderTools()}
                        </div>
                    </dash-modal-section>

                    <dash-modal-section title="Key Phrases" icon="message-circle" no-padding>
                        <div style="padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);">
                            ${this._renderKeyPhrases()}
                        </div>
                    </dash-modal-section>

                    <dash-modal-section title="Recent Activity" icon="activity" no-padding>
                        ${this._renderActivity()}
                    </dash-modal-section>
                </div>
            </div>
        `;
    }
}

customElements.define('agent-detail-modal', AgentDetailModal);
export { AgentDetailModal };
