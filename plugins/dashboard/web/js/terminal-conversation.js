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
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.stopStreamingIndicator();
    },

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
     * @param {number} timestamp - Optional timestamp
     */
    addUserMessage(text, timestamp = null) {
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
     * @param {number} timestamp - Optional timestamp
     * @param {string} source - 'main' or agent ID
     */
    addAssistantMessage(content, toolUses = [], timestamp = null, source = 'main') {
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
     */
    startStreamingIndicator() {
        this.streamStartTime = Date.now();
        this.toolsInProgress = [];

        if (!this.container) return;

        // Create streaming indicator element
        this.streamingIndicator = document.createElement('div');
        this.streamingIndicator.className = 'terminal-streaming-indicator chat-message agent-message';
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
                const tools = this.toolsInProgress.map(t => {
                    // Handle Task tool specially to show agent type
                    if (t.name === 'Task' && t.input?.subagent_type) {
                        return `Task(${t.input.subagent_type})`;
                    }
                    return t.name || t;
                }).join(', ');
                statusText = `Using: ${tools}`;
                statusClass = 'status-tools';
                break;
            case 'receiving':
                statusText = 'Receiving response...';
                statusClass = 'status-receiving';
                break;
            case 'agent':
                const agentType = this.toolsInProgress.find(t => t.name === 'Task')?.input?.subagent_type || 'Agent';
                const agentInfo = this.getAgentInfo(agentType);
                statusText = `${agentInfo.name} working...`;
                statusClass = 'status-agent';
                break;
        }

        // Build tools list HTML if there are tools in progress
        let toolsHtml = '';
        if (this.toolsInProgress && this.toolsInProgress.length > 0) {
            toolsHtml = '<div class="streaming-tools-list">';
            for (const tool of this.toolsInProgress) {
                const statusClass = tool.status === 'complete' ? 'tool-complete' :
                                   tool.status === 'error' ? 'tool-error' : 'tool-running';
                const statusIcon = tool.status === 'complete' ? '✓' :
                                  tool.status === 'error' ? '✗' : '⋯';

                // Format tool name
                let displayName = tool.name || 'Tool';
                if (tool.name === 'Task' && tool.input?.subagent_type) {
                    displayName = `Task(${tool.input.subagent_type})`;
                }

                toolsHtml += `
                    <div class="streaming-tool ${statusClass}">
                        <span class="tool-name">${this.escapeHtml(displayName)}</span>
                        <span class="tool-status-icon">${statusIcon}</span>
                    </div>
                `;
            }
            toolsHtml += '</div>';
        }

        return `
            <div class="message-avatar" style="--domain-color: #6366f1">
                <span class="avatar-initial streaming-spinner">${spinner}</span>
            </div>
            <div class="message-body">
                <div class="streaming-status-content">
                    <span class="streaming-status ${statusClass}">${statusText}</span>
                    <span class="streaming-time">${seconds}s</span>
                </div>
                ${toolsHtml}
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
        } else if (toolObj.status && existingTool.status !== toolObj.status) {
            // Update existing tool's status
            existingTool.status = toolObj.status;
            this.renderToolsInIndicator();
        }
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
     * Render tools in the streaming indicator with status badges
     */
    renderToolsInIndicator() {
        if (!this.streamingIndicator) return;

        const toolsContainer = this.streamingIndicator.querySelector('.streaming-tools-list');
        if (!toolsContainer) {
            // Create tools container if it doesn't exist
            const bodyEl = this.streamingIndicator.querySelector('.message-body');
            if (bodyEl) {
                const toolsEl = document.createElement('div');
                toolsEl.className = 'streaming-tools-list';
                bodyEl.appendChild(toolsEl);
                this.renderToolsInIndicator(); // Re-run now that container exists
            }
            return;
        }

        // Render each tool with status
        const toolsHtml = this.toolsInProgress.map(tool => {
            const statusClass = tool.status === 'complete' ? 'tool-complete' :
                               tool.status === 'error' ? 'tool-error' : 'tool-running';
            const statusIcon = tool.status === 'complete' ? '✓' :
                              tool.status === 'error' ? '✗' : '⋯';

            // Get tool icon
            const iconHtml = typeof ToolIcons !== 'undefined'
                ? ToolIcons.getIcon(tool.name)
                : `<span class="tool-icon-fallback">${(tool.name || 'T').charAt(0)}</span>`;

            // Format tool name (handle Task with subagent_type)
            let displayName = tool.name;
            if (tool.name === 'Task' && tool.input?.subagent_type) {
                displayName = `Task(${tool.input.subagent_type})`;
            }

            return `
                <div class="streaming-tool ${statusClass}" data-tool-id="${this.escapeHtml(tool.id || '')}">
                    ${iconHtml}
                    <span class="tool-name">${this.escapeHtml(displayName)}</span>
                    <span class="tool-status-icon">${statusIcon}</span>
                    ${tool.duration ? `<span class="tool-duration">${(tool.duration / 1000).toFixed(1)}s</span>` : ''}
                </div>
            `;
        }).join('');

        toolsContainer.innerHTML = toolsHtml;
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
