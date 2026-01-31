/**
 * SDK Client Service
 *
 * Handles communication with the Claude SDK bridge API.
 * Manages sessions, message streaming, and tool execution.
 *
 * @module services/sdk-client
 */

import { AppStore, Actions } from '../store/app-state.js';

/**
 * SDK Event Types
 */
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
    MCP_TOOL_RESULT: 'mcp_tool_result'
};

/**
 * SDK Client Class
 */
class SDKClientClass {
    constructor() {
        /** @type {AbortController|null} */
        this._abortController = null;

        /** @type {Set<Function>} */
        this._listeners = new Set();

        /** @type {string|null} */
        this._sessionId = null;

        /** @type {string} */
        this._baseUrl = '/api/sdk';
    }

    /**
     * Send a message and stream the response
     * @param {string} prompt - User prompt
     * @param {Object} options - Request options
     * @returns {Promise<void>}
     */
    async sendMessage(prompt, options = {}) {
        if (AppStore.isStreaming.value) {
            console.warn('[SDK] Already streaming, ignoring request');
            return;
        }

        const {
            model = AppStore.terminalModel.value || 'sonnet',
            resumeSession = true
        } = options;

        // Create abort controller for this request
        this._abortController = new AbortController();
        AppStore.isStreaming.value = true;

        // Add user message to store
        Actions.addTerminalMessage({
            role: 'user',
            content: prompt
        });

        try {
            const response = await fetch(`${this._baseUrl}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt,
                    model,
                    session_id: resumeSession ? this._sessionId : null
                }),
                signal: this._abortController.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Process streaming response
            await this._processStream(response);

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('[SDK] Request aborted');
                this._notifyListeners(SDKEventType.INTERRUPT, { reason: 'user' });
            } else {
                console.error('[SDK] Request error:', error);
                this._notifyListeners(SDKEventType.ERROR, {
                    message: error.message,
                    code: 'REQUEST_ERROR'
                });
                Actions.addError({
                    type: 'sdk',
                    message: error.message
                });
            }
        } finally {
            AppStore.isStreaming.value = false;
            this._abortController = null;
        }
    }

    /**
     * Process SSE stream from response
     * @param {Response} response
     */
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

                // Process complete SSE events
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const event = JSON.parse(data);
                            currentAssistantMessage = this._processEvent(event, currentAssistantMessage);
                        } catch (e) {
                            console.warn('[SDK] Failed to parse event:', data);
                        }
                    }
                }
            }

            // Finalize assistant message
            if (currentAssistantMessage) {
                Actions.addTerminalMessage(currentAssistantMessage);
            }

        } catch (error) {
            if (error.name !== 'AbortError') {
                throw error;
            }
        }
    }

    /**
     * Process a single event
     * @param {Object} event
     * @param {Object|null} currentMessage
     * @returns {Object|null} Updated current message
     */
    _processEvent(event, currentMessage) {
        const { type, data } = event;

        switch (type) {
            case SDKEventType.INIT:
                this._sessionId = data.session_id;
                AppStore.sessionId.value = data.session_id;
                this._notifyListeners(type, data);
                break;

            case SDKEventType.TEXT:
                // Create or update assistant message
                if (!currentMessage) {
                    currentMessage = {
                        role: 'assistant',
                        content: '',
                        tools: []
                    };
                }
                currentMessage.content += data.content || '';
                // Notify for streaming display
                this._notifyListeners(type, {
                    ...data,
                    fullContent: currentMessage.content
                });
                break;

            case SDKEventType.THINKING:
                this._notifyListeners(type, data);
                break;

            case SDKEventType.TOOL_START:
            case SDKEventType.MCP_TOOL_START:
                if (currentMessage) {
                    currentMessage.tools = currentMessage.tools || [];
                    currentMessage.tools.push({
                        id: data.tool_use_id,
                        name: data.tool_name,
                        input: data.input,
                        status: 'running',
                        isMcp: type === SDKEventType.MCP_TOOL_START
                    });
                }
                this._notifyListeners(type, data);
                break;

            case SDKEventType.TOOL_RESULT:
            case SDKEventType.MCP_TOOL_RESULT:
                if (currentMessage) {
                    const tool = currentMessage.tools?.find(t => t.id === data.tool_use_id);
                    if (tool) {
                        tool.result = data.result;
                        tool.error = data.error;
                        tool.status = data.error ? 'error' : 'complete';
                    }
                }
                this._notifyListeners(type, data);
                break;

            case SDKEventType.USAGE:
                Actions.updateTokenUsage({
                    input: data.input_tokens || 0,
                    output: data.output_tokens || 0,
                    cacheRead: data.cache_read_input_tokens || 0,
                    cacheCreation: data.cache_creation_input_tokens || 0
                });
                this._notifyListeners(type, data);
                break;

            case SDKEventType.ERROR:
                Actions.addError({
                    type: 'sdk',
                    message: data.message || data.error,
                    code: data.code
                });
                this._notifyListeners(type, data);
                break;

            case SDKEventType.RESULT:
            case SDKEventType.COMPLETE:
                this._notifyListeners(type, data);
                break;

            case SDKEventType.INPUT_REQUEST:
                this._notifyListeners(type, data);
                break;

            default:
                console.log('[SDK] Unknown event type:', type, data);
                this._notifyListeners(type, data);
        }

        return currentMessage;
    }

    /**
     * Interrupt the current request
     */
    interrupt() {
        if (this._abortController) {
            this._abortController.abort();
        }
    }

    /**
     * Respond to an input request
     * @param {string} response - User response
     */
    async respondToInput(response) {
        if (!this._sessionId) {
            console.error('[SDK] No active session for input response');
            return;
        }

        try {
            await fetch(`${this._baseUrl}/input`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: this._sessionId,
                    response
                })
            });
        } catch (error) {
            console.error('[SDK] Failed to send input response:', error);
        }
    }

    /**
     * Reset the current session
     */
    async resetSession() {
        if (this._sessionId) {
            try {
                await fetch(`${this._baseUrl}/reset`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        session_id: this._sessionId
                    })
                });
            } catch (error) {
                console.error('[SDK] Failed to reset session:', error);
            }
        }

        this._sessionId = null;
        Actions.resetSession();
    }

    /**
     * Get available models
     * @returns {Promise<Array>}
     */
    async getModels() {
        try {
            const response = await fetch(`${this._baseUrl}/models`);
            if (!response.ok) throw new Error('Failed to fetch models');
            return await response.json();
        } catch (error) {
            console.error('[SDK] Failed to get models:', error);
            return [];
        }
    }

    /**
     * Check SDK availability
     * @returns {Promise<boolean>}
     */
    async checkAvailability() {
        try {
            const response = await fetch(`${this._baseUrl}/status`);
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Subscribe to SDK events
     * @param {Function} callback - Callback function (eventType, data)
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
    }

    /**
     * Notify all listeners of an event
     * @param {string} eventType
     * @param {Object} data
     */
    _notifyListeners(eventType, data) {
        this._listeners.forEach(callback => {
            try {
                callback(eventType, data);
            } catch (error) {
                console.error('[SDK] Listener error:', error);
            }
        });
    }

    /**
     * Get current session ID
     * @returns {string|null}
     */
    get sessionId() {
        return this._sessionId;
    }

    /**
     * Check if currently streaming
     * @returns {boolean}
     */
    get isStreaming() {
        return AppStore.isStreaming.value;
    }
}

// Export singleton instance
export const SDKClient = new SDKClientClass();
