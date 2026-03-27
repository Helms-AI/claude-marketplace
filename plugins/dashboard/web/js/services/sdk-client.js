/**
 * SDK Client Service - Handles communication with the Claude SDK bridge API
 * @module services/sdk-client
 */

import { AppStore, Actions } from '../store/app-state.js';
import { ConversationStorage } from '../conversation-storage.js';
import { AttachmentService } from './attachment-service.js';

// Internal event types used by the SDK client
export const SDKEventType = {
    INIT: 'init',
    TEXT: 'text',
    TOOL_START: 'tool_start',
    TOOL_RESULT: 'tool_result',
    THINKING: 'thinking',
    RESULT: 'result',
    ERROR: 'error',
    USAGE: 'usage',
    COMPLETE: 'complete',
    INTERRUPT: 'interrupt',
    INPUT_REQUEST: 'input_request',
    MCP_TOOL_START: 'mcp_tool_start',
    MCP_TOOL_RESULT: 'mcp_tool_result',
    // SDK bridge message types
    STREAM_EVENT: 'stream_event',
    ASSISTANT: 'assistant',
    USER: 'user',
    TOOL_RESULT_MSG: 'tool_result'
};

class SDKClientClass {
    constructor() {
        this._abortController = null;
        this._listeners = new Set();
        this._sessionId = null;
        this._baseUrl = '/api/input/sdk';
        this._storageInitialized = false;
        this._activeConversationId = null;  // Track which conversation is streaming
    }

    /**
     * Initialize SDK client and restore session from localStorage if valid
     */
    async init() {
        if (this._storageInitialized) return;

        try {
            await ConversationStorage.init();
            this._storageInitialized = true;

            // Initialize the main terminal conversation BEFORE loading messages
            // This ensures the per-conversation Map is ready to receive restored messages
            const terminalConversationId = { type: 'terminal', id: 'main' };
            Actions.initConversation(terminalConversationId);

            // Restore session ID from localStorage if still valid
            if (ConversationStorage.isSessionValid()) {
                const savedSessionId = ConversationStorage.getSessionId();
                if (savedSessionId) {
                    this._sessionId = savedSessionId;
                    AppStore.sessionId.value = savedSessionId;
                    console.log('[SDK] Restored session ID from localStorage:', savedSessionId);

                    // Also restore model preference
                    const savedModel = ConversationStorage.getModel();
                    if (savedModel) {
                        AppStore.terminalModel.value = savedModel;
                    }

                    // Load previous conversation messages from IndexedDB
                    await this._loadStoredMessages(savedSessionId);
                }
            } else {
                // Clear expired session
                ConversationStorage.clearSessionStorage();
                console.log('[SDK] No valid session to restore');
            }
        } catch (error) {
            console.error('[SDK] Failed to initialize storage:', error);
        }
    }

    /**
     * Load stored messages from IndexedDB and populate the terminal
     */
    async _loadStoredMessages(sessionId) {
        try {
            const messages = await ConversationStorage.getSessionMessages(sessionId);
            if (messages && messages.length > 0) {
                console.log(`[SDK] Loading ${messages.length} stored messages for session ${sessionId}`);

                // Convert stored messages to terminal message format and add them
                const terminalMessages = messages.map(msg => ({
                    id: msg.messageId || crypto.randomUUID(),
                    role: msg.role,
                    content: msg.content,
                    tools: msg.tools || [],
                    timestamp: msg.timestamp,
                    restored: true // Mark as restored so UI can style differently if needed
                }));

                // Set messages directly to avoid triggering save again
                // Legacy: also set terminalMessages for backwards compatibility
                AppStore.terminalMessages.value = terminalMessages;

                // NEW: Also populate the per-conversation Map for terminal:main
                const terminalConversationId = { type: 'terminal', id: 'main' };
                const key = `${terminalConversationId.type}:${terminalConversationId.id}`;
                const conversations = new Map(AppStore.conversations.value);
                const conv = conversations.get(key);

                if (conv) {
                    conversations.set(key, {
                        ...conv,
                        messages: terminalMessages,
                        lastActivity: Date.now()
                    });
                    AppStore.conversations.value = conversations;
                    console.log('[SDK] Restored conversation history to per-conversation Map');
                }

                console.log('[SDK] Restored conversation history');
            }
        } catch (error) {
            console.error('[SDK] Failed to load stored messages:', error);
        }
    }

