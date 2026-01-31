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
        this.renderTree();
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
                <div class="tree-empty">No skills found</div>
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
                    <span class="tree-node-label">${displayName}</span>
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
                <span class="tree-node-label">/${skill.id}</span>
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
     */
    async renderSkillDetailTab(skill) {
        const container = document.getElementById('skillDetailView');
        if (!container) return;

        // Fetch invocations
        let invocations = [];
        try {
            const response = await Dashboard.fetchAPI(`/api/skills/id/${skill.id}/invocations`);
            invocations = response.invocations || [];
        } catch (e) {
            console.error('Error loading skill invocations:', e);
        }

        const domainClass = Dashboard.getDomainClass(skill.domain);

        const inputsHtml = skill.handoff_inputs?.length > 0
            ? skill.handoff_inputs.map(s => `<span class="detail-tag">/${s}</span>`).join('')
            : '<span class="detail-muted">None</span>';

        const outputsHtml = skill.handoff_outputs?.length > 0
            ? skill.handoff_outputs.map(s => `<span class="detail-tag">/${s}</span>`).join('')
            : '<span class="detail-muted">None</span>';

        const invocationsHtml = invocations.length > 0
            ? invocations.slice(0, 10).map(e => `
                <div class="activity-event">
                    <span class="event-time">${new Date(e.timestamp).toLocaleString()}</span>
                    <span class="event-type">${e.content?.tool || e.event_type}</span>
                </div>
            `).join('')
            : '<p class="detail-muted">No invocations recorded</p>';

        container.innerHTML = `
            <div class="detail-header">
                <div class="detail-title-row">
                    <h2 class="detail-title">/${skill.id}</h2>
                    <span class="detail-domain ${domainClass}">${skill.domain.replace(/-/g, ' ')}</span>
                </div>
                <p class="detail-subtitle">${skill.name}</p>
            </div>

            ${skill.description ? `
            <div class="detail-section">
                <h4>Description</h4>
                <p>${skill.description}</p>
            </div>
            ` : ''}

            ${skill.backing_agent ? `
            <div class="detail-section">
                <h4>Backing Agent</h4>
                <p>${skill.backing_agent}</p>
            </div>
            ` : ''}

            <div class="detail-section">
                <h4>Receives Handoffs From</h4>
                <div class="detail-tags">${inputsHtml}</div>
            </div>

            <div class="detail-section">
                <h4>Hands Off To</h4>
                <div class="detail-tags">${outputsHtml}</div>
            </div>

            <div class="detail-section">
                <h4>Invocation Count</h4>
                <p class="detail-stat">${skill.invocation_count || 0}</p>
            </div>

            <div class="detail-section">
                <h4>Recent Invocations</h4>
                <div class="detail-activity">${invocationsHtml}</div>
            </div>
        `;

        // Show the skill detail tab
        document.getElementById('skillDetailTab').classList.add('active');
    },

    /**
     * Show skill in modal (single-click quick view)
     * Redesigned modal with domain accent, command display, handoff flow, stats
     */
    async showSkillDetail(skillId) {
        const skill = this.data.skills.find(s => s.id === skillId);
        if (!skill) return;

        // Fetch invocations
        let invocations = [];
        try {
            const response = await Dashboard.fetchAPI(`/api/skills/id/${skillId}/invocations`);
            invocations = response.invocations || [];
        } catch (e) {
            console.error('Error loading skill invocations:', e);
        }

        const domainClass = Dashboard.getDomainClass(skill.domain);
        const displayDomain = skill.domain.replace(/-/g, ' ');

        // Format last invoked time
        const lastInvoked = skill.last_invoked 
            ? this.formatRelativeTime(new Date(skill.last_invoked))
            : 'Never';

        // Build backing agent card if available
        const backingAgentHtml = skill.backing_agent ? this.buildBackingAgentCard(skill) : '';

        // Build handoff flow visualization
        const handoffFlowHtml = this.buildHandoffFlowHtml(skill, domainClass);

        // Build invocations list with alternating rows
        const invocationsHtml = invocations.length > 0
            ? invocations.slice(0, 8).map(e => {
                const time = new Date(e.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const eventText = e.content?.tool || e.event_type.replace(/_/g, ' ');
                return `
                    <div class="modal-activity-row">
                        <span class="modal-activity-time">${time}</span>
                        <span class="modal-activity-event">${eventText}</span>
                    </div>
                `;
            }).join('')
            : '<div class="modal-empty-state" style="padding: 16px;">No invocations recorded</div>';

        const content = `
            <div class="modal-domain-accent ${domainClass}"></div>
            
            <div class="modal-header">
                <p class="modal-command ${domainClass}"><span class="modal-command-prefix">/</span><span class="modal-command-name">${skill.id}</span></p>
                <p class="modal-skill-name">${skill.name}</p>
                <span class="modal-domain-badge ${domainClass}">${displayDomain}</span>
            </div>

            ${backingAgentHtml ? `
            <div class="modal-section">
                <div class="modal-section-title">Powered By</div>
                ${backingAgentHtml}
            </div>
            ` : ''}

            <div class="modal-section">
                <div class="modal-section-title">Handoff Flow</div>
                ${handoffFlowHtml}
            </div>

            <div class="modal-section">
                <div class="modal-stats-grid">
                    <div class="modal-stat-card">
                        <div class="modal-stat-label">Invocations</div>
                        <div class="modal-stat-value">${skill.invocation_count || 0}</div>
                    </div>
                    <div class="modal-stat-card">
                        <div class="modal-stat-label">Last Invoked</div>
                        <div class="modal-stat-value" style="font-size: 16px;">${lastInvoked}</div>
                    </div>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">Recent Invocations</div>
                <div class="modal-invocations-list">${invocationsHtml}</div>
            </div>
        `;

        Dashboard.openModal('skillModal', content);
        
        // Add the modal-skill class to the modal content for styling
        const modalContent = document.querySelector('#skillModal .modal-content');
        if (modalContent) {
            modalContent.classList.add('modal-skill');
        }

        // Attach click handlers after modal opens
        this.attachSkillModalHandlers(skill);
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

        this.renderTree();
    },

    /**
     * Update skill activity (called from SSE events)
     */
    updateActivity(skillId) {
        const skill = this.data.skills.find(s => s.id === skillId);
        if (skill) {
            skill.last_invoked = new Date().toISOString();
            skill.invocation_count = (skill.invocation_count || 0) + 1;
            this.renderTree();
        }
    }
};
