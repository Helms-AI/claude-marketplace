/**
 * Command Service - Passthrough Mode
 *
 * Handles submission of commands to the parent Claude Code session
 * via the command queue API. Commands are processed by hooks in the
 * parent session and responses are matched back via SSE.
 *
 * @module services/command-service
 */

import { AppStore, Actions } from '../store/app-state.js';

/**
 * Command status constants
 * @enum {string}
 */
export const CommandStatus = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    ERROR: 'error'
};

/**
 * Command Service singleton
 */
class CommandServiceClass {
    constructor() {
        this._pollInterval = null;
        this._statusCheckInterval = null;
    }

    /**
     * Send a command to the parent Claude session via the queue
     * @param {string} message - The command prompt
     * @param {Object} options - Command options
     * @param {string} options.contextId - Context identifier (e.g., 'changeset:abc')
     * @returns {Promise<Object>} Command details including ID
     */
    async sendCommand(message, options = {}) {
        const { contextId = 'main' } = options;

        // Set pending state in store
        Actions.setPendingCommand({
            message,
            contextId,
            timestamp: Date.now()
        });

        try {
            const response = await fetch('/api/commands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: message,
                    metadata: {
                        context_id: contextId,
                        source: 'dashboard'
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
                Actions.clearPendingCommand(contextId);
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('[CommandService] Command submitted:', result.command?.id);

            // Start polling for status updates
            this._startStatusPolling(result.command?.id, contextId);

            return result;
        } catch (error) {
            console.error('[CommandService] Error sending command:', error);
            Actions.clearPendingCommand(contextId);
            Actions.addError({
                type: 'command',
                message: `Failed to send command: ${error.message}`
            });
            throw error;
        }
    }

    /**
     * Cancel a pending command
     * @param {string} commandId - Command ID to cancel
     * @returns {Promise<boolean>} True if cancelled
     */
    async cancelCommand(commandId) {
        try {
            const response = await fetch(`/api/commands/${commandId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                return false;
            }

            console.log('[CommandService] Command cancelled:', commandId);
            return true;
        } catch (error) {
            console.error('[CommandService] Error cancelling command:', error);
            return false;
        }
    }

    /**
     * Cancel command by context ID
     * @param {string} contextId - Context identifier
     */
    cancelByContextId(contextId) {
        const pending = AppStore.pendingCommand?.value;
        if (pending && pending.contextId === contextId) {
            Actions.clearPendingCommand(contextId);
            // Note: We could also try to cancel in the backend,
            // but clearing local state is usually sufficient
        }
    }

    /**
     * Handle command completion from SSE
     * @param {Object} data - Completion data from SSE
     */
    handleCommandComplete(data) {
        const { command_id, context_id, status, error } = data;
        console.log('[CommandService] Command completed:', command_id, status);

        // Clear pending state
        if (context_id) {
            Actions.clearPendingCommand(context_id);
        }

        // Stop polling
        this._stopStatusPolling();

        // Handle errors
        if (status === 'error' && error) {
            Actions.addError({
                type: 'command',
                message: error
            });
        }
    }

    /**
     * Get passthrough status
     * @returns {Promise<Object>} Status info including active state
     */
    async getPassthroughStatus() {
        try {
            const response = await fetch('/api/commands/status');
            if (!response.ok) {
                return { active: false, error: `HTTP ${response.status}` };
            }
            return await response.json();
        } catch (error) {
            console.error('[CommandService] Error getting status:', error);
            return { active: false, error: error.message };
        }
    }

    /**
     * List commands with optional filter
     * @param {Object} options - Filter options
     * @returns {Promise<Array>} List of commands
     */
    async listCommands(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.status) params.set('status', options.status);
            if (options.limit) params.set('limit', String(options.limit));

            const response = await fetch(`/api/commands?${params}`);
            if (!response.ok) {
                return [];
            }

            const data = await response.json();
            return data.commands || [];
        } catch (error) {
            console.error('[CommandService] Error listing commands:', error);
            return [];
        }
    }

    /**
     * Start polling for passthrough status
     * Updates the store with active state
     */
    startStatusMonitoring(intervalMs = 5000) {
        if (this._statusCheckInterval) return;

        const checkStatus = async () => {
            const status = await this.getPassthroughStatus();
            Actions.setPassthroughActive(status.active);
        };

        // Initial check
        checkStatus();

        // Periodic checks
        this._statusCheckInterval = setInterval(checkStatus, intervalMs);
    }

    /**
     * Stop status monitoring
     */
    stopStatusMonitoring() {
        if (this._statusCheckInterval) {
            clearInterval(this._statusCheckInterval);
            this._statusCheckInterval = null;
        }
    }

    /**
     * Start polling for a specific command's status
     * @private
     */
    _startStatusPolling(commandId, contextId) {
        // Clear any existing poll
        this._stopStatusPolling();

        if (!commandId) return;

        this._pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/commands/${commandId}`);
                if (!response.ok) {
                    this._stopStatusPolling();
                    return;
                }

                const data = await response.json();
                const status = data.command?.status;

                if (status === 'completed' || status === 'error' || status === 'cancelled') {
                    this.handleCommandComplete({
                        command_id: commandId,
                        context_id: contextId,
                        status,
                        error: data.command?.error
                    });
                }
            } catch (error) {
                console.error('[CommandService] Poll error:', error);
            }
        }, 1000); // Poll every second
    }

    /**
     * Stop status polling
     * @private
     */
    _stopStatusPolling() {
        if (this._pollInterval) {
            clearInterval(this._pollInterval);
            this._pollInterval = null;
        }
    }
}

// Singleton export
export const CommandService = new CommandServiceClass();