    /**
     * Save a message to IndexedDB for persistence
     */
    async _saveMessage(message) {
        if (!this._sessionId || !this._storageInitialized) return;

        try {
            await ConversationStorage.saveMessage(this._sessionId, {
                messageId: message.id,
                role: message.role,
                content: message.content,
                tools: message.tools || []
            });
        } catch (error) {
            console.error('[SDK] Failed to save message:', error);
        }
    }

    async sendMessage(prompt, options = {}) {
        // Check if any conversation is streaming
        if (AppStore.activeStreamingId.value || AppStore.isStreaming.value) {
            console.warn('[SDK] A conversation is already streaming');
            return;
        }

        const {
            conversationId = { type: 'terminal', id: 'main' },  // Default to main terminal
            model = AppStore.terminalModel.value || 'sonnet',
            contextPrefix = null,
            resumeSession = true,
            overrideResumeId = null,  // Override the resume session ID (e.g. for CLI sessions)
            settings = {},
            attachments = []  // Image attachments
        } = options;

        // Initialize conversation if it doesn't exist
        Actions.initConversation(conversationId);

        // Save model preference to localStorage
        ConversationStorage.setModel(model);

        this._abortController = new AbortController();
        this._activeConversationId = conversationId;

        // Set active streaming target
        Actions.setActiveStreamingId(conversationId);
        Actions.setConversationStreaming(conversationId, true);

        // Clear previous streaming content for this conversation
        Actions.clearConversationStreamingState(conversationId);
        Actions.setConversationStreaming(conversationId, true);

        // Legacy: also set global streaming state for backwards compatibility
        Actions.clearStreamingState();
        AppStore.isStreaming.value = true;

        // Add user message to specific conversation AND legacy terminalMessages
        const userBlocks = [{ type: 'text', text: prompt }];
        const userMessage = {
            role: 'user',
            content: prompt,
            text: prompt,
            blocks: userBlocks,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            source: 'main',
            isError: false,
            tool_calls: [],
            ...(attachments.length > 0 && {
                attachments: attachments.map(a => ({
                    id: a.id,
                    name: a.name,
                    type: a.type,
                    size: a.size,
                    preview: a.preview
                }))
            })
        };
        Actions.addConversationMessage(conversationId, userMessage);

        // Legacy: also add to terminalMessages for main terminal backwards compatibility
        if (conversationId.type === 'terminal' && conversationId.id === 'main') {
            Actions.addTerminalMessage(userMessage);
        }

        this._saveMessage(userMessage);

        // Build prompt with optional context prefix
        const fullPrompt = contextPrefix ? `${contextPrefix}\n\nUser request: ${prompt}` : prompt;

        // Build request body with all settings
        // Convert attachments to Claude API format if present
        const images = attachments.length > 0 ? AttachmentService.toClaudeFormat(attachments) : undefined;

        const requestBody = {
            prompt: fullPrompt,  // Use full prompt with context prefix if provided
            model: settings.model || model,
            resume: overrideResumeId || (resumeSession ? this._sessionId : null),
            // Image attachments in Claude format
            ...(images && { images }),
            // SDK options from settings panel
            ...(settings.maxTurns !== undefined && { max_turns: settings.maxTurns }),
            ...(settings.extendedThinking !== undefined && { enable_thinking: settings.extendedThinking }),
            ...(settings.maxThinkingTokens !== undefined && { max_thinking_tokens: settings.maxThinkingTokens }),
            ...(settings.continueConversation !== undefined && { continue_conversation: settings.continueConversation }),
            ...(settings.permissionMode !== undefined && { permission_mode: settings.permissionMode }),
            ...(settings.sandboxMode !== undefined && { sandbox_mode: settings.sandboxMode }),
            ...(settings.fileCheckpointing !== undefined && { file_checkpointing: settings.fileCheckpointing }),
            ...(settings.mcpTools !== undefined && { mcp_tools: settings.mcpTools }),
            ...(settings.betaContext1m && { beta_context_1m: true }),
            ...(settings.toolRestrictions && settings.toolRestrictions !== 'all' && { tool_restrictions: settings.toolRestrictions }),
            ...(settings.maxRetries !== undefined && { max_retries: settings.maxRetries })
        };

        try {
            const response = await fetch(`${this._baseUrl}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                signal: this._abortController.signal
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            await this._processStream(response);
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('[SDK] Request aborted');
                this._notifyListeners(SDKEventType.INTERRUPT, { reason: 'user' });
            } else {
                console.error('[SDK] Request error:', error);
                this._notifyListeners(SDKEventType.ERROR, { message: error.message, code: 'REQUEST_ERROR' });
                Actions.addError({ type: 'sdk', message: error.message });

                // Add error message to conversation so users see feedback
                const errorMessage = {
                    role: 'assistant',
                    content: `⚠️ **Connection Error**: ${error.message}`,
                    id: crypto.randomUUID(),
                    isError: true,
                    errorCode: 'REQUEST_ERROR'
                };

                if (this._activeConversationId) {
                    Actions.addConversationMessage(this._activeConversationId, errorMessage);
                }
                if (this._activeConversationId?.type === 'terminal' && this._activeConversationId?.id === 'main') {
                    Actions.addTerminalMessage(errorMessage);
                }
            }
        } finally {
            // Clear streaming state for the conversation
            if (this._activeConversationId) {
                Actions.clearConversationStreamingState(this._activeConversationId);
            }
            Actions.setActiveStreamingId(null);

            // Legacy: clear global streaming state
            AppStore.isStreaming.value = false;
            this._abortController = null;
            this._activeConversationId = null;
        }
    }

    async _processStream(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentAssistantMessage = null;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        try {
                            const event = JSON.parse(data);
                            currentAssistantMessage = this._processEvent(event, currentAssistantMessage);
                        } catch (e) { console.warn('[SDK] Failed to parse event:', data); }
                    }
                }
            }
            if (currentAssistantMessage) {
                // The SDK service already returns messages in canonical format
                // with role, blocks[], content, tool_calls, model
                const finalMessage = {
                    ...currentAssistantMessage,
                    id: currentAssistantMessage.id || crypto.randomUUID(),
                    role: currentAssistantMessage.role || 'assistant',
                    timestamp: Date.now()
                };

                // Add to specific conversation
                if (this._activeConversationId) {
                    Actions.addConversationMessage(this._activeConversationId, finalMessage);
                }

                // Legacy: also add to terminalMessages for main terminal backwards compatibility
                if (this._activeConversationId?.type === 'terminal' && this._activeConversationId?.id === 'main') {
                    Actions.addTerminalMessage(finalMessage);
                }

                // Save assistant message to IndexedDB
                this._saveMessage(finalMessage);
            }
            // Clear streaming state after message is finalized
            Actions.clearStreamingState();
        } catch (error) { if (error.name !== 'AbortError') throw error; }
    }

    _processEvent(event, currentMessage) {
        // Handle SDK bridge message format directly
        // The SDK bridge sends messages like: {type: "stream_event", event_type: "...", ...}
        // or {type: "assistant", content: "..."}, not {type, data} format
        const eventType = event.type;

        switch (eventType) {
            // === SDK Bridge: StreamEvent messages (real-time streaming) ===
            case 'stream_event':
                return this._processStreamEvent(event, currentMessage);

            // === SDK Bridge: AssistantMessage (complete response) ===
            case 'assistant':
                // This is the complete assistant message - update streaming content
                if (event.content) {
                    if (!currentMessage) currentMessage = { role: 'assistant', content: '', tools: [] };
                    // Don't append, replace - this is the final content
                    currentMessage.content = event.content;
                    Actions.setStreamingContent(event.content);
                }
                if (event.tool_uses) {
                    currentMessage = currentMessage || { role: 'assistant', content: '', tools: [] };
                    currentMessage.tools = event.tool_uses.map(t => ({
                        id: t.id, name: t.name, input: t.input, status: 'complete'
                    }));
                }
                this._notifyListeners(SDKEventType.TEXT, { content: event.content, complete: true });
                break;

            // === SDK Bridge: ResultMessage (final result with usage) ===
            case 'result':
                if (event.session_id) {
                    this._sessionId = event.session_id;
                    AppStore.sessionId.value = event.session_id;
                    // Persist session ID to localStorage for resuming
                    ConversationStorage.setSessionId(event.session_id);
                }
                if (event.total_cost_usd !== undefined || event.usage) {
                    const usage = event.usage || {};
                    Actions.updateTokenUsage({
                        input: usage.input_tokens || 0,
                        output: usage.output_tokens || 0,
                        cacheRead: usage.cache_read_input_tokens || 0,
                        cacheCreation: usage.cache_creation_input_tokens || 0,
                        cost: event.total_cost_usd
                    });
                }
                this._notifyListeners(SDKEventType.RESULT, event);
                break;

            // === SDK Bridge: Tool result message ===
            case 'tool_result':
                if (event.results) {
                    for (const result of event.results) {
                        if (currentMessage) {
                            const tool = currentMessage.tools?.find(t => t.id === result.tool_use_id);
                            if (tool) {
                                tool.result = result.content;
                                tool.error = result.is_error;
                                tool.status = result.is_error ? 'error' : 'complete';
                            }
                        }
                        Actions.updateStreamingTool({
                            id: result.tool_use_id,
                            result: result.content,
                            error: result.is_error,
                            status: result.is_error ? 'error' : 'complete'
                        });
                    }
                }
                this._notifyListeners(SDKEventType.TOOL_RESULT, event);
                break;

            // === SDK Bridge: Error message ===
            case 'error':
                const errorMessage = event.content || event.error?.message || 'An unknown error occurred';
                const errorCode = event.error?.code || 'unknown_error';

                // Add to error store for logging/debugging
                Actions.addError({ type: 'sdk', message: errorMessage, code: errorCode });

                // Check if this is an SDK not installed error - offer auto-install
                if (errorCode === 'sdk_not_installed') {
                    // Attempt auto-install
                    this._handleSdkNotInstalled(errorMessage);
                } else {
                    // IMPORTANT: Also create an error message in the conversation
                    // so users can see what went wrong (fixes missing feedback issue)
                    const errorAssistantMessage = {
                        role: 'assistant',
                        content: `⚠️ **Error**: ${errorMessage}`,
                        id: crypto.randomUUID(),
                        isError: true,
                        errorCode: errorCode
                    };

                    // Add error message to the active conversation
                    if (this._activeConversationId) {
                        Actions.addConversationMessage(this._activeConversationId, errorAssistantMessage);
                    }

                    // Legacy: also add to terminalMessages for main terminal
                    if (this._activeConversationId?.type === 'terminal' && this._activeConversationId?.id === 'main') {
                        Actions.addTerminalMessage(errorAssistantMessage);
                    }
                }

                this._notifyListeners(SDKEventType.ERROR, event);
                break;

            // === SDK Bridge: System message ===
            case 'system':
                if (event.subtype === 'retry') {
                    console.log(`[SDK] Retry ${event.data?.attempt}/${event.data?.max_retries} after ${event.data?.delay}s`);
                } else if (event.subtype === 'init') {
                    // Session initialization — save session_id if present
                    if (event.data?.session_id) {
                        this._sessionId = event.data.session_id;
                        AppStore.sessionId.value = event.data.session_id;
                    }
                }
                // Log compaction/context events for debugging
                console.log(`[SDK] System: ${event.subtype}`, event.data);
                this._notifyListeners(SDKEventType.INIT, event);
                break;

            // === Legacy format support (if type/data format is used) ===
            default:
                // Try legacy format with {type, data} structure
                if (event.data) {
                    return this._processLegacyEvent(event, currentMessage);
                }
                this._notifyListeners(eventType, event);
        }
        return currentMessage;
    }

    /**
     * Process StreamEvent messages from SDK bridge (real-time streaming)
     * These provide character-by-character updates during response generation
     */
    _processStreamEvent(event, currentMessage) {
        const { event_type, delta_type, block_type } = event;

        switch (event_type) {
            case 'message_start':
                // New message starting - initialize
                if (event.session_id) {
                    this._sessionId = event.session_id;
                    AppStore.sessionId.value = event.session_id;
                    // Persist session ID to localStorage for resuming
                    ConversationStorage.setSessionId(event.session_id);
                }
                this._notifyListeners(SDKEventType.INIT, { session_id: event.session_id, model: event.model });
                break;

            case 'content_block_start':
                // A new content block is starting (text, tool_use, thinking)
                if (block_type === 'tool_use') {
                    if (!currentMessage) currentMessage = { role: 'assistant', content: '', tools: [] };
                    currentMessage.tools = currentMessage.tools || [];
                    const toolData = {
                        id: event.tool_id,
                        name: event.tool_name,
                        input: {},
                        status: 'running'
                    };
                    currentMessage.tools.push(toolData);

                    // Update conversation-specific streaming tools
                    if (this._activeConversationId) {
                        Actions.updateConversationStreamingTool(this._activeConversationId, toolData);
                    }

                    // Legacy: also update global streaming tools
                    Actions.updateStreamingTool(toolData);
                    this._notifyListeners(SDKEventType.TOOL_START, { tool_use_id: event.tool_id, tool_name: event.tool_name });
                } else if (block_type === 'thinking') {
                    this._notifyListeners(SDKEventType.THINKING, { start: true });
                }
                break;

            case 'content_block_delta':
                // Incremental update to a content block
                if (delta_type === 'text_delta') {
                    // Text content streaming - this is the key for conversation display!
                    if (!currentMessage) currentMessage = { role: 'assistant', content: '', tools: [] };
                    const text = event.text || '';
                    currentMessage.content += text;

                    // Update streaming content for specific conversation
                    if (this._activeConversationId) {
                        Actions.appendConversationStreamingContent(this._activeConversationId, text);
                    }
                    this._notifyListeners(SDKEventType.TEXT, { content: text, fullContent: currentMessage.content });
                } else if (delta_type === 'input_json_delta') {
                    // Tool input being built incrementally
                    // We could accumulate this but for now just log
                    console.log('[SDK] Tool input delta:', event.partial_json);
                } else if (delta_type === 'thinking_delta') {
                    // Extended thinking content
                    this._notifyListeners(SDKEventType.THINKING, { thinking: event.thinking });
                }
                break;

            case 'content_block_stop':
                // A content block has finished
                this._notifyListeners(SDKEventType.COMPLETE, { block_index: event.block_index });
                break;

            case 'message_delta':
                // Message-level update (often includes stop_reason and usage)
                if (event.usage) {
                    Actions.updateTokenUsage({
                        input: event.usage.input_tokens || 0,
                        output: event.usage.output_tokens || 0,
                        cacheRead: event.usage.cache_read_input_tokens || 0,
                        cacheCreation: event.usage.cache_creation_input_tokens || 0
                    });
                    this._notifyListeners(SDKEventType.USAGE, event.usage);
                }
                break;

            case 'message_stop':
                // Message complete
                this._notifyListeners(SDKEventType.COMPLETE, { message_complete: true });
                break;

            default:
                console.log('[SDK] Unknown stream event type:', event_type, event);
        }

        return currentMessage;
    }

    /**
     * Process legacy event format with {type, data} structure
     * Kept for backwards compatibility
     */
    _processLegacyEvent(event, currentMessage) {
        const { type, data } = event;
        switch (type) {
            case SDKEventType.INIT:
                this._sessionId = data.session_id;
                AppStore.sessionId.value = data.session_id;
                this._notifyListeners(type, data);
                break;
            case SDKEventType.TEXT:
                if (!currentMessage) currentMessage = { role: 'assistant', content: '', tools: [] };
                currentMessage.content += data.content || '';
                this._notifyListeners(type, { ...data, fullContent: currentMessage.content });
                break;
            case SDKEventType.THINKING:
                this._notifyListeners(type, data);
                break;
            case SDKEventType.TOOL_START:
            case SDKEventType.MCP_TOOL_START:
                if (currentMessage) {
                    currentMessage.tools = currentMessage.tools || [];
                    currentMessage.tools.push({ id: data.tool_use_id, name: data.tool_name, input: data.input, status: 'running', isMcp: type === SDKEventType.MCP_TOOL_START });
                }
                Actions.updateStreamingTool({ id: data.tool_use_id, name: data.tool_name, input: data.input, status: 'running', isMcp: type === SDKEventType.MCP_TOOL_START });
                this._notifyListeners(type, data);
                break;
            case SDKEventType.TOOL_RESULT:
            case SDKEventType.MCP_TOOL_RESULT:
                if (currentMessage) {
                    const tool = currentMessage.tools?.find(t => t.id === data.tool_use_id);
                    if (tool) { tool.result = data.result; tool.error = data.error; tool.status = data.error ? 'error' : 'complete'; }
                }
                Actions.updateStreamingTool({ id: data.tool_use_id, result: data.result, error: data.error, status: data.error ? 'error' : 'complete' });
                this._notifyListeners(type, data);
                break;
            case SDKEventType.USAGE:
                Actions.updateTokenUsage({ input: data.input_tokens || 0, output: data.output_tokens || 0, cacheRead: data.cache_read_input_tokens || 0, cacheCreation: data.cache_creation_input_tokens || 0 });
                this._notifyListeners(type, data);
                break;
            case SDKEventType.ERROR:
                Actions.addError({ type: 'sdk', message: data.message || data.error, code: data.code });
                this._notifyListeners(type, data);
                break;
            default:
                this._notifyListeners(type, data);
        }
        return currentMessage;
    }

    interrupt() {
        if (this._abortController) this._abortController.abort();
        // Also tell the server to interrupt
        fetch(`${this._baseUrl}/interrupt`, { method: 'POST' }).catch(() => {});
    }

    async respondToInput(response) {
        if (!this._sessionId) return;
        try { await fetch(`${this._baseUrl}/input`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: this._sessionId, response }) }); }
        catch (error) { console.error('[SDK] Failed to send input response:', error); }
    }

    async resetSession() {
        if (this._sessionId) {
            try { await fetch(`${this._baseUrl}/sessions/${this._sessionId}`, { method: 'DELETE' }); }
            catch (error) { console.error('[SDK] Failed to close session:', error); }

            // Clear stored messages from IndexedDB
            try { await ConversationStorage.clearSession(this._sessionId); }
            catch (error) { console.error('[SDK] Failed to clear stored messages:', error); }
        }
        this._sessionId = null;
        // Clear persisted session from localStorage
        ConversationStorage.clearSessionStorage();
        Actions.resetSession();
    }

    /**
     * Switch to a different session
     * @param {string} sessionId - The session ID to switch to
     */
    async switchSession(sessionId) {
        if (this._sessionId === sessionId) {
            console.log('[SDK] Already on session:', sessionId);
            return;
        }

        console.log('[SDK] Switching to session:', sessionId);

        // Update the session ID
        this._sessionId = sessionId;
        AppStore.sessionId.value = sessionId;

        // Persist to localStorage
        ConversationStorage.setSessionId(sessionId);

        // Clear current messages from UI (legacy)
        AppStore.terminalMessages.value = [];

        // Also clear the per-conversation Map for terminal:main
        const terminalConversationId = { type: 'terminal', id: 'main' };
        Actions.clearConversationMessages(terminalConversationId);

        // Load stored messages for the new session from IndexedDB
        await this._loadStoredMessages(sessionId);

        console.log('[SDK] Switched to session:', sessionId);
    }

    /**
     * Get list of available sessions from server
     * @returns {Promise<string[]>} Array of session IDs
     */
    async getSessions() {
        try {
            const response = await fetch(`${this._baseUrl}/sessions`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.sessions || [];
        } catch (error) {
            console.error('[SDK] Failed to fetch sessions:', error);
            return [];
        }
    }

    async getModels() {
        try {
            const r = await fetch(`${this._baseUrl}/config`);
            if (!r.ok) throw new Error();
            const data = await r.json();
            return data.config?.available_models || ['sonnet', 'opus', 'haiku'];
        }
        catch { return ['sonnet', 'opus', 'haiku']; }
    }

    async checkAvailability() {
        try {
            const response = await fetch(`${this._baseUrl}/config`);
            if (!response.ok) return false;
            const data = await response.json();
            return !data.error && data.config !== null;
        }
        catch { return false; }
    }

    /**
     * Handle SDK not installed error - offer auto-install
     * @private
     */
    async _handleSdkNotInstalled(originalError) {
        // Capture conversation ID before async operations (it may be cleared in finally block)
        const conversationId = this._activeConversationId;
        const isTerminalMain = conversationId?.type === 'terminal' && conversationId?.id === 'main';

        // Show initial message with install option
        const installMessage = {
            role: 'assistant',
            content: `⚠️ **SDK Not Installed**

The Claude Agent SDK is not installed. Would you like me to install it automatically?

**Installing now...** (this may take a moment)`,
            id: crypto.randomUUID(),
            isError: true,
            errorCode: 'sdk_not_installed'
        };

        if (conversationId) {
            Actions.addConversationMessage(conversationId, installMessage);
        }
        if (isTerminalMain) {
            Actions.addTerminalMessage(installMessage);
        }

        // Attempt auto-install
        try {
            const installUrl = `${this._baseUrl}/install`;
            console.log('[SDK] Attempting auto-install at:', installUrl);
            const response = await fetch(installUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            console.log('[SDK] Install response status:', response.status);
            const result = await response.json();
            console.log('[SDK] Install result:', result);

            let followUpMessage;
            if (result.success) {
                if (result.already_installed) {
                    followUpMessage = {
                        role: 'assistant',
                        content: `✅ **SDK Already Installed**

The Claude Agent SDK is already installed. Please refresh the page to reinitialize the connection.`,
                        id: crypto.randomUUID()
                    };
                } else {
                    followUpMessage = {
                        role: 'assistant',
                        content: `✅ **SDK Installed Successfully!**

The Claude Agent SDK has been installed. Please **refresh the page** to start using Claude.`,
                        id: crypto.randomUUID()
                    };
                }
            } else {
                followUpMessage = {
                    role: 'assistant',
                    content: `❌ **Installation Failed**

Could not install the SDK automatically: ${result.message || result.error}

**Manual installation:** Run this command in your terminal:
\`\`\`
pip install claude-agent-sdk
\`\`\``,
                    id: crypto.randomUUID(),
                    isError: true
                };
            }

            if (conversationId) {
                Actions.addConversationMessage(conversationId, followUpMessage);
            }
            if (isTerminalMain) {
                Actions.addTerminalMessage(followUpMessage);
            }

        } catch (error) {
            console.error('[SDK] Auto-install failed:', error);
            const errorFollowUp = {
                role: 'assistant',
                content: `❌ **Installation Failed**

Could not connect to install endpoint: ${error.message}

**Manual installation:** Run this command in your terminal:
\`\`\`
pip install claude-agent-sdk
\`\`\``,
                id: crypto.randomUUID(),
                isError: true
            };

            if (conversationId) {
                Actions.addConversationMessage(conversationId, errorFollowUp);
            }
            if (isTerminalMain) {
                Actions.addTerminalMessage(errorFollowUp);
            }
        }
    }

    subscribe(callback) { this._listeners.add(callback); return () => this._listeners.delete(callback); }

    _notifyListeners(eventType, data) {
        this._listeners.forEach(cb => { try { cb(eventType, data); } catch (e) { console.error('[SDK] Listener error:', e); } });
    }

    get sessionId() { return this._sessionId; }
    get isStreaming() { return AppStore.isStreaming.value; }
}

export const SDKClient = new SDKClientClass();
