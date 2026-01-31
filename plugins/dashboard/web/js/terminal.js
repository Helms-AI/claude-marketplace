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
        viewMode: 'conversation'
    },

    elements: {
        connectionStatus: null,
        output: null,
        conversation: null,
        input: null,
        actionBtns: null,
        container: null,
        agentInfo: null,
        viewToggleBtns: null
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

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupViewToggle();

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

        // Fetch version and SDK info
        this.loadVersion();
        this.loadSDKInfo();

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

    cacheElements() {
        this.elements.container = document.querySelector('.terminal-container');
        this.elements.connectionStatus = document.getElementById('terminalConnectionStatus');
        this.elements.output = document.getElementById('terminalOutput');
        this.elements.conversation = document.getElementById('terminalConversation');
        this.elements.input = document.getElementById('terminalInput');
        this.elements.actionBtns = document.querySelectorAll('.terminal-action-btn');
        this.elements.viewToggleBtns = document.querySelectorAll('.terminal-view-toggle .view-toggle-btn');
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

        // Disable input while processing
        this.elements.input.disabled = true;
        this.state.waitingForResponse = true;

        // Start streaming progress indicator
        this.startStreamingProgress();

        try {
            const response = await fetch('/api/input/sdk/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: command })
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
                                    this.updateStreamingContent(currentContent);
                                },
                                onToolUse: (tool) => {
                                    if (tool.name && !toolsUsed.find(t => t.name === tool.name && t.id === tool.id)) {
                                        toolsUsed.push(tool);
                                        this.addToolInProgress(tool);
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

            // Display response based on view mode
            if (currentContent || toolsUsed.length > 0) {
                this.displayResponse(currentContent, toolsUsed);
            }

        } catch (error) {
            this.stopStreamingProgress();
            this.displayError(error.message);
        } finally {
            this.elements.input.disabled = false;
            this.elements.input.focus();
            this.state.waitingForResponse = false;
            this.updateConnectionStatus('connected');
        }
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
        const toolName = typeof tool === 'string' ? tool : tool.name;
        const existingTool = this.state.toolsInProgress.find(t =>
            (typeof t === 'string' ? t : t.name) === toolName
        );

        if (!existingTool) {
            // Store full tool object if available
            this.state.toolsInProgress.push(tool);

            // Update appropriate indicator with full tool object
            if (this.state.viewMode === 'conversation' && typeof TerminalConversation !== 'undefined') {
                TerminalConversation.addToolInProgress(tool);
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

            // Final result with cost/usage
            case 'result':
                onResult?.(data);
                // Log usage info
                if (data.total_cost_usd) {
                    console.log(`[Terminal] Cost: $${data.total_cost_usd.toFixed(4)}`);
                }
                if (data.duration_ms) {
                    console.log(`[Terminal] Duration: ${data.duration_ms}ms`);
                }
                break;

            // System messages
            case 'system':
                console.log(`[Terminal] System (${data.subtype}):`, data.data);
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
     * Handle StreamEvent messages - these provide real-time lifecycle visibility
     * @param {Object} data - The stream event data
     * @param {Object} callbacks - Callback functions
     */
    handleStreamEvent(data, callbacks) {
        const { onContent, onToolUse } = callbacks;

        switch (data.event_type) {
            // A new content block is starting
            case 'content_block_start':
                if (data.block_type === 'tool_use') {
                    // Tool is starting - show it immediately
                    const tool = {
                        id: data.tool_id,
                        name: data.tool_name,
                        input: {}, // Will be filled in by deltas
                        status: 'starting'
                    };
                    onToolUse?.(tool);
                    console.log(`[Terminal] Tool starting: ${data.tool_name}`);
                } else if (data.block_type === 'thinking') {
                    // Extended thinking is starting
                    this.updateStreamingStatus('thinking');
                    console.log('[Terminal] Thinking started');
                } else if (data.block_type === 'text') {
                    this.updateStreamingStatus('receiving');
                }
                break;

            // Incremental content update
            case 'content_block_delta':
                if (data.delta_type === 'text_delta' && data.text) {
                    // Accumulate streaming text
                    this.streamingText = (this.streamingText || '') + data.text;
                    onContent?.(this.streamingText);
                } else if (data.delta_type === 'thinking_delta' && data.thinking) {
                    // Could show thinking progress
                    console.debug('[Terminal] Thinking:', data.thinking.substring(0, 50) + '...');
                } else if (data.delta_type === 'input_json_delta') {
                    // Tool input being built incrementally
                    console.debug('[Terminal] Tool input delta');
                }
                break;

            // A content block is complete
            case 'content_block_stop':
                console.debug(`[Terminal] Block ${data.block_index} complete`);
                break;

            // Message is starting
            case 'message_start':
                this.streamingText = ''; // Reset for new message
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
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Terminal.init();
});
