/**
 * Activity Service - Batched SSE handling for tool activities
 * @module services/activity-service
 *
 * Handles tool_use and tool_result events with a 100ms batch window
 * to prevent render thrashing during rapid tool activity.
 */

import { AppStore, Actions, batch } from '../store/app-state.js';

/**
 * Activity status enumeration
 */
export const ActivityStatus = {
    PENDING: 'pending',
    RUNNING: 'running',
    SUCCESS: 'success',
    ERROR: 'error'
};

/**
 * Singleton service for managing tool activities
 */
class ActivityServiceClass {
    constructor() {
        /** @type {Object[]} Pending activities to be batched */
        this._pendingActivities = [];

        /** @type {number|null} Batch timeout handle */
        this._batchTimeout = null;

        /** @type {number} Batch window in milliseconds */
        this._batchWindowMs = 100;

        /** @type {Map<string, Object>} Running tools by ID */
        this._runningTools = new Map();
    }

    /**
     * Handle an SSE tool event
     * @param {Object} event - The SSE event data
     */
    handleToolEvent(event) {
        const eventData = event?.data || event;
        const type = event?.type || eventData?.type || eventData?.event_type;

        if (type === 'tool_use') {
            this._handleToolUse(eventData);
        } else if (type === 'tool_result') {
            this._handleToolResult(eventData);
        }
    }

    /**
     * Handle a tool_use event (tool starting)
     * @private
     */
    _handleToolUse(data) {
        const toolId = data.tool_use_id || data.id || crypto.randomUUID();
        const activity = {
            id: toolId,
            type: 'tool_use',
            tool: data.name || data.tool || 'Unknown',
            file: this._extractFilePath(data),
            status: ActivityStatus.RUNNING,
            timestamp: data.timestamp || Date.now(),
            input: data.input,
            changesetId: data.changeset_id
        };

        // Track running tool
        this._runningTools.set(toolId, activity);

        // Add to pending batch
        this._addToPendingBatch(activity);
    }

    /**
     * Handle a tool_result event (tool completed)
     * @private
     */
    _handleToolResult(data) {
        const toolId = data.tool_use_id || data.id;
        const isError = data.is_error || data.error || false;
        const resultOutput = data.output || data.result || data.content;
        const errorMessage = isError ? (data.error_message || data.error || resultOutput) : null;

        // Update running tool status
        if (toolId && this._runningTools.has(toolId)) {
            const activity = this._runningTools.get(toolId);
            activity.status = isError ? ActivityStatus.ERROR : ActivityStatus.SUCCESS;
            activity.result = isError ? null : resultOutput;
            activity.error = errorMessage;
            activity.completedAt = Date.now();
            activity.duration = activity.completedAt - activity.timestamp;
            this._runningTools.delete(toolId);

            // Add completion to batch
            this._addToPendingBatch({
                ...activity,
                type: 'tool_result'
            });
        } else {
            // Tool result without matching tool_use (direct completion)
            const activity = {
                id: toolId || crypto.randomUUID(),
                type: 'tool_result',
                tool: data.name || data.tool || 'Unknown',
                file: this._extractFilePath(data),
                status: isError ? ActivityStatus.ERROR : ActivityStatus.SUCCESS,
                timestamp: data.timestamp || Date.now(),
                result: isError ? null : resultOutput,
                error: errorMessage,
                changesetId: data.changeset_id
            };
            this._addToPendingBatch(activity);
        }
    }

    /**
     * Extract file path from tool data
     * @private
     */
    _extractFilePath(data) {
        // Try various common field names
        return data.file_path ||
               data.path ||
               data.file ||
               data.input?.file_path ||
               data.input?.path ||
               data.input?.file ||
               null;
    }

    /**
     * Add activity to pending batch
     * @private
     */
    _addToPendingBatch(activity) {
        this._pendingActivities.push(activity);

        // Set up batch flush if not already pending
        if (!this._batchTimeout) {
            this._batchTimeout = setTimeout(() => {
                this._flushBatch();
            }, this._batchWindowMs);
        }
    }

    /**
     * Flush pending activities to store
     * @private
     */
    _flushBatch() {
        if (this._pendingActivities.length === 0) {
            this._batchTimeout = null;
            return;
        }

        const activities = [...this._pendingActivities];
        this._pendingActivities = [];
        this._batchTimeout = null;

        // Batch update the store
        batch(() => {
            activities.forEach(activity => {
                // Add to activities feed with result/error data
                Actions.addActivity({
                    type: activity.type,
                    message: this._formatActivityMessage(activity),
                    tool: activity.tool,
                    file: activity.file,
                    status: activity.status,
                    duration: activity.duration,
                    result: activity.result,     // Include result for expandable view
                    error: activity.error,       // Include error message
                    changesetId: activity.changesetId
                });

                // Also add to conversation events if we have a watched changeset
                const watchedId = AppStore.watchedChangesetId.value;
                if (watchedId && activity.changesetId === watchedId) {
                    Actions.addConversationEvent({
                        event_type: activity.type,
                        content: {
                            tool: activity.tool,
                            file: activity.file,
                            input: activity.input,
                            result: activity.result
                        },
                        timestamp: activity.timestamp,
                        status: activity.status
                    });
                }
            });
        });
    }

    /**
     * Format activity message for display
     * @private
     */
    _formatActivityMessage(activity) {
        const tool = activity.tool;
        const file = activity.file ? ` - ${this._shortenPath(activity.file)}` : '';

        if (activity.status === ActivityStatus.RUNNING) {
            return `Running ${tool}${file}`;
        } else if (activity.status === ActivityStatus.ERROR) {
            return `${tool} failed${file}`;
        } else {
            return `${tool} completed${file}`;
        }
    }

    /**
     * Shorten file path for display
     * @private
     */
    _shortenPath(path) {
        if (!path) return '';
        const parts = path.split('/');
        if (parts.length <= 3) return path;
        return `.../${parts.slice(-2).join('/')}`;
    }

    /**
     * Get currently running tools
     * @returns {Object[]} Array of running tool activities
     */
    getRunningTools() {
        return Array.from(this._runningTools.values());
    }

    /**
     * Check if any tools are currently running
     * @returns {boolean}
     */
    hasRunningTools() {
        return this._runningTools.size > 0;
    }

    /**
     * Get count of running tools
     * @returns {number}
     */
    getRunningToolCount() {
        return this._runningTools.size;
    }

    /**
     * Clear all running tools (e.g., on session reset)
     */
    clearRunningTools() {
        this._runningTools.clear();
    }

    /**
     * Set the batch window duration
     * @param {number} ms - Milliseconds to wait before flushing
     */
    setBatchWindow(ms) {
        this._batchWindowMs = Math.max(50, Math.min(500, ms));
    }
}

// Export singleton instance
export const ActivityService = new ActivityServiceClass();
