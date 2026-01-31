/**
 * Thinking Indicator Module
 * Shows a visual indicator when Claude is actively processing (thinking, executing tools)
 * and disappears when idle.
 *
 * State Machine:
 * IDLE --[assistant message]--> THINKING
 * THINKING --[tool_use block]--> TOOL_EXECUTING
 * TOOL_EXECUTING --[tool_result]--> THINKING
 * THINKING --[500ms no activity OR user message]--> IDLE
 */

const ThinkingIndicator = {
    // Current state: 'idle' | 'thinking' | 'tool_executing'
    status: 'idle',

    // Currently executing tool name (if any)
    currentTool: null,

    // Pending tools: Map of tool_use_id -> tool name
    pendingTools: new Map(),

    // Idle timeout reference (500ms)
    idleTimeout: null,

    // Container element reference
    container: null,

    // DOM element reference
    element: null,

    /**
     * Initialize the thinking indicator.
     * Creates the DOM element and appends it to the conversation container.
     */
    init() {
        this.container = document.getElementById('conversationContainer');
        if (!this.container) return;

        // Create the indicator element (initially hidden)
        this.element = document.createElement('div');
        this.element.className = 'thinking-indicator-container';
        this.element.innerHTML = `
            <div class="thinking-indicator">
                <div class="thinking-avatar">
                    <span class="avatar-initial">AI</span>
                </div>
                <div class="thinking-content">
                    <div class="thinking-dots">
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                    </div>
                    <span class="thinking-label">Claude is thinking...</span>
                    <span class="tool-label" style="display: none;"></span>
                </div>
            </div>
        `;

        // Hide initially
        this.element.style.display = 'none';

        // Append to container
        this.container.appendChild(this.element);
    },

    /**
     * Process an incoming message to detect activity and update state.
     * @param {Object} message - The message object with role, content, tool_calls, etc.
     * @param {string} source - 'main' or agent ID
     */
    processMessage(message, source) {
        if (!message) return;

        const role = message.role;
        const content = message.content || [];
        const toolCalls = message.tool_calls || [];

        // User message: immediately go to idle
        if (role === 'user') {
            // Check if this is a tool_result (response to tool execution)
            const hasToolResult = Array.isArray(content) &&
                content.some(block => block.type === 'tool_result');

            if (hasToolResult) {
                // Tool result received - clear that pending tool and go back to thinking
                content.forEach(block => {
                    if (block.type === 'tool_result' && block.tool_use_id) {
                        this.pendingTools.delete(block.tool_use_id);
                    }
                });

                // If no more pending tools, go to thinking state
                if (this.pendingTools.size === 0) {
                    this.setStatus('thinking');
                } else {
                    // Still have pending tools - update to show first pending
                    const firstPending = this.pendingTools.values().next().value;
                    this.setStatus('tool_executing', firstPending);
                }
            } else {
                // Regular user input - go to idle immediately
                this.setStatus('idle');
            }
            return;
        }

        // Assistant message: start thinking
        if (role === 'assistant') {
            // Check for tool_use blocks
            const toolUseBlocks = Array.isArray(content) ?
                content.filter(block => block.type === 'tool_use') : [];

            // Also check tool_calls array (different format)
            const allToolCalls = [...toolUseBlocks, ...toolCalls];

            if (allToolCalls.length > 0) {
                // Tool execution - track pending tools
                allToolCalls.forEach(tool => {
                    const toolId = tool.id || tool.tool_use_id;
                    const toolName = tool.name || tool.tool_name || 'Tool';
                    if (toolId) {
                        this.pendingTools.set(toolId, toolName);
                    }
                });

                // Show first tool being executed
                const firstTool = allToolCalls[0];
                const toolName = firstTool.name || firstTool.tool_name || 'Tool';
                this.setStatus('tool_executing', toolName);
            } else {
                // Regular assistant message - thinking state
                this.setStatus('thinking');
            }
        }
    },

    /**
     * Set the visual status of the indicator.
     * @param {string} status - 'idle' | 'thinking' | 'tool_executing'
     * @param {string} toolName - Name of the tool being executed (optional)
     */
    setStatus(status, toolName = null) {
        // Clear any existing idle timeout
        if (this.idleTimeout) {
            clearTimeout(this.idleTimeout);
            this.idleTimeout = null;
        }

        this.status = status;
        this.currentTool = toolName;

        if (!this.element) return;

        const thinkingIndicator = this.element.querySelector('.thinking-indicator');
        const thinkingLabel = this.element.querySelector('.thinking-label');
        const toolLabel = this.element.querySelector('.tool-label');

        switch (status) {
            case 'idle':
                // Hide indicator
                this.element.style.display = 'none';
                this.pendingTools.clear();
                break;

            case 'thinking':
                // Show thinking indicator
                this.element.style.display = 'block';
                thinkingIndicator.classList.remove('tool-active');
                thinkingLabel.textContent = 'Claude is thinking...';
                toolLabel.style.display = 'none';

                // Set idle timeout (500ms)
                this.idleTimeout = setTimeout(() => {
                    this.setStatus('idle');
                }, 500);
                break;

            case 'tool_executing':
                // Show tool execution indicator
                this.element.style.display = 'block';
                thinkingIndicator.classList.add('tool-active');
                thinkingLabel.textContent = 'Executing';
                toolLabel.textContent = toolName || 'Tool';
                toolLabel.style.display = 'inline-block';

                // Don't set idle timeout during tool execution
                // Wait for tool_result to transition back to thinking
                break;
        }

        // Scroll to show indicator (only if auto-scroll is enabled)
        if (status !== 'idle' && this.container) {
            // Check if Conversation module has auto-scroll enabled
            const shouldScroll = typeof Conversation !== 'undefined' &&
                                 Conversation.autoScrollEnabled !== false;
            if (shouldScroll) {
                this.container.scrollTo({
                    top: this.container.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
    },

    /**
     * Clear the indicator and reset state.
     * Called when conversation is cleared.
     */
    clear() {
        if (this.idleTimeout) {
            clearTimeout(this.idleTimeout);
            this.idleTimeout = null;
        }

        this.status = 'idle';
        this.currentTool = null;
        this.pendingTools.clear();

        if (this.element) {
            this.element.style.display = 'none';
        }
    },

    /**
     * Remove the indicator element from DOM.
     * Called on cleanup.
     */
    destroy() {
        this.clear();
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.container = null;
    }
};
