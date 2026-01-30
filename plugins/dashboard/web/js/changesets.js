/**
 * Changesets Module
 * Handles changeset list and selection with unified conversation view
 */

const Changesets = {
    data: {
        changesets: [],
        currentChangesetId: null,
        currentSessionId: null, // Claude Code's native session ID (for task matching)
        events: [],
        transcript: null
    },

    async init() {
        await this.loadChangesets();
        this.render();
    },

    async loadChangesets() {
        try {
            const response = await Dashboard.fetchAPI('/api/changesets');
            this.data.changesets = response.changesets || [];
        } catch (e) {
            console.error('Error loading changesets:', e);
            this.data.changesets = [];
        }
    },

    render() {
        this.renderChangesetList();
        this.updateChangesetCount();
    },

    updateChangesetCount() {
        const countEl = document.getElementById('changesetCount');
        if (countEl) {
            countEl.textContent = this.data.changesets.length;
        }
    },

    renderChangesetList() {
        const list = document.getElementById('changesetList');

        if (this.data.changesets.length === 0) {
            list.innerHTML = `
                <div class="empty-changesets">
                    <div class="empty-icon">&#9632;</div>
                    <p>No active changesets</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.data.changesets.map((changeset, index) => {
            const isActive = changeset.id === this.data.currentChangesetId;
            const domains = (changeset.domains_involved || []).slice(0, 3);
            const phaseClass = changeset.phase ? `phase-${changeset.phase}` : '';

            return `
                <div class="changeset-item ${isActive ? 'active' : ''}"
                     data-changeset-id="${changeset.id}"
                     style="animation-delay: ${index * 50}ms">
                    <div class="changeset-item-header">
                        <span class="changeset-id">${changeset.id}</span>
                        ${changeset.phase ? `<span class="changeset-status ${phaseClass}">${changeset.phase}</span>` : ''}
                    </div>
                    <div class="changeset-item-meta">
                        <span class="meta-events">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                            ${changeset.event_count || 0}
                        </span>
                        ${changeset.handoff_count ? `
                            <span class="meta-handoffs">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                                </svg>
                                ${changeset.handoff_count}
                            </span>
                        ` : ''}
                    </div>
                    ${domains.length > 0 ? `
                        <div class="changeset-item-domains">
                            ${domains.map(d => `<span class="mini-domain domain-${d.replace(/_/g, '-')}">${this.getDomainInitial(d)}</span>`).join('')}
                            ${(changeset.domains_involved || []).length > 3 ? `<span class="mini-domain more">+${changeset.domains_involved.length - 3}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        // Add click handlers
        list.querySelectorAll('.changeset-item').forEach(item => {
            item.addEventListener('click', () => {
                const changesetId = item.dataset.changesetId;
                this.selectChangeset(changesetId);
            });
        });
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

        // Update selection UI
        document.querySelectorAll('.changeset-item').forEach(item => {
            item.classList.toggle('active', item.dataset.changesetId === changesetId);
        });

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

        header.innerHTML = `
            <div class="header-top-row">
                <div class="header-identity">
                    <span class="header-changeset-id">${changeset.id}</span>
                    <span class="header-phase ${phaseClass}">${changeset.phase || 'active'}</span>
                </div>
                <div class="header-actions">
                    <div class="header-stats">
                        <span class="header-stat">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                            ${this.data.events.length} events
                        </span>
                        ${changeset.handoff_count ? `
                            <span class="header-stat">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                                </svg>
                                ${changeset.handoff_count} handoffs
                            </span>
                        ` : ''}
                    </div>
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
        `;

        // Add click handler for delete button
        const deleteBtn = header.querySelector('.delete-changeset-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const changesetId = deleteBtn.dataset.changesetId;
                this.deleteChangeset(changesetId);
            });
        }
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
        this.renderChangesetList();
        this.updateChangesetCount();

        // Highlight the new changeset card briefly
        setTimeout(() => {
            const newCard = document.querySelector(`.changeset-item[data-changeset-id="${newChangeset.id}"]`);
            if (newCard) {
                this.animateChange(newCard);
            }
        }, 50);
    },

    /**
     * Update an existing changeset with real-time changes (surgical DOM updates)
     * @param {Object} eventData - Contains changeset_id, changes, and full_changeset
     */
    updateChangeset(eventData) {
        const { changeset_id, changes, full_changeset } = eventData;

        // Update in-memory changeset data
        const changesetIndex = this.data.changesets.findIndex(c => c.id === changeset_id);
        if (changesetIndex === -1) {
            // Changeset not in list yet, add it
            this.data.changesets.unshift(full_changeset);
            this.renderChangesetList();
            this.updateChangesetCount();
            return;
        }

        // Merge changes into existing changeset
        const changeset = this.data.changesets[changesetIndex];
        Object.assign(changeset, full_changeset);

        // Find the DOM element for this changeset card
        const cardElement = document.querySelector(`.changeset-item[data-changeset-id="${changeset_id}"]`);
        if (cardElement) {
            this.updateChangesetCardDOM(cardElement, changeset, changes);
        }

        // Update conversation header if this is the selected changeset
        if (changeset_id === this.data.currentChangesetId) {
            this.renderConversationHeader(changeset);
        }
    },

    /**
     * Perform surgical DOM updates on a changeset card
     * @param {HTMLElement} cardElement - The changeset card DOM element
     * @param {Object} changeset - The updated changeset data
     * @param {Object} changes - Object describing what fields changed
     */
    updateChangesetCardDOM(cardElement, changeset, changes) {
        // Update phase badge if changed
        if ('phase' in changes) {
            const statusEl = cardElement.querySelector('.changeset-status');
            if (statusEl) {
                // Remove old phase classes
                statusEl.className = 'changeset-status';
                if (changeset.phase) {
                    statusEl.classList.add(`phase-${changeset.phase}`);
                    statusEl.textContent = changeset.phase;
                }
                this.animateChange(statusEl);
            } else if (changeset.phase) {
                // Create status badge if it didn't exist
                const header = cardElement.querySelector('.changeset-item-header');
                const statusSpan = document.createElement('span');
                statusSpan.className = `changeset-status phase-${changeset.phase}`;
                statusSpan.textContent = changeset.phase;
                header.appendChild(statusSpan);
                this.animateChange(statusSpan);
            }
        }

        // Update event count if changed
        if ('event_count' in changes) {
            const eventsEl = cardElement.querySelector('.meta-events');
            if (eventsEl) {
                // Find text node and update it
                const textNode = eventsEl.lastChild;
                if (textNode) {
                    textNode.textContent = ` ${changeset.event_count || 0}`;
                }
                this.animateChange(eventsEl);
            }
        }

        // Update handoff count if changed
        if ('handoff_count' in changes) {
            let handoffsEl = cardElement.querySelector('.meta-handoffs');
            const metaEl = cardElement.querySelector('.changeset-item-meta');

            if (changeset.handoff_count && changeset.handoff_count > 0) {
                if (handoffsEl) {
                    // Update existing
                    const textNode = handoffsEl.lastChild;
                    if (textNode) {
                        textNode.textContent = ` ${changeset.handoff_count}`;
                    }
                    this.animateChange(handoffsEl);
                } else if (metaEl) {
                    // Create new handoff count element
                    handoffsEl = document.createElement('span');
                    handoffsEl.className = 'meta-handoffs';
                    handoffsEl.innerHTML = `
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7"></path>
                        </svg>
                        ${changeset.handoff_count}
                    `;
                    metaEl.appendChild(handoffsEl);
                    this.animateChange(handoffsEl);
                }
            }
        }

        // Update domain pills if changed
        if ('domains_involved' in changes) {
            let domainsEl = cardElement.querySelector('.changeset-item-domains');
            const domains = (changeset.domains_involved || []).slice(0, 3);

            if (domains.length > 0) {
                const domainsHtml = domains.map(d =>
                    `<span class="mini-domain domain-${d.replace(/_/g, '-')}">${this.getDomainInitial(d)}</span>`
                ).join('') + (changeset.domains_involved.length > 3
                    ? `<span class="mini-domain more">+${changeset.domains_involved.length - 3}</span>`
                    : '');

                if (domainsEl) {
                    domainsEl.innerHTML = domainsHtml;
                    this.animateChange(domainsEl);
                } else {
                    // Create domains container
                    domainsEl = document.createElement('div');
                    domainsEl.className = 'changeset-item-domains';
                    domainsEl.innerHTML = domainsHtml;
                    cardElement.appendChild(domainsEl);
                    this.animateChange(domainsEl);
                }
            }
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
