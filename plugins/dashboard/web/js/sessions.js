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
        if (exists) return;

        // Add new session to the list
        this.data.sessions.unshift({
            id: sessionData.session_id,
            started_at: sessionData.started_at,
            phase: sessionData.phase || 'active',
            current_domain: null,
            current_agent: null,
            event_count: 0,
            handoff_count: 0,
            artifacts: [],
            domains_involved: sessionData.domains_involved || []
        });

        this.renderSessionList();
        this.updateSessionCount();
    }
};
