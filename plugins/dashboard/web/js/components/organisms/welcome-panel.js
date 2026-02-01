/**
 * WelcomePanel Organism - Portal into the system
 * @module components/organisms/welcome-panel
 *
 * Features:
 * - Agent persona greeting with rotating quotes
 * - Live activity feed (main focus)
 * - Recent changesets for resuming work
 * - Compressed quick actions
 */
import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions, ConnectionState, agentCount, skillCount, activeChangesets } from '../../store/app-state.js';
import '../atoms/icon.js';
import '../molecules/activity-list.js';

// Agent greetings - personality layer
const AGENT_GREETINGS = [
    { agent: 'Alex Morgan', role: 'PM Broker', quote: 'Ready to orchestrate your next cross-domain adventure.', icon: 'briefcase', domain: 'pm' },
    { agent: 'Sofia Reyes', role: 'Architecture Lead', quote: 'Let\'s design something that scales beautifully.', icon: 'layers', domain: 'architecture' },
    { agent: 'Dana Reyes', role: 'UX Lead', quote: 'Every pixel tells a story. What shall we create?', icon: 'palette', domain: 'user-experience' },
    { agent: 'Chris Nakamura', role: 'Frontend Lead', quote: 'Components waiting to come alive. What\'s the vision?', icon: 'monitor', domain: 'frontend' },
    { agent: 'David Park', role: 'Backend Lead', quote: 'APIs at the ready. Time to build something solid.', icon: 'server', domain: 'backend' },
    { agent: 'Amanda Torres', role: 'Testing Lead', quote: 'Quality is not an act, it\'s a habit. Let\'s verify.', icon: 'flask', domain: 'testing' },
    { agent: 'Michael Chang', role: 'DevOps Lead', quote: 'Infrastructure awaits. Ready to deploy excellence.', icon: 'cloud', domain: 'devops' },
    { agent: 'Nathan Brooks', role: 'Security Lead', quote: 'Vigilance is our strength. What needs protecting?', icon: 'shield', domain: 'security' },
];

