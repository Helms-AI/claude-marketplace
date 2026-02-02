/**
 * Conversation Client - Simple browser-to-server messaging
 *
 * Clean event-driven flow:
 * 1. Browser sends message → POST /api/conversation/send
 * 2. Server processes with Claude SDK
 * 3. Server streams response via SSE → Browser updates UI
 */

import { AppStore, Actions } from '../store/app-state.js';

/**
 * Event types from the server
 */
export const ConversationEventType = {
    START: 'start',
    TEXT: 'text',
    ASSISTANT: 'assistant',
    ERROR: 'error',
    END: 'end'
};

class ConversationClientClass {
    constructor() {
        this._abortController = null;
        this._listeners = new Set();
    }

    /**
     * Send a message and stream the response
     *
     * @param {string} message - The user's message
     * @param {Object} options - Options
     * @param {Object} options.conversationId - Conversation identifier {type, id}
     * @param {Object} options.settings - SDK settings (model, max_turns, etc.)
     * @param {string} options.contextId - Optional context ID for tracking
     * @returns {Promise<void>}
     */
    async sendMessage(message, options = {}) {
        const {
            conversationId = { type: 'conversation', id: 'main' },
            settings = {},
            contextId = null
        } = options;

        // Check if already streaming
        if (AppStore.activeStreamingId.value) {
            console.warn('[ConversationClient] Already streaming');
            return;
        }

        this._abortController = new AbortController();

        // Initialize conversation if needed
        Actions.initConversation(conversationId);

        // Set streaming state
        Actions.setActiveStreamingId(conversationId);
        Actions.setConversationStreaming(conversationId, true);

        // Add user message to conversation
        const userMessage = {
            role: 'user',
            content: message,
            id: crypto.randomUUID(),
            timestamp: Date.now()
        };
        Actions.addConversationMessage(conversationId, userMessage);

        // Build request
        const requestBody = {
            message,
            context_id: contextId || `${conversationId.type}:${conversationId.id}`,
            settings: {
                model: settings.model || AppStore.terminalModel?.value || 'sonnet',
                max_turns: settings.maxTurns || 50,
                enable_thinking: settings.extendedThinking !== false,
                max_thinking_tokens: settings.maxThinkingTokens || 16000,
                permission_mode: settings.permissionMode || 'bypassPermissions',
                system_prompt: settings.systemPrompt || null
            }
        };

        let accumulatedText = '';

        try {
            const response = await fetch('/api/conversation/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                signal: this._abortController.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Process SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        try {
                            const event = JSON.parse(data);
                            accumulatedText = this._processEvent(event, conversationId, accumulatedText);
                        } catch (e) {
                            console.warn('[ConversationClient] Failed to parse:', data);
                        }
                    }
                }
            }

            // Final message if we have accumulated text
            console.log('[ConversationClient] Final accumulated:', accumulatedText?.substring(0, 50));
            if (accumulatedText) {
                const assistantMessage = {
                    role: 'assistant',
                    content: accumulatedText,
                    id: crypto.randomUUID(),
                    timestamp: Date.now()
                };
                console.log('[ConversationClient] Adding assistant message to store');
                Actions.addConversationMessage(conversationId, assistantMessage);
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('[ConversationClient] Cancelled');
                this._notify(ConversationEventType.END, { reason: 'cancelled' });
            } else {
                console.error('[ConversationClient] Error:', error);

                // Add error message to conversation
                const errorMessage = {
                    role: 'assistant',
                    content: `⚠️ **Error**: ${error.message}`,
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    isError: true
                };
                Actions.addConversationMessage(conversationId, errorMessage);

                this._notify(ConversationEventType.ERROR, { message: error.message });
            }
        } finally {
            // Clear streaming state
            Actions.clearConversationStreamingState(conversationId);
            Actions.setActiveStreamingId(null);
            this._abortController = null;
        }
    }

    /**
     * Process a server event
     */
    _processEvent(event, conversationId, accumulatedText) {
        const { type, content, context_id } = event;

        switch (type) {
            case 'start':
                console.log('[ConversationClient] Stream started');
                this._notify(ConversationEventType.START, { context_id });
                break;

            case 'text':
                // Streaming text chunk
                accumulatedText += content;
                // Update streaming content in store
                Actions.setConversationStreamingContent(conversationId, accumulatedText);
                this._notify(ConversationEventType.TEXT, { content, accumulated: accumulatedText });
                break;

            case 'assistant':
                // Complete assistant message
                console.log('[ConversationClient] Received assistant:', content?.substring(0, 50));
                accumulatedText = content;
                this._notify(ConversationEventType.ASSISTANT, { content });
                break;

            case 'error':
                console.error('[ConversationClient] Server error:', content);
                this._notify(ConversationEventType.ERROR, { message: content });
                break;

            case 'end':
                console.log('[ConversationClient] Stream ended');
                this._notify(ConversationEventType.END, {});
                break;
        }

        return accumulatedText;
    }

    /**
     * Cancel the current request
     */
    cancel() {
        if (this._abortController) {
            this._abortController.abort();

            // Also notify server
            fetch('/api/conversation/cancel', { method: 'POST' })
                .catch(e => console.warn('[ConversationClient] Cancel request failed:', e));

            return true;
        }
        return false;
    }

    /**
     * Add event listener
     */
    on(callback) {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
    }

    /**
     * Notify listeners
     */
    _notify(type, data) {
        for (const listener of this._listeners) {
            try {
                listener({ type, ...data });
            } catch (e) {
                console.error('[ConversationClient] Listener error:', e);
            }
        }
    }

    /**
     * Check service status
     */
    async getStatus() {
        try {
            const response = await fetch('/api/conversation/status');
            return await response.json();
        } catch (error) {
            return { available: false, error: error.message };
        }
    }
}

// Export singleton
export const ConversationClient = new ConversationClientClass();
