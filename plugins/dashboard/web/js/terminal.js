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
        toolsInProgress: []
    },

    elements: {
        connectionStatus: null,
        output: null,
        input: null,
        actionBtns: null,
        container: null,
        agentInfo: null
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

        // Detect OS and apply styling class
        this.state.detectedOS = this.detectOS();
        if (this.elements.container) {
            this.elements.container.classList.add(`terminal-${this.state.detectedOS}`);
        }

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
        this.elements.input = document.getElementById('terminalInput');
        this.elements.actionBtns = document.querySelectorAll('.terminal-action-btn');
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

        // Display command
        this.appendLine(`> ${command}`, 'command');

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
                this.appendLine(`Error: ${error.error || 'Failed to send command'}`, 'error');
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

                            // Handle different message types
                            // Accept 'assistant' or 'unknown' with content as valid responses
                            if (data.type === 'assistant' || (data.type === 'unknown' && data.content)) {
                                if (data.content) {
                                    currentContent = data.content;
                                    // Update streaming line with content preview
                                    if (!hasStartedResponse) {
                                        hasStartedResponse = true;
                                        this.updateStreamingStatus('receiving');
                                    }
                                    this.updateStreamingContent(currentContent);
                                }
                                if (data.tool_uses) {
                                    for (const tool of data.tool_uses) {
                                        if (tool.name && !toolsUsed.includes(tool.name)) {
                                            toolsUsed.push(tool.name);
                                            this.addToolInProgress(tool.name);
                                        }
                                    }
                                }
                            } else if (data.type === 'error') {
                                this.stopStreamingProgress();
                                this.appendLine(`Error: ${data.content || 'Unknown error'}`, 'error');
                            } else if (data.type === 'tool_result') {
                                // Tool results - mark tool complete, show errors
                                const results = data.results || [];
                                for (const result of results) {
                                    this.markToolComplete(result.tool_use_id);
                                    if (result.is_error) {
                                        this.appendLine(`[Tool Error] ${result.content}`, 'error');
                                    }
                                }
                            }
                        } catch (e) {
                            // Ignore parse errors
                        }
                    }
                }
            }

            // Stop streaming progress and display final content
            this.stopStreamingProgress();

            if (currentContent) {
                this.appendLine('', 'output');
                const lines = currentContent.split('\n');
                for (const line of lines) {
                    this.appendLine(line, 'output');
                }
            }

        } catch (error) {
            this.stopStreamingProgress();
            this.appendLine(`Error: ${error.message}`, 'error');
        } finally {
            this.elements.input.disabled = false;
            this.elements.input.focus();
            this.state.waitingForResponse = false;
            this.updateConnectionStatus('connected');
        }
    },

    /**
     * Start the streaming progress indicator
     */
    startStreamingProgress() {
        this.state.streamStartTime = Date.now();
        this.state.toolsInProgress = [];

        // Create streaming status line
        const output = this.elements.output;
        if (output) {
            this.state.streamingLineEl = document.createElement('div');
            this.state.streamingLineEl.className = 'terminal-line streaming-progress';
            this.state.streamingLineEl.innerHTML = this.getStreamingHTML('thinking', 0);
            output.appendChild(this.state.streamingLineEl);
            output.scrollTop = output.scrollHeight;
        }

        // Update status bar
        this.updateConnectionStatus('thinking');

        // Start timer to update elapsed time
        this.state.streamTimer = setInterval(() => {
            this.updateStreamingTimer();
        }, 100);
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
     */
    addToolInProgress(toolName) {
        if (!this.state.toolsInProgress.includes(toolName)) {
            this.state.toolsInProgress.push(toolName);
            this.updateStreamingTimer();
        }
    },

    /**
     * Mark a tool as complete
     */
    markToolComplete(toolId) {
        // For now just keep showing tools, they'll clear on response
    },

    /**
     * Stop the streaming progress indicator
     */
    stopStreamingProgress() {
        // Clear timer
        if (this.state.streamTimer) {
            clearInterval(this.state.streamTimer);
            this.state.streamTimer = null;
        }

        // Remove streaming line
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
        const output = this.elements.output;
        if (!output) return;

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
