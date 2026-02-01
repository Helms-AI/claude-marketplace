/**
 * Skills Module - IDE Tree View
 * Handles skill tree view in sidebar and detail views
 */

const Skills = {
    data: {
        skills: [],
        filteredSkills: [],
        collapsedDomains: new Set(),
        selectedSkillId: null
    },

    // Known domains in the marketplace ecosystem
    knownDomains: [
        'architecture', 'backend', 'data', 'devops', 'documentation',
        'frontend', 'pm', 'security', 'testing', 'user-experience'
    ],

    // Cache for command palette search
    cache: [],

    async init() {
        await this.loadSkills();
        // Note: Tree rendering now handled by Lit component <skill-tree>
        // this.renderTree() - Disabled, Lit handles this
    },

    async loadSkills() {
        try {
            const response = await Dashboard.fetchAPI('/api/skills');
            this.data.skills = response.skills || [];
            this.data.filteredSkills = [...this.data.skills];
            this.cache = this.data.skills; // For command palette
            this.updateCount();
        } catch (e) {
            console.error('Error loading skills:', e);
            this.data.skills = [];
            this.data.filteredSkills = [];
        }
    },

    updateCount() {
        const countEl = document.getElementById('skillCount');
        if (countEl) {
            countEl.textContent = this.data.skills.length;
        }
    },

    /**
     * Group skills by domain for tree view
     */
    groupByDomain(skills) {
        const groups = {};

        skills.forEach(skill => {
            const domain = skill.domain || 'external';
            const isExternal = !this.knownDomains.includes(domain);
            const groupKey = isExternal ? 'external' : domain;

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(skill);
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
     * Render skill tree in sidebar
     */
    renderTree() {
        const container = document.getElementById('skillsTreeContent');
        if (!container) return;

        const skills = this.data.filteredSkills;
        if (skills.length === 0) {
            container.innerHTML = `
                <dash-empty-state
                    icon="zap"
                    title="No skills found"
                    variant="centered"
                ></dash-empty-state>
            `;
            return;
        }

        const domainGroups = this.groupByDomain(skills);

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

        const skillNodes = items.map(skill => this.renderSkillNode(skill)).join('');

        return `
            <div class="tree-domain-group ${isExternal ? 'external' : ''}" data-domain="${domain}">
                <div class="tree-node tree-node-domain ${isCollapsed ? 'collapsed' : ''}" data-expanded="${!isCollapsed}">
                    <span class="tree-chevron">${isCollapsed ? '▸' : '▾'}</span>
                    <span class="tree-domain-accent ${domainClass}"></span>
                    <span class="tree-node-label ${domainClass}">${displayName}</span>
                    <span class="tree-node-count">${items.length}</span>
                </div>
                <div class="tree-children ${isCollapsed ? 'hidden' : ''}">
                    ${skillNodes}
                </div>
            </div>
        `;
    },

    /**
     * Render a single skill node
     */
    renderSkillNode(skill) {
        const domainClass = Dashboard.getDomainClass(skill.domain);
        const isActive = skill.last_invoked ? 'active' : '';
        const isSelected = this.data.selectedSkillId === skill.id;
        const hasHandoffs = skill.handoff_inputs?.length > 0 || skill.handoff_outputs?.length > 0;

        return `
            <div class="tree-node tree-node-leaf ${isActive} ${isSelected ? 'selected' : ''}"
                 data-skill-id="${skill.id}"
                 title="${skill.description || skill.name}">
                <span class="tree-node-icon ${domainClass}">⚡</span>
                <span class="tree-node-label ${domainClass}">/${skill.id}</span>
                ${hasHandoffs ? '<span class="tree-node-badge handoff-badge">↔</span>' : ''}
                ${skill.invocation_count > 0 ? `<span class="tree-node-badge count-badge">${skill.invocation_count}</span>` : ''}
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

        // Skill leaf node click
        container.querySelectorAll('.tree-node-leaf').forEach(node => {
            node.addEventListener('click', () => {
                const skillId = node.dataset.skillId;
                this.selectSkill(skillId);
            });

            // Double-click to open in tab
            node.addEventListener('dblclick', () => {
                const skillId = node.dataset.skillId;
                this.openSkillTab(skillId);
            });
        });
    },

    /**
     * Select a skill in the tree
     */
    selectSkill(skillId) {
        // Update selection state
        this.data.selectedSkillId = skillId;

        // Update tree UI
        document.querySelectorAll('#skillsTreeContent .tree-node-leaf').forEach(node => {
            node.classList.toggle('selected', node.dataset.skillId === skillId);
        });

        // Show skill detail in modal (single-click)
        this.showSkillDetail(skillId);
    },

    /**
     * Open skill in a new tab
     */
    openSkillTab(skillId) {
        const skill = this.data.skills.find(s => s.id === skillId);
        if (!skill) return;

        Dashboard.openTab(`skill-${skillId}`, '/' + skill.id, '⚡');
        this.renderSkillDetailTab(skill);
    },

    /**
     * Render skill detail in the editor tab
     * Uses Lit components for consistent styling
     */
    async renderSkillDetailTab(skill) {
        const container = document.getElementById('skillDetailView');
        if (!container) return;

        const domainClass = Dashboard.getDomainClass(skill.domain);
        const displayDomain = skill.domain.replace(/-/g, ' ');

        // Show loading state with header first
        container.innerHTML = `
            <div class="detail-header">
                <div class="detail-title-row" style="display: flex; align-items: center; gap: 12px;">
                    <dash-icon name="zap" size="24" style="color: var(--${domainClass.replace('domain-', 'domain-')}, var(--accent-color));"></dash-icon>
                    <div>
                        <h2 class="detail-title" style="font-family: var(--font-mono);">/${skill.id}</h2>
                        <p class="detail-subtitle">${skill.name}</p>
                        <dash-tag label="${displayDomain}" domain="${skill.domain}" variant="subtle" size="xs"></dash-tag>
                    </div>
                </div>
            </div>
            <div style="padding: 24px; text-align: center;">
                <dash-spinner size="lg"></dash-spinner>
            </div>
        `;

        // Fetch invocations
        let invocations = [];
        try {
            const response = await Dashboard.fetchAPI(`/api/skills/id/${skill.id}/invocations`);
            invocations = response.invocations || [];
        } catch (e) {
            console.error('Error loading skill invocations:', e);
        }

        // Build handoff items for tag lists
        const inputItems = (skill.handoff_inputs || []).map(s => ({ label: s, prefix: '/' }));
        const outputItems = (skill.handoff_outputs || []).map(s => ({ label: s, prefix: '/' }));

        container.innerHTML = `
            <div class="detail-header">
                <div class="detail-title-row" style="display: flex; align-items: center; gap: 12px;">
                    <dash-icon name="zap" size="24" style="color: var(--${domainClass.replace('domain-', 'domain-')}, var(--accent-color));"></dash-icon>
                    <div>
                        <h2 class="detail-title" style="font-family: var(--font-mono);">/${skill.id}</h2>
                        <p class="detail-subtitle">${skill.name}</p>
                        <dash-tag label="${displayDomain}" domain="${skill.domain}" variant="subtle" size="xs"></dash-tag>
                    </div>
                </div>
            </div>

            ${skill.description ? `
            <dash-detail-section title="Description" icon="file-text">
                <p>${skill.description}</p>
            </dash-detail-section>
            ` : ''}

            ${skill.backing_agent ? `
            <dash-detail-section title="Backing Agent" icon="bot">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <dash-avatar name="${skill.backing_agent}" domain="${skill.domain}" size="sm"></dash-avatar>
                    <span>${skill.backing_agent}</span>
                </div>
            </dash-detail-section>
            ` : ''}

            <dash-detail-section title="Receives Handoffs From" icon="arrow-down-left">
                <dash-tag-list id="skillInputs" prefix="/" empty-text="None"></dash-tag-list>
            </dash-detail-section>

            <dash-detail-section title="Hands Off To" icon="arrow-up-right">
                <dash-tag-list id="skillOutputs" prefix="/" empty-text="None"></dash-tag-list>
            </dash-detail-section>

            <dash-detail-section title="Statistics" icon="bar-chart-2">
                <div style="display: flex; gap: 24px;">
                    <div>
                        <div style="font-size: 24px; font-weight: 600; color: var(--accent-color);">${skill.invocation_count || 0}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">Invocations</div>
                    </div>
                    <div>
                        <div style="font-size: 16px; font-weight: 500; color: var(--text-secondary);">${skill.last_invoked ? this.formatRelativeTime(new Date(skill.last_invoked)) : 'Never'}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">Last Invoked</div>
                    </div>
                </div>
            </dash-detail-section>

            <dash-detail-section title="Recent Invocations" icon="history">
                <dash-activity-list id="skillInvocations" empty-message="No invocations recorded" show-time-ago></dash-activity-list>
            </dash-detail-section>
        `;

        // Set data on Lit components after they're in the DOM
        requestAnimationFrame(() => {
            const inputsList = container.querySelector('#skillInputs');
            if (inputsList) {
                inputsList.items = skill.handoff_inputs || [];
            }

            const outputsList = container.querySelector('#skillOutputs');
            if (outputsList) {
                outputsList.items = skill.handoff_outputs || [];
            }

            const invocationsList = container.querySelector('#skillInvocations');
            if (invocationsList) {
                invocationsList.items = invocations.map(inv => ({
                    timestamp: inv.timestamp,
                    event_type: inv.content?.tool || inv.event_type,
                    icon: 'play'
                }));
            }
        });

        // Show the skill detail tab
        const skillDetailTab = document.getElementById('skillDetailTab');
        if (skillDetailTab) {
            skillDetailTab.classList.add('active');
        }
    },

    /**
     * Show skill in modal (single-click quick view)
     * Uses the skill-detail-modal Lit component
     */
    async showSkillDetail(skillId) {
        const skill = this.data.skills.find(s => s.id === skillId);
        if (!skill) return;

        // Create or get the skill detail modal component
        let modalComponent = document.getElementById('skillDetailModalComponent');
        if (!modalComponent) {
            modalComponent = document.createElement('skill-detail-modal');
            modalComponent.id = 'skillDetailModalComponent';
        }

        // Try to find the backing agent
        const backingAgent = skill.backing_agent && typeof Agents !== 'undefined'
            ? Agents.data.agents.find(a => a.name === skill.backing_agent || a.id === skill.backing_agent)
            : null;

        // Set initial loading state
        modalComponent.skill = skill;
        modalComponent.invocations = [];
        modalComponent.backingAgent = backingAgent;
        modalComponent.loading = true;

        // Open modal with the component
        Dashboard.openModal('skillModal', '');
        const modalContent = document.querySelector('#skillModal .modal-content');
        if (modalContent) {
            modalContent.classList.add('modal-skill');
            modalContent.innerHTML = '';
            modalContent.appendChild(modalComponent);
        }

        // Fetch invocations asynchronously
        try {
            const response = await Dashboard.fetchAPI(`/api/skills/id/${skillId}/invocations`);
            modalComponent.invocations = response.invocations || [];
        } catch (e) {
            console.error('Error loading skill invocations:', e);
            modalComponent.invocations = [];
        }

        // Update loading state
        modalComponent.loading = false;

        // Attach event handlers for navigation
        modalComponent.addEventListener('agent-click', (e) => {
            const agentName = e.detail.agentName;
            Dashboard.closeModal('skillModal');
            if (typeof Agents !== 'undefined') {
                const agent = Agents.data.agents.find(a =>
                    a.name === agentName || a.id === agentName
                );
                if (agent) {
                    setTimeout(() => Agents.showAgentDetail(agent.id), 150);
                }
            }
        });

        modalComponent.addEventListener('skill-click', (e) => {
            const targetSkillId = e.detail.skillId;
            Dashboard.closeModal('skillModal');
            setTimeout(() => this.showSkillDetail(targetSkillId), 150);
        });
    },

    /**
     * Build backing agent card HTML
     */
    buildBackingAgentCard(skill) {
        const domainClass = Dashboard.getDomainClass(skill.domain);
        
        // Try to find the agent in the Agents cache
        const agent = typeof Agents !== 'undefined' && Agents.data.agents 
            ? Agents.data.agents.find(a => a.name === skill.backing_agent || a.id === skill.backing_agent)
            : null;

        const agentRole = agent?.role || 'Agent';
        const initials = skill.backing_agent.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        return `
            <div class="modal-agent-link ${domainClass}" data-agent-name="${skill.backing_agent}" tabindex="0">
                <div class="modal-agent-link-icon modal-avatar ${domainClass}">${initials}</div>
                <div class="modal-agent-link-info">
                    <div class="modal-agent-link-name">${skill.backing_agent}</div>
                    <div class="modal-agent-link-role">${agentRole}</div>
                </div>
                <span class="modal-agent-link-arrow">→</span>
            </div>
        `;
    },

    /**
     * Build handoff flow visualization HTML with SVG connectors
     */
    buildHandoffFlowHtml(skill, domainClass) {
        const inputs = skill.handoff_inputs || [];
        const outputs = skill.handoff_outputs || [];

        // If no handoffs, show appropriate message
        if (inputs.length === 0 && outputs.length === 0) {
            return `
                <div class="modal-handoff-flow">
                    <div class="modal-empty-state">No handoff relationships defined</div>
                </div>
            `;
        }

        // Build input nodes with label
        const inputNodesHtml = inputs.length > 0
            ? `<div class="handoff-flow-label">Receives From</div>` +
              inputs.map(s => `<div class="handoff-node" data-skill-id="${s}" tabindex="0" title="/${s}">/${s}</div>`).join('')
            : '<div class="handoff-flow-label">Receives From</div><div class="modal-empty-state">No upstream skills</div>';

        // Build output nodes with label
        const outputNodesHtml = outputs.length > 0
            ? `<div class="handoff-flow-label">Hands Off To</div>` +
              outputs.map(s => `<div class="handoff-node" data-skill-id="${s}" tabindex="0" title="/${s}">/${s}</div>`).join('')
            : '<div class="handoff-flow-label">Hands Off To</div><div class="modal-empty-state">Terminal skill</div>';

        return `
            <div class="modal-handoff-flow">
                <div class="handoff-flow-container" id="handoffFlowContainer">
                    <div class="handoff-flow-column inputs">
                        ${inputNodesHtml}
                    </div>
                    <div class="handoff-flow-column center">
                        <div class="handoff-flow-label">Current Skill</div>
                        <div class="handoff-node handoff-node-current ${domainClass}">/${skill.id}</div>
                    </div>
                    <div class="handoff-flow-column outputs">
                        ${outputNodesHtml}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Attach click handlers for skill modal interactive elements
     */
    attachSkillModalHandlers(skill) {
        // Handle backing agent click
        const agentLink = document.querySelector('.modal-agent-link');
        if (agentLink) {
            const handleAgentClick = () => {
                const agentName = agentLink.dataset.agentName;
                // Close skill modal
                Dashboard.closeModal('skillModal');
                // Find and open agent modal
                if (typeof Agents !== 'undefined') {
                    const agent = Agents.data.agents.find(a => 
                        a.name === agentName || a.id === agentName
                    );
                    if (agent) {
                        setTimeout(() => Agents.showAgentDetail(agent.id), 150);
                    }
                }
            };
            agentLink.addEventListener('click', handleAgentClick);
            agentLink.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleAgentClick();
            });
        }

        // Handle handoff node clicks
        document.querySelectorAll('.handoff-node:not(.handoff-node-current)').forEach(node => {
            const handleNodeClick = () => {
                const targetSkillId = node.dataset.skillId;
                if (targetSkillId) {
                    // Close current modal
                    Dashboard.closeModal('skillModal');
                    // Open new skill modal after animation
                    setTimeout(() => this.showSkillDetail(targetSkillId), 150);
                }
            };
            node.addEventListener('click', handleNodeClick);
            node.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleNodeClick();
            });
        });
    },

    /**
     * Format a date as relative time (e.g., "2 hours ago")
     */
    formatRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    },

    /**
     * Filter skills based on search query
     */
    filter(query) {
        const searchTerm = query.toLowerCase();

        this.data.filteredSkills = this.data.skills.filter(skill => {
            return !searchTerm ||
                skill.name.toLowerCase().includes(searchTerm) ||
                skill.id.toLowerCase().includes(searchTerm) ||
                (skill.description || '').toLowerCase().includes(searchTerm) ||
                skill.domain.toLowerCase().includes(searchTerm);
        });

        // Update store filter for Lit component
        if (window.DashboardActions?.setSkillFilter) {
            window.DashboardActions.setSkillFilter(query);
        }
        // Note: Tree rendering handled by Lit component <skill-tree>
    },

    /**
     * Update skill activity (called from SSE events)
     */
    updateActivity(skillId) {
        const skill = this.data.skills.find(s => s.id === skillId);
        if (skill) {
            skill.last_invoked = new Date().toISOString();
            skill.invocation_count = (skill.invocation_count || 0) + 1;
            // Update store for Lit component
            if (window.DashboardServices?.Skill?.updateSkillActivity) {
                window.DashboardServices.Skill.updateSkillActivity(skillId);
            }
            // Note: Tree rendering handled by Lit component <skill-tree>
        }
    }
};
