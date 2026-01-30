/**
 * Conversation Module - Chat-Style Unified View
 * Industrial-editorial aesthetic with real-time SSE updates
 * Supports both metadata events and full Claude Code transcripts
 */

const Conversation = {
    container: null,
    lastDomain: null,
    messageIndex: 0,
    currentTranscript: null,
    viewMode: 'unified', // 'unified' | 'events' | 'transcript'

    // Domain initials for avatars
    domainInitials: {
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
    },

    // Domain colors (matching CSS variables)
    domainColors: {
        'pm': '#6366f1',
        'user-experience': '#f472b6',
        'frontend': '#22d3ee',
        'backend': '#4ade80',
        'architecture': '#a78bfa',
        'testing': '#facc15',
        'devops': '#fb923c',
        'data': '#60a5fa',
        'security': '#f87171',
        'documentation': '#a3e635'
    },

    init() {
        this.container = document.getElementById('conversationContainer');
    },

    render(events, session, transcript = null) {
        if (!this.container) this.init();

        this.lastDomain = null;
        this.messageIndex = 0;
        this.currentTranscript = transcript;

        const hasEvents = events && events.length > 0;
        const hasTranscript = transcript && transcript.messages && transcript.messages.length > 0;
        const hasMergedTimeline = transcript && transcript.merged_timeline && transcript.merged_timeline.length > 0;

        if (!hasEvents && !hasTranscript && !hasMergedTimeline) {
            this.container.innerHTML = `
                <div class="conversation-empty">
                    <div class="empty-terminal">
                        <div class="terminal-line">$ session loaded: ${session?.id || 'unknown'}</div>
                        <div class="terminal-line">$ no events or transcript data</div>
                        <div class="terminal-cursor"></div>
                    </div>
                </div>
            `;
            return;
        }

        // Build conversation HTML with view toggle
        let html = this.renderViewToggle(hasEvents, hasTranscript || hasMergedTimeline);
        html += '<div class="chat-stream">';

        if (this.viewMode === 'transcript' && (hasTranscript || hasMergedTimeline)) {
            // Use merged timeline if available (inline subagents), otherwise fall back
            if (hasMergedTimeline) {
                html += this.renderMergedTimeline(transcript.merged_timeline);
            } else {
                html += this.renderTranscriptMessages(transcript);
            }
        } else if (this.viewMode === 'events' && hasEvents) {
            // Render events only
            events.forEach((event, index) => {
                html += this.renderMessage(event, index);
            });
        } else {
            // Unified view: prefer merged timeline for inline subagents
            if (hasMergedTimeline) {
                html += this.renderMergedTimeline(transcript.merged_timeline);
            } else {
                html += this.renderUnifiedView(events, transcript);
            }
        }

        html += '</div>';

        // Note: Subagents section removed - now shown inline via merged_timeline

        this.container.innerHTML = html;

        // Add view toggle event listeners
        this.bindViewToggle();

        // Scroll to bottom
        this.container.scrollTop = this.container.scrollHeight;

        // Trigger staggered animations
        requestAnimationFrame(() => {
            const messages = this.container.querySelectorAll('.chat-message, .chat-divider, .chat-decision, .transcript-message, .subagent-context');
            messages.forEach((msg, i) => {
                msg.style.animationDelay = `${Math.min(i * 30, 500)}ms`;
                msg.classList.add('animate-in');
            });
        });
    },

    renderViewToggle(hasEvents, hasTranscript) {
        if (!hasEvents && !hasTranscript) return '';

        return `
            <div class="view-toggle">
                <button class="toggle-btn ${this.viewMode === 'unified' ? 'active' : ''}" data-view="unified" title="Show unified timeline">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <circle cx="4" cy="6" r="1"></circle>
                        <circle cx="4" cy="12" r="1"></circle>
                        <circle cx="4" cy="18" r="1"></circle>
                    </svg>
                    Unified
                </button>
                ${hasTranscript ? `
                    <button class="toggle-btn ${this.viewMode === 'transcript' ? 'active' : ''}" data-view="transcript" title="Show full transcript">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Transcript
                    </button>
                ` : ''}
                ${hasEvents ? `
                    <button class="toggle-btn ${this.viewMode === 'events' ? 'active' : ''}" data-view="events" title="Show metadata events">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        Events
                    </button>
                ` : ''}
            </div>
        `;
    },

    bindViewToggle() {
        const buttons = this.container.querySelectorAll('.toggle-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const newView = btn.dataset.view;
                if (newView !== this.viewMode) {
                    this.viewMode = newView;
                    // Re-render with current data
                    if (Sessions && Sessions.data) {
                        const session = Sessions.data.sessions.find(s => s.id === Sessions.data.currentSessionId);
                        this.render(Sessions.data.events, session, Sessions.data.transcript);
                    }
                }
            });
        });
    },

    renderUnifiedView(events, transcript) {
        let html = '';

        // Prefer merged timeline for inline subagents
        if (transcript && transcript.merged_timeline && transcript.merged_timeline.length > 0) {
            html += this.renderMergedTimeline(transcript.merged_timeline);
        } else if (transcript && transcript.messages && transcript.messages.length > 0) {
            html += this.renderTranscriptMessages(transcript);
        } else if (events && events.length > 0) {
            // Fall back to events-only view
            events.forEach((event, index) => {
                html += this.renderMessage(event, index);
            });
        }

        return html;
    },

    renderMergedTimeline(mergedTimeline) {
        let html = '';
        let currentSource = null;
        let inSubagent = false;

        mergedTimeline.forEach((entry, index) => {
            const { message, source, timestamp } = entry;
            const isSubagent = source !== 'main';

            // Handle subagent context transitions
            if (isSubagent && !inSubagent) {
                // Starting a subagent section
                html += this.renderSubagentContextStart(source);
                inSubagent = true;
                currentSource = source;
            } else if (!isSubagent && inSubagent) {
                // Ending a subagent section
                html += this.renderSubagentContextEnd(currentSource);
                inSubagent = false;
                currentSource = null;
            } else if (isSubagent && currentSource !== source) {
                // Switching between subagents
                html += this.renderSubagentContextEnd(currentSource);
                html += this.renderSubagentContextStart(source);
                currentSource = source;
            }

            // Render the message
            if (message.role === 'user') {
                html += this.renderTimelineUserMessage(message, isSubagent, source);
            } else if (message.role === 'assistant') {
                html += this.renderTimelineAssistantMessage(message, isSubagent, source);
            }
        });

        // Close any open subagent context
        if (inSubagent) {
            html += this.renderSubagentContextEnd(currentSource);
        }

        return html;
    },

    renderSubagentContextStart(agentId) {
        return `
            <div class="subagent-context subagent-context-start" data-agent-id="${agentId}">
                <div class="subagent-context-line"></div>
                <div class="subagent-context-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Agent ${this.escapeHtml(agentId)} started
                </div>
                <div class="subagent-context-line"></div>
            </div>
        `;
    },

    renderSubagentContextEnd(agentId) {
        return `
            <div class="subagent-context subagent-context-end" data-agent-id="${agentId}">
                <div class="subagent-context-line"></div>
                <div class="subagent-context-label end-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Agent ${this.escapeHtml(agentId)} completed
                </div>
                <div class="subagent-context-line"></div>
            </div>
        `;
    },

    renderTimelineUserMessage(msg, isSubagent, source) {
        const time = this.formatTime(msg.timestamp);
        const text = msg.text || '';

        // Skip tool_result only messages (technical noise)
        if (!text && msg.content && msg.content.every(c => c.type === 'tool_result')) {
            return '';
        }

        const subagentClass = isSubagent ? 'is-subagent subagent-indent' : '';

        return `
            <div class="chat-message transcript-message user-message ${subagentClass}" data-source="${source}">
                <div class="message-body">
                    <div class="message-header">
                        <span class="message-domain user">USER</span>
                        ${isSubagent ? `<span class="subagent-badge">to Agent ${this.escapeHtml(source)}</span>` : ''}
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-content">
                        ${this.formatTranscriptContent(text)}
                    </div>
                </div>
                <div class="message-avatar user-avatar ${isSubagent ? 'subagent-avatar' : ''}">
                    <span class="avatar-initial">U</span>
                </div>
            </div>
        `;
    },

    renderTimelineAssistantMessage(msg, isSubagent, source) {
        const time = this.formatTime(msg.timestamp);
        const text = msg.text || '';
        const toolCalls = msg.tool_calls || [];

        // Determine domain/agent styling
        let domain = 'pm';
        let initial = 'AI';
        let color = '#6366f1';

        if (isSubagent) {
            initial = source.substring(0, 2).toUpperCase();
            color = '#a78bfa'; // Subagent color
        }

        // Skip empty messages
        if (!text && toolCalls.length === 0) {
            return '';
        }

        let contentHtml = '';

        // Add text content
        if (text) {
            contentHtml += `<div class="transcript-text">${this.formatTranscriptContent(text)}</div>`;
        }

        // Add tool calls
        if (toolCalls.length > 0) {
            contentHtml += '<div class="transcript-tools">';
            toolCalls.forEach(tool => {
                contentHtml += this.renderToolCall(tool);
            });
            contentHtml += '</div>';
        }

        const subagentClass = isSubagent ? 'is-subagent subagent-indent subagent-message' : '';

        return `
            <div class="chat-message transcript-message agent-message ${subagentClass}" data-domain="${domain}" data-source="${source}">
                <div class="message-avatar ${isSubagent ? 'subagent-avatar' : ''}" style="--domain-color: ${color}">
                    <span class="avatar-initial">${initial}</span>
                    <span class="avatar-pulse"></span>
                </div>
                <div class="message-body">
                    <div class="message-header">
                        <span class="message-domain" style="--domain-color: ${color}">
                            ${isSubagent ? `Agent ${this.escapeHtml(source)}` : 'Claude'}
                        </span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-content">
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
    },

    renderTranscriptMessages(transcript) {
        let html = '';

        transcript.messages.forEach((msg, index) => {
            if (msg.role === 'user') {
                html += this.renderTranscriptUserMessage(msg);
            } else if (msg.role === 'assistant') {
                html += this.renderTranscriptAssistantMessage(msg);
            }
        });

        return html;
    },

    renderTranscriptUserMessage(msg) {
        const time = this.formatTime(msg.timestamp);
        const text = msg.text || '';

        // Skip tool_result only messages (technical noise)
        if (!text && msg.content && msg.content.every(c => c.type === 'tool_result')) {
            return '';
        }

        return `
            <div class="chat-message transcript-message user-message">
                <div class="message-body">
                    <div class="message-header">
                        <span class="message-domain user">USER</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-content">
                        ${this.formatTranscriptContent(text)}
                    </div>
                </div>
                <div class="message-avatar user-avatar">
                    <span class="avatar-initial">U</span>
                </div>
            </div>
        `;
    },

    renderTranscriptAssistantMessage(msg) {
        const time = this.formatTime(msg.timestamp);
        const text = msg.text || '';
        const toolCalls = msg.tool_calls || [];
        const agentId = msg.agent_id;

        // Determine domain/agent styling
        let domain = 'pm';
        let initial = 'AI';
        let color = '#6366f1';

        if (agentId) {
            initial = agentId.substring(0, 2).toUpperCase();
            color = '#a78bfa'; // Subagent color
        }

        // Skip empty messages
        if (!text && toolCalls.length === 0) {
            return '';
        }

        let contentHtml = '';

        // Add text content
        if (text) {
            contentHtml += `<div class="transcript-text">${this.formatTranscriptContent(text)}</div>`;
        }

        // Add tool calls
        if (toolCalls.length > 0) {
            contentHtml += '<div class="transcript-tools">';
            toolCalls.forEach(tool => {
                contentHtml += this.renderToolCall(tool);
            });
            contentHtml += '</div>';
        }

        return `
            <div class="chat-message transcript-message agent-message ${agentId ? 'subagent-message' : ''}" data-domain="${domain}">
                <div class="message-avatar" style="--domain-color: ${color}">
                    <span class="avatar-initial">${initial}</span>
                    <span class="avatar-pulse"></span>
                </div>
                <div class="message-body">
                    <div class="message-header">
                        <span class="message-domain" style="--domain-color: ${color}">
                            ${agentId ? `Agent ${agentId}` : 'Claude'}
                        </span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-content">
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
    },

    renderToolCall(tool) {
        const name = tool.name || 'Unknown Tool';
        const input = tool.input || {};

        // Format input preview
        let inputPreview = '';
        if (typeof input === 'object') {
            const keys = Object.keys(input);
            if (keys.length > 0) {
                // Show first few params
                const previewKeys = keys.slice(0, 2);
                inputPreview = previewKeys.map(k => {
                    let val = input[k];
                    if (typeof val === 'string') {
                        val = val.length > 50 ? val.substring(0, 50) + '...' : val;
                    } else if (typeof val === 'object') {
                        val = '[object]';
                    }
                    return `${k}: ${val}`;
                }).join(', ');
                if (keys.length > 2) {
                    inputPreview += ` (+${keys.length - 2} more)`;
                }
            }
        }

        return `
            <div class="tool-call-card">
                <span class="tool-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                    </svg>
                </span>
                <span class="tool-name">${this.escapeHtml(name)}</span>
                ${inputPreview ? `<span class="tool-params">${this.escapeHtml(inputPreview)}</span>` : ''}
            </div>
        `;
    },

    formatTranscriptContent(text) {
        if (!text) return '';

        // Escape HTML first
        let escaped = this.escapeHtml(text);

        // Convert markdown-style code blocks to pre
        escaped = escaped.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>');

        // Convert inline code
        escaped = escaped.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

        // Convert newlines to br
        escaped = escaped.replace(/\n/g, '<br>');

        return escaped;
    },

    addEvent(event) {
        if (!this.container) this.init();

        // Remove empty state if present
        const emptyState = this.container.querySelector('.conversation-empty');
        if (emptyState) {
            this.container.innerHTML = '<div class="chat-stream"></div>';
        }

        const stream = this.container.querySelector('.chat-stream');
        if (!stream) return;

        const messageHtml = this.renderMessage(event, this.messageIndex++);
        stream.insertAdjacentHTML('beforeend', messageHtml);

        // Animate new message
        const newMessage = stream.lastElementChild;
        if (newMessage) {
            newMessage.classList.add('animate-in', 'new-message');
        }

        // Scroll to bottom smoothly
        this.container.scrollTo({
            top: this.container.scrollHeight,
            behavior: 'smooth'
        });
    },

    addTranscriptMessage(message, source) {
        /**
         * Add a new transcript message from SSE real-time update.
         * @param {Object} message - The message object with role, text, tool_calls, timestamp
         * @param {string} source - 'main' or the agent_id
         */
        if (!this.container) this.init();

        // Remove empty state if present
        const emptyState = this.container.querySelector('.conversation-empty');
        if (emptyState) {
            this.container.innerHTML = this.renderViewToggle(false, true) + '<div class="chat-stream"></div>';
            this.bindViewToggle();
        }

        const stream = this.container.querySelector('.chat-stream');
        if (!stream) return;

        const isSubagent = source !== 'main';
        let messageHtml = '';

        // Check if we need to add/close subagent context markers
        if (isSubagent) {
            // Check if we're already in a subagent context for this agent
            const lastContext = stream.querySelector('.subagent-context-start[data-agent-id]:last-of-type');
            const lastContextAgentId = lastContext?.dataset?.agentId;

            // Check if there's an open subagent context that needs closing
            const hasOpenContext = lastContext && !stream.querySelector(`.subagent-context-end[data-agent-id="${lastContextAgentId}"]`);

            if (!hasOpenContext || lastContextAgentId !== source) {
                // Close previous if different agent
                if (hasOpenContext && lastContextAgentId !== source) {
                    messageHtml += this.renderSubagentContextEnd(lastContextAgentId);
                }
                // Start new subagent context if not already open for this agent
                if (!hasOpenContext || lastContextAgentId !== source) {
                    messageHtml += this.renderSubagentContextStart(source);
                }
            }
        } else {
            // Check if we need to close any open subagent context
            const openContexts = stream.querySelectorAll('.subagent-context-start');
            openContexts.forEach(ctx => {
                const agentId = ctx.dataset.agentId;
                const hasEnd = stream.querySelector(`.subagent-context-end[data-agent-id="${agentId}"]`);
                if (!hasEnd) {
                    messageHtml += this.renderSubagentContextEnd(agentId);
                }
            });
        }

        // Render the message
        if (message.role === 'user') {
            messageHtml += this.renderTimelineUserMessage(message, isSubagent, source);
        } else if (message.role === 'assistant') {
            messageHtml += this.renderTimelineAssistantMessage(message, isSubagent, source);
        }

        if (!messageHtml) return;

        stream.insertAdjacentHTML('beforeend', messageHtml);

        // Animate new elements
        const newElements = stream.querySelectorAll(':scope > :last-child, :scope > :nth-last-child(2), :scope > :nth-last-child(3)');
        newElements.forEach(el => {
            if (!el.classList.contains('animate-in')) {
                el.classList.add('animate-in', 'new-message');
            }
        });

        // Scroll to bottom smoothly
        this.container.scrollTo({
            top: this.container.scrollHeight,
            behavior: 'smooth'
        });
    },

    renderMessage(event, index) {
        const domain = event.domain || 'pm';
        const time = this.formatTime(event.timestamp);

        // Check if we need a handoff divider
        let dividerHtml = '';
        if (this.lastDomain && this.lastDomain !== domain && event.event_type !== 'handoff_started') {
            dividerHtml = this.renderHandoffDivider(this.lastDomain, domain);
        }

        this.lastDomain = domain;

        // Route to appropriate renderer
        switch (event.event_type) {
            case 'decision_made':
                return dividerHtml + this.renderDecision(event, time);
            case 'handoff_started':
                return this.renderHandoffDivider(
                    event.content?.source_domain || this.lastDomain || 'pm',
                    event.content?.handoff_target || event.content?.target_domain || 'unknown'
                );
            case 'user_response':
                return dividerHtml + this.renderUserMessage(event, time);
            case 'artifact_created':
                return dividerHtml + this.renderArtifact(event, time, domain);
            default:
                return dividerHtml + this.renderAgentMessage(event, time, domain);
        }
    },

    renderAgentMessage(event, time, domain) {
        const initial = this.domainInitials[domain] || domain.substring(0, 2).toUpperCase();
        const color = this.domainColors[domain] || '#6e6e73';
        const content = this.getEventContent(event);

        return `
            <div class="chat-message agent-message" data-domain="${domain}">
                <div class="message-avatar" style="--domain-color: ${color}">
                    <span class="avatar-initial">${initial}</span>
                    <span class="avatar-pulse"></span>
                </div>
                <div class="message-body">
                    <div class="message-header">
                        <span class="message-domain" style="--domain-color: ${color}">${domain}</span>
                        <span class="message-type">${this.formatEventType(event.event_type)}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-content">
                        ${content}
                    </div>
                </div>
            </div>
        `;
    },

    renderUserMessage(event, time) {
        const content = event.content?.response || event.content?.message || 'User input received';

        return `
            <div class="chat-message user-message">
                <div class="message-body">
                    <div class="message-header">
                        <span class="message-domain user">USER</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-content">
                        ${this.escapeHtml(content)}
                    </div>
                </div>
                <div class="message-avatar user-avatar">
                    <span class="avatar-initial">U</span>
                </div>
            </div>
        `;
    },

    renderDecision(event, time) {
        const decision = event.content?.decision || 'Decision made';
        const rationale = event.content?.rationale || '';
        const domain = event.domain || 'pm';
        const color = this.domainColors[domain] || '#6366f1';

        return `
            <div class="chat-decision" data-domain="${domain}">
                <div class="decision-marker">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <div class="decision-card" style="--domain-color: ${color}">
                    <div class="decision-header">
                        <span class="decision-label">DECISION</span>
                        <span class="decision-domain-pill" style="background: ${color}">${domain}</span>
                        <span class="decision-time">${time}</span>
                    </div>
                    <div class="decision-text">${this.escapeHtml(decision)}</div>
                    ${rationale ? `
                        <div class="decision-rationale">
                            <span class="rationale-label">Rationale:</span>
                            ${this.escapeHtml(rationale)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    renderHandoffDivider(fromDomain, toDomain) {
        const fromColor = this.domainColors[fromDomain] || '#6e6e73';
        const toColor = this.domainColors[toDomain] || '#6e6e73';
        const fromInitial = this.domainInitials[fromDomain] || fromDomain.substring(0, 2).toUpperCase();
        const toInitial = this.domainInitials[toDomain] || toDomain.substring(0, 2).toUpperCase();

        // Update lastDomain to the target
        this.lastDomain = toDomain;

        return `
            <div class="chat-divider handoff-divider">
                <div class="divider-line"></div>
                <div class="handoff-indicator">
                    <span class="handoff-from" style="--domain-color: ${fromColor}">
                        <span class="handoff-badge">${fromInitial}</span>
                        ${fromDomain}
                    </span>
                    <span class="handoff-arrow">
                        <svg width="20" height="12" viewBox="0 0 20 12">
                            <path d="M0 6h16M12 1l5 5-5 5" stroke="currentColor" stroke-width="2" fill="none"/>
                        </svg>
                    </span>
                    <span class="handoff-to" style="--domain-color: ${toColor}">
                        <span class="handoff-badge">${toInitial}</span>
                        ${toDomain}
                    </span>
                </div>
                <div class="divider-line"></div>
            </div>
        `;
    },

    renderArtifact(event, time, domain) {
        const name = event.content?.artifact_name || event.content?.name || 'artifact';
        const type = event.content?.artifact_type || event.content?.type || 'file';
        const color = this.domainColors[domain] || '#6e6e73';

        return `
            <div class="chat-message agent-message artifact-message" data-domain="${domain}">
                <div class="message-avatar" style="--domain-color: ${color}">
                    <span class="avatar-initial">&#128196;</span>
                </div>
                <div class="message-body">
                    <div class="message-header">
                        <span class="message-domain" style="--domain-color: ${color}">${domain}</span>
                        <span class="message-type">artifact created</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="artifact-card">
                        <div class="artifact-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                        </div>
                        <div class="artifact-info">
                            <span class="artifact-name">${this.escapeHtml(name)}</span>
                            <span class="artifact-type">${type}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getEventContent(event) {
        switch (event.event_type) {
            case 'skill_invoked':
                const skillId = event.skill_id || event.content?.skill_id || 'unknown';
                const skillName = event.content?.skill_name || '';
                return `
                    <span class="skill-invoke">
                        <span class="skill-slash">/</span>${this.escapeHtml(skillId)}
                    </span>
                    ${skillName && skillName !== skillId ? `<span class="skill-name">${this.escapeHtml(skillName)}</span>` : ''}
                `;

            case 'agent_activated':
                const agentName = event.content?.agent_name || event.agent_id || 'Agent';
                const agentRole = event.content?.agent_role || '';
                return `
                    <span class="agent-activate">
                        <strong>${this.escapeHtml(agentName)}</strong>
                        ${agentRole ? `<span class="agent-role">${this.escapeHtml(agentRole)}</span>` : ''}
                        <span class="status-active">now active</span>
                    </span>
                `;

            case 'tool_called':
                const tool = event.content?.tool || 'Tool';
                const output = event.content?.output_preview || '';
                return `
                    <span class="tool-call">
                        <span class="tool-name">${this.escapeHtml(tool)}</span>
                    </span>
                    ${output ? `<pre class="tool-output">${this.escapeHtml(output.substring(0, 200))}${output.length > 200 ? '...' : ''}</pre>` : ''}
                `;

            case 'team_session':
                return `<span class="team-session-start">Team session initiated</span>`;

            case 'handoff_completed':
                return `<span class="handoff-complete-msg">Handoff completed successfully</span>`;

            default:
                return `<span class="generic-event">${event.event_type.replace(/_/g, ' ')}</span>`;
        }
    },

    formatTime(timestamp) {
        if (!timestamp) return '--:--';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    },

    formatEventType(type) {
        return (type || '').replace(/_/g, ' ');
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    clear() {
        if (!this.container) this.init();
        this.lastDomain = null;
        this.messageIndex = 0;
        this.currentTranscript = null;
        this.container.innerHTML = `
            <div class="conversation-empty">
                <div class="empty-terminal">
                    <div class="terminal-line">$ session cleared</div>
                    <div class="terminal-cursor"></div>
                </div>
            </div>
        `;
    }
};
