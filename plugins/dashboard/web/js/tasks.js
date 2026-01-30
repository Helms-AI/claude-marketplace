/**
 * Tasks Module
 * Real-time task list overlay for tracking Claude Code task progress
 */

const Tasks = {
    data: {
        tasks: [],
        sessionId: null,
        visible: false,
        pinned: false,
        collapsed: false
    },

    init() {
        this.createOverlay();
        this.bindEvents();
    },

    /**
     * Create the task overlay DOM structure
     */
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'tasksOverlay';
        overlay.className = 'tasks-overlay tasks-hidden';
        overlay.innerHTML = `
            <div class="tasks-header">
                <div class="tasks-header-left">
                    <div class="tasks-title">
                        <span class="tasks-title-icon">&#9745;</span>
                        <span>Tasks</span>
                    </div>
                    <span class="tasks-count" id="tasksCount">0/0</span>
                </div>
                <div class="tasks-progress">
                    <div class="tasks-progress-bar" id="tasksProgressBar" style="width: 0%"></div>
                </div>
                <div class="tasks-header-actions">
                    <button class="tasks-btn" id="tasksPinBtn" title="Pin below conversation">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2v20M5 5l14 14M19 5L5 19"></path>
                        </svg>
                    </button>
                    <button class="tasks-btn" id="tasksCollapseBtn" title="Collapse">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="tasks-content" id="tasksContent">
                <div class="tasks-empty">
                    <div class="tasks-empty-icon">&#9744;</div>
                    <div>No tasks yet</div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    },

    /**
     * Bind event handlers
     */
    bindEvents() {
        const overlay = document.getElementById('tasksOverlay');
        const header = overlay.querySelector('.tasks-header');
        const pinBtn = document.getElementById('tasksPinBtn');
        const collapseBtn = document.getElementById('tasksCollapseBtn');

        // Toggle collapse on header click (only when not pinned)
        header.addEventListener('click', (e) => {
            if (!this.data.pinned && !e.target.closest('.tasks-btn')) {
                this.toggleCollapse();
            }
        });

        // Pin button
        pinBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePin();
        });

        // Collapse button
        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCollapse();
        });
    },

    /**
     * Set the current session and clear tasks
     * @param {string} sessionId - The session ID
     */
    setSession(sessionId) {
        this.data.sessionId = sessionId;
        this.data.tasks = [];
        this.data.visible = false;
        this.updateVisibility();
        this.render();
    },

    /**
     * Handle task state change events from SSE
     * @param {Object} eventData - The task event data
     */
    handleTaskEvent(eventData) {
        const { event, task, session_id } = eventData;

        // Only process events for the current session
        if (session_id && session_id !== this.data.sessionId) {
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
    },

    /**
     * Add a new task
     * @param {Object} task - Task object
     */
    addTask(task) {
        // Check if task already exists
        const existingIndex = this.data.tasks.findIndex(t => t.id === task.id);
        if (existingIndex >= 0) {
            this.data.tasks[existingIndex] = task;
        } else {
            this.data.tasks.push(task);
        }

        this.data.visible = true;
        this.updateVisibility();
        this.render();
        this.animateNewTask(task.id);
    },

    /**
     * Update an existing task
     * @param {Object} task - Updated task object
     */
    updateTask(task) {
        const index = this.data.tasks.findIndex(t => t.id === task.id);
        if (index >= 0) {
            const oldStatus = this.data.tasks[index].status;
            this.data.tasks[index] = task;
            this.render();

            // Animate status change
            if (oldStatus !== task.status) {
                this.animateStatusChange(task.id, oldStatus, task.status);
            }
        } else {
            // Task not found, add it
            this.addTask(task);
        }
    },

    /**
     * Remove a task
     * @param {string} taskId - Task ID to remove
     */
    removeTask(taskId) {
        this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
        this.render();

        // Hide overlay if no tasks
        if (this.data.tasks.length === 0) {
            this.data.visible = false;
            this.updateVisibility();
        }
    },

    /**
     * Process initial tasks from transcript tool calls
     * @param {Array} toolCalls - Array of tool call objects
     */
    processTranscriptToolCalls(toolCalls) {
        for (const toolCall of toolCalls) {
            const name = toolCall.name;
            const input = toolCall.input || {};

            if (name === 'TaskCreate') {
                // Simulate task creation (ID will be assigned sequentially)
                const taskId = String(this.data.tasks.length + 1);
                const task = {
                    id: taskId,
                    subject: input.subject || '',
                    description: input.description || '',
                    status: 'pending',
                    activeForm: input.activeForm || '',
                    blocks: [],
                    blockedBy: []
                };
                this.data.tasks.push(task);
            } else if (name === 'TaskUpdate') {
                const taskId = input.taskId;
                const task = this.data.tasks.find(t => t.id === taskId);
                if (task) {
                    if (input.status) task.status = input.status;
                    if (input.subject) task.subject = input.subject;
                    if (input.description) task.description = input.description;
                    if (input.activeForm) task.activeForm = input.activeForm;
                    if (input.addBlocks) {
                        task.blocks = [...(task.blocks || []), ...input.addBlocks];
                    }
                    if (input.addBlockedBy) {
                        task.blockedBy = [...(task.blockedBy || []), ...input.addBlockedBy];
                    }
                }
            }
        }

        // Show overlay if we have tasks
        if (this.data.tasks.length > 0) {
            this.data.visible = true;
            this.updateVisibility();
        }
        this.render();
    },

    /**
     * Render the task list
     */
    render() {
        const content = document.getElementById('tasksContent');
        const countEl = document.getElementById('tasksCount');
        const progressBar = document.getElementById('tasksProgressBar');

        if (this.data.tasks.length === 0) {
            content.innerHTML = `
                <div class="tasks-empty">
                    <div class="tasks-empty-icon">&#9744;</div>
                    <div>No tasks yet</div>
                </div>
            `;
            countEl.textContent = '0/0';
            progressBar.style.width = '0%';
            return;
        }

        // Calculate stats
        const total = this.data.tasks.length;
        const completed = this.data.tasks.filter(t => t.status === 'completed').length;
        const progress = total > 0 ? (completed / total) * 100 : 0;

        countEl.textContent = `${completed}/${total}`;
        progressBar.style.width = `${progress}%`;

        // Sort tasks: in_progress first, then pending, then completed
        const sortedTasks = [...this.data.tasks].sort((a, b) => {
            const order = { 'in_progress': 0, 'pending': 1, 'completed': 2 };
            return (order[a.status] || 1) - (order[b.status] || 1);
        });

        content.innerHTML = sortedTasks.map(task => this.renderTask(task)).join('');
    },

    /**
     * Render a single task item
     * @param {Object} task - Task object
     * @returns {string} HTML string
     */
    renderTask(task) {
        const statusClass = `task-status-${task.status}`;
        const showActiveForm = task.status === 'in_progress' && task.activeForm;

        // Build dependencies HTML
        let depsHtml = '';
        if ((task.blockedBy && task.blockedBy.length > 0) || (task.blocks && task.blocks.length > 0)) {
            const badges = [];
            if (task.blockedBy && task.blockedBy.length > 0) {
                task.blockedBy.forEach(id => {
                    badges.push(`<span class="task-dep-badge blocked">blocked by #${id}</span>`);
                });
            }
            if (task.blocks && task.blocks.length > 0) {
                task.blocks.forEach(id => {
                    badges.push(`<span class="task-dep-badge">blocks #${id}</span>`);
                });
            }
            depsHtml = `<div class="task-deps">${badges.join('')}</div>`;
        }

        return `
            <div class="task-item ${statusClass}" data-task-id="${task.id}">
                <div class="task-checkbox"></div>
                <div class="task-body">
                    <div class="task-subject">${this.escapeHtml(task.subject)}</div>
                    ${showActiveForm ? `<div class="task-active-form">${this.escapeHtml(task.activeForm)}</div>` : ''}
                    ${depsHtml}
                </div>
            </div>
        `;
    },

    /**
     * Update overlay visibility
     */
    updateVisibility() {
        const overlay = document.getElementById('tasksOverlay');

        if (this.data.visible && this.data.tasks.length > 0) {
            overlay.classList.remove('tasks-hidden');
            overlay.classList.add('tasks-visible');
        } else {
            overlay.classList.add('tasks-hidden');
            overlay.classList.remove('tasks-visible');
        }
    },

    /**
     * Toggle pinned mode
     */
    togglePin() {
        this.data.pinned = !this.data.pinned;
        const overlay = document.getElementById('tasksOverlay');
        const pinBtn = document.getElementById('tasksPinBtn');

        overlay.classList.toggle('tasks-pinned', this.data.pinned);
        pinBtn.classList.toggle('active', this.data.pinned);

        if (this.data.pinned) {
            // Move overlay into the sessions main area
            const sessionsMain = document.querySelector('.sessions-main');
            if (sessionsMain) {
                // Insert after conversation container
                const container = document.getElementById('conversationContainer');
                if (container && container.nextSibling) {
                    sessionsMain.insertBefore(overlay, container.nextSibling);
                } else {
                    sessionsMain.appendChild(overlay);
                }
            }
        } else {
            // Move back to body
            document.body.appendChild(overlay);
        }
    },

    /**
     * Toggle collapsed state
     */
    toggleCollapse() {
        this.data.collapsed = !this.data.collapsed;
        const overlay = document.getElementById('tasksOverlay');
        const collapseBtn = document.getElementById('tasksCollapseBtn');

        overlay.classList.toggle('tasks-collapsed', this.data.collapsed);

        // Rotate the collapse icon
        const svg = collapseBtn.querySelector('svg');
        svg.style.transform = this.data.collapsed ? 'rotate(180deg)' : '';
    },

    /**
     * Animate a newly added task
     * @param {string} taskId - Task ID
     */
    animateNewTask(taskId) {
        setTimeout(() => {
            const taskEl = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
            if (taskEl) {
                taskEl.classList.add('task-new');
                setTimeout(() => taskEl.classList.remove('task-new'), 400);
            }
        }, 10);
    },

    /**
     * Animate task status change
     * @param {string} taskId - Task ID
     * @param {string} oldStatus - Previous status
     * @param {string} newStatus - New status
     */
    animateStatusChange(taskId, oldStatus, newStatus) {
        const taskEl = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
        if (!taskEl) return;

        if (newStatus === 'completed') {
            taskEl.classList.add('task-completing');
            setTimeout(() => taskEl.classList.remove('task-completing'), 500);
        } else {
            taskEl.classList.add('task-highlight');
            setTimeout(() => taskEl.classList.remove('task-highlight'), 600);
        }
    },

    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Clear all tasks
     */
    clear() {
        this.data.tasks = [];
        this.data.visible = false;
        this.updateVisibility();
        this.render();
    }
};
