/**
 * Changesets Module - IDE Integration
 * Handles changeset list and selection with tab-based conversation view
 */

const Changesets = {
    data: {
        changesets: [],
        currentChangesetId: null,
        currentSessionId: null, // Claude Code's native session ID (for task matching)
        events: [],
        transcript: null,
        selectedChangesetId: null,
        expandedChangesets: new Set(), // Track which changesets are expanded
        filterQuery: ''
    },

    // Cache for command palette search
    cache: [],

    async init() {
        await this.loadChangesets();
        this.render();
    },

    async loadChangesets() {
        try {
            const response = await Dashboard.fetchAPI('/api/changesets');
            this.data.changesets = response.changesets || [];
            // Update cache for command palette search
            this.cache = this.data.changesets.map(c => ({
                changeset_id: c.id,
                ...c
            }));
        } catch (e) {
            console.error('Error loading changesets:', e);
            this.data.changesets = [];
        }
    },

    render() {
        this.renderChangesetTree();
        this.updateChangesetCount();
        // Update explorer tab counts
        if (Dashboard.updateExplorerTabCounts) {
            Dashboard.updateExplorerTabCounts();
        }
    },

    updateChangesetCount() {
        const countEl = document.getElementById('changesetCount');
        if (countEl) {
            countEl.textContent = this.data.changesets.length;
        }
        // Also update work tab count
        const workTabCount = document.getElementById('workTabCount');
        if (workTabCount) {
            workTabCount.textContent = this.data.changesets.length;
        }
    },

    /**
     * Filter changesets by search query
     * @param {string} query - Filter query
     */
    filter(query) {
        this.data.filterQuery = query.toLowerCase();
        this.renderChangesetTree();
    },

    /**
     * Render changesets as expandable tree items
     */
    renderChangesetTree() {
        const tree = document.getElementById('changesetTree');
        if (!tree) return;

        // Filter changesets if query present
        let changesets = this.data.changesets;
        if (this.data.filterQuery) {
            changesets = changesets.filter(c =>
                c.id.toLowerCase().includes(this.data.filterQuery) ||
                (c.phase || '').toLowerCase().includes(this.data.filterQuery) ||
                (c.artifacts || []).some(a => {
                    const name = typeof a === 'object' ? a.name : a;
                    return name.toLowerCase().includes(this.data.filterQuery);
                })
            );
        }

        if (changesets.length === 0) {
            tree.innerHTML = `
                <div class="tree-empty">
                    ${this.data.filterQuery ? 'No matching changesets' : 'No active changesets'}
                </div>
            `;
            return;
        }

        tree.innerHTML = changesets.map((changeset) => {
            const isActive = changeset.id === this.data.currentChangesetId;
            const isExpanded = this.data.expandedChangesets.has(changeset.id);
            const artifacts = changeset.artifacts || [];
            const hasArtifacts = artifacts.length > 0;

            // Format time
            const timeStr = changeset.started_at ? Dashboard.formatTime(changeset.started_at) : '';

            return `
                <div class="changeset-tree-item ${isExpanded ? 'expanded' : ''}" data-changeset-id="${changeset.id}">
                    <div class="changeset-tree-header ${isActive ? 'active' : ''}">
                        <span class="changeset-expand-chevron ${hasArtifacts ? '' : 'no-artifacts'} ${isExpanded ? 'expanded' : ''}">▶</span>
                        <span class="changeset-tree-icon">📁</span>
                        <span class="changeset-tree-name">${this.formatChangesetName(changeset.id)}</span>
                        ${changeset.phase ? `<span class="changeset-tree-badge phase-${changeset.phase}">${changeset.phase}</span>` : ''}
                        <span class="changeset-tree-time">${timeStr}</span>
                    </div>
                    ${hasArtifacts ? `
                        <div class="changeset-artifacts">
                            ${artifacts.map(a => this.renderArtifactItem(changeset.id, a)).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        // Add event listeners
        this.attachTreeEventListeners(tree);
    },

    /**
     * Format changeset name for display (extract meaningful part)
     * @param {string} id - Changeset ID like "20260129-143052-implement-user-auth"
     */
    formatChangesetName(id) {
        // Try to extract task name from format: YYYYMMDD-HHMMSS-task-name
        const parts = id.split('-');
        if (parts.length > 2) {
            // Skip date and time parts, join the rest
            return parts.slice(2).join('-');
        }
        return id;
    },

    /**
     * Render a single artifact item
     */
    renderArtifactItem(changesetId, artifact) {
        const name = typeof artifact === 'object' ? artifact.name : artifact;
        const icon = this.getArtifactIcon(name);
        const iconClass = this.getArtifactIconClass(name);

        return `
            <div class="artifact-item" data-changeset-id="${changesetId}" data-artifact="${name}">
                <span class="artifact-icon ${iconClass}">${icon}</span>
                <span class="artifact-name">${name}</span>
            </div>
        `;
    },

    /**
     * Get icon for artifact based on extension
     */
    getArtifactIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'md': '📝',
            'json': '{}',
            'yaml': '📋',
            'yml': '📋',
            'txt': '📄',
            'py': '🐍',
            'js': '📜',
            'ts': '📜',
            'html': '🌐',
            'css': '🎨'
        };
        return iconMap[ext] || '📄';
    },

    /**
     * Get CSS class for artifact icon coloring
     */
    getArtifactIconClass(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const classMap = {
            'md': 'markdown',
            'json': 'json',
            'yaml': 'yaml',
            'yml': 'yaml',
            'txt': 'text',
            'py': 'code',
            'js': 'code',
            'ts': 'code'
        };
        return classMap[ext] || 'text';
    },

    /**
     * Attach event listeners to tree items
     */
    attachTreeEventListeners(tree) {
        // Chevron click to expand/collapse
        tree.querySelectorAll('.changeset-expand-chevron:not(.no-artifacts)').forEach(chevron => {
            chevron.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = chevron.closest('.changeset-tree-item');
                const changesetId = item.dataset.changesetId;
                this.toggleChangeset(changesetId);
            });
        });

        // Header click to select changeset
        tree.querySelectorAll('.changeset-tree-header').forEach(header => {
            header.addEventListener('click', (e) => {
                // Ignore if clicking the chevron
                if (e.target.classList.contains('changeset-expand-chevron')) return;

                const item = header.closest('.changeset-tree-item');
                const changesetId = item.dataset.changesetId;
                this.selectChangeset(changesetId);
            });
        });

        // Artifact click to open in tab
        tree.querySelectorAll('.artifact-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const changesetId = item.dataset.changesetId;
                const artifactName = item.dataset.artifact;
                this.openArtifact(changesetId, artifactName);
            });
        });
    },

    /**
     * Toggle changeset expand/collapse state
     */
    toggleChangeset(changesetId) {
        if (this.data.expandedChangesets.has(changesetId)) {
            this.data.expandedChangesets.delete(changesetId);
        } else {
            this.data.expandedChangesets.add(changesetId);
        }
        this.renderChangesetTree();
    },

    /**
     * Open an artifact file in a new editor tab
     */
    async openArtifact(changesetId, artifactName) {
        const tabId = `artifact-${changesetId}-${artifactName}`;

        // Open the tab first
        Dashboard.openTab(tabId, artifactName, '📄');

        // Fetch artifact content
        try {
            const response = await Dashboard.fetchAPI(`/api/changesets/${changesetId}/artifacts/${encodeURIComponent(artifactName)}`);
            this.renderArtifactContent(response);
        } catch (e) {
            console.error('Error loading artifact:', e);
            this.renderArtifactError(artifactName, e.message);
        }
    },

    /**
     * Render artifact content in the artifact view
     */
    renderArtifactContent(data) {
        const view = document.getElementById('artifactView');
        if (!view) return;

        const isMarkdown = data.content_type === 'markdown';

        if (isMarkdown && typeof marked !== 'undefined') {
            // Render markdown
            view.innerHTML = `
                <div class="artifact-content markdown">
                    ${marked.parse(data.content)}
                </div>
            `;
        } else {
            // Render as plain text/code
            view.innerHTML = `
                <div class="artifact-content">
                    <pre>${this.escapeHtml(data.content)}</pre>
                </div>
            `;
        }
    },

    /**
     * Render error when artifact fails to load
     */
    renderArtifactError(artifactName, errorMessage) {
        const view = document.getElementById('artifactView');
        if (!view) return;

        view.innerHTML = `
            <div class="artifact-placeholder">
                <span class="placeholder-icon">⚠️</span>
                <span>Failed to load ${artifactName}</span>
                <span style="font-size: 12px; color: var(--text-muted)">${errorMessage}</span>
            </div>
        `;
    },

    // Keep the old renderChangesetList as alias for compatibility
    renderChangesetList() {
        this.renderChangesetTree();
    },

    getDomainInitial(domain) {
        const initials = {
            'pm': 'PM',
            'user-experience': 'UX',
            'frontend': 'FE',
            'backend': 'BE',
            'architecture': 'AR',
            'testing': 'QA',
            'devops': 'DO',
            'data': 'DA',
            'security': 'SC',
            'documentation': 'DC'
        };
        return initials[domain] || domain.substring(0, 2).toUpperCase();
    },

    /**
     * Extract unique domains from the Conversation's agent metadata.
     * Maps built-in agent types to domains as well.
     */
    extractDomainsFromAgentMetadata() {
        const domains = [];
        const agentMetadata = Conversation.agentMetadata || {};

        // Map built-in agent types to domains
        const typeToDomain = {
            'Explore': 'pm',
            'Plan': 'architecture',
            'Bash': 'devops',
            'general-purpose': 'pm'
        };

        for (const [agentId, info] of Object.entries(agentMetadata)) {
            if (info.domain) {
                domains.push(info.domain);
            } else if (info.type && typeToDomain[info.type]) {
                domains.push(typeToDomain[info.type]);
            }
        }

        return [...new Set(domains)]; // Return unique domains
    },

    async selectChangeset(changesetId) {
        const previousChangesetId = this.data.currentChangesetId;
        this.data.currentChangesetId = changesetId;
        this.data.selectedChangesetId = changesetId;

        // Update selection UI in sidebar (tree view)
        document.querySelectorAll('.changeset-tree-header').forEach(header => {
            const item = header.closest('.changeset-tree-item');
            header.classList.toggle('active', item.dataset.changesetId === changesetId);
        });

        // Open as a tab in the editor
        const shortId = changesetId.length > 25 ? changesetId.substring(0, 22) + '...' : changesetId;
        Dashboard.openTab(`changeset-${changesetId}`, shortId, '📄');

        // Unwatch previous changeset if any
        if (previousChangesetId && previousChangesetId !== changesetId) {
            try {
                await fetch(`/api/changesets/${previousChangesetId}/unwatch`, { method: 'POST' });
            } catch (e) {
                console.warn('Failed to unwatch previous changeset:', e);
            }
        }

        // Load changeset details, conversation events, and transcript
        try {
            // Fetch both conversation events and transcript (with merged timeline) in parallel
            const [conversationResponse, transcriptResponse] = await Promise.all([
                Dashboard.fetchAPI(`/api/changesets/${changesetId}/conversation`),
                Dashboard.fetchAPI(`/api/changesets/${changesetId}/transcript?merge_timeline=true`).catch(e => {
                    console.warn('Transcript not available:', e);
                    return { messages: [], subagents: {}, merged_timeline: [] };
                })
            ]);

            this.data.events = conversationResponse.events || [];
            this.data.transcript = transcriptResponse;

            // Store the Claude Code native session ID for task event matching
            this.data.currentSessionId = transcriptResponse.session_id || null;

            // Set the task session using Claude's native session ID
            Tasks.setSession(this.data.currentSessionId);

            // Set agent metadata from transcript response for proper agent naming/coloring
            if (transcriptResponse.agent_metadata) {
                Conversation.setAgentMetadata(transcriptResponse.agent_metadata);
            }

            this.renderConversationHeader(conversationResponse.changeset);
            Conversation.render(this.data.events, conversationResponse.changeset, transcriptResponse);

            // Extract tasks from existing tool calls in the transcript
            this.initializeTasksFromTranscript(transcriptResponse);

            // Start watching this changeset for real-time updates
            try {
                const watchResponse = await fetch(`/api/changesets/${changesetId}/watch`, { method: 'POST' });
                if (watchResponse.ok) {
                    const watchData = await watchResponse.json();
                    // Update session ID if returned by watch endpoint
                    if (watchData.session_id) {
                        this.data.currentSessionId = watchData.session_id;
                        Tasks.setSession(watchData.session_id);
                    }
                }
            } catch (e) {
                console.warn('Failed to start watching changeset:', e);
            }
        } catch (e) {
            console.error('Error loading changeset:', e);
        }
    },

    /**
     * Initialize tasks from existing tool calls in the transcript
     * @param {Object} transcriptResponse - The transcript response with messages
     */
    initializeTasksFromTranscript(transcriptResponse) {
        const allToolCalls = [];

        // Collect tool calls from main messages
        const messages = transcriptResponse.messages || [];
        for (const msg of messages) {
            if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
                allToolCalls.push(...msg.tool_calls);
            }
        }

        // Collect tool calls from merged timeline if available
        const timeline = transcriptResponse.merged_timeline || [];
        for (const entry of timeline) {
            const msg = entry.message;
            if (msg && msg.tool_calls && Array.isArray(msg.tool_calls)) {
                allToolCalls.push(...msg.tool_calls);
            }
        }

        // Filter for task-related tool calls and process them
        const taskToolCalls = allToolCalls.filter(tc =>
            tc.name === 'TaskCreate' || tc.name === 'TaskUpdate' || tc.name === 'TaskList' || tc.name === 'TaskGet'
        );

        if (taskToolCalls.length > 0) {
            Tasks.processTranscriptToolCalls(taskToolCalls);
        }
    },

    renderConversationHeader(changeset) {
        const header = document.getElementById('conversationHeader');

        // Collect domains from changeset metadata AND agent metadata
        const changesetDomains = changeset.domains_involved || [];
        const agentDomains = this.extractDomainsFromAgentMetadata();

        // Merge and dedupe domains
        const allDomains = [...new Set([...changesetDomains, ...agentDomains])];

        // Build domains badges
        const domainsBadges = allDomains
            .map(d => {
                const initial = this.getDomainInitial(d);
                return `<span class="header-domain domain-${d.replace(/_/g, '-')}" title="${d}">${initial}</span>`;
            })
            .join('');

        // Build artifacts list
        const artifacts = changeset.artifacts || [];
        const artifactsList = artifacts.slice(0, 3)
            .map(a => `<span class="header-artifact">${typeof a === 'object' ? a.name : a}</span>`)
            .join('');

        const phaseClass = changeset.phase ? `phase-${changeset.phase}` : '';

        // Check if there's collapsible content
        const hasCollapsibleContent = changeset.original_request || domainsBadges || artifactsList;

        header.innerHTML = `
            <div class="header-top-row">
                <div class="header-identity">
                    <span class="header-changeset-id">${changeset.id}</span>
                    <span class="header-phase ${phaseClass}">${changeset.phase || 'active'}</span>
                </div>
                <div class="header-actions">
                    <div class="header-view-toggle">
                        <button class="view-icon-btn active" data-view="unified" title="Unified view">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                <circle cx="4" cy="6" r="1.5"></circle>
                                <circle cx="4" cy="12" r="1.5"></circle>
                                <circle cx="4" cy="18" r="1.5"></circle>
                            </svg>
                        </button>
                        <button class="view-icon-btn" data-view="transcript" title="Transcript view">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </button>
                        <button class="view-icon-btn" data-view="events" title="Events view">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                        </button>
                    </div>
                    <div class="header-stats">
                        <span class="header-stat">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                            ${this.data.events.length} events
                        </span>
                        ${changeset.handoff_count ? `
                            <span class="header-stat">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                                </svg>
                                ${changeset.handoff_count} handoffs
                            </span>
                        ` : ''}
                    </div>
                    ${hasCollapsibleContent ? `
                        <button class="header-collapse-btn" title="Toggle details" aria-expanded="false">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                    ` : ''}
                    <button class="delete-changeset-btn" title="Delete changeset" data-changeset-id="${changeset.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </div>
            ${hasCollapsibleContent ? `
                <div class="header-collapsible collapsed">
                    ${changeset.original_request ? `
                        <div class="header-request">
                            <span class="request-label">REQUEST</span>
                            <span class="request-text">${this.escapeHtml(changeset.original_request)}</span>
                        </div>
                    ` : ''}
                    <div class="header-bottom-row">
                        ${domainsBadges ? `<div class="header-domains">${domainsBadges}</div>` : ''}
                        ${artifactsList ? `
                            <div class="header-artifacts">
                                <span class="artifacts-label">Artifacts:</span>
                                ${artifactsList}
                                ${artifacts.length > 3 ? `<span class="header-artifact more">+${artifacts.length - 3}</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
        `;

        // Add click handler for collapse button
        const collapseBtn = header.querySelector('.header-collapse-btn');
        const collapsibleContent = header.querySelector('.header-collapsible');
        const topRow = header.querySelector('.header-top-row');
        if (collapseBtn && collapsibleContent && topRow) {
            // Set initial collapsed state (for browsers without :has() support)
            topRow.classList.add('collapsed-sibling');

            collapseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = !collapsibleContent.classList.contains('collapsed');
                collapsibleContent.classList.toggle('collapsed');
                collapseBtn.setAttribute('aria-expanded', !isExpanded);
                collapseBtn.classList.toggle('expanded', !isExpanded);
                // Also toggle class on top row for browsers without :has() support
                topRow.classList.toggle('collapsed-sibling', isExpanded);
            });
        }

        // Add click handler for delete button
        const deleteBtn = header.querySelector('.delete-changeset-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const changesetId = deleteBtn.dataset.changesetId;
                this.deleteChangeset(changesetId);
            });
        }

        // Add click handlers for view toggle icons
        const viewBtns = header.querySelectorAll('.view-icon-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const newView = btn.dataset.view;
                if (newView !== Conversation.viewMode) {
                    // Update active state on buttons
                    viewBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    // Change view mode and re-render
                    Conversation.viewMode = newView;
                    if (this.data) {
                        const changeset = this.data.changesets.find(c => c.changeset_id === this.data.currentChangesetId);
                        Conversation.render(this.data.events, changeset, this.data.transcript);
                    }
                }
            });
        });
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    handleEvent(event) {
        // Add to current changeset if matching
        if (event.changeset_id === this.data.currentChangesetId) {
            this.data.events.push(event);
            Conversation.addEvent(event);
        }

        // Update changeset list
        const existingChangeset = this.data.changesets.find(c => c.id === event.changeset_id);
        if (existingChangeset) {
            existingChangeset.event_count++;
            existingChangeset.current_domain = event.domain;
            existingChangeset.current_agent = event.agent_id;
        } else {
            this.data.changesets.unshift({
                id: event.changeset_id,
                started_at: event.timestamp,
                phase: 'active',
                current_domain: event.domain,
                current_agent: event.agent_id,
                event_count: 1,
                handoff_count: 0,
                artifacts: [],
                domains_involved: event.domain ? [event.domain] : []
            });
        }

        this.renderChangesetList();
        this.updateChangesetCount();
    },

    addChangeset(changesetData) {
        // Check if changeset already exists
        const exists = this.data.changesets.some(c => c.id === changesetData.changeset_id);
        if (exists) {
            // Changeset exists - update it instead
            if (changesetData.full_changeset) {
                this.updateChangeset({
                    changeset_id: changesetData.changeset_id,
                    changes: {},
                    full_changeset: changesetData.full_changeset
                });
            }
            return;
        }

        // Use full_changeset if available, otherwise construct from basic data
        const newChangeset = changesetData.full_changeset || {
            id: changesetData.changeset_id,
            started_at: changesetData.started_at,
            phase: changesetData.phase || 'active',
            current_domain: null,
            current_agent: null,
            event_count: 0,
            handoff_count: 0,
            artifacts: [],
            domains_involved: changesetData.domains_involved || []
        };

        // Ensure id is set (full_changeset might use different key)
        if (!newChangeset.id && changesetData.changeset_id) {
            newChangeset.id = changesetData.changeset_id;
        }

        this.data.changesets.unshift(newChangeset);
        this.renderChangesetTree();
        this.updateChangesetCount();

        // Highlight the new changeset tree item briefly
        setTimeout(() => {
            const newItem = document.querySelector(`.changeset-tree-item[data-changeset-id="${newChangeset.id}"]`);
            if (newItem) {
                this.animateChange(newItem.querySelector('.changeset-tree-header'));
            }
        }, 50);
    },

    /**
     * Update an existing changeset with real-time changes
     * @param {Object} eventData - Contains changeset_id, changes, and full_changeset
     */
    updateChangeset(eventData) {
        const { changeset_id, changes, full_changeset } = eventData;

        // Update in-memory changeset data
        const changesetIndex = this.data.changesets.findIndex(c => c.id === changeset_id);
        if (changesetIndex === -1) {
            // Changeset not in list yet, add it
            this.data.changesets.unshift(full_changeset);
            this.renderChangesetTree();
            this.updateChangesetCount();
            return;
        }

        // Merge changes into existing changeset
        const changeset = this.data.changesets[changesetIndex];
        Object.assign(changeset, full_changeset);

        // Re-render tree for simplicity (could be optimized for surgical updates)
        this.renderChangesetTree();

        // Update conversation header if this is the selected changeset
        if (changeset_id === this.data.currentChangesetId) {
            this.renderConversationHeader(changeset);
        }
    },

    /**
     * Add animation class to highlight changed elements
     * @param {HTMLElement} element - Element to animate
     */
    animateChange(element) {
        if (!element) return;
        element.classList.add('value-changed');
        setTimeout(() => {
            element.classList.remove('value-changed');
        }, 600);
    },

    /**
     * Remove a changeset from the UI (called when changeset is deleted)
     * @param {string} changesetId - The changeset ID to remove
     */
    removeChangeset(changesetId) {
        // Remove from in-memory data
        this.data.changesets = this.data.changesets.filter(c => c.id !== changesetId);

        // If this was the selected changeset, clear the conversation view
        if (this.data.currentChangesetId === changesetId) {
            this.data.currentChangesetId = null;
            this.data.currentSessionId = null;
            this.data.events = [];
            this.data.transcript = null;

            // Clear conversation header
            const header = document.getElementById('conversationHeader');
            if (header) {
                header.innerHTML = `
                    <div class="header-placeholder">
                        <span class="placeholder-icon">←</span>
                        <span>Select a changeset to view conversation</span>
                    </div>
                `;
            }

            // Clear conversation container
            const container = document.getElementById('conversationContainer');
            if (container) {
                container.innerHTML = `
                    <div class="conversation-empty">
                        <div class="empty-terminal">
                            <div class="terminal-line">$ awaiting changeset selection...</div>
                            <div class="terminal-cursor"></div>
                        </div>
                    </div>
                `;
            }
        }

        // Re-render the changeset list
        this.renderChangesetList();
        this.updateChangesetCount();
    },

    /**
     * Delete a changeset (with confirmation)
     * @param {string} changesetId - The changeset ID to delete
     */
    async deleteChangeset(changesetId) {
        const changeset = this.data.changesets.find(c => c.id === changesetId);
        if (!changeset) return;

        const confirmed = confirm(
            `Delete changeset "${changesetId}"?\n\n` +
            `This will permanently delete all files in this changeset's directory.\n` +
            `This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/changesets/${changesetId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete changeset');
            }

            // The SSE event will handle the UI update, but we can also update immediately
            this.removeChangeset(changesetId);

        } catch (e) {
            console.error('Error deleting changeset:', e);
            alert(`Failed to delete changeset: ${e.message}`);
        }
    }
};
