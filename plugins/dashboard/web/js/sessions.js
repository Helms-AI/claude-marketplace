/**
 * Sessions Module
 * Handles session list and selection with unified conversation view
 */

const Sessions = {
    data: {
        sessions: [],
        currentSessionId: null,
        events: [],
        transcript: null
    },

    async init() {
        await this.loadSessions();
        this.render();
    },

    async loadSessions() {
        try {
            const response = await Dashboard.fetchAPI('/api/sessions');
            this.data.sessions = response.sessions || [];
        } catch (e) {
            console.error('Error loading sessions:', e);
            this.data.sessions = [];
        }
    },

    render() {
        this.renderSessionList();
        this.updateSessionCount();
    },

    updateSessionCount() {
        const countEl = document.getElementById('sessionCount');
        if (countEl) {
            countEl.textContent = this.data.sessions.length;
        }
    },

    renderSessionList() {
        const list = document.getElementById('sessionList');

        if (this.data.sessions.length === 0) {
            list.innerHTML = `
                <div class="empty-sessions">
                    <div class="empty-icon">&#9632;</div>
                    <p>No active sessions</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.data.sessions.map((session, index) => {
            const isActive = session.id === this.data.currentSessionId;
            const domains = (session.domains_involved || []).slice(0, 3);
            const phaseClass = session.phase ? `phase-${session.phase}` : '';

            return `
                <div class="session-item ${isActive ? 'active' : ''}"
                     data-session-id="${session.id}"
                     style="animation-delay: ${index * 50}ms">
                    <div class="session-item-header">
                        <span class="session-id">${session.id}</span>
                        ${session.phase ? `<span class="session-status ${phaseClass}">${session.phase}</span>` : ''}
                    </div>
                    <div class="session-item-meta">
                        <span class="meta-events">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                            ${session.event_count || 0}
                        </span>
                        ${session.handoff_count ? `
                            <span class="meta-handoffs">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                                </svg>
                                ${session.handoff_count}
                            </span>
                        ` : ''}
                    </div>
                    ${domains.length > 0 ? `
                        <div class="session-item-domains">
                            ${domains.map(d => `<span class="mini-domain domain-${d.replace(/_/g, '-')}">${this.getDomainInitial(d)}</span>`).join('')}
                            ${(session.domains_involved || []).length > 3 ? `<span class="mini-domain more">+${session.domains_involved.length - 3}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        // Add click handlers
        list.querySelectorAll('.session-item').forEach(item => {
            item.addEventListener('click', () => {
                const sessionId = item.dataset.sessionId;
                this.selectSession(sessionId);
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

    async selectSession(sessionId) {
        const previousSessionId = this.data.currentSessionId;
        this.data.currentSessionId = sessionId;

        // Update selection UI
        document.querySelectorAll('.session-item').forEach(item => {
            item.classList.toggle('active', item.dataset.sessionId === sessionId);
        });

        // Unwatch previous session if any
        if (previousSessionId && previousSessionId !== sessionId) {
            try {
                await fetch(`/api/sessions/${previousSessionId}/unwatch`, { method: 'POST' });
            } catch (e) {
                console.warn('Failed to unwatch previous session:', e);
            }
        }

        // Load session details, conversation events, and transcript
        try {
            // Fetch both conversation events and transcript (with merged timeline) in parallel
            const [conversationResponse, transcriptResponse] = await Promise.all([
                Dashboard.fetchAPI(`/api/sessions/${sessionId}/conversation`),
                Dashboard.fetchAPI(`/api/sessions/${sessionId}/transcript?merge_timeline=true`).catch(e => {
                    console.warn('Transcript not available:', e);
                    return { messages: [], subagents: {}, merged_timeline: [] };
                })
            ]);

            this.data.events = conversationResponse.events || [];
            this.data.transcript = transcriptResponse;

            this.renderConversationHeader(conversationResponse.session);
            Conversation.render(this.data.events, conversationResponse.session, transcriptResponse);

            // Start watching this session for real-time updates
            try {
                await fetch(`/api/sessions/${sessionId}/watch`, { method: 'POST' });
            } catch (e) {
                console.warn('Failed to start watching session:', e);
            }
        } catch (e) {
            console.error('Error loading session:', e);
        }
    },

    renderConversationHeader(session) {
        const header = document.getElementById('conversationHeader');

        // Build domains badges
        const domainsBadges = (session.domains_involved || [])
            .map(d => {
                const initial = this.getDomainInitial(d);
                return `<span class="header-domain domain-${d.replace(/_/g, '-')}" title="${d}">${initial}</span>`;
            })
            .join('');

        // Build artifacts list
        const artifacts = session.artifacts || [];
        const artifactsList = artifacts.slice(0, 3)
            .map(a => `<span class="header-artifact">${typeof a === 'object' ? a.name : a}</span>`)
            .join('');

        const phaseClass = session.phase ? `phase-${session.phase}` : '';

        header.innerHTML = `
            <div class="header-top-row">
                <div class="header-identity">
                    <span class="header-session-id">${session.id}</span>
                    <span class="header-phase ${phaseClass}">${session.phase || 'active'}</span>
                </div>
                <div class="header-actions">
                    <div class="header-stats">
                        <span class="header-stat">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                            ${this.data.events.length} events
                        </span>
                        ${session.handoff_count ? `
                            <span class="header-stat">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                                </svg>
                                ${session.handoff_count} handoffs
                            </span>
                        ` : ''}
                    </div>
                    <button class="delete-session-btn" title="Delete session" data-session-id="${session.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </div>
            ${session.original_request ? `
                <div class="header-request">
                    <span class="request-label">REQUEST</span>
                    <span class="request-text">${this.escapeHtml(session.original_request)}</span>
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
        const deleteBtn = header.querySelector('.delete-session-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sessionId = deleteBtn.dataset.sessionId;
                this.deleteSession(sessionId);
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
        // Add to current session if matching
        if (event.session_id === this.data.currentSessionId) {
            this.data.events.push(event);
            Conversation.addEvent(event);
        }

        // Update session list
        const existingSession = this.data.sessions.find(s => s.id === event.session_id);
        if (existingSession) {
            existingSession.event_count++;
            existingSession.current_domain = event.domain;
            existingSession.current_agent = event.agent_id;
        } else {
            this.data.sessions.unshift({
                id: event.session_id,
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

        this.renderSessionList();
        this.updateSessionCount();
    },

    addSession(sessionData) {
        // Check if session already exists
        const exists = this.data.sessions.some(s => s.id === sessionData.session_id);
        if (exists) {
            // Session exists - update it instead
            if (sessionData.full_session) {
                this.updateSession({
                    session_id: sessionData.session_id,
                    changes: {},
                    full_session: sessionData.full_session
                });
            }
            return;
        }

        // Use full_session if available, otherwise construct from basic data
        const newSession = sessionData.full_session || {
            id: sessionData.session_id,
            started_at: sessionData.started_at,
            phase: sessionData.phase || 'active',
            current_domain: null,
            current_agent: null,
            event_count: 0,
            handoff_count: 0,
            artifacts: [],
            domains_involved: sessionData.domains_involved || []
        };

        // Ensure id is set (full_session might use different key)
        if (!newSession.id && sessionData.session_id) {
            newSession.id = sessionData.session_id;
        }

        this.data.sessions.unshift(newSession);
        this.renderSessionList();
        this.updateSessionCount();

        // Highlight the new session card briefly
        setTimeout(() => {
            const newCard = document.querySelector(`.session-item[data-session-id="${newSession.id}"]`);
            if (newCard) {
                this.animateChange(newCard);
            }
        }, 50);
    },

    /**
     * Update an existing session with real-time changes (surgical DOM updates)
     * @param {Object} eventData - Contains session_id, changes, and full_session
     */
    updateSession(eventData) {
        const { session_id, changes, full_session } = eventData;

        // Update in-memory session data
        const sessionIndex = this.data.sessions.findIndex(s => s.id === session_id);
        if (sessionIndex === -1) {
            // Session not in list yet, add it
            this.data.sessions.unshift(full_session);
            this.renderSessionList();
            this.updateSessionCount();
            return;
        }

        // Merge changes into existing session
        const session = this.data.sessions[sessionIndex];
        Object.assign(session, full_session);

        // Find the DOM element for this session card
        const cardElement = document.querySelector(`.session-item[data-session-id="${session_id}"]`);
        if (cardElement) {
            this.updateSessionCardDOM(cardElement, session, changes);
        }

        // Update conversation header if this is the selected session
        if (session_id === this.data.currentSessionId) {
            this.renderConversationHeader(session);
        }
    },

    /**
     * Perform surgical DOM updates on a session card
     * @param {HTMLElement} cardElement - The session card DOM element
     * @param {Object} session - The updated session data
     * @param {Object} changes - Object describing what fields changed
     */
    updateSessionCardDOM(cardElement, session, changes) {
        // Update phase badge if changed
        if ('phase' in changes) {
            const statusEl = cardElement.querySelector('.session-status');
            if (statusEl) {
                // Remove old phase classes
                statusEl.className = 'session-status';
                if (session.phase) {
                    statusEl.classList.add(`phase-${session.phase}`);
                    statusEl.textContent = session.phase;
                }
                this.animateChange(statusEl);
            } else if (session.phase) {
                // Create status badge if it didn't exist
                const header = cardElement.querySelector('.session-item-header');
                const statusSpan = document.createElement('span');
                statusSpan.className = `session-status phase-${session.phase}`;
                statusSpan.textContent = session.phase;
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
                    textNode.textContent = ` ${session.event_count || 0}`;
                }
                this.animateChange(eventsEl);
            }
        }

        // Update handoff count if changed
        if ('handoff_count' in changes) {
            let handoffsEl = cardElement.querySelector('.meta-handoffs');
            const metaEl = cardElement.querySelector('.session-item-meta');

            if (session.handoff_count && session.handoff_count > 0) {
                if (handoffsEl) {
                    // Update existing
                    const textNode = handoffsEl.lastChild;
                    if (textNode) {
                        textNode.textContent = ` ${session.handoff_count}`;
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
                        ${session.handoff_count}
                    `;
                    metaEl.appendChild(handoffsEl);
                    this.animateChange(handoffsEl);
                }
            }
        }

        // Update domain pills if changed
        if ('domains_involved' in changes) {
            let domainsEl = cardElement.querySelector('.session-item-domains');
            const domains = (session.domains_involved || []).slice(0, 3);

            if (domains.length > 0) {
                const domainsHtml = domains.map(d =>
                    `<span class="mini-domain domain-${d.replace(/_/g, '-')}">${this.getDomainInitial(d)}</span>`
                ).join('') + (session.domains_involved.length > 3
                    ? `<span class="mini-domain more">+${session.domains_involved.length - 3}</span>`
                    : '');

                if (domainsEl) {
                    domainsEl.innerHTML = domainsHtml;
                    this.animateChange(domainsEl);
                } else {
                    // Create domains container
                    domainsEl = document.createElement('div');
                    domainsEl.className = 'session-item-domains';
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
     * Remove a session from the UI (called when session is deleted)
     * @param {string} sessionId - The session ID to remove
     */
    removeSession(sessionId) {
        // Remove from in-memory data
        this.data.sessions = this.data.sessions.filter(s => s.id !== sessionId);

        // If this was the selected session, clear the conversation view
        if (this.data.currentSessionId === sessionId) {
            this.data.currentSessionId = null;
            this.data.events = [];
            this.data.transcript = null;

            // Clear conversation header
            const header = document.getElementById('conversationHeader');
            if (header) {
                header.innerHTML = `
                    <div class="header-placeholder">
                        <span class="placeholder-icon">←</span>
                        <span>Select a session to view conversation</span>
                    </div>
                `;
            }

            // Clear conversation container
            const container = document.getElementById('conversationContainer');
            if (container) {
                container.innerHTML = `
                    <div class="conversation-empty">
                        <div class="empty-terminal">
                            <div class="terminal-line">$ awaiting session selection...</div>
                            <div class="terminal-cursor"></div>
                        </div>
                    </div>
                `;
            }
        }

        // Re-render the session list
        this.renderSessionList();
        this.updateSessionCount();
    },

    /**
     * Delete a session (with confirmation)
     * @param {string} sessionId - The session ID to delete
     */
    async deleteSession(sessionId) {
        const session = this.data.sessions.find(s => s.id === sessionId);
        if (!session) return;

        const confirmed = confirm(
            `Delete session "${sessionId}"?\n\n` +
            `This will permanently delete all files in this session's directory.\n` +
            `This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete session');
            }

            // The SSE event will handle the UI update, but we can also update immediately
            this.removeSession(sessionId);

        } catch (e) {
            console.error('Error deleting session:', e);
            alert(`Failed to delete session: ${e.message}`);
        }
    }
};
