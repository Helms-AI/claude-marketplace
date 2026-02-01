/**
 * Modal Identity Molecule - Modal header with avatar and info
 * @module components/molecules/modal-identity
 *
 * Displays an identity header for modals with avatar, name, role,
 * domain badge, and optional description.
 */
import { LitElement, html, css } from 'lit';
import '../atoms/avatar.js';
import '../atoms/tag.js';

class DashModalIdentity extends LitElement {
    static properties = {
        name: { type: String },
        role: { type: String },
        domain: { type: String },
        description: { type: String },
        prefix: { type: String },       // For skill commands (e.g., "/")
        showDomainAccent: { type: Boolean, attribute: 'show-domain-accent' }
    };

    static styles = css`
        :host {
            display: block;
            position: relative;
        }

        /* Domain accent bar at top */
        .domain-accent {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--accent-bg, var(--accent-color));
            border-radius: var(--radius-md, 6px) var(--radius-md, 6px) 0 0;
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

        .identity {
            display: flex;
            align-items: flex-start;
            gap: var(--spacing-md, 12px);
            padding: var(--spacing-lg, 16px);
        }

        :host([show-domain-accent]) .identity {
            padding-top: calc(var(--spacing-lg, 16px) + 4px);
        }

        .avatar-container {
            flex-shrink: 0;
        }

        .identity-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs, 4px);
        }

        .name-row {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            flex-wrap: wrap;
        }

        .name {
            font-size: var(--font-size-xl, 16px);
            font-weight: 600;
            color: var(--text-primary, #1f2937);
            margin: 0;
        }

        /* Command display for skills */
        .command {
            font-family: var(--font-mono);
            font-size: var(--font-size-lg, 14px);
            font-weight: 600;
        }

        .command-prefix {
            opacity: 0.6;
        }

        .command.domain-pm { color: var(--domain-pm, #6366f1); }
        .command.domain-user-experience { color: var(--domain-user-experience, #f472b6); }
        .command.domain-frontend { color: var(--domain-frontend, #22d3ee); }
        .command.domain-architecture { color: var(--domain-architecture, #a78bfa); }
        .command.domain-backend { color: var(--domain-backend, #4ade80); }
        .command.domain-testing { color: var(--domain-testing, #facc15); }
        .command.domain-devops { color: var(--domain-devops, #fb923c); }
        .command.domain-data { color: var(--domain-data, #60a5fa); }
        .command.domain-security { color: var(--domain-security, #f87171); }
        .command.domain-documentation { color: var(--domain-documentation, #a3e635); }

        .role {
            font-size: var(--font-size-sm, 12px);
            color: var(--text-secondary, #6b7280);
            margin: 0;
        }

        .badge-row {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            margin-top: var(--spacing-xs, 4px);
        }

        .description {
            font-size: var(--font-size-sm, 12px);
            color: var(--text-secondary, #6b7280);
            line-height: 1.5;
            margin-top: var(--spacing-sm, 8px);
        }
    `;

    constructor() {
        super();
        this.name = '';
        this.role = '';
        this.domain = '';
        this.description = '';
        this.prefix = '';
        this.showDomainAccent = false;
    }

    _getDomainDisplayName() {
        return this.domain.replace(/-/g, ' ');
    }

    render() {
        const isCommand = !!this.prefix;
        const domainClass = this.domain ? `domain-${this.domain}` : '';

        return html`
            ${this.showDomainAccent && this.domain ? html`
                <div class="domain-accent ${domainClass}"></div>
            ` : ''}

            <div class="identity">
                <div class="avatar-container">
                    <dash-avatar
                        name="${this.name}"
                        domain="${this.domain}"
                        size="lg"
                    ></dash-avatar>
                </div>

                <div class="identity-info">
                    <div class="name-row">
                        ${isCommand ? html`
                            <span class="command ${domainClass}">
                                <span class="command-prefix">${this.prefix}</span>${this.name}
                            </span>
                        ` : html`
                            <h2 class="name">${this.name}</h2>
                        `}
                    </div>

                    ${this.role ? html`
                        <p class="role">${this.role}</p>
                    ` : ''}

                    ${this.domain ? html`
                        <div class="badge-row">
                            <dash-tag
                                label="${this._getDomainDisplayName()}"
                                domain="${this.domain}"
                                variant="subtle"
                                size="xs"
                            ></dash-tag>
                        </div>
                    ` : ''}

                    ${this.description ? html`
                        <p class="description">${this.description}</p>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

customElements.define('dash-modal-identity', DashModalIdentity);
export { DashModalIdentity };
