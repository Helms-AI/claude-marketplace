/**
 * Agents Module
 * Handles agent list, search, filter, and detail views
 * With domain-grouped layout (Industrial-Editorial aesthetic)
 */

const Agents = {
    data: {
        agents: [],
        domains: [],
        filteredAgents: [],
        collapsedDomains: new Set()
    },

    // Known domains in the marketplace ecosystem
    knownDomains: [
        'architecture', 'backend', 'data', 'devops', 'documentation',
        'frontend', 'pm', 'security', 'testing', 'user-experience'
    ],

    async init() {
        await this.loadAgents();
        await this.loadDomains();
        this.setupSearch();
        this.setupFilter();
        this.render();
    },

    async loadAgents() {
        try {
            const response = await Dashboard.fetchAPI('/api/agents');
            this.data.agents = response.agents || [];
            this.data.filteredAgents = [...this.data.agents];
        } catch (e) {
            console.error('Error loading agents:', e);
            this.data.agents = [];
            this.data.filteredAgents = [];
        }
    },

    async loadDomains() {
        try {
            const response = await Dashboard.fetchAPI('/api/domains');
            this.data.domains = response.domains || [];
            this.populateDomainFilter();
        } catch (e) {
            console.error('Error loading domains:', e);
        }
    },

    populateDomainFilter() {
        const select = document.getElementById('domainFilter');
        select.innerHTML = '<option value="">All Domains</option>';

        this.data.domains.forEach(domain => {
            const option = document.createElement('option');
            option.value = domain.name;
            option.textContent = domain.name.replace(/-/g, ' ');
            option.style.textTransform = 'capitalize';
            select.appendChild(option);
        });
    },

    setupSearch() {
        const input = document.getElementById('agentSearch');
        input.addEventListener('input', () => {
            this.filterAgents();
        });
    },

    setupFilter() {
        const select = document.getElementById('domainFilter');
        select.addEventListener('change', () => {
            this.filterAgents();
        });
    },

    filterAgents() {
        const searchTerm = document.getElementById('agentSearch').value.toLowerCase();
        const domainFilter = document.getElementById('domainFilter').value;

        this.data.filteredAgents = this.data.agents.filter(agent => {
            const matchesSearch = !searchTerm ||
                agent.name.toLowerCase().includes(searchTerm) ||
                agent.role.toLowerCase().includes(searchTerm) ||
                agent.id.toLowerCase().includes(searchTerm);

            const matchesDomain = !domainFilter || agent.domain === domainFilter;

            return matchesSearch && matchesDomain;
        });

        this.render();
    },

    /**
     * Group agents by domain
     * Known domains appear alphabetically, External domain appears last
     */
    groupByDomain(agents) {
        const groups = {};

        agents.forEach(agent => {
            const domain = agent.domain || 'external';
            const isExternal = !this.knownDomains.includes(domain);
            const groupKey = isExternal ? 'external' : domain;

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(agent);
        });

        // Sort: known domains alphabetically, external last
        const sortedDomains = Object.keys(groups)
            .filter(d => d !== 'external')
            .sort();

        if (groups['external']) {
            sortedDomains.push('external');
        }

        return sortedDomains.map(domain => ({
            domain,
            items: groups[domain],
            isExternal: domain === 'external'
        }));
    },

    render() {
        this.renderStats();
        this.renderGrid();
    },

    renderStats() {
        const stats = document.getElementById('agentStats');
        const totalAgents = this.data.agents.length;
        const totalDomains = this.data.domains.length;
        const activeAgents = this.data.agents.filter(a => a.last_active).length;

        stats.innerHTML = `
            <div class="stat-item">
                <span class="stat-value">${totalAgents}</span>
                <span class="stat-label">Total Agents</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${totalDomains}</span>
                <span class="stat-label">Domains</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${activeAgents}</span>
                <span class="stat-label">Recently Active</span>
            </div>
        `;
    },

    renderGrid() {
        const grid = document.getElementById('agentGrid');

        if (this.data.filteredAgents.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">&#128269;</div>
                    <p>No agents found</p>
                </div>
            `;
            return;
        }

        const domainGroups = this.groupByDomain(this.data.filteredAgents);

        grid.innerHTML = domainGroups.map(group => this.renderDomainGroup(group)).join('');

        // Add click handlers for cards
        grid.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', () => {
                const agentId = card.dataset.agentId;
                this.showAgentDetail(agentId);
            });
        });

        // Add click handlers for domain headers (collapse/expand)
        grid.querySelectorAll('.domain-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const domainGroup = header.closest('.domain-group');
                const domain = domainGroup.dataset.domain;

                domainGroup.classList.toggle('collapsed');

                if (domainGroup.classList.contains('collapsed')) {
                    this.data.collapsedDomains.add(domain);
                } else {
                    this.data.collapsedDomains.delete(domain);
                }
            });
        });
    },

    renderDomainGroup(group) {
        const { domain, items, isExternal } = group;
        const isCollapsed = this.data.collapsedDomains.has(domain);
        const displayName = domain.replace(/-/g, ' ');
        const domainClass = `domain-${domain}`;

        const chevronSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

        const externalNotice = isExternal
            ? `<div class="external-notice">These agents are not controlled by the Helms AI ecosystem</div>`
            : '';

        const cards = items.map(agent => this.renderCard(agent)).join('');

        return `
            <div class="domain-group ${isExternal ? 'domain-external' : ''} ${isCollapsed ? 'collapsed' : ''}" data-domain="${domain}">
                <div class="domain-header">
                    <div class="domain-header-left">
                        <span class="domain-accent ${domainClass}"></span>
                        <span class="domain-name">${displayName}</span>
                        <span class="domain-count">${items.length} agent${items.length !== 1 ? 's' : ''}</span>
                    </div>
                    <button class="domain-toggle" aria-label="Toggle ${displayName} section">
                        ${chevronSvg}
                    </button>
                </div>
                <div class="domain-content">
                    ${externalNotice}
                    <div class="card-grid">
                        ${cards}
                    </div>
                </div>
            </div>
        `;
    },

    renderCard(agent) {
        const domainClass = Dashboard.getDomainClass(agent.domain);
        const tools = agent.tools.slice(0, 4).map(t =>
            `<span class="tool-tag">${t}</span>`
        ).join('');
        const moreTools = agent.tools.length > 4 ? `<span class="tool-tag">+${agent.tools.length - 4}</span>` : '';

        const activityHtml = agent.last_active
            ? `<div class="card-activity"><span class="activity-indicator"></span>Active ${Dashboard.formatTime(agent.last_active)}</div>`
            : '';

        return `
            <div class="card" data-agent-id="${agent.id}">
                <div class="card-header">
                    <span class="card-title">${agent.name}</span>
                    <span class="card-domain ${domainClass}">${agent.domain.replace(/-/g, ' ')}</span>
                </div>
                <div class="card-role">${agent.role}</div>
                <div class="card-tools">${tools}${moreTools}</div>
                ${activityHtml}
            </div>
        `;
    },

    async showAgentDetail(agentId) {
        const agent = this.data.agents.find(a => a.id === agentId);
        if (!agent) return;

        // Fetch activity
        let activity = [];
        try {
            const response = await Dashboard.fetchAPI(`/api/agents/id/${agentId}/activity`);
            activity = response.events || [];
        } catch (e) {
            console.error('Error loading agent activity:', e);
        }

        const domainClass = Dashboard.getDomainClass(agent.domain);
        const tools = agent.tools.map(t => `<span class="tool-tag">${t}</span>`).join('');
        const phrases = agent.key_phrases.map(p => `<div class="key-phrase">"${p}"</div>`).join('');

        const activityHtml = activity.length > 0
            ? activity.slice(0, 10).map(e => `
                <div class="transcript-event ${e.event_type}">
                    <div class="event-timestamp">${new Date(e.timestamp).toLocaleString()}</div>
                    <div class="event-content">${e.event_type.replace(/_/g, ' ')}</div>
                </div>
            `).join('')
            : '<p class="text-muted">No recent activity</p>';

        const content = `
            <div class="modal-title">${agent.name}</div>
            <span class="card-domain ${domainClass}">${agent.domain.replace(/-/g, ' ')}</span>

            <div class="modal-section">
                <h4>Role</h4>
                <p>${agent.role}</p>
            </div>

            ${agent.description ? `
            <div class="modal-section">
                <h4>Description</h4>
                <p>${agent.description}</p>
            </div>
            ` : ''}

            <div class="modal-section">
                <h4>Tools</h4>
                <div class="card-tools">${tools}</div>
            </div>

            ${agent.key_phrases.length > 0 ? `
            <div class="modal-section">
                <h4>Key Phrases</h4>
                ${phrases}
            </div>
            ` : ''}

            <div class="modal-section">
                <h4>Recent Activity</h4>
                ${activityHtml}
            </div>
        `;

        Dashboard.openModal('agentModal', content);
    },

    updateActivity(agentId) {
        const agent = this.data.agents.find(a => a.id === agentId);
        if (agent) {
            agent.last_active = new Date().toISOString();
            this.render();
        }
    }
};
