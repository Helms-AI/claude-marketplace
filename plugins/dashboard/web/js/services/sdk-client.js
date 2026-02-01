/**
 * SDK Client Service - Handles communication with the Claude SDK bridge API
 * @module services/sdk-client
 */

import { AppStore, Actions } from '../store/app-state.js';
import { ConversationStorage } from '../conversation-storage.js';

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
    }

    /**
     * Initialize SDK client and restore session from localStorage if valid
     */
    async init() {
        if (this._storageInitialized) return;

        try {
            await ConversationStorage.init();
            this._storageInitialized = true;

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
                AppStore.terminalMessages.value = terminalMessages;
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
        if (AppStore.isStreaming.value) return;
        const {
            model = AppStore.terminalModel.value || 'sonnet',
            resumeSession = true,
            settings = {}
        } = options;

        // Save model preference to localStorage
        ConversationStorage.setModel(model);

        this._abortController = new AbortController();
        // Clear previous streaming content before starting new request
        Actions.clearStreamingState();
        AppStore.isStreaming.value = true;

        // Add user message and save to IndexedDB
        const userMessage = { role: 'user', content: prompt, id: crypto.randomUUID() };
        Actions.addTerminalMessage(userMessage);
        this._saveMessage(userMessage);

        // Build request body with all settings
        const requestBody = {
            prompt,
            model: settings.model || model,
            resume: resumeSession ? this._sessionId : null,
            // SDK options from settings panel
            ...(settings.maxTurns !== undefined && { max_turns: settings.maxTurns }),
            ...(settings.extendedThinking !== undefined && { enable_thinking: settings.extendedThinking }),
            ...(settings.maxThinkingTokens !== undefined && { max_thinking_tokens: settings.maxThinkingTokens }),
            ...(settings.continueConversation !== undefined && { continue_conversation: settings.continueConversation }),
            ...(settings.permissionMode !== undefined && { permission_mode: settings.permissionMode }),
            ...(settings.sandboxMode !== undefined && { sandbox_mode: settings.sandboxMode }),
            ...(settings.fileCheckpointing !== undefined && { file_checkpointing: settings.fileCheckpointing }),
            ...(settings.mcpTools !== undefined && { mcp_tools: settings.mcpTools }),
            ...(settings.betaFeatures !== undefined && { beta_features: settings.betaFeatures }),
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
            }
        } finally {
            AppStore.isStreaming.value = false;
            this._abortController = null;
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
                // Add ID if not present
                currentAssistantMessage.id = currentAssistantMessage.id || crypto.randomUUID();
                Actions.addTerminalMessage(currentAssistantMessage);
                // Save assistant message to IndexedDB
                this._saveMessage(currentAssistantMessage);
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
                Actions.addError({ type: 'sdk', message: event.content || event.error?.message, code: event.error?.code });
                this._notifyListeners(SDKEventType.ERROR, event);
                break;

            // === SDK Bridge: System message ===
            case 'system':
                if (event.subtype === 'retry') {
                    console.log(`[SDK] Retry ${event.data?.attempt}/${event.data?.max_retries} after ${event.data?.delay}s`);
                }
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
                    currentMessage.tools.push({
                        id: event.tool_id,
                        name: event.tool_name,
                        input: {},
                        status: 'running'
                    });
                    Actions.updateStreamingTool({
                        id: event.tool_id,
                        name: event.tool_name,
                        input: {},
                        status: 'running'
                    });
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
                    // Update streaming content for real-time UI display
                    Actions.appendStreamingContent(text);
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
                Actions.appendStreamingContent(data.content || '');
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

        // Clear current messages from UI
        AppStore.terminalMessages.value = [];

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

    subscribe(callback) { this._listeners.add(callback); return () => this._listeners.delete(callback); }

    _notifyListeners(eventType, data) {
        this._listeners.forEach(cb => { try { cb(eventType, data); } catch (e) { console.error('[SDK] Listener error:', e); } });
    }

    get sessionId() { return this._sessionId; }
    get isStreaming() { return AppStore.isStreaming.value; }
}

export const SDKClient = new SDKClientClass();
