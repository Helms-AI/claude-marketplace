/**
 * Task Service - Manages task list state and events
 * @module services/task-service
 */
import { signal, computed } from '@preact/signals-core';

/**
 * @typedef {Object} Task
 * @property {string} id - Task ID
 * @property {string} subject - Task title
 * @property {string} [description] - Task description
 * @property {'pending' | 'in_progress' | 'completed'} status - Task status
 * @property {string} [activeForm] - Present continuous form for spinner display
 * @property {string[]} [blocks] - Tasks this task blocks
 * @property {string[]} [blockedBy] - Tasks blocking this task
 */

class TaskServiceClass {
    /** @type {import('@preact/signals-core').Signal<Task[]>} */
    tasks = signal([]);

    /** @type {import('@preact/signals-core').Signal<string|null>} */
    sessionId = signal(null);

    // Computed values
    total = computed(() => this.tasks.value.length);
    completed = computed(() => this.tasks.value.filter(t => t.status === 'completed').length);
    inProgress = computed(() => this.tasks.value.filter(t => t.status === 'in_progress').length);
    pending = computed(() => this.tasks.value.filter(t => t.status === 'pending').length);
    progress = computed(() => this.total.value > 0 ? (this.completed.value / this.total.value) * 100 : 0);

    /** Sorted tasks: in_progress first, then pending, then completed */
    sortedTasks = computed(() => {
        const order = { 'in_progress': 0, 'pending': 1, 'completed': 2 };
        return [...this.tasks.value].sort((a, b) =>
            (order[a.status] || 1) - (order[b.status] || 1)
        );
    });

    /** Event callbacks */
    _onTaskAdded = null;
    _onTaskUpdated = null;
    _onTaskRemoved = null;

    /**
     * Set event callback for task added
     * @param {Function} callback
     */
    onTaskAdded(callback) {
        this._onTaskAdded = callback;
    }

    /**
     * Set event callback for task updated
     * @param {Function} callback
     */
    onTaskUpdated(callback) {
        this._onTaskUpdated = callback;
    }

    /**
     * Set event callback for task removed
     * @param {Function} callback
     */
    onTaskRemoved(callback) {
        this._onTaskRemoved = callback;
    }

    /**
     * Set the current session and clear tasks
     * @param {string} sessionId
     */
    setSession(sessionId) {
        this.sessionId.value = sessionId;
        this.tasks.value = [];
    }

    /**
     * Handle task state change events from SSE
     * @param {Object} eventData - { event, task, session_id }
     */
    handleTaskEvent(eventData) {
        const { event, task, session_id } = eventData;

        // Only process events for the current session
        if (session_id && session_id !== this.sessionId.value) {
            return;
        }

        if (!task) return;

        switch (event) {
            case 'task_created':
                this.addTask(task);
                break;
            case 'task_updated':
                this.updateTask(task);
                break;
            case 'task_deleted':
                this.removeTask(task.id);
                break;
        }
    }

    /**
     * Add a new task
     * @param {Task} task
     */
    addTask(task) {
        const existingIndex = this.tasks.value.findIndex(t => t.id === task.id);

        if (existingIndex >= 0) {
            // Update existing task
            this.tasks.value = this.tasks.value.map((t, i) =>
                i === existingIndex ? task : t
            );
        } else {
            // Add new task
            this.tasks.value = [...this.tasks.value, task];
        }

        if (this._onTaskAdded) {
            this._onTaskAdded(task);
        }
    }

    /**
     * Update an existing task
     * @param {Task} task
     */
    updateTask(task) {
        const index = this.tasks.value.findIndex(t => t.id === task.id);

        if (index >= 0) {
            const oldStatus = this.tasks.value[index].status;
            this.tasks.value = this.tasks.value.map((t, i) =>
                i === index ? task : t
            );

            if (this._onTaskUpdated) {
                this._onTaskUpdated(task, oldStatus);
            }
        } else {
            this.addTask(task);
        }
    }

    /**
     * Remove a task
     * @param {string} taskId
     */
    removeTask(taskId) {
        const task = this.tasks.value.find(t => t.id === taskId);
        this.tasks.value = this.tasks.value.filter(t => t.id !== taskId);

        if (this._onTaskRemoved && task) {
            this._onTaskRemoved(task);
        }
    }

    /**
     * Get a task by ID
     * @param {string} taskId
     * @returns {Task|undefined}
     */
    getTask(taskId) {
        return this.tasks.value.find(t => t.id === taskId);
    }

    /**
     * Process tool calls from transcript to extract tasks
     * @param {Array} toolCalls
     */
    processTranscriptToolCalls(toolCalls) {
        for (const toolCall of toolCalls) {
            const name = toolCall.name;
            const input = toolCall.input || {};

            if (name === 'TaskCreate') {
                const taskId = String(this.tasks.value.length + 1);
                const task = {
                    id: taskId,
                    subject: input.subject || '',
                    description: input.description || '',
                    status: 'pending',
                    activeForm: input.activeForm || '',
                    blocks: [],
                    blockedBy: []
                };
                this.addTask(task);
            } else if (name === 'TaskUpdate') {
                const taskId = input.taskId;
                const existingTask = this.getTask(taskId);
                if (existingTask) {
                    const updatedTask = { ...existingTask };
                    if (input.status) updatedTask.status = input.status;
                    if (input.subject) updatedTask.subject = input.subject;
                    if (input.description) updatedTask.description = input.description;
                    if (input.activeForm) updatedTask.activeForm = input.activeForm;
                    if (input.addBlocks) {
                        updatedTask.blocks = [...(updatedTask.blocks || []), ...input.addBlocks];
                    }
                    if (input.addBlockedBy) {
                        updatedTask.blockedBy = [...(updatedTask.blockedBy || []), ...input.addBlockedBy];
                    }
                    this.updateTask(updatedTask);
                }
            }
        }
    }

    /**
     * Clear all tasks
     */
    clear() {
        this.tasks.value = [];
    }

    /**
     * Check if there are any tasks
     * @returns {boolean}
     */
    hasTasks() {
        return this.tasks.value.length > 0;
    }
}

// Singleton export
export const TaskService = new TaskServiceClass();
export { TaskServiceClass };