class DashWelcomePanel extends SignalWatcher(LitElement) {
    static properties = {
        greeting: { type: Object, state: true },
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: var(--bg-primary, #1e1e1e);
            overflow: hidden;
        }

        /* Greeting Header */
        .greeting-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-md, 12px);
            padding: var(--spacing-lg, 20px) var(--spacing-xl, 24px);
            background: linear-gradient(135deg,
                var(--bg-secondary, #252526) 0%,
                var(--bg-primary, #1e1e1e) 100%
            );
            border-bottom: 1px solid var(--border-color, #3d3d3d);
        }

        .agent-avatar {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--agent-bg, rgba(74, 144, 217, 0.15));
            color: var(--agent-color, #4a90d9);
            flex-shrink: 0;
        }

        /* Domain-specific avatar colors */
        .agent-avatar.domain-pm { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
        .agent-avatar.domain-architecture { background: rgba(167, 139, 250, 0.15); color: #a78bfa; }
        .agent-avatar.domain-user-experience { background: rgba(244, 114, 182, 0.15); color: #f472b6; }
        .agent-avatar.domain-frontend { background: rgba(34, 211, 238, 0.15); color: #22d3ee; }
        .agent-avatar.domain-backend { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
        .agent-avatar.domain-testing { background: rgba(250, 204, 21, 0.15); color: #facc15; }
        .agent-avatar.domain-devops { background: rgba(251, 146, 60, 0.15); color: #fb923c; }
        .agent-avatar.domain-security { background: rgba(248, 113, 113, 0.15); color: #f87171; }

        .greeting-content {
            flex: 1;
            min-width: 0;
        }

        .greeting-quote {
            font-size: var(--font-size-md, 14px);
            color: var(--text-primary, #e0e0e0);
            margin: 0 0 4px;
            font-style: italic;
        }

        .greeting-attribution {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #808080);
        }

        .greeting-agent {
            font-weight: 600;
            color: var(--text-secondary, #b0b0b0);
        }

        .status-bar {
            display: flex;
            align-items: center;
            gap: var(--spacing-lg, 20px);
            margin-left: auto;
            flex-shrink: 0;
        }

        .status-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #808080);
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--status-color, #808080);
        }

        .status-dot.connected { background: #4ade80; }
        .status-dot.connecting { background: #facc15; animation: pulse 1s infinite; }
        .status-dot.disconnected { background: #f87171; }
        .status-dot.error { background: #f87171; }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .status-value {
            font-weight: 600;
            color: var(--text-secondary, #b0b0b0);
        }

        /* Main Content Area */
        .content-area {
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 320px;
            gap: var(--spacing-md, 12px);
            padding: var(--spacing-md, 12px);
            overflow: hidden;
        }

        /* Activity Feed - Main Focus */
        .activity-section {
            display: flex;
            flex-direction: column;
            background: var(--bg-secondary, #252526);
            border-radius: var(--radius-md, 6px);
            overflow: hidden;
        }

        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            background: var(--bg-tertiary, rgba(255, 255, 255, 0.03));
            border-bottom: 1px solid var(--border-color, #3d3d3d);
        }

        .section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: var(--font-size-xs, 11px);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted, #808080);
        }

        .section-title .live-indicator {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #4ade80;
            animation: pulse 2s infinite;
        }

        .activity-feed {
            flex: 1;
            overflow-y: auto;
        }

        .activity-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: var(--spacing-sm, 8px);
            color: var(--text-muted, #808080);
            padding: var(--spacing-xl, 24px);
            text-align: center;
        }

        .activity-empty-icon {
            opacity: 0.3;
        }

        .activity-empty-text {
            font-size: var(--font-size-sm, 13px);
        }

        .activity-empty-hint {
            font-size: var(--font-size-xs, 11px);
            opacity: 0.7;
        }

        /* Right Sidebar */
        .sidebar-section {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md, 12px);
            overflow-y: auto;
        }

        /* Recent Changesets */
        .changesets-card {
            background: var(--bg-secondary, #252526);
            border-radius: var(--radius-md, 6px);
            overflow: hidden;
        }

        .changeset-list {
            max-height: 200px;
            overflow-y: auto;
        }

        .changeset-item {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
            cursor: pointer;
            transition: background 0.15s ease;
        }

        .changeset-item:last-child {
            border-bottom: none;
        }

        .changeset-item:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.04));
        }

        .changeset-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: var(--radius-sm, 4px);
            background: var(--accent-bg, rgba(74, 144, 217, 0.1));
            color: var(--accent-color, #4a90d9);
            flex-shrink: 0;
        }

        .changeset-content {
            flex: 1;
            min-width: 0;
        }

        .changeset-title {
            font-size: var(--font-size-sm, 12px);
            color: var(--text-primary, #e0e0e0);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .changeset-meta {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #808080);
        }

        .changeset-domains {
            display: flex;
            gap: 4px;
        }

        .domain-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
        }

        .domain-dot.architecture { background: #a78bfa; }
        .domain-dot.backend { background: #4ade80; }
        .domain-dot.frontend { background: #22d3ee; }
        .domain-dot.user-experience { background: #f472b6; }
        .domain-dot.testing { background: #facc15; }
        .domain-dot.devops { background: #fb923c; }
        .domain-dot.security { background: #f87171; }
        .domain-dot.data { background: #60a5fa; }
        .domain-dot.pm { background: #6366f1; }
        .domain-dot.documentation { background: #a3e635; }

        /* Quick Actions */
        .actions-card {
            background: var(--bg-secondary, #252526);
            border-radius: var(--radius-md, 6px);
            overflow: hidden;
        }

        .actions-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1px;
            background: var(--border-subtle, rgba(255, 255, 255, 0.05));
        }

        .action-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: var(--spacing-md, 12px) var(--spacing-sm, 8px);
            background: var(--bg-secondary, #252526);
            border: none;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .action-btn:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.04));
        }

        .action-btn:hover .action-icon {
            color: var(--accent-color, #4a90d9);
            transform: scale(1.1);
        }

        .action-icon {
            color: var(--text-muted, #808080);
            transition: all 0.15s ease;
        }

        .action-label {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-secondary, #b0b0b0);
        }

        /* Stats Row */
        .stats-row {
            display: flex;
            justify-content: space-around;
            padding: var(--spacing-sm, 8px);
            background: var(--bg-tertiary, rgba(255, 255, 255, 0.03));
            border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
        }

        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
        }

        .stat-value {
            font-size: var(--font-size-lg, 18px);
            font-weight: 700;
            color: var(--text-primary, #e0e0e0);
        }

        .stat-label {
            font-size: var(--font-size-xs, 10px);
            color: var(--text-muted, #808080);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        /* Responsive: Stack on narrow screens */
        @media (max-width: 700px) {
            .content-area {
                grid-template-columns: 1fr;
            }

            .sidebar-section {
                flex-direction: row;
                gap: var(--spacing-sm, 8px);
            }

            .changesets-card,
            .actions-card {
                flex: 1;
            }
        }
    `;

    constructor() {
        super();
        this.greeting = this._getRandomGreeting();
    }

    connectedCallback() {
        super.connectedCallback();
        // Rotate greeting every 30 seconds
        this._greetingInterval = setInterval(() => {
            this.greeting = this._getRandomGreeting();
        }, 30000);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._greetingInterval) {
            clearInterval(this._greetingInterval);
        }
    }

    _getRandomGreeting() {
        const index = Math.floor(Math.random() * AGENT_GREETINGS.length);
        return AGENT_GREETINGS[index];
    }

    _getConnectionStatus() {
        const state = AppStore.connectionState.value;
        return {
            state,
            class: state.toLowerCase(),
            text: state === ConnectionState.CONNECTED ? 'Online' :
                  state === ConnectionState.CONNECTING ? 'Connecting' :
                  state === ConnectionState.ERROR ? 'Error' : 'Offline'
        };
    }

    _handleAction(action) {
        this.dispatchEvent(new CustomEvent('dash-action', {
            detail: { action },
            bubbles: true,
            composed: true
        }));
    }

    _handleChangesetClick(changeset) {
        Actions.setSelectedChangeset(changeset);
        Actions.openTab({
            id: `changeset-${changeset.id}`,
            title: changeset.task || changeset.id,
            type: 'changeset',
            data: changeset
        });
    }

    _renderActivityFeed() {
        const activities = AppStore.activities.value;

        if (activities.length === 0) {
            return html`
                <div class="activity-empty">
                    <dash-icon name="activity" size="32" class="activity-empty-icon"></dash-icon>
                    <span class="activity-empty-text">No activity yet</span>
                    <span class="activity-empty-hint">
                        Start a conversation or invoke a skill to see live updates
                    </span>
                </div>
            `;
        }

        return html`
            <dash-activity-list
                .items=${activities}
                max-items="50"
                show-time-ago
            ></dash-activity-list>
        `;
    }

    _renderRecentChangesets() {
        const changesets = activeChangesets.value.slice(0, 5);

        if (changesets.length === 0) {
            return html`
                <div class="changeset-item" style="justify-content: center; opacity: 0.6;">
                    <span style="font-size: 11px;">No active changesets</span>
                </div>
            `;
        }

        return changesets.map(cs => html`
            <div class="changeset-item" @click=${() => this._handleChangesetClick(cs)}>
                <div class="changeset-icon">
                    <dash-icon name="git-branch" size="14"></dash-icon>
                </div>
                <div class="changeset-content">
                    <div class="changeset-title">${cs.task || cs.id}</div>
                    <div class="changeset-meta">
                        <div class="changeset-domains">
                            ${(cs.domains || []).slice(0, 3).map(d => html`
                                <span class="domain-dot ${d}"></span>
                            `)}
                        </div>
                        <span>${cs.status || cs.phase}</span>
                    </div>
                </div>
            </div>
        `);
    }

    render() {
        const status = this._getConnectionStatus();
        const agents = agentCount.value;
        const skills = skillCount.value;

        return html`
            <!-- Greeting Header -->
            <div class="greeting-header">
                <div class="agent-avatar domain-${this.greeting.domain}">
                    <dash-icon name="${this.greeting.icon}" size="24"></dash-icon>
                </div>
                <div class="greeting-content">
                    <p class="greeting-quote">"${this.greeting.quote}"</p>
                    <div class="greeting-attribution">
                        <span>—</span>
                        <span class="greeting-agent">${this.greeting.agent}</span>
                        <span>•</span>
                        <span>${this.greeting.role}</span>
                    </div>
                </div>
                <div class="status-bar">
                    <div class="status-item">
                        <span class="status-dot ${status.class}"></span>
                        <span>${status.text}</span>
                    </div>
                    <div class="status-item">
                        <dash-icon name="users" size="12"></dash-icon>
                        <span class="status-value">${agents}</span>
                    </div>
                    <div class="status-item">
                        <dash-icon name="zap" size="12"></dash-icon>
                        <span class="status-value">${skills}</span>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="content-area">
                <!-- Activity Feed - Primary Focus -->
                <div class="activity-section">
                    <div class="section-header">
                        <div class="section-title">
                            <span class="live-indicator"></span>
                            Live Activity
                        </div>
                    </div>
                    <div class="activity-feed">
                        ${this._renderActivityFeed()}
                    </div>
                </div>

                <!-- Right Sidebar -->
                <div class="sidebar-section">
                    <!-- Recent Changesets -->
                    <div class="changesets-card">
                        <div class="section-header">
                            <div class="section-title">
                                <dash-icon name="git-branch" size="12"></dash-icon>
                                Resume Work
                            </div>
                        </div>
                        <div class="changeset-list">
                            ${this._renderRecentChangesets()}
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="actions-card">
                        <div class="section-header">
                            <div class="section-title">
                                <dash-icon name="zap" size="12"></dash-icon>
                                Quick Actions
                            </div>
                        </div>
                        <div class="actions-grid">
                            <button class="action-btn" @click=${() => this._handleAction('terminal')}>
                                <dash-icon name="terminal" size="18" class="action-icon"></dash-icon>
                                <span class="action-label">Terminal</span>
                            </button>
                            <button class="action-btn" @click=${() => this._handleAction('graph')}>
                                <dash-icon name="share-2" size="18" class="action-icon"></dash-icon>
                                <span class="action-label">Graph</span>
                            </button>
                            <button class="action-btn" @click=${() => this._handleAction('agents')}>
                                <dash-icon name="users" size="18" class="action-icon"></dash-icon>
                                <span class="action-label">Agents</span>
                            </button>
                            <button class="action-btn" @click=${() => this._handleAction('changesets')}>
                                <dash-icon name="layers" size="18" class="action-icon"></dash-icon>
                                <span class="action-label">Changesets</span>
                            </button>
                        </div>
                        <div class="stats-row">
                            <div class="stat-item">
                                <span class="stat-value">${agents}</span>
                                <span class="stat-label">Agents</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${skills}</span>
                                <span class="stat-label">Skills</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${activeChangesets.value.length}</span>
                                <span class="stat-label">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('welcome-panel', DashWelcomePanel);
export { DashWelcomePanel };
