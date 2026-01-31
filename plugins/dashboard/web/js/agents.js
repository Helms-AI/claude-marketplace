/**
 * Agents Module - IDE Tree View
 * Handles agent tree view in sidebar and detail views
 */

const Agents = {
    data: {
        agents: [],
        domains: [],
        filteredAgents: [],
        collapsedDomains: new Set(),
        selectedAgentId: null
    },

    // Known domains in the marketplace ecosystem
    knownDomains: [
        'architecture', 'backend', 'data', 'devops', 'documentation',
        'frontend', 'pm', 'security', 'testing', 'user-experience'
    ],

    // Cache for command palette search
    cache: [],

    async init() {
        await this.loadAgents();
        await this.loadDomains();
        this.renderTree();
    },

    async loadAgents() {
        try {
            const response = await Dashboard.fetchAPI('/api/agents');
            this.data.agents = response.agents || [];
            this.data.filteredAgents = [...this.data.agents];
            this.cache = this.data.agents; // For command palette
            this.updateCount();
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
        } catch (e) {
            console.error('Error loading domains:', e);
        }
    },

    updateCount() {
        const countEl = document.getElementById('agentCount');
        if (countEl) {
            countEl.textContent = this.data.agents.length;
        }
    },

    /**
     * Group agents by domain for tree view
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

    /**
     * Render agent tree in sidebar
     */
    renderTree() {
        const container = document.getElementById('agentsTreeContent');
        if (!container) return;

        const agents = this.data.filteredAgents;
        if (agents.length === 0) {
            container.innerHTML = `
                <div class="tree-empty">No agents found</div>
            `;
            return;
        }

        const domainGroups = this.groupByDomain(agents);

        container.innerHTML = domainGroups.map(group => this.renderDomainNode(group)).join('');

        // Add click handlers
        this.attachTreeListeners(container);
        this.updateCount();
    },

    /**
     * Render a domain group node
     */
    renderDomainNode(group) {
        const { domain, items, isExternal } = group;
        const isCollapsed = this.data.collapsedDomains.has(domain);
        const displayName = domain.replace(/-/g, ' ');
        const domainClass = `domain-${domain}`;

        const agentNodes = items.map(agent => this.renderAgentNode(agent)).join('');

        return `
            <div class="tree-domain-group ${isExternal ? 'external' : ''}" data-domain="${domain}">
                <div class="tree-node tree-node-domain ${isCollapsed ? 'collapsed' : ''}" data-expanded="${!isCollapsed}">
                    <span class="tree-chevron">${isCollapsed ? '▸' : '▾'}</span>
                    <span class="tree-domain-accent ${domainClass}"></span>
                    <span class="tree-node-label">${displayName}</span>
                    <span class="tree-node-count">${items.length}</span>
                </div>
                <div class="tree-children ${isCollapsed ? 'hidden' : ''}">
                    ${agentNodes}
                </div>
            </div>
        `;
    },

    /**
     * Render a single agent node
     */
    renderAgentNode(agent) {
        const domainClass = Dashboard.getDomainClass(agent.domain);
        const isActive = agent.last_active ? 'active' : '';
        const isSelected = this.data.selectedAgentId === agent.id;

        return `
            <div class="tree-node tree-node-leaf ${isActive} ${isSelected ? 'selected' : ''}"
                 data-agent-id="${agent.id}"
                 title="${agent.role}">
                <span class="tree-node-icon ${domainClass}">●</span>
                <span class="tree-node-label">${agent.name}</span>
                ${agent.last_active ? '<span class="tree-node-badge active-badge">●</span>' : ''}
            </div>
        `;
    },

    /**
     * Attach event listeners to tree nodes
     */
    attachTreeListeners(container) {
        // Domain group toggle
        container.querySelectorAll('.tree-node-domain').forEach(node => {
            node.addEventListener('click', (e) => {
                e.stopPropagation();
                const group = node.closest('.tree-domain-group');
                const domain = group.dataset.domain;
                const children = group.querySelector('.tree-children');
                const chevron = node.querySelector('.tree-chevron');

                if (this.data.collapsedDomains.has(domain)) {
                    this.data.collapsedDomains.delete(domain);
                    node.classList.remove('collapsed');
                    node.dataset.expanded = 'true';
                    children.classList.remove('hidden');
                    chevron.textContent = '▾';
                } else {
                    this.data.collapsedDomains.add(domain);
                    node.classList.add('collapsed');
                    node.dataset.expanded = 'false';
                    children.classList.add('hidden');
                    chevron.textContent = '▸';
                }
            });
        });

        // Agent leaf node click
        container.querySelectorAll('.tree-node-leaf').forEach(node => {
            node.addEventListener('click', () => {
                const agentId = node.dataset.agentId;
                this.selectAgent(agentId);
            });

            // Double-click to open in tab
            node.addEventListener('dblclick', () => {
                const agentId = node.dataset.agentId;
                this.openAgentTab(agentId);
            });
        });
    },

    /**
     * Select an agent in the tree
     */
    selectAgent(agentId) {
        // Update selection state
        this.data.selectedAgentId = agentId;

        // Update tree UI
        document.querySelectorAll('#agentsTreeContent .tree-node-leaf').forEach(node => {
            node.classList.toggle('selected', node.dataset.agentId === agentId);
        });

        // Show agent detail in modal (single-click)
        this.showAgentDetail(agentId);
    },

    /**
     * Open agent in a new tab
     */
    openAgentTab(agentId) {
        const agent = this.data.agents.find(a => a.id === agentId);
        if (!agent) return;

        Dashboard.openTab(`agent-${agentId}`, agent.name, '🤖');
        this.renderAgentDetailTab(agent);
    },

    /**
     * Render agent detail in the editor tab
     */
    async renderAgentDetailTab(agent) {
        const container = document.getElementById('agentDetailView');
        if (!container) return;

        // Fetch activity
        let activity = [];
        try {
            const response = await Dashboard.fetchAPI(`/api/agents/id/${agent.id}/activity`);
            activity = response.events || [];
        } catch (e) {
            console.error('Error loading agent activity:', e);
        }

        const domainClass = Dashboard.getDomainClass(agent.domain);
        const tools = agent.tools.map(t => `<span class="detail-tag">${t}</span>`).join('');
        const phrases = agent.key_phrases.map(p => `<div class="detail-phrase">"${p}"</div>`).join('');

        const activityHtml = activity.length > 0
            ? activity.slice(0, 10).map(e => `
                <div class="activity-event ${e.event_type}">
                    <span class="event-time">${new Date(e.timestamp).toLocaleString()}</span>
                    <span class="event-type">${e.event_type.replace(/_/g, ' ')}</span>
                </div>
            `).join('')
            : '<p class="detail-muted">No recent activity</p>';

        container.innerHTML = `
            <div class="detail-header">
                <div class="detail-title-row">
                    <h2 class="detail-title">${agent.name}</h2>
                    <span class="detail-domain ${domainClass}">${agent.domain.replace(/-/g, ' ')}</span>
                </div>
                <p class="detail-subtitle">${agent.role}</p>
            </div>

            ${agent.description ? `
            <div class="detail-section">
                <h4>Description</h4>
                <p>${agent.description}</p>
            </div>
            ` : ''}

            <div class="detail-section">
                <h4>Tools</h4>
                <div class="detail-tags">${tools || '<span class="detail-muted">No tools</span>'}</div>
            </div>

            ${agent.key_phrases.length > 0 ? `
            <div class="detail-section">
                <h4>Key Phrases</h4>
                <div class="detail-phrases">${phrases}</div>
            </div>
            ` : ''}

            <div class="detail-section">
                <h4>Recent Activity</h4>
                <div class="detail-activity">${activityHtml}</div>
            </div>
        `;

        // Show the agent detail tab
        document.getElementById('agentDetailTab').classList.add('active');
    },

    /**
     * Show agent in modal (single-click quick view)
     * Redesigned modal with domain accent, avatar, tools grid, key phrases
     */
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
        const displayDomain = agent.domain.replace(/-/g, ' ');
        
        // Get initials for avatar
        const initials = agent.name.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        // Build tools grid
        const toolsHtml = agent.tools && agent.tools.length > 0
            ? agent.tools.map(t => `<span class="modal-tool-tag">${t}</span>`).join('')
            : '<span class="modal-empty-state">No tools configured</span>';

        // Build key phrases with domain-colored borders
        const phrasesHtml = agent.key_phrases && agent.key_phrases.length > 0
            ? agent.key_phrases.map(p => 
                `<div class="modal-phrase-item ${domainClass}">"${p}"</div>`
            ).join('')
            : '<span class="modal-empty-state">No key phrases defined</span>';

        // Build activity list with alternating rows
        const activityHtml = activity.length > 0
            ? activity.slice(0, 10).map(e => {
                const time = new Date(e.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const eventText = e.event_type.replace(/_/g, ' ');
                return `
                    <div class="modal-activity-row">
                        <span class="modal-activity-time">${time}</span>
                        <span class="modal-activity-event">${eventText}</span>
                    </div>
                `;
            }).join('')
            : '<div class="modal-empty-state" style="padding: 16px;">No recent activity</div>';

        const content = `
            <div class="modal-domain-accent ${domainClass}"></div>
            
            <div class="modal-header">
                <div class="modal-identity">
                    <div class="modal-avatar ${domainClass}">${initials}</div>
                    <div class="modal-identity-info">
                        <h2 class="modal-name">${agent.name}</h2>
                        <p class="modal-role">${agent.role}</p>
                        <span class="modal-domain-badge ${domainClass}">${displayDomain}</span>
                    </div>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">Tools</div>
                <div class="modal-tools-grid">${toolsHtml}</div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">Key Phrases</div>
                <div class="modal-phrases">${phrasesHtml}</div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">Recent Activity</div>
                <div class="modal-activity-list">${activityHtml}</div>
            </div>
        `;

        Dashboard.openModal('agentModal', content);
        
        // Add the modal-agent class to the modal content for styling
        const modalContent = document.querySelector('#agentModal .modal-content');
        if (modalContent) {
            modalContent.classList.add('modal-agent');
        }
    },

    /**
     * Filter agents based on search query
     */
    filter(query) {
        const searchTerm = query.toLowerCase();

        this.data.filteredAgents = this.data.agents.filter(agent => {
            return !searchTerm ||
                agent.name.toLowerCase().includes(searchTerm) ||
                agent.role.toLowerCase().includes(searchTerm) ||
                agent.id.toLowerCase().includes(searchTerm) ||
                agent.domain.toLowerCase().includes(searchTerm);
        });

        this.renderTree();
    },

    /**
     * Update agent activity (called from SSE events)
     */
    updateActivity(agentId) {
        const agent = this.data.agents.find(a => a.id === agentId);
        if (agent) {
            agent.last_active = new Date().toISOString();
            this.renderTree();
        }
    }
};
