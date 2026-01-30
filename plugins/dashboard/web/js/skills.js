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

        const inputsHtml = skill.handoff_inputs?.length > 0
            ? skill.handoff_inputs.map(s => `<span class="tool-tag">/${s}</span>`).join('')
            : '<span class="text-muted">None</span>';

        const outputsHtml = skill.handoff_outputs?.length > 0
            ? skill.handoff_outputs.map(s => `<span class="tool-tag">/${s}</span>`).join('')
            : '<span class="text-muted">None</span>';

        const invocationsHtml = invocations.length > 0
            ? invocations.slice(0, 10).map(e => `
                <div class="transcript-event ${e.event_type}">
                    <div class="event-timestamp">${new Date(e.timestamp).toLocaleString()}</div>
                    <div class="event-content">${e.content?.tool || e.event_type.replace(/_/g, ' ')}</div>
                </div>
            `).join('')
            : '<p class="text-muted">No invocations recorded</p>';

        const content = `
            <div class="modal-title">/${skill.id}</div>
            <span class="card-domain ${domainClass}">${skill.domain.replace(/-/g, ' ')}</span>

            <div class="modal-section">
                <h4>Name</h4>
                <p>${skill.name}</p>
            </div>

            ${skill.description ? `
            <div class="modal-section">
                <h4>Description</h4>
                <p>${skill.description}</p>
            </div>
            ` : ''}

            ${skill.backing_agent ? `
            <div class="modal-section">
                <h4>Backing Agent</h4>
                <p>${skill.backing_agent}</p>
            </div>
            ` : ''}

            <div class="modal-section">
                <h4>Receives Handoffs From</h4>
                <div class="card-tools">${inputsHtml}</div>
            </div>

            <div class="modal-section">
                <h4>Hands Off To</h4>
                <div class="card-tools">${outputsHtml}</div>
            </div>

            <div class="modal-section">
                <h4>Invocation Count</h4>
                <p>${skill.invocation_count || 0}</p>
            </div>

            <div class="modal-section">
                <h4>Recent Invocations</h4>
                ${invocationsHtml}
            </div>
        `;

        Dashboard.openModal('skillModal', content);
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
