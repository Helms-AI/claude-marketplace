/**
 * Skills Module
 * Handles skill list, search, filter, and detail views
 * With domain-grouped layout (Industrial-Editorial aesthetic)
 */

const Skills = {
    data: {
        skills: [],
        filteredSkills: [],
        collapsedDomains: new Set()
    },

    // Known domains in the marketplace ecosystem
    knownDomains: [
        'architecture', 'backend', 'data', 'devops', 'documentation',
        'frontend', 'pm', 'security', 'testing', 'user-experience'
    ],

    async init() {
        await this.loadSkills();
        this.setupSearch();
        this.setupFilter();
        this.render();
    },

    async loadSkills() {
        try {
            const response = await Dashboard.fetchAPI('/api/skills');
            this.data.skills = response.skills || [];
            this.data.filteredSkills = [...this.data.skills];
            this.populateDomainFilter();
        } catch (e) {
            console.error('Error loading skills:', e);
            this.data.skills = [];
            this.data.filteredSkills = [];
        }
    },

    populateDomainFilter() {
        const select = document.getElementById('skillDomainFilter');
        const domains = [...new Set(this.data.skills.map(s => s.domain))];

        select.innerHTML = '<option value="">All Domains</option>';
        domains.forEach(domain => {
            const option = document.createElement('option');
            option.value = domain;
            option.textContent = domain.replace(/-/g, ' ');
            option.style.textTransform = 'capitalize';
            select.appendChild(option);
        });
    },

    setupSearch() {
        const input = document.getElementById('skillSearch');
        input.addEventListener('input', () => {
            this.filterSkills();
        });
    },

    setupFilter() {
        const select = document.getElementById('skillDomainFilter');
        select.addEventListener('change', () => {
            this.filterSkills();
        });
    },

    filterSkills() {
        const searchTerm = document.getElementById('skillSearch').value.toLowerCase();
        const domainFilter = document.getElementById('skillDomainFilter').value;

        this.data.filteredSkills = this.data.skills.filter(skill => {
            const matchesSearch = !searchTerm ||
                skill.name.toLowerCase().includes(searchTerm) ||
                skill.id.toLowerCase().includes(searchTerm) ||
                skill.description.toLowerCase().includes(searchTerm);

            const matchesDomain = !domainFilter || skill.domain === domainFilter;

            return matchesSearch && matchesDomain;
        });

        this.render();
    },

    /**
     * Group skills by domain
     * Known domains appear alphabetically, External domain appears last
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

    render() {
        this.renderStats();
        this.renderGrid();
    },

    renderStats() {
        const stats = document.getElementById('skillStats');
        const totalSkills = this.data.skills.length;
        const domains = [...new Set(this.data.skills.map(s => s.domain))].length;
        const invokedSkills = this.data.skills.filter(s => s.invocation_count > 0).length;

        stats.innerHTML = `
            <div class="stat-item">
                <span class="stat-value">${totalSkills}</span>
                <span class="stat-label">Total Skills</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${domains}</span>
                <span class="stat-label">Domains</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${invokedSkills}</span>
                <span class="stat-label">Used Skills</span>
            </div>
        `;
    },

    renderGrid() {
        const grid = document.getElementById('skillGrid');

        if (this.data.filteredSkills.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">&#128269;</div>
                    <p>No skills found</p>
                </div>
            `;
            return;
        }

        const domainGroups = this.groupByDomain(this.data.filteredSkills);

        grid.innerHTML = domainGroups.map(group => this.renderDomainGroup(group)).join('');

        // Add click handlers for cards
        grid.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', () => {
                const skillId = card.dataset.skillId;
                this.showSkillDetail(skillId);
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
            ? `<div class="external-notice">These skills are not controlled by the Helms AI ecosystem</div>`
            : '';

        const cards = items.map(skill => this.renderCard(skill)).join('');

        return `
            <div class="domain-group ${isExternal ? 'domain-external' : ''} ${isCollapsed ? 'collapsed' : ''}" data-domain="${domain}">
                <div class="domain-header">
                    <div class="domain-header-left">
                        <span class="domain-accent ${domainClass}"></span>
                        <span class="domain-name">${displayName}</span>
                        <span class="domain-count">${items.length} skill${items.length !== 1 ? 's' : ''}</span>
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

    renderCard(skill) {
        const domainClass = Dashboard.getDomainClass(skill.domain);

        const agentInfo = skill.backing_agent
            ? `<div class="card-role">Backed by: ${skill.backing_agent}</div>`
            : '';

        const handoffs = [];
        if (skill.handoff_inputs.length > 0) {
            handoffs.push(`<span class="tool-tag">&#8592; ${skill.handoff_inputs.length} inputs</span>`);
        }
        if (skill.handoff_outputs.length > 0) {
            handoffs.push(`<span class="tool-tag">&#8594; ${skill.handoff_outputs.length} outputs</span>`);
        }

        const activityHtml = skill.last_invoked
            ? `<div class="card-activity"><span class="activity-indicator"></span>Invoked ${Dashboard.formatTime(skill.last_invoked)}</div>`
            : (skill.invocation_count > 0
                ? `<div class="card-activity">Invocations: ${skill.invocation_count}</div>`
                : '');

        return `
            <div class="card" data-skill-id="${skill.id}">
                <div class="card-header">
                    <span class="card-title">/${skill.id}</span>
                    <span class="card-domain ${domainClass}">${skill.domain.replace(/-/g, ' ')}</span>
                </div>
                ${agentInfo}
                ${skill.description ? `<div class="card-role">${skill.description.substring(0, 100)}${skill.description.length > 100 ? '...' : ''}</div>` : ''}
                <div class="card-tools">${handoffs.join('')}</div>
                ${activityHtml}
            </div>
        `;
    },

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

        const inputsHtml = skill.handoff_inputs.length > 0
            ? skill.handoff_inputs.map(s => `<span class="tool-tag">/${s}</span>`).join('')
            : '<span class="text-muted">None</span>';

        const outputsHtml = skill.handoff_outputs.length > 0
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
                <p>${skill.invocation_count}</p>
            </div>

            <div class="modal-section">
                <h4>Recent Invocations</h4>
                ${invocationsHtml}
            </div>
        `;

        Dashboard.openModal('skillModal', content);
    },

    updateActivity(skillId) {
        const skill = this.data.skills.find(s => s.id === skillId);
        if (skill) {
            skill.last_invoked = new Date().toISOString();
            skill.invocation_count++;
            this.render();
        }
    }
};
