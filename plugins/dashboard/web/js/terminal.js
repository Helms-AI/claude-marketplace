/**
 * Terminal Module - SDK-based Claude Code Terminal
 * Uses Claude Agent SDK for querying with streaming responses
 */

const Terminal = {
    state: {
        commandHistory: [],
        historyIndex: -1,
        currentInput: '',
        detectedOS: null,
        version: '?.?.?',
        waitingForResponse: false,
        agentCount: 0,
        pluginCount: 0,
        // Streaming state
        streamStartTime: null,
        streamTimer: null,
        streamingLineEl: null,
        toolsInProgress: [],
        // View mode: 'conversation' | 'terminal'
        viewMode: 'conversation',
        // SDK configuration (Phase 1.1-1.4)
        sdkConfig: {
            availableModels: ['sonnet', 'opus', 'haiku'],
            currentModel: 'sonnet',
            maxTurns: 50,
            maxBudgetUsd: 5.0,
            enableThinking: true
        },
        // Cost tracking (Phase 1.3)
        sessionCost: 0,
        lastQueryCost: 0,
        // Session management for conversation continuity
        sessionId: null
    },

    elements: {
        connectionStatus: null,
        output: null,
        conversation: null,
        input: null,
        actionBtns: null,
        container: null,
        agentInfo: null,
        viewToggleBtns: null,
        modelSelector: null,
        costDisplay: null,
        interruptBtn: null
    },

    /**
     * Detect the user's operating system from browser information
     */
    detectOS() {
        const platform = navigator.platform?.toLowerCase() || '';
        const userAgent = navigator.userAgent?.toLowerCase() || '';

        if (platform.includes('mac') || userAgent.includes('mac')) {
            return 'macos';
        } else if (platform.includes('win') || userAgent.includes('win')) {
            return 'windows';
        } else {
            return 'linux';
        }
    },

    async init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupViewToggle();
        this.setupModelSelector();

        // Detect OS and apply styling class
        this.state.detectedOS = this.detectOS();
        if (this.elements.container) {
            this.elements.container.classList.add(`terminal-${this.state.detectedOS}`);
        }

        // Initialize conversation view
        if (this.elements.conversation && typeof TerminalConversation !== 'undefined') {
            TerminalConversation.init(this.elements.conversation);
        }

        // Set initial view mode
        this.setViewMode(this.state.viewMode);

        // Initialize conversation storage and restore session if available
        if (typeof ConversationStorage !== 'undefined') {
            try {
                await ConversationStorage.init();
                await this.restoreSession();
            } catch (e) {
                console.error('[Terminal] Failed to initialize storage:', e);
            }
        }

        // Fetch version and SDK info
        this.loadVersion();
        this.loadSDKInfo();
        this.loadSDKConfig();

        // Enable input immediately (SDK is always available)
        this.enableInput(true);
        this.updateConnectionStatus('connected');
    },

    async loadVersion() {
        try {
            const response = await fetch('/api/version');
            if (response.ok) {
                const data = await response.json();
                if (data.version) {
                    this.state.version = data.version;
                    this.updateVersionDisplay();
                }
            }
        } catch (e) {
            console.error('Failed to load version:', e);
        }
    },

    async loadSDKInfo() {
        try {
            // Load agent and plugin counts
            const [agentsResp, pluginsResp] = await Promise.all([
                fetch('/api/input/sdk/agents'),
                fetch('/api/input/sdk/plugins')
            ]);

            if (agentsResp.ok) {
                const data = await agentsResp.json();
                this.state.agentCount = data.count || 0;
            }

            if (pluginsResp.ok) {
                const data = await pluginsResp.json();
                this.state.pluginCount = data.count || 0;
            }

            // Update display
            this.updateSDKInfoDisplay();

        } catch (e) {
            console.error('Failed to load SDK info:', e);
        }
    },

    updateVersionDisplay() {
        const welcome = this.elements.output?.querySelector('.terminal-welcome');
        if (welcome) {
            welcome.innerHTML = welcome.innerHTML.replace(
                /Terminal v[\d.?]+/,
                `Terminal v${this.state.version}`
            );
        }
    },

    updateSDKInfoDisplay() {
        if (this.state.agentCount > 0) {
            this.appendLine(`SDK loaded: ${this.state.pluginCount} plugins, ${this.state.agentCount} agents`, 'success');
        }
    },

    /**
     * Load SDK configuration from the server
     */
    async loadSDKConfig() {
        try {
            const response = await fetch('/api/input/sdk/config');
            if (response.ok) {
                const data = await response.json();
                if (data.config) {
                    this.state.sdkConfig = {
                        availableModels: data.config.available_models || ['sonnet', 'opus', 'haiku'],
                        currentModel: data.config.current_model || 'sonnet',
                        maxTurns: data.config.max_turns || 50,
                        maxBudgetUsd: data.config.max_budget_usd || 5.0,
                        enableThinking: data.config.enable_thinking !== false
                    };
                    this.updateModelSelectorDisplay();
                    console.log('[Terminal] SDK config loaded:', this.state.sdkConfig);
                }
            }
        } catch (e) {
            console.error('Failed to load SDK config:', e);
        }
    },

    /**
     * Setup model selector dropdown
     */
    setupModelSelector() {
        // The model selector is created dynamically, so we check if it exists
        // and create click handler
        const selector = this.elements.modelSelector;
        if (selector) {
            selector.addEventListener('change', (e) => {
                this.setModel(e.target.value);
            });
        }
    },

    /**
     * Update model selector display
     */
    updateModelSelectorDisplay() {
        const selector = this.elements.modelSelector;
        if (!selector) return;

        // Clear existing options
        selector.innerHTML = '';

        // Add options for each available model
        for (const model of this.state.sdkConfig.availableModels) {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model.charAt(0).toUpperCase() + model.slice(1);
            option.selected = model === this.state.sdkConfig.currentModel;
            selector.appendChild(option);
        }
    },

    /**
     * Set the current model
     * @param {string} model - The model to use ('sonnet', 'opus', 'haiku')
     */
    setModel(model) {
        if (this.state.sdkConfig.availableModels.includes(model)) {
            this.state.sdkConfig.currentModel = model;
            console.log(`[Terminal] Model set to: ${model}`);

            // Persist model selection
            if (typeof ConversationStorage !== 'undefined') {
                ConversationStorage.setModel(model);
            }
        }
    },

    /**
     * Restore session from storage on page load
     * Retrieves session ID, model, and conversation history
     */
    async restoreSession() {
        if (typeof ConversationStorage === 'undefined') return;

        try {
            const sessionState = await ConversationStorage.getSessionState();

            if (!sessionState) {
                console.log('[Terminal] No valid session to restore');
                return;
            }

            const { sessionId, model, messages } = sessionState;

            // Restore session ID
            this.state.sessionId = sessionId;
            console.log(`[Terminal] Restoring session: ${sessionId}`);

            // Restore model selection
            if (model && this.state.sdkConfig.availableModels.includes(model)) {
                this.state.sdkConfig.currentModel = model;
                this.updateModelSelectorDisplay();
            }

            // Restore conversation history
            if (messages && messages.length > 0) {
                this.replayMessages(messages);
                console.log(`[Terminal] Restored ${messages.length} messages`);
            }
        } catch (e) {
            console.error('[Terminal] Failed to restore session:', e);
            // Clear potentially corrupted storage
            ConversationStorage.clearSessionStorage();
        }
    },

    /**
     * Replay stored messages into the conversation view
     * @param {Array} messages - Array of stored messages
     */
    replayMessages(messages) {
        if (!messages || messages.length === 0) return;

        // Remove welcome message before replaying
        const welcome = this.elements.conversation?.querySelector('.terminal-conversation-welcome');
        if (welcome) {
            welcome.remove();
        }

        for (const msg of messages) {
            if (msg.type === 'user') {
                if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
                    TerminalConversation.addUserMessage(msg.content, { skipStorage: true, timestamp: msg.timestamp });
                } else {
                    this.appendLine(`> ${msg.content}`, 'command');
                }
            } else if (msg.type === 'assistant') {
                if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
                    TerminalConversation.addAssistantMessage(
                        msg.text,
                        msg.toolUses || [],
                        { skipStorage: true, timestamp: msg.timestamp, source: msg.source || 'main' }
                    );
                } else {
                    if (msg.text) {
                        this.appendLine('', 'output');
                        const lines = msg.text.split('\n');
                        for (const line of lines) {
                            this.appendLine(line, 'output');
                        }
                    }
                }
            }
        }

        // Scroll to bottom after replay
        if (this.elements.conversation) {
            this.elements.conversation.scrollTop = this.elements.conversation.scrollHeight;
        }
    },

    /**
     * Save a user message to storage
     * @param {string} content - The message content
     */
    async saveUserMessage(content) {
        if (typeof ConversationStorage === 'undefined' || !this.state.sessionId) return;

        try {
            await ConversationStorage.saveMessage(this.state.sessionId, {
                type: 'user',
                content
            });
        } catch (e) {
            console.warn('[Terminal] Failed to save user message:', e);
        }
    },

    /**
     * Save an assistant message to storage
     * @param {string} text - The response text
     * @param {Array} toolUses - Array of tool uses
     * @param {string} source - 'main' or agent ID
     */
    async saveAssistantMessage(text, toolUses = [], source = 'main') {
        if (typeof ConversationStorage === 'undefined' || !this.state.sessionId) return;

        try {
            await ConversationStorage.saveMessage(this.state.sessionId, {
                type: 'assistant',
                text,
                toolUses,
                source
            });
        } catch (e) {
            console.warn('[Terminal] Failed to save assistant message:', e);
        }
    },

    /**
     * Display cost summary after a query
     * @param {number} cost - Cost in USD
     */
    displayCostSummary(cost) {
        this.state.lastQueryCost = cost || 0;
        this.state.sessionCost += this.state.lastQueryCost;

        // Update cost display if it exists
        if (this.elements.costDisplay) {
            this.elements.costDisplay.innerHTML = `
                <span class="cost-label">Query:</span>
                <span class="cost-value">$${this.state.lastQueryCost.toFixed(4)}</span>
                <span class="cost-separator">|</span>
                <span class="cost-label">Session:</span>
                <span class="cost-value">$${this.state.sessionCost.toFixed(4)}</span>
            `;
            this.elements.costDisplay.classList.add('has-cost');
        }

        console.log(`[Terminal] Cost: $${cost?.toFixed(4) || '0.0000'} (Session: $${this.state.sessionCost.toFixed(4)})`);
    },

    cacheElements() {
        this.elements.container = document.querySelector('.terminal-container');
        this.elements.connectionStatus = document.getElementById('terminalConnectionStatus');
        this.elements.output = document.getElementById('terminalOutput');
        this.elements.conversation = document.getElementById('terminalConversation');
        this.elements.input = document.getElementById('terminalInput');
        this.elements.actionBtns = document.querySelectorAll('.terminal-action-btn');
        this.elements.viewToggleBtns = document.querySelectorAll('.terminal-view-toggle .view-toggle-btn');
        this.elements.modelSelector = document.getElementById('terminalModelSelector');
        this.elements.costDisplay = document.getElementById('terminalCostDisplay');
        this.elements.interruptBtn = document.getElementById('terminalInterruptBtn');
    },

    setupEventListeners() {
        // Input handling
        if (this.elements.input) {
            this.elements.input.addEventListener('keydown', (e) => {
                this.handleInputKeydown(e);
            });
        }

        // Action buttons
        this.elements.actionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleAction(action);
            });
        });
    },

    /**
     * Setup view toggle button event listeners
     */
    setupViewToggle() {
        this.elements.viewToggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                if (view !== this.state.viewMode) {
                    this.setViewMode(view);
                }
            });
        });
    },

    /**
     * Switch between terminal and conversation view modes
     * @param {string} mode - 'terminal' | 'conversation'
     */
    setViewMode(mode) {
        this.state.viewMode = mode;

        // Update toggle button states
        this.elements.viewToggleBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === mode);
        });

        // Toggle view visibility
        if (this.elements.output) {
            this.elements.output.classList.toggle('hidden', mode !== 'terminal');
        }
        if (this.elements.conversation) {
            this.elements.conversation.classList.toggle('hidden', mode !== 'conversation');
        }
    },

    handleInputKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.sendCommand();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.navigateHistory(-1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.navigateHistory(1);
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            this.handleAction('clear');
        } else if (e.key === 'c' && e.ctrlKey && this.state.waitingForResponse) {
            // Ctrl+C to interrupt (Phase 2.2)
            e.preventDefault();
            this.handleAction('interrupt');
        }
    },

    async sendCommand() {
        const input = this.elements.input;
        const command = input.value.trim();

        if (!command) return;
        if (this.state.waitingForResponse) return;

        // Add to history
        if (command && (this.state.commandHistory.length === 0 ||
            this.state.commandHistory[this.state.commandHistory.length - 1] !== command)) {
            this.state.commandHistory.push(command);
        }
        this.state.historyIndex = -1;
        this.state.currentInput = '';

        // Display command based on view mode
        if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
            // Remove welcome message if present
            const welcome = this.elements.conversation?.querySelector('.terminal-conversation-welcome');
            if (welcome) {
                welcome.remove();
            }
            TerminalConversation.addUserMessage(command);
        } else {
            this.appendLine(`> ${command}`, 'command');
        }

        // Clear input
        input.value = '';

        // Save user message to storage (session ID will be set after first response)
        // We defer this until we have a session ID
        this._pendingUserMessage = command;

        // Process the command using shared logic
        await this.processUserInput(command);
    },

    /**
     * Display a response based on current view mode
     * @param {string} content - The text content
     * @param {Array} toolUses - Array of tool use objects
     */
    displayResponse(content, toolUses = []) {
        if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
            TerminalConversation.addAssistantMessage(content, toolUses);
        } else {
            // Terminal mode: plain text output
            if (content) {
                this.appendLine('', 'output');
                const lines = content.split('\n');
                for (const line of lines) {
                    this.appendLine(line, 'output');
                }
            }
        }
    },

    /**
     * Display an error based on current view mode
     * @param {string} message - The error message
     */
    displayError(message) {
        if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
            // Create error message as assistant response
            TerminalConversation.addAssistantMessage(`**Error:** ${message}`, []);
        } else {
            this.appendLine(`Error: ${message}`, 'error');
        }
    },

    /**
     * Start the streaming progress indicator
     */
    startStreamingProgress() {
        this.state.streamStartTime = Date.now();
        this.state.toolsInProgress = [];

        // Use conversation view streaming indicator if in conversation mode
        if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
            TerminalConversation.startStreamingIndicator();
        } else {
            // Create streaming status line for terminal mode
            const output = this.elements.output;
            if (output) {
                this.state.streamingLineEl = document.createElement('div');
                this.state.streamingLineEl.className = 'terminal-line streaming-progress';
                this.state.streamingLineEl.innerHTML = this.getStreamingHTML('thinking', 0);
                output.appendChild(this.state.streamingLineEl);
                output.scrollTop = output.scrollHeight;
            }

            // Start timer to update elapsed time
            this.state.streamTimer = setInterval(() => {
                this.updateStreamingTimer();
            }, 100);
        }

        // Update status bar
        this.updateConnectionStatus('thinking');
    },

    /**
     * Update the streaming timer display
     */
    updateStreamingTimer() {
        if (!this.state.streamingLineEl || !this.state.streamStartTime) return;

        const elapsed = Date.now() - this.state.streamStartTime;
        const status = this.state.toolsInProgress.length > 0 ? 'tools' : 'thinking';
        this.state.streamingLineEl.innerHTML = this.getStreamingHTML(status, elapsed);

        // Update status bar with elapsed time
        this.updateConnectionStatus('thinking');

        // Keep scrolled to bottom
        const output = this.elements.output;
        if (output) {
            output.scrollTop = output.scrollHeight;
        }
    },

    /**
     * Generate HTML for streaming progress indicator
     */
    getStreamingHTML(status, elapsed) {
        const seconds = (elapsed / 1000).toFixed(1);
        const spinner = this.getSpinnerFrame(elapsed);

        let statusText = '';
        let statusClass = '';

        switch (status) {
            case 'thinking':
                statusText = `${spinner} Thinking...`;
                statusClass = 'status-thinking';
                break;
            case 'tools':
                const tools = this.state.toolsInProgress.join(', ');
                statusText = `${spinner} Using: ${tools}`;
                statusClass = 'status-tools';
                break;
            case 'receiving':
                statusText = `${spinner} Receiving response...`;
                statusClass = 'status-receiving';
                break;
        }

        return `<span class="streaming-status ${statusClass}">${statusText}</span>` +
               `<span class="streaming-time">${seconds}s</span>`;
    },

    /**
     * Get animated spinner frame
     */
    getSpinnerFrame(elapsed) {
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        const frameIndex = Math.floor(elapsed / 80) % frames.length;
        return frames[frameIndex];
    },

    /**
     * Update streaming status (thinking -> receiving)
     */
    updateStreamingStatus(status) {
        if (!this.state.streamingLineEl) return;
        const elapsed = Date.now() - this.state.streamStartTime;
        this.state.streamingLineEl.innerHTML = this.getStreamingHTML(status, elapsed);
    },

    /**
     * Update streaming line with content preview
     */
    updateStreamingContent(content) {
        // Content is shown in final display, just update status
        this.updateStreamingStatus('receiving');
    },

    /**
     * Add a tool to the in-progress list
     * @param {string|Object} tool - Tool name or full tool object
     */
    addToolInProgress(tool) {
        const toolObj = typeof tool === 'string' ? { name: tool } : tool;
        const toolId = toolObj.id;

        // Check if tool already exists (by ID if available, otherwise by name)
        const existingIndex = this.state.toolsInProgress.findIndex(t => {
            if (toolId && typeof t === 'object' && t.id) {
                return t.id === toolId;
            }
            return (typeof t === 'string' ? t : t.name) === toolObj.name;
        });

        if (existingIndex === -1) {
            // Store full tool object
            this.state.toolsInProgress.push(toolObj);

            // Update appropriate indicator with full tool object
            if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
                TerminalConversation.addToolInProgress(toolObj);
            } else {
                this.updateStreamingTimer();
            }
        } else {
            // Update existing tool with new data (especially input)
            const existing = this.state.toolsInProgress[existingIndex];
            if (typeof existing === 'object') {
                Object.assign(existing, toolObj);
            } else {
                this.state.toolsInProgress[existingIndex] = toolObj;
            }

            // Update appropriate indicator
            if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
                TerminalConversation.addToolInProgress(toolObj);
            } else {
                this.updateStreamingTimer();
            }
        }
    },

    /**
     * Handle a streaming message from the SDK bridge.
     * This is the central dispatcher for all SDK event types.
     * @param {Object} data - The parsed message data
     * @param {Object} callbacks - Callback functions for different event types
     */
    handleStreamMessage(data, callbacks) {
        const { onContent, onToolUse, onToolResult, onError, onResult } = callbacks;

        switch (data.type) {
            // StreamEvent - Real-time lifecycle events
            case 'stream_event':
                // Capture session ID from stream events for conversation continuity
                if (data.session_id && !this.state.sessionId) {
                    this.state.sessionId = data.session_id;
                    console.log(`[Terminal] Session captured from stream: ${this.state.sessionId}`);
                    // Persist session ID
                    if (typeof ConversationStorage !== 'undefined') {
                        ConversationStorage.setSessionId(data.session_id);
                    }
                }
                this.handleStreamEvent(data, callbacks);
                break;

            // AssistantMessage - Complete response with content blocks
            case 'assistant':
                if (data.content) {
                    onContent?.(data.content);
                }
                if (data.tool_uses) {
                    for (const tool of data.tool_uses) {
                        onToolUse?.(tool);
                    }
                }
                // Handle thinking blocks (extended thinking)
                if (data.thinking) {
                    console.log('[Terminal] Thinking blocks:', data.thinking.length);
                }
                break;

            // Unknown type with content - treat as assistant response
            case 'unknown':
                if (data.content) {
                    onContent?.(data.content);
                }
                if (data.tool_uses) {
                    for (const tool of data.tool_uses) {
                        onToolUse?.(tool);
                    }
                }
                break;

            // Tool results from user message
            case 'tool_result':
                const results = data.results || [];
                for (const result of results) {
                    onToolResult?.(result);
                }
                break;

            // Final result with cost/usage (Phase 1.3)
            case 'result':
                onResult?.(data);
                // Display cost summary
                if (data.total_cost_usd !== undefined) {
                    this.displayCostSummary(data.total_cost_usd);
                }
                if (data.duration_ms) {
                    console.log(`[Terminal] Duration: ${data.duration_ms}ms`);
                }
                // Capture session ID from result message for conversation continuity
                if (data.session_id && !this.state.sessionId) {
                    this.state.sessionId = data.session_id;
                    console.log(`[Terminal] Session captured from result: ${this.state.sessionId}`);
                    // Persist session ID
                    if (typeof ConversationStorage !== 'undefined') {
                        ConversationStorage.setSessionId(data.session_id);
                    }
                }
                break;

            // System messages
            case 'system':
                console.log(`[Terminal] System (${data.subtype}):`, data.data);
                // Handle retry notifications (Phase 4.1)
                if (data.subtype === 'retry') {
                    this.handleRetryNotification(data.data);
                }
                // Capture session ID from init message for conversation continuity
                if (data.subtype === 'init' && data.data?.session_id) {
                    this.state.sessionId = data.data.session_id;
                    console.log(`[Terminal] Session started: ${this.state.sessionId}`);
                    // Persist session ID
                    if (typeof ConversationStorage !== 'undefined') {
                        ConversationStorage.setSessionId(data.data.session_id);
                    }
                }
                break;

            // Error messages
            case 'error':
                onError?.(data.content || 'Unknown error');
                break;

            default:
                // Log unknown types for debugging
                console.debug('[Terminal] Unknown message type:', data.type, data);
        }
    },

    /**
     * Track partial tool input JSON being streamed
     * Maps block_index -> { jsonString: string, toolName: string, toolId: string }
     */
    streamingToolInputs: {},

    /**
     * Handle StreamEvent messages - these provide real-time lifecycle visibility
     * @param {Object} data - The stream event data
     * @param {Object} callbacks - Callback functions
     */
    handleStreamEvent(data, callbacks) {
        const { onContent, onTextDelta, onToolUse } = callbacks;

        switch (data.event_type) {
            // A new content block is starting
            case 'content_block_start':
                if (data.block_type === 'tool_use') {
                    // Initialize tracking for this tool's streaming input (keyed by block_index)
                    const blockIndex = data.block_index;
                    this.streamingToolInputs[blockIndex] = {
                        jsonString: '',
                        toolName: data.tool_name,
                        toolId: data.tool_id
                    };
                    // Tool is starting - show it immediately (input will update as it streams)
                    const tool = {
                        id: data.tool_id,
                        name: data.tool_name,
                        input: {}, // Will be filled in by deltas
                        status: 'starting'
                    };
                    onToolUse?.(tool);
                    console.log(`[Terminal] Tool starting: ${data.tool_name}`);
                } else if (data.block_type === 'thinking') {
                    // Extended thinking is starting (Phase 1.4)
                    this.updateStreamingStatus('thinking');
                    if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
                        TerminalConversation.startThinkingBlock();
                    }
                    console.log('[Terminal] Thinking started');
                } else if (data.block_type === 'text') {
                    this.updateStreamingStatus('receiving');
                    // Start streaming message immediately when text block begins
                    if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
                        if (!TerminalConversation.isStreamingMessage()) {
                            TerminalConversation.startStreamingMessage('main');
                        }
                    }
                }
                break;

            // Incremental content update
            case 'content_block_delta':
                if (data.delta_type === 'text_delta' && data.text) {
                    // Accumulate streaming text
                    this.streamingText = (this.streamingText || '') + data.text;
                    onContent?.(this.streamingText);
                    // NEW: Call onTextDelta with just the delta for real-time streaming
                    onTextDelta?.(data.text);
                } else if (data.delta_type === 'thinking_delta' && data.thinking) {
                    // Extended thinking content (Phase 1.4)
                    if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
                        TerminalConversation.appendThinkingContent(data.thinking);
                    }
                    console.debug('[Terminal] Thinking:', data.thinking.substring(0, 50) + '...');
                } else if (data.delta_type === 'input_json_delta' && data.partial_json) {
                    // Tool input being built incrementally - accumulate and try to parse
                    const blockIndex = data.block_index;
                    const toolInfo = this.streamingToolInputs[blockIndex];
                    if (toolInfo) {
                        toolInfo.jsonString += data.partial_json;

                        // Try to parse the accumulated JSON
                        try {
                            const input = JSON.parse(toolInfo.jsonString);
                            // Successfully parsed! Update the tool with real input data
                            const tool = {
                                id: toolInfo.toolId,
                                name: toolInfo.toolName,
                                input: input,
                                status: 'running'
                            };
                            onToolUse?.(tool);
                            console.debug('[Terminal] Tool input updated:', Object.keys(input));
                        } catch (e) {
                            // JSON not complete yet, keep accumulating
                        }
                    }
                }
                break;

            // A content block is complete
            case 'content_block_stop':
                // End thinking block if we were in thinking mode (Phase 1.4)
                if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
                    if (TerminalConversation.isThinking) {
                        TerminalConversation.endThinkingBlock();
                    }
                }
                console.debug(`[Terminal] Block ${data.block_index} complete`);
                break;

            // Message is starting
            case 'message_start':
                this.streamingText = ''; // Reset for new message
                this.streamingToolInputs = {}; // Reset tool input tracking
                if (data.model) {
                    console.log(`[Terminal] Using model: ${data.model}`);
                }
                break;

            // Message metadata update
            case 'message_delta':
                if (data.stop_reason) {
                    console.log(`[Terminal] Stop reason: ${data.stop_reason}`);
                }
                if (data.usage) {
                    console.debug('[Terminal] Usage:', data.usage);
                }
                break;

            // Message is complete
            case 'message_stop':
                console.debug('[Terminal] Message complete');
                break;

            default:
                console.debug('[Terminal] Unknown stream event:', data.event_type);
        }
    },

    /**
     * Mark a tool as complete
     * @param {string} toolId - The tool use ID
     * @param {boolean} isError - Whether the tool resulted in an error
     */
    markToolComplete(toolId, isError = false) {
        // Update the tool in the in-progress list
        const toolIndex = this.state.toolsInProgress.findIndex(t =>
            (typeof t === 'object' ? t.id : null) === toolId
        );

        if (toolIndex >= 0) {
            const tool = this.state.toolsInProgress[toolIndex];
            if (typeof tool === 'object') {
                tool.status = isError ? 'error' : 'complete';
            }
        }

        // Update conversation view if active
        if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
            TerminalConversation.markToolComplete(toolId, isError);
        }
    },

    /**
     * Stop the streaming progress indicator
     */
    stopStreamingProgress() {
        // Stop conversation view indicator if in conversation mode
        if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
            TerminalConversation.stopStreamingIndicator();
        }

        // Clear timer (terminal mode)
        if (this.state.streamTimer) {
            clearInterval(this.state.streamTimer);
            this.state.streamTimer = null;
        }

        // Remove streaming line (terminal mode)
        if (this.state.streamingLineEl) {
            this.state.streamingLineEl.remove();
            this.state.streamingLineEl = null;
        }

        // Reset state
        this.state.streamStartTime = null;
        this.state.toolsInProgress = [];
    },

    navigateHistory(direction) {
        const input = this.elements.input;
        const history = this.state.commandHistory;

        if (history.length === 0) return;

        if (this.state.historyIndex === -1) {
            this.state.currentInput = input.value;
        }

        let newIndex = this.state.historyIndex + direction;

        if (direction < 0) {
            if (newIndex < 0) newIndex = 0;
            if (this.state.historyIndex === -1) {
                newIndex = history.length - 1;
            }
        } else {
            if (newIndex >= history.length) {
                this.state.historyIndex = -1;
                input.value = this.state.currentInput;
                return;
            }
        }

        this.state.historyIndex = newIndex;
        input.value = history[newIndex] || '';
    },

    handleAction(action) {
        if (action === 'clear') {
            this.clearOutput();
        } else if (action === 'interrupt') {
            this.interruptQuery();
        }
    },

    /**
     * Handle retry notification (Phase 4.1)
     * @param {Object} data - Retry data with attempt, max_retries, delay, error
     */
    handleRetryNotification(data) {
        const { attempt, max_retries, delay, error } = data;
        const errorCode = error?.code || 'unknown';
        const message = `Retrying (${attempt}/${max_retries}) in ${delay.toFixed(1)}s - ${errorCode}`;

        console.log(`[Terminal] ${message}`);

        // Update streaming indicator to show retry
        if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
            TerminalConversation.showRetryIndicator(attempt, max_retries, delay, errorCode);
        } else if (this.state.streamingLineEl) {
            this.state.streamingLineEl.innerHTML = `
                <span class="streaming-status status-retry">
                    ⟳ ${message}
                </span>
            `;
        }
    },

    /**
     * Interrupt the current query (Phase 2.2)
     */
    async interruptQuery() {
        if (!this.state.waitingForResponse) return;

        try {
            const response = await fetch('/api/input/sdk/interrupt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.interrupted) {
                    console.log('[Terminal] Query interrupted');
                    this.stopStreamingProgress();
                    this.displayError('Query interrupted by user');
                }
            }
        } catch (e) {
            console.error('Failed to interrupt:', e);
        }
    },

    appendLine(text, type = 'output') {
        const output = this.elements.output;
        if (!output) return;

        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        line.textContent = text;

        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    },

    clearOutput() {
        // Clear session storage and IndexedDB
        if (typeof ConversationStorage !== 'undefined') {
            if (this.state.sessionId) {
                ConversationStorage.clearSession(this.state.sessionId).catch(e =>
                    console.warn('[Terminal] Failed to clear session storage:', e)
                );
            }
            ConversationStorage.clearSessionStorage();
        }

        // Reset session for new conversation
        if (this.state.sessionId) {
            console.log(`[Terminal] Ending session: ${this.state.sessionId}`);
            this.state.sessionId = null;
        }
        // Reset cost tracking for new session
        this.state.sessionCost = 0;
        this.state.lastQueryCost = 0;

        // Clear terminal output
        const output = this.elements.output;
        if (output) {
            output.innerHTML = `<pre class="terminal-welcome">
 ██████╗██╗       █████╗ ██╗   ██╗██████╗ ███████╗
██╔════╝██║      ██╔══██╗██║   ██║██╔══██╗██╔════╝
██║     ██║      ███████║██║   ██║██║  ██║█████╗
██║     ██║      ██╔══██║██║   ██║██║  ██║██╔══╝
╚██████╗███████╗ ██║  ██║╚██████╔╝██████╔╝███████╗
 ╚═════╝╚══════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
   ██████╗ ██████╗ ██████╗ ███████╗
  ██╔════╝██╔═══██╗██╔══██╗██╔════╝
  ██║     ██║   ██║██║  ██║█████╗
  ██║     ██║   ██║██║  ██║██╔══╝
  ╚██████╗╚██████╔╝██████╔╝███████╗
   ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝

  Claude Code Terminal v${this.state.version}
  ─────────────────────────────

  Terminal cleared.
</pre>`;
        }

        // Clear conversation view
        if (this.elements.conversation && typeof TerminalConversation !== 'undefined') {
            TerminalConversation.clear();
            // Show welcome message again
            this.elements.conversation.innerHTML = `
                <div class="terminal-conversation-welcome">
                    <div class="welcome-content">
                        <div class="welcome-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </div>
                        <h3>Claude SDK Terminal</h3>
                        <p>Terminal cleared. Type a message to start a new conversation.</p>
                    </div>
                </div>
            `;
            // Re-initialize conversation module
            TerminalConversation.init(this.elements.conversation);
        }
    },

    updateConnectionStatus(status) {
        const statusEl = this.elements.connectionStatus;
        if (!statusEl) return;

        statusEl.className = `terminal-status ${status}`;

        switch (status) {
            case 'connected':
                statusEl.textContent = 'SDK Ready';
                break;
            case 'thinking':
                // Show elapsed time in status bar during thinking
                if (this.state.streamStartTime) {
                    const elapsed = ((Date.now() - this.state.streamStartTime) / 1000).toFixed(1);
                    statusEl.textContent = `Thinking... ${elapsed}s`;
                } else {
                    statusEl.textContent = 'Thinking...';
                }
                break;
            default:
                statusEl.textContent = 'Ready';
                break;
        }
    },

    enableInput(enabled) {
        const input = this.elements.input;
        if (input) {
            input.disabled = !enabled;
            if (enabled) {
                input.focus();
            }
        }
    },

    // Called when terminal tab is activated
    onTabActivated() {
        if (this.elements.input) {
            this.elements.input.focus();
        }
    },

    /**
     * Continue the conversation with a user response (e.g., from AskUserQuestion)
     * @param {string} responseText - The user's response text
     */
    continueWithUserResponse(responseText) {
        if (!responseText) return;
        if (this.state.waitingForResponse) {
            console.warn('[Terminal] Cannot continue - already waiting for response');
            return;
        }

        // Display the user response in the conversation
        if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
            // Remove welcome message if present
            const welcome = this.elements.conversation?.querySelector('.terminal-conversation-welcome');
            if (welcome) {
                welcome.remove();
            }
            TerminalConversation.addUserMessage(responseText);
        } else {
            this.appendLine(`> ${responseText}`, 'command');
        }

        // Add to history
        if (this.state.commandHistory.length === 0 ||
            this.state.commandHistory[this.state.commandHistory.length - 1] !== responseText) {
            this.state.commandHistory.push(responseText);
        }

        // Process the response as a new command
        this.processUserInput(responseText);
    },

    /**
     * Process user input and send to SDK
     * Separated from sendCommand to allow programmatic submission
     * @param {string} text - The text to send
     */
    async processUserInput(text) {
        if (!text) return;

        // Disable input while processing
        this.elements.input.disabled = true;
        this.state.waitingForResponse = true;

        // Enable interrupt button (Phase 2.2)
        if (this.elements.interruptBtn) {
            this.elements.interruptBtn.disabled = false;
        }

        // Start streaming progress indicator
        this.startStreamingProgress();

        try {
            // Build request body with SDK options (Phase 1.1-1.4)
            const requestBody = {
                prompt: text,
                model: this.state.sdkConfig.currentModel,
                max_turns: this.state.sdkConfig.maxTurns,
                max_budget_usd: this.state.sdkConfig.maxBudgetUsd,
                enable_thinking: this.state.sdkConfig.enableThinking
            };

            // Add session ID for conversation continuity if we have one
            if (this.state.sessionId) {
                requestBody.resume = this.state.sessionId;
                console.log(`[Terminal] Resuming session: ${this.state.sessionId}`);
            } else {
                console.log('[Terminal] Starting new session');
            }

            const response = await fetch('/api/input/sdk/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const error = await response.json();
                this.stopStreamingProgress();
                this.displayError(error.error || 'Failed to send command');
                return;
            }

            // Stream SSE response with live updates
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let currentContent = '';
            let toolsUsed = [];
            let hasStartedResponse = false;

            // Check if we're in conversation mode for real-time streaming
            const isConversationMode = this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Parse SSE events from buffer
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            // Handle different message types from the SDK
                            this.handleStreamMessage(data, {
                                onContent: (content) => {
                                    currentContent = content;
                                    if (!hasStartedResponse) {
                                        hasStartedResponse = true;
                                        this.updateStreamingStatus('receiving');
                                    }
                                    // In conversation mode, content is streamed via onTextDelta
                                    if (!isConversationMode) {
                                        this.updateStreamingContent(currentContent);
                                    }
                                },
                                onTextDelta: (delta) => {
                                    // Real-time text streaming for conversation mode
                                    if (isConversationMode) {
                                        // Stop the streaming indicator on first text
                                        if (!hasStartedResponse) {
                                            hasStartedResponse = true;
                                            this.stopStreamingProgress();
                                        }
                                        TerminalConversation.appendStreamingText(delta);
                                    }
                                },
                                onToolUse: (tool) => {
                                    // Check if this tool already exists (from streaming events)
                                    const existingTool = toolsUsed.find(t => t.id === tool.id);
                                    const isStreaming = typeof TerminalConversation !== 'undefined' && TerminalConversation.isStreamingMessage();

                                    if (existingTool) {
                                        // Update existing tool with complete data (especially input)
                                        Object.assign(existingTool, tool);
                                        // Also update the streaming message so tool cards show data
                                        if (isConversationMode && isStreaming) {
                                            TerminalConversation.addStreamingTool(tool);
                                        }
                                    } else if (tool.name) {
                                        toolsUsed.push(tool);
                                        // In conversation mode, add tool to streaming message
                                        if (isConversationMode && isStreaming) {
                                            TerminalConversation.addStreamingTool(tool);
                                        } else {
                                            this.addToolInProgress(tool);
                                        }
                                    }
                                },
                                onToolResult: (result) => {
                                    this.markToolComplete(result.tool_use_id, result.is_error);
                                    if (result.is_error) {
                                        this.displayError(`[Tool Error] ${result.content}`);
                                    }
                                },
                                onError: (error) => {
                                    this.stopStreamingProgress();
                                    if (isConversationMode) {
                                        TerminalConversation.finalizeStreamingMessage(toolsUsed);
                                    }
                                    this.displayError(error);
                                },
                                onResult: (result) => {
                                    if (result.subagent) {
                                        console.log(`[Terminal] Subagent returned result`, result);
                                    }
                                }
                            });
                        } catch (e) {
                            // Ignore parse errors
                            console.debug('[Terminal] Parse error:', e, line);
                        }
                    }
                }
            }

            // Stop streaming progress and display final content
            this.stopStreamingProgress();

            // Finalize streaming message in conversation mode
            if (isConversationMode && TerminalConversation.isStreamingMessage()) {
                TerminalConversation.finalizeStreamingMessage(toolsUsed);
            } else if (currentContent || toolsUsed.length > 0) {
                // Non-streaming fallback: display response at end
                this.displayResponse(currentContent, toolsUsed);
            }

            // Save messages to storage now that we have a session ID
            if (this.state.sessionId && typeof ConversationStorage !== 'undefined') {
                // Save the pending user message first
                if (this._pendingUserMessage) {
                    this.saveUserMessage(this._pendingUserMessage);
                    this._pendingUserMessage = null;
                }
                // Save the assistant response
                if (currentContent || toolsUsed.length > 0) {
                    this.saveAssistantMessage(currentContent, toolsUsed, 'main');
                }
            }

        } catch (error) {
            this.stopStreamingProgress();
            this.displayError(error.message);
        } finally {
            this.elements.input.disabled = false;
            this.elements.input.focus();
            this.state.waitingForResponse = false;
            this.updateConnectionStatus('connected');

            // Disable interrupt button (Phase 2.2)
            if (this.elements.interruptBtn) {
                this.elements.interruptBtn.disabled = true;
            }
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Terminal.init();
});
