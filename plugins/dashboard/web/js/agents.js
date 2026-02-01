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
        // Note: Tree rendering now handled by Lit component <agent-tree>
        // this.renderTree() - Disabled, Lit handles this
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
                <dash-empty-state
                    icon="users"
                    title="No agents found"
                    variant="centered"
                ></dash-empty-state>
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
                    <span class="tree-node-label ${domainClass}">${displayName}</span>
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
                <span class="tree-node-label ${domainClass}">${agent.name}</span>
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
     * Uses Lit components for consistent styling
     */
    async renderAgentDetailTab(agent) {
        const container = document.getElementById('agentDetailView');
        if (!container) return;

        const domainClass = Dashboard.getDomainClass(agent.domain);
        const displayDomain = agent.domain.replace(/-/g, ' ');

        // Show loading state with header first
        container.innerHTML = `
            <div class="detail-header">
                <div class="detail-title-row">
                    <dash-avatar name="${agent.name}" domain="${agent.domain}" size="lg"></dash-avatar>
                    <div style="margin-left: 12px;">
                        <h2 class="detail-title">${agent.name}</h2>
                        <p class="detail-subtitle">${agent.role}</p>
                        <dash-tag label="${displayDomain}" domain="${agent.domain}" variant="subtle" size="xs"></dash-tag>
                    </div>
                </div>
            </div>
            <div style="padding: 24px; text-align: center;">
                <dash-spinner size="lg"></dash-spinner>
            </div>
        `;

        // Fetch activity
        let activity = [];
        try {
            const response = await Dashboard.fetchAPI(`/api/agents/id/${agent.id}/activity`);
            activity = response.events || [];
        } catch (e) {
            console.error('Error loading agent activity:', e);
        }

        // Build tools list for Lit component
        const toolsJson = JSON.stringify(agent.tools || []);

        // Build activity list for Lit component
        const activityJson = JSON.stringify(activity.slice(0, 10));

        container.innerHTML = `
            <div class="detail-header">
                <div class="detail-title-row">
                    <dash-avatar name="${agent.name}" domain="${agent.domain}" size="lg"></dash-avatar>
                    <div style="margin-left: 12px;">
                        <h2 class="detail-title">${agent.name}</h2>
                        <p class="detail-subtitle">${agent.role}</p>
                        <dash-tag label="${displayDomain}" domain="${agent.domain}" variant="subtle" size="xs"></dash-tag>
                    </div>
                </div>
            </div>

            ${agent.description ? `
            <dash-detail-section title="Description" icon="file-text">
                <p>${agent.description}</p>
            </dash-detail-section>
            ` : ''}

            <dash-detail-section title="Tools" icon="wrench">
                <dash-tag-list id="agentTools" empty-text="No tools configured"></dash-tag-list>
            </dash-detail-section>

            ${agent.key_phrases && agent.key_phrases.length > 0 ? `
            <dash-detail-section title="Key Phrases" icon="message-circle">
                <div class="phrases-list">
                    ${agent.key_phrases.map(p => `<div class="detail-phrase ${domainClass}">"${p}"</div>`).join('')}
                </div>
            </dash-detail-section>
            ` : ''}

            <dash-detail-section title="Recent Activity" icon="activity">
                <dash-activity-list id="agentActivity" empty-message="No recent activity" show-time-ago></dash-activity-list>
            </dash-detail-section>
        `;

        // Set data on Lit components after they're in the DOM
        requestAnimationFrame(() => {
            const toolsList = container.querySelector('#agentTools');
            if (toolsList) {
                toolsList.items = agent.tools || [];
            }

            const activityList = container.querySelector('#agentActivity');
            if (activityList) {
                activityList.items = activity;
            }
        });

        // Show the agent detail tab
        const agentDetailTab = document.getElementById('agentDetailTab');
        if (agentDetailTab) {
            agentDetailTab.classList.add('active');
        }
    },

    /**
     * Show agent in modal (single-click quick view)
     * Uses the agent-detail-modal Lit component
     */
    async showAgentDetail(agentId) {
        const agent = this.data.agents.find(a => a.id === agentId);
        if (!agent) return;

        // Create or get the agent detail modal component
        let modalComponent = document.getElementById('agentDetailModalComponent');
        if (!modalComponent) {
            modalComponent = document.createElement('agent-detail-modal');
            modalComponent.id = 'agentDetailModalComponent';
        }

        // Set initial loading state
        modalComponent.agent = agent;
        modalComponent.activity = [];
        modalComponent.loading = true;

        // Open modal with the component
        Dashboard.openModal('agentModal', '');
        const modalContent = document.querySelector('#agentModal .modal-content');
        if (modalContent) {
            modalContent.classList.add('modal-agent');
            modalContent.innerHTML = '';
            modalContent.appendChild(modalComponent);
        }

        // Fetch activity asynchronously
        try {
            const response = await Dashboard.fetchAPI(`/api/agents/id/${agentId}/activity`);
            modalComponent.activity = response.events || [];
        } catch (e) {
            console.error('Error loading agent activity:', e);
            modalComponent.activity = [];
        }

        // Update loading state
        modalComponent.loading = false;
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

        // Update store filter for Lit component
        if (window.DashboardActions?.setAgentFilter) {
            window.DashboardActions.setAgentFilter(query);
        }
        // Note: Tree rendering handled by Lit component <agent-tree>
    },

    /**
     * Update agent activity (called from SSE events)
     */
    updateActivity(agentId) {
        const agent = this.data.agents.find(a => a.id === agentId);
        if (agent) {
            agent.last_active = new Date().toISOString();
            // Update store for Lit component
            if (window.DashboardServices?.Agent?.updateAgentActivity) {
                window.DashboardServices.Agent.updateAgentActivity(agentId);
            }
            // Note: Tree rendering handled by Lit component <agent-tree>
        }
    }
};
