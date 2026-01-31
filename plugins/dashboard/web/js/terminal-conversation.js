/**
 * Terminal Conversation Module - Conversation-Style View for SDK Terminal
 * Adapts SDK responses to rich conversation display with tool cards, avatars, and markdown
 * Includes subagent context rendering for agent/skill visibility
 */

const TerminalConversation = {
    container: null,
    messages: [],
    lastRole: null,
    lastSource: 'main',
    autoScrollEnabled: true,
    streamingIndicator: null,
    streamStartTime: null,
    streamTimer: null,
    toolsInProgress: [],
    currentSubagent: null,
    agentMetadata: {},
    // Extended thinking state (Phase 1.4)
    thinkingContent: '',
    thinkingBlock: null,
    isThinking: false,

    // Domain initials for avatars (matching Conversation module)
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
        'documentation': 'DC',
        'Explore': 'EX',
        'Plan': 'PL',
        'Bash': 'SH',
        'general-purpose': 'GP'
    },

    // Domain colors (matching Conversation module)
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
        'documentation': '#a3e635',
        'sdk': '#a78bfa',
        'user': '#6e6e73',
        'claude': '#6366f1',
        'Explore': '#6366f1',
        'Plan': '#a78bfa',
        'Bash': '#4ade80',
        'general-purpose': '#818cf8'
    },

    /**
     * Initialize the terminal conversation view
     * @param {HTMLElement} containerEl - The container element
     */
    init(containerEl) {
        this.container = containerEl;
        this.autoScrollEnabled = true;
        this.messages = [];
        this.lastRole = null;
        this.lastSource = 'main';
        this.currentSubagent = null;
        this.setupScrollTracking();
    },

    /**
     * Setup scroll tracking for smart auto-scroll behavior
     */
    setupScrollTracking() {
        if (!this.container) return;

        if (this._scrollHandler) {
            this.container.removeEventListener('scroll', this._scrollHandler);
        }

        this._scrollHandler = () => {
            const threshold = 50;
            const isAtBottom =
                this.container.scrollHeight - this.container.scrollTop - this.container.clientHeight < threshold;
            this.autoScrollEnabled = isAtBottom;
        };

        this.container.addEventListener('scroll', this._scrollHandler);
    },

    /**
     * Clear all messages
     */
    clear() {
        this.messages = [];
        this.lastRole = null;
        this.lastSource = 'main';
        this.currentSubagent = null;
        this.thinkingContent = '';
        this.thinkingBlock = null;
        this.isThinking = false;
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.stopStreamingIndicator();
    },

    /**
     * Start a thinking block (extended thinking - Phase 1.4)
     */
    startThinkingBlock() {
        this.isThinking = true;
        this.thinkingContent = '';

        // Create collapsible thinking container
        if (!this.thinkingBlock && this.streamingIndicator) {
            const thinkingEl = document.createElement('div');
            thinkingEl.className = 'thinking-block collapsed';
            thinkingEl.innerHTML = `
                <div class="thinking-header" onclick="TerminalConversation.toggleThinking()">
                    <span class="thinking-icon">💭</span>
                    <span class="thinking-label">Extended Thinking</span>
                    <span class="thinking-toggle">▶</span>
                </div>
                <div class="thinking-content"></div>
            `;
            this.thinkingBlock = thinkingEl;

            // Insert before the streaming indicator
            if (this.streamingIndicator.parentNode) {
                this.streamingIndicator.parentNode.insertBefore(
                    thinkingEl,
                    this.streamingIndicator
                );
            }
        }
    },

    /**
     * Append content to the current thinking block
     * @param {string} text - The thinking text to append
     */
    appendThinkingContent(text) {
        if (!text) return;

        this.thinkingContent += text;

        if (this.thinkingBlock) {
            const contentEl = this.thinkingBlock.querySelector('.thinking-content');
            if (contentEl) {
                contentEl.textContent = this.thinkingContent;
            }
        }
    },

    /**
     * End the current thinking block
     */
    endThinkingBlock() {
        this.isThinking = false;

        if (this.thinkingBlock) {
            // Mark as complete
            this.thinkingBlock.classList.add('complete');

            // Update the label with character count
            const labelEl = this.thinkingBlock.querySelector('.thinking-label');
            if (labelEl) {
                const charCount = this.thinkingContent.length;
                labelEl.textContent = `Extended Thinking (${this.formatCharCount(charCount)})`;
            }
        }
    },

    /**
     * Toggle thinking block visibility
     */
    toggleThinking() {
        if (this.thinkingBlock) {
            this.thinkingBlock.classList.toggle('collapsed');
            const toggleEl = this.thinkingBlock.querySelector('.thinking-toggle');
            if (toggleEl) {
                toggleEl.textContent = this.thinkingBlock.classList.contains('collapsed') ? '▶' : '▼';
            }
        }
    },

    /**
     * Format character count for display
     * @param {number} count - Character count
     * @returns {string} Formatted string
     */
    formatCharCount(count) {
        if (count < 1000) return `${count} chars`;
        if (count < 10000) return `${(count / 1000).toFixed(1)}k chars`;
        return `${Math.round(count / 1000)}k chars`;
    },

    // ========================================
    // REAL-TIME STREAMING MESSAGE METHODS
    // ========================================

    /**
     * Streaming message state
     */
    streamingMessage: null,
    streamingMessageContent: '',
    streamingMessageTools: [],

    /**
     * Start a new streaming assistant message
     * Creates the message bubble immediately so text can be appended in real-time
     * @param {string} source - 'main' or agent ID
     */
    startStreamingMessage(source = 'main') {
        // Don't start if already streaming
        if (this.streamingMessage) return;

        // Guard against null container - critical fix for black screen bug
        if (!this.container) {
            console.warn('[TerminalConversation] Cannot start streaming - container is null');
            return;
        }

        const time = this.formatTime(new Date());
        const isSubagent = source !== 'main';
        const agentInfo = this.getAgentInfo(source);

        // Reset streaming state
        this.streamingMessageContent = '';
        this.streamingMessageTools = [];

        // Handle subagent context transitions
        let contextHtml = '';
        if (isSubagent && this.currentSubagent !== source) {
            if (this.currentSubagent) {
                contextHtml = this.renderSubagentContextEnd(this.currentSubagent);
                this.container.insertAdjacentHTML('beforeend', contextHtml);
            }
            contextHtml = this.renderSubagentContextStart(source);
            this.container.insertAdjacentHTML('beforeend', contextHtml);
            this.currentSubagent = source;
        } else if (!isSubagent && this.currentSubagent) {
            contextHtml = this.renderSubagentContextEnd(this.currentSubagent);
            this.container.insertAdjacentHTML('beforeend', contextHtml);
            this.currentSubagent = null;
        }

        // Create the streaming message element
        const subagentClass = isSubagent ? 'is-subagent subagent-indent subagent-message' : '';

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message transcript-message agent-message terminal-message streaming-message ${subagentClass}`;
        messageEl.dataset.source = source;
        messageEl.innerHTML = `
            <div class="message-avatar ${isSubagent ? 'subagent-avatar' : ''}" style="--domain-color: ${agentInfo.color}">
                <span class="avatar-initial">${agentInfo.initial}</span>
                <span class="avatar-pulse streaming-pulse"></span>
            </div>
            <div class="message-body">
                <div class="message-header">
                    <span class="message-domain" style="--domain-color: ${agentInfo.color}">
                        ${isSubagent ? this.escapeHtml(agentInfo.name) : 'Claude'}
                    </span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-content">
                    <div class="transcript-text streaming-text"></div>
                    <div class="transcript-tools streaming-tools"></div>
                    <span class="streaming-cursor">▊</span>
                </div>
            </div>
        `;

        this.streamingMessage = messageEl;
        this.container.appendChild(messageEl);

        // Move streaming indicator to be AFTER the message (at the bottom)
        // This ensures "Thinking..." always appears below the current message
        if (this.streamingIndicator && this.streamingIndicator.parentNode === this.container) {
            this.container.appendChild(this.streamingIndicator);
        }

        // Animate in
        messageEl.classList.add('animate-in', 'new-message');

        // Auto-scroll
        if (this.autoScrollEnabled) {
            this.container.scrollTo({
                top: this.container.scrollHeight,
                behavior: 'smooth'
            });
        }

        this.lastRole = 'assistant';
        this.lastSource = source;
    },

    /**
     * Append text delta to the streaming message
     * @param {string} text - The text delta to append
     */
    appendStreamingText(text) {
        if (!text) return;

        // Guard against null container - critical fix for black screen bug
        if (!this.container) {
            console.warn('[TerminalConversation] Cannot append text - container is null');
            return;
        }

        // Auto-start message if not already started
        if (!this.streamingMessage) {
            this.startStreamingMessage('main');
            // If startStreamingMessage failed due to container issues, abort
            if (!this.streamingMessage) {
                console.warn('[TerminalConversation] Failed to start streaming message');
                return;
            }
        }

        this.streamingMessageContent += text;

        // Update the text content with markdown rendering
        const textEl = this.streamingMessage?.querySelector('.streaming-text');
        if (textEl && this.container.contains(this.streamingMessage)) {
            try {
                textEl.innerHTML = this.formatMarkdown(this.streamingMessageContent);
            } catch (e) {
                console.error('[TerminalConversation] Error formatting markdown:', e);
                textEl.textContent = this.streamingMessageContent;
            }
        }

        // Auto-scroll to keep up with new content
        if (this.autoScrollEnabled && this.container) {
            this.container.scrollTop = this.container.scrollHeight;
        }
    },

    /**
     * Add a tool use to the streaming message
     * @param {Object} tool - The tool use object
     */
    addStreamingTool(tool) {
        if (!tool) return;

        // Guard against null container
        if (!this.container) {
            console.warn('[TerminalConversation] Cannot add tool - container is null');
            return;
        }

        // Auto-start message if not already started
        if (!this.streamingMessage) {
            this.startStreamingMessage('main');
            // If startStreamingMessage failed, abort
            if (!this.streamingMessage) {
                console.warn('[TerminalConversation] Failed to start streaming message for tool');
                return;
            }
        }

        // Check if tool already exists
        const existingIndex = this.streamingMessageTools.findIndex(t => t.id === tool.id);
        const newHasInput = tool.input && Object.keys(tool.input).length > 0;

        if (existingIndex !== -1) {
            // Update existing tool with new data
            Object.assign(this.streamingMessageTools[existingIndex], tool);
        } else {
            // Add new tool
            this.streamingMessageTools.push(tool);
        }

        // Re-render tools when called - ensures updates are displayed immediately
        // IMPORTANT: Skip re-rendering interactive tools that have user state (like AskUserQuestion)
        const toolsEl = this.streamingMessage?.querySelector('.streaming-tools');
        if (toolsEl && this.container.contains(this.streamingMessage)) {
            // Build list of tools that have active interactive state
            const toolsWithState = new Set();
            if (typeof QuestionRenderer !== 'undefined') {
                for (const t of this.streamingMessageTools) {
                    if (t.name === 'AskUserQuestion' && t.id) {
                        const questionData = QuestionRenderer.activeQuestions[t.id];
                        // Has state if: exists, not submitted, and has at least one answer or DOM cache
                        if (questionData && !questionData.submitted && !questionData._cleaned) {
                            toolsWithState.add(t.id);
                        }
                    }
                }
            }

            // Re-render only tools without active state
            const existingCards = new Map();
            // Preserve existing interactive tool cards
            toolsEl.querySelectorAll('[data-tool-id]').forEach(card => {
                const toolId = card.dataset.toolId;
                if (toolsWithState.has(toolId)) {
                    existingCards.set(toolId, card);
                }
            });

            // Clear and rebuild, reinserting preserved cards
            toolsEl.innerHTML = '';
            for (const t of this.streamingMessageTools) {
                if (t.id && existingCards.has(t.id)) {
                    // Reinsert the preserved card (maintains user state)
                    toolsEl.appendChild(existingCards.get(t.id));
                } else {
                    // Render fresh
                    const toolHtml = this.renderToolCall(t);
                    toolsEl.insertAdjacentHTML('beforeend', toolHtml);
                }
            }
        }

        // Auto-scroll
        if (this.autoScrollEnabled && this.container) {
            this.container.scrollTop = this.container.scrollHeight;
        }
    },

    /**
     * Finalize the streaming message
     * Removes cursor and streaming classes, makes it a permanent message
     * @param {Array} finalToolUses - Final array of tool uses (for reconciliation)
     */
    finalizeStreamingMessage(finalToolUses = []) {
        if (!this.streamingMessage) return;

        // Remove streaming indicators
        this.streamingMessage.classList.remove('streaming-message');
        const cursor = this.streamingMessage.querySelector('.streaming-cursor');
        if (cursor) cursor.remove();

        const pulse = this.streamingMessage.querySelector('.streaming-pulse');
        if (pulse) pulse.classList.remove('streaming-pulse');

        // Re-render tools with final complete data
        // This ensures tool inputs (which may have been empty during streaming) are now displayed
        // IMPORTANT: Preserve interactive tools that have user state (like AskUserQuestion)
        if (finalToolUses.length > 0) {
            const toolsEl = this.streamingMessage.querySelector('.streaming-tools');
            if (toolsEl) {
                // Build list of tools that have active interactive state
                const toolsWithState = new Set();
                if (typeof QuestionRenderer !== 'undefined') {
                    for (const tool of finalToolUses) {
                        if (tool.name === 'AskUserQuestion' && tool.id) {
                            const questionData = QuestionRenderer.activeQuestions[tool.id];
                            // Has state if: exists and not fully cleaned up
                            if (questionData && !questionData._cleaned) {
                                toolsWithState.add(tool.id);
                            }
                        }
                    }
                }

                // Preserve existing interactive tool cards
                const existingCards = new Map();
                toolsEl.querySelectorAll('[data-tool-id]').forEach(card => {
                    const toolId = card.dataset.toolId;
                    if (toolsWithState.has(toolId)) {
                        existingCards.set(toolId, card);
                    }
                });

                // Clear and rebuild, reinserting preserved cards
                toolsEl.innerHTML = '';
                for (const tool of finalToolUses) {
                    if (tool.id && existingCards.has(tool.id)) {
                        // Reinsert the preserved card (maintains user state)
                        toolsEl.appendChild(existingCards.get(tool.id));
                    } else {
                        // Render fresh
                        const toolHtml = this.renderToolCall(tool);
                        toolsEl.insertAdjacentHTML('beforeend', toolHtml);
                    }
                }
            }
        }

        // Clear streaming state
        this.streamingMessage = null;
        this.streamingMessageContent = '';
        this.streamingMessageTools = [];
    },

    /**
     * Check if currently streaming a message
     * @returns {boolean} True if streaming
     */
    isStreamingMessage() {
        return this.streamingMessage !== null;
    },

    // ========================================
    // END REAL-TIME STREAMING MESSAGE METHODS
    // ========================================

    /**
     * Get agent information for display
     * @param {string} agentId - The agent ID or type
     * @returns {Object} Agent info with name, color, initial
     */
    getAgentInfo(agentId) {
        if (!agentId || agentId === 'main') {
            return {
                name: 'Claude',
                color: this.domainColors['claude'],
                initial: 'AI',
                domain: null
            };
        }

        // Check metadata first
        const info = this.agentMetadata[agentId] || {};
        const type = info.type || agentId;
        const domain = info.domain || this.inferDomainFromType(type);

        return {
            name: info.name || this.formatAgentName(type),
            type: type,
            domain: domain,
            color: domain ? (this.domainColors[domain] || '#a78bfa') : (this.domainColors[type] || '#a78bfa'),
            initial: this.getAgentInitial(info.name || type)
        };
    },

    /**
     * Infer domain from built-in agent types
     * @param {string} type - The agent type
     * @returns {string|null} Domain name or null
     */
    inferDomainFromType(type) {
        const typeToDomain = {
            'Explore': 'pm',
            'Plan': 'architecture',
            'Bash': 'devops',
            'general-purpose': 'pm'
        };
        return typeToDomain[type] || null;
    },

    /**
     * Format agent type into a display name
     * @param {string} type - The agent type
     * @returns {string} Formatted name
     */
    formatAgentName(type) {
        if (!type) return 'Agent';
        if (/^[a-f0-9]+$/.test(type) && type.length <= 8) {
            return `Agent ${type}`;
        }
        // Convert kebab-case or colon-separated to Title Case
        return type.split(/[-:_]/).map(w =>
            w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join(' ');
    },

    /**
     * Get 2-character initial from agent name
     * @param {string} name - The agent name
     * @returns {string} 2-char initial
     */
    getAgentInitial(name) {
        if (!name) return 'AG';
        // Check if it's a known type
        if (this.domainInitials[name]) {
            return this.domainInitials[name];
        }
        if (/^[a-f0-9]+$/.test(name) && name.length <= 8) {
            return name.substring(0, 2).toUpperCase();
        }
        const words = name.split(/[\s-_:]+/);
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    },

    /**
     * Add a user command message
     * @param {string} text - The command text
     * @param {Object} options - Optional settings
     * @param {boolean} options.skipStorage - Don't save to storage (used during replay)
     * @param {number} options.timestamp - Optional timestamp
     */
    addUserMessage(text, options = {}) {
        // Guard against null container
        if (!this.container) {
            console.warn('[TerminalConversation] Cannot add user message - container is null');
            return;
        }

        const timestamp = options.timestamp || (typeof options === 'number' ? options : null);
        const time = timestamp ? this.formatTime(new Date(timestamp)) : this.formatTime(new Date());
        const isConsecutive = this.lastRole === 'user' && this.lastSource === 'main';

        const html = this.renderUserMessage(text, time, isConsecutive);
        this.appendMessage(html);
        this.lastRole = 'user';
        this.lastSource = 'main';
    },

    /**
     * Add an assistant response message
     * @param {string} content - The text content
     * @param {Array} toolUses - Array of tool use objects
     * @param {Object} options - Optional settings
     * @param {boolean} options.skipStorage - Don't save to storage (used during replay)
     * @param {number} options.timestamp - Optional timestamp
     * @param {string} options.source - 'main' or agent ID
     */
    addAssistantMessage(content, toolUses = [], options = {}) {
        // Handle legacy signature: (content, toolUses, timestamp, source)
        let timestamp, source;
        if (typeof options === 'number' || options === null) {
            timestamp = options;
            source = arguments[3] || 'main';
        } else {
            timestamp = options.timestamp || null;
            source = options.source || 'main';
        }

        const time = timestamp ? this.formatTime(new Date(timestamp)) : this.formatTime(new Date());
        const isSubagent = source !== 'main';

        // Handle subagent context transitions
        let contextHtml = '';
        if (isSubagent && this.currentSubagent !== source) {
            // Close previous subagent if any
            if (this.currentSubagent) {
                contextHtml += this.renderSubagentContextEnd(this.currentSubagent);
            }
            // Open new subagent context
            contextHtml += this.renderSubagentContextStart(source);
            this.currentSubagent = source;
        } else if (!isSubagent && this.currentSubagent) {
            // Close subagent context when returning to main
            contextHtml += this.renderSubagentContextEnd(this.currentSubagent);
            this.currentSubagent = null;
        }

        // Determine if consecutive
        const isConsecutive = this.lastRole === 'assistant' && this.lastSource === source;

        const messageHtml = this.renderAssistantMessage(content, toolUses, time, isConsecutive, source);

        this.appendMessage(contextHtml + messageHtml);
        this.lastRole = 'assistant';
        this.lastSource = source;
    },

    /**
     * Render subagent context start marker
     * @param {string} agentId - The agent ID
     * @returns {string} HTML string
     */
    renderSubagentContextStart(agentId) {
        const agentInfo = this.getAgentInfo(agentId);
        return `
            <div class="subagent-context subagent-context-start" data-agent-id="${this.escapeHtml(agentId)}" style="--agent-color: ${agentInfo.color}">
                <div class="subagent-context-line"></div>
                <div class="subagent-context-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    ${this.escapeHtml(agentInfo.name)} started
                </div>
                <div class="subagent-context-line"></div>
            </div>
        `;
    },

    /**
     * Render subagent context end marker
     * @param {string} agentId - The agent ID
     * @returns {string} HTML string
     */
    renderSubagentContextEnd(agentId) {
        const agentInfo = this.getAgentInfo(agentId);
        return `
            <div class="subagent-context subagent-context-end" data-agent-id="${this.escapeHtml(agentId)}" style="--agent-color: ${agentInfo.color}">
                <div class="subagent-context-line"></div>
                <div class="subagent-context-label end-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    ${this.escapeHtml(agentInfo.name)} completed
                </div>
                <div class="subagent-context-line"></div>
            </div>
        `;
    },

    /**
     * Append a message HTML to the container
     * @param {string} html - The message HTML
     */
    appendMessage(html) {
        if (!this.container || !html) return;

        this.container.insertAdjacentHTML('beforeend', html);

        // Animate new elements
        const newElements = this.container.querySelectorAll(':scope > :last-child, :scope > :nth-last-child(2)');
        newElements.forEach(el => {
            if (!el.classList.contains('animate-in')) {
                el.classList.add('animate-in', 'new-message');
            }
        });

        // Auto-scroll to bottom if enabled
        if (this.autoScrollEnabled) {
            this.container.scrollTo({
                top: this.container.scrollHeight,
                behavior: 'smooth'
            });
        }
    },

    /**
     * Render a user message
     * @param {string} text - The message text
     * @param {string} time - Formatted time string
     * @param {boolean} isConsecutive - Whether this follows another user message
     * @returns {string} HTML string
     */
    renderUserMessage(text, time, isConsecutive = false) {
        const consecutiveClass = isConsecutive ? 'consecutive' : '';

        const avatarHtml = isConsecutive
            ? '<div class="message-avatar-spacer"></div>'
            : `<div class="message-avatar user-avatar terminal-user-avatar">
                    <span class="avatar-initial">$</span>
                </div>`;

        const inlineTimeHtml = isConsecutive ? `<span class="message-time-inline">${time}</span>` : '';

        return `
            <div class="chat-message transcript-message user-message terminal-message ${consecutiveClass}" data-source="main">
                ${avatarHtml}
                <div class="message-body">
                    <div class="message-header">
                        <span class="message-domain user terminal-prompt-label">COMMAND</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-content terminal-command-content">
                        <code class="terminal-command-text">${this.escapeHtml(text)}</code>${inlineTimeHtml}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render an assistant message
     * @param {string} content - The text content
     * @param {Array} toolUses - Array of tool use objects
     * @param {string} time - Formatted time string
     * @param {boolean} isConsecutive - Whether this follows another assistant message
     * @param {string} source - 'main' or agent ID
     * @returns {string} HTML string
     */
    renderAssistantMessage(content, toolUses = [], time, isConsecutive = false, source = 'main') {
        // Skip empty messages
        if (!content && toolUses.length === 0) {
            return '';
        }

        const isSubagent = source !== 'main';
        const agentInfo = this.getAgentInfo(source);
        const consecutiveClass = isConsecutive ? 'consecutive' : '';
        const subagentClass = isSubagent ? 'is-subagent subagent-indent subagent-message' : '';

        const avatarHtml = isConsecutive
            ? '<div class="message-avatar-spacer"></div>'
            : `<div class="message-avatar ${isSubagent ? 'subagent-avatar' : ''}" style="--domain-color: ${agentInfo.color}">
                    <span class="avatar-initial">${agentInfo.initial}</span>
                    <span class="avatar-pulse"></span>
                </div>`;

        const inlineTimeHtml = isConsecutive ? `<span class="message-time-inline">${time}</span>` : '';

        let contentHtml = '';

        // Add text content with markdown rendering
        if (content) {
            contentHtml += `<div class="transcript-text">${this.formatMarkdown(content)}</div>`;
        }

        // Add tool calls using registry
        if (toolUses.length > 0) {
            contentHtml += '<div class="transcript-tools">';
            toolUses.forEach(tool => {
                contentHtml += this.renderToolCall(tool);
            });
            contentHtml += '</div>';
        }

        return `
            <div class="chat-message transcript-message agent-message terminal-message ${consecutiveClass} ${subagentClass}" data-source="${this.escapeHtml(source)}">
                ${avatarHtml}
                <div class="message-body">
                    <div class="message-header">
                        <span class="message-domain" style="--domain-color: ${agentInfo.color}">
                            ${isSubagent ? this.escapeHtml(agentInfo.name) : 'Claude'}
                        </span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-content">
                        ${contentHtml}${inlineTimeHtml}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render a tool call using the ToolRendererRegistry
     * @param {Object} tool - Tool call object with name and input
     * @returns {string} HTML string
     */
    renderToolCall(tool) {
        if (typeof ToolRendererRegistry !== 'undefined') {
            return ToolRendererRegistry.render(tool);
        }
        // Fallback if registry not loaded
        return `<div class="tool-call-card">
            <span class="tool-name">${this.escapeHtml(tool.name || 'Unknown Tool')}</span>
        </div>`;
    },

    /**
     * Format text as markdown
     * @param {string} text - The text to format
     * @returns {string} HTML string
     */
    formatMarkdown(text) {
        if (!text) return '';

        // Pre-process: Remove Claude Code system tags
        let processed = text;
        processed = processed.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '');
        processed = processed.replace(/<command-message>([\s\S]*?)<\/command-message>/g, '$1');
        processed = processed.replace(/<command-name>([\s\S]*?)<\/command-name>/g, '**/$1**');
        processed = processed.replace(/<command-args>([\s\S]*?)<\/command-args>/g, '\n\n> $1');
        processed = processed.replace(/<commentary>([\s\S]*?)<\/commentary>/g, '\n\n> *$1*\n\n');
        processed = processed.replace(/<example>([\s\S]*?)<\/example>/g, '\n\n```\n$1\n```\n\n');

        // Use marked library for GitHub-flavored markdown
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                gfm: true,
                breaks: true,
                headerIds: false,
                mangle: false
            });

            try {
                return marked.parse(processed);
            } catch (e) {
                console.warn('Markdown parsing failed:', e);
                return this.escapeHtml(processed).replace(/\n/g, '<br>');
            }
        }

        // Fallback if marked is not loaded
        return this.escapeHtml(processed).replace(/\n/g, '<br>');
    },

    /**
     * Start showing the streaming indicator
     * Creates a minimal status line (no avatar) with tools appearing above the status
     */
    startStreamingIndicator() {
        this.streamStartTime = Date.now();
        this.toolsInProgress = [];

        if (!this.container) return;

        // Create streaming indicator element - minimal design without avatar
        this.streamingIndicator = document.createElement('div');
        this.streamingIndicator.className = 'terminal-streaming-indicator';
        this.streamingIndicator.innerHTML = this.getStreamingHTML('thinking', 0);

        this.container.appendChild(this.streamingIndicator);

        // Start timer
        this.streamTimer = setInterval(() => {
            this.updateStreamingTimer();
        }, 100);

        // Auto-scroll
        if (this.autoScrollEnabled) {
            this.container.scrollTo({
                top: this.container.scrollHeight,
                behavior: 'smooth'
            });
        }
    },

    /**
     * Update the streaming timer display
     */
    updateStreamingTimer() {
        if (!this.streamingIndicator || !this.streamStartTime) return;

        const elapsed = Date.now() - this.streamStartTime;
        const status = this.toolsInProgress.length > 0 ? 'tools' : 'thinking';
        this.streamingIndicator.innerHTML = this.getStreamingHTML(status, elapsed);

        // Auto-scroll
        if (this.autoScrollEnabled && this.container) {
            this.container.scrollTop = this.container.scrollHeight;
        }
    },

    /**
     * Get HTML for streaming indicator
     * Minimal design: tools render above, status line at bottom, no avatar
     * @param {string} status - 'thinking' | 'tools' | 'receiving' | 'agent'
     * @param {number} elapsed - Elapsed time in ms
     * @returns {string} HTML string
     */
    getStreamingHTML(status, elapsed) {
        const seconds = (elapsed / 1000).toFixed(1);
        const spinner = this.getSpinnerFrame(elapsed);

        let statusText = '';
        let statusClass = '';

        switch (status) {
            case 'thinking':
                statusText = 'Thinking...';
                statusClass = 'status-thinking';
                break;
            case 'tools':
                statusText = 'Working...';
                statusClass = 'status-tools';
                break;
            case 'receiving':
                statusText = 'Receiving...';
                statusClass = 'status-receiving';
                break;
            case 'agent':
                const agentType = this.toolsInProgress.find(t => t.name === 'Task')?.input?.subagent_type || 'Agent';
                const agentInfo = this.getAgentInfo(agentType);
                statusText = `${agentInfo.name} working...`;
                statusClass = 'status-agent';
                break;
        }

        // Build tool cards HTML - these appear ABOVE the status line
        let toolCardsHtml = '';
        if (this.toolsInProgress && this.toolsInProgress.length > 0) {
            toolCardsHtml = '<div class="streaming-tool-cards">';
            for (const tool of this.toolsInProgress) {
                // Use the full tool renderer for rich display
                if (typeof ToolRendererRegistry !== 'undefined') {
                    toolCardsHtml += ToolRendererRegistry.render(tool);
                } else {
                    // Fallback to simple display
                    let displayName = tool.name || 'Tool';
                    if (tool.name === 'Task' && tool.input?.subagent_type) {
                        displayName = `Task(${tool.input.subagent_type})`;
                    }
                    toolCardsHtml += `<div class="tool-card tool-card-simple"><span class="tool-name">${this.escapeHtml(displayName)}</span></div>`;
                }
            }
            toolCardsHtml += '</div>';
        }

        // Simple status line without avatar - aligned with message content
        return `
            ${toolCardsHtml}
            <div class="streaming-status-line">
                <span class="streaming-spinner">${spinner}</span>
                <span class="streaming-status ${statusClass}">${statusText}</span>
                <span class="streaming-time">${seconds}s</span>
            </div>
        `;
    },

    /**
     * Get animated spinner frame
     * @param {number} elapsed - Elapsed time in ms
     * @returns {string} Spinner character
     */
    getSpinnerFrame(elapsed) {
        const frames = ['\u280B', '\u2819', '\u2839', '\u2838', '\u283C', '\u2834', '\u2826', '\u2827', '\u2807', '\u280F'];
        const frameIndex = Math.floor(elapsed / 80) % frames.length;
        return frames[frameIndex];
    },

    /**
     * Update streaming status
     * @param {string} status - 'thinking' | 'tools' | 'receiving' | 'agent'
     */
    updateStreamingStatus(status) {
        if (!this.streamingIndicator) return;
        const elapsed = Date.now() - this.streamStartTime;
        this.streamingIndicator.innerHTML = this.getStreamingHTML(status, elapsed);
    },

    /**
     * Add a tool to in-progress list (enhanced to track full tool object)
     * @param {string|Object} tool - The tool name or full tool object
     */
    addToolInProgress(tool) {
        const toolObj = typeof tool === 'string' ? { name: tool } : tool;
        const toolName = toolObj.name;
        const toolId = toolObj.id;

        // Check if we already have this tool by ID or name
        const existingTool = this.toolsInProgress.find(t => {
            if (toolId && t.id) return t.id === toolId;
            return (t.name || t) === toolName;
        });

        if (!existingTool) {
            // Add preview text (Phase 1.5)
            toolObj.preview = this.getToolPreview(toolObj);

            // Add new tool with tracking info
            this.toolsInProgress.push({
                ...toolObj,
                startTime: Date.now(),
                status: toolObj.status || 'running'
            });

            // Update status - show 'agent' status for Task tool
            if (toolName === 'Task') {
                this.updateStreamingStatus('agent');
            } else {
                this.updateStreamingTimer();
            }

            // Also render the tool in the streaming indicator
            this.renderToolsInIndicator();
        } else {
            // Update existing tool with new data (especially input which may now be available)
            const hadInput = existingTool.input && Object.keys(existingTool.input).length > 0;
            Object.assign(existingTool, toolObj);

            // Regenerate preview if we now have input data
            if (!hadInput && toolObj.input && Object.keys(toolObj.input).length > 0) {
                existingTool.preview = this.getToolPreview(existingTool);
            }

            // Update status if changed
            if (toolObj.status) {
                existingTool.status = toolObj.status;
            }

            // Re-render to show updated data
            this.renderToolsInIndicator();
        }
    },

    /**
     * Get a preview string for a tool (Phase 1.5)
     * @param {Object} tool - Tool object with name and input
     * @returns {string} Human-readable preview
     */
    getToolPreview(tool) {
        const input = tool.input || {};

        switch (tool.name) {
            case 'Read':
                return `📖 ${this.truncatePath(input.file_path)}`;

            case 'Write':
                return `✏️ ${this.truncatePath(input.file_path)}`;

            case 'Edit':
                return `🔧 ${this.truncatePath(input.file_path)}`;

            case 'Bash':
                const cmd = input.command || '';
                const desc = input.description || '';
                return `💻 ${desc || this.truncateCmd(cmd, 40)}`;

            case 'Grep':
                return `🔍 "${input.pattern}" in ${input.path || '.'}`;

            case 'Glob':
                return `📁 ${input.pattern}`;

            case 'WebFetch':
                try {
                    const url = new URL(input.url || '');
                    return `🌐 ${url.hostname}`;
                } catch {
                    return `🌐 ${this.truncateCmd(input.url || '', 30)}`;
                }

            case 'WebSearch':
                return `🔎 "${input.query}"`;

            case 'Task':
                return `🤖 ${input.subagent_type}: ${input.description || 'running'}`;

            case 'Skill':
                return `⚡ /${input.skill || 'skill'}`;

            case 'AskUserQuestion':
                return `❓ Asking user question`;

            case 'EnterPlanMode':
                return `📋 Entering plan mode`;

            case 'ExitPlanMode':
                return `✅ Exiting plan mode`;

            case 'TodoWrite':
                const todoCount = (input.todos || []).length;
                return `📝 Updating ${todoCount} tasks`;

            default:
                return `⚙️ ${tool.name}`;
        }
    },

    /**
     * Truncate a file path for display
     * @param {string} path - The full path
     * @returns {string} Truncated path showing last 2 segments
     */
    truncatePath(path) {
        if (!path) return '';
        const parts = path.split('/');
        if (parts.length > 3) {
            return `.../${parts.slice(-2).join('/')}`;
        }
        return path;
    },

    /**
     * Truncate a command for display
     * @param {string} cmd - The command
     * @param {number} max - Maximum length
     * @returns {string} Truncated command
     */
    truncateCmd(cmd, max) {
        if (!cmd) return '';
        if (cmd.length <= max) return cmd;
        return cmd.substring(0, max) + '...';
    },

    /**
     * Mark a tool as complete
     * @param {string} toolId - The tool use ID
     * @param {boolean} isError - Whether the tool resulted in an error
     */
    markToolComplete(toolId, isError = false) {
        const tool = this.toolsInProgress.find(t => t.id === toolId);
        if (tool) {
            tool.status = isError ? 'error' : 'complete';
            tool.endTime = Date.now();
            tool.duration = tool.endTime - tool.startTime;
            this.renderToolsInIndicator();
        }
    },

    /**
     * Render tools in the streaming indicator
     * Re-renders the entire indicator with tool cards above status line
     */
    renderToolsInIndicator() {
        if (!this.streamingIndicator || !this.streamStartTime) return;

        // Re-render the entire streaming indicator with updated tools
        const elapsed = Date.now() - this.streamStartTime;
        const status = this.toolsInProgress.length > 0 ? 'tools' : 'thinking';
        this.streamingIndicator.innerHTML = this.getStreamingHTML(status, elapsed);

        // Auto-scroll to show new tools
        if (this.autoScrollEnabled && this.container) {
            this.container.scrollTop = this.container.scrollHeight;
        }
    },

    /**
     * Show retry indicator (Phase 4.1)
     * @param {number} attempt - Current retry attempt
     * @param {number} maxRetries - Maximum retries
     * @param {number} delay - Delay before retry in seconds
     * @param {string} errorCode - Error code that caused retry
     */
    showRetryIndicator(attempt, maxRetries, delay, errorCode) {
        if (!this.streamingIndicator) return;

        const elapsed = Date.now() - this.streamStartTime;
        const seconds = (elapsed / 1000).toFixed(1);

        this.streamingIndicator.innerHTML = `
            <div class="streaming-status-line retry-status-line">
                <span class="streaming-spinner">⟳</span>
                <span class="streaming-status status-retry">Retrying (${attempt}/${maxRetries}) in ${delay.toFixed(1)}s</span>
                <span class="streaming-time">${seconds}s</span>
                <span class="error-code">${this.escapeHtml(errorCode)}</span>
            </div>
        `;

        // Add animation class
        this.streamingIndicator.classList.add('retry-mode');
    },

    /**
     * Stop and remove streaming indicator
     */
    stopStreamingIndicator() {
        if (this.streamTimer) {
            clearInterval(this.streamTimer);
            this.streamTimer = null;
        }

        if (this.streamingIndicator) {
            this.streamingIndicator.remove();
            this.streamingIndicator = null;
        }

        this.streamStartTime = null;
        this.toolsInProgress = [];
    },

    /**
     * Format a timestamp
     * @param {Date} date - The date to format
     * @returns {string} Formatted time string
     */
    formatTime(date) {
        if (!date) return '--:--';
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    },

    /**
     * Escape HTML special characters
     * @param {string} text - The text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
