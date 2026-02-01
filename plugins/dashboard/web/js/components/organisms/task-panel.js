/**
 * TaskPanel Organism - Task list popup for status bar
 * @module components/organisms/task-panel
 */
import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import '../atoms/icon.js';
import '../atoms/dot.js';
import '../atoms/progress-bar.js';

/**
 * @fires dash-close - When panel is closed
 */
class DashTaskPanel extends LitElement {
    static properties = {
        tasks: { type: Array },
        open: { type: Boolean, reflect: true }
    };

    static styles = css`
        :host {
            position: absolute;
            bottom: 100%;
            right: 0;
            margin-bottom: 8px;
            width: 320px;
            max-height: 400px;
            background: var(--bg-primary, #ffffff);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: var(--radius-md, 6px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            display: none;
            flex-direction: column;
        }

        :host([open]) {
            display: flex;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .title {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            font-size: var(--font-size-sm, 12px);
            font-weight: 600;
            color: var(--text-primary, #1f2937);
        }

        .count {
            padding: 2px 6px;
            font-size: 10px;
            font-weight: 600;
            color: var(--text-muted, #9ca3af);
            background: var(--bg-tertiary, #e5e7eb);
            border-radius: 10px;
        }

        .close-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            border: none;
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            color: var(--text-muted, #9ca3af);
            cursor: pointer;
            transition: all 0.15s;
        }

        .close-btn:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
            color: var(--text-primary, #1f2937);
        }

        .progress {
            padding: 0 var(--spacing-md, 12px);
            padding-top: var(--spacing-sm, 8px);
        }

        .list {
            flex: 1;
            overflow-y: auto;
            padding: var(--spacing-sm, 8px) 0;
        }

        .task-item {
            display: flex;
            align-items: flex-start;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-xs, 4px) var(--spacing-md, 12px);
            transition: background 0.1s;
        }

        .task-item:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.02));
        }

        .task-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            margin-top: 2px;
            flex-shrink: 0;
        }

        .task-icon.pending { color: var(--text-muted, #9ca3af); }
        .task-icon.in_progress { color: var(--accent-color, #3b82f6); }
        .task-icon.completed { color: var(--success-color, #22c55e); }

        .task-content {
            flex: 1;
            min-width: 0;
        }

        .task-subject {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-primary, #1f2937);
            line-height: 1.4;
        }

        .task-item.completed .task-subject {
            color: var(--text-muted, #9ca3af);
            text-decoration: line-through;
        }

        .task-active {
            font-size: 10px;
            color: var(--accent-color, #3b82f6);
            font-style: italic;
        }

        .task-deps {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 2px;
        }

        .dep-badge {
            padding: 1px 4px;
            font-size: 9px;
            color: var(--text-muted, #9ca3af);
            background: var(--bg-tertiary, #e5e7eb);
            border-radius: 3px;
        }

        .dep-badge.blocked {
            color: var(--warning-color, #f59e0b);
            background: var(--warning-bg, #fef3c7);
        }

        .empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xl, 24px);
            color: var(--text-muted, #9ca3af);
            text-align: center;
        }

        .empty-icon {
            font-size: 24px;
            margin-bottom: var(--spacing-sm, 8px);
            opacity: 0.5;
        }

        .empty-text {
            font-size: var(--font-size-sm, 12px);
        }
    `;

    constructor() {
        super();
        this.tasks = [];
        this.open = false;
    }

    get sortedTasks() {
        const order = { 'in_progress': 0, 'pending': 1, 'completed': 2 };
        return [...this.tasks].sort((a, b) =>
            (order[a.status] || 1) - (order[b.status] || 1)
        );
    }

    get completed() {
        return this.tasks.filter(t => t.status === 'completed').length;
    }

    get total() {
        return this.tasks.length;
    }

    get progress() {
        return this.total > 0 ? (this.completed / this.total) * 100 : 0;
    }

    render() {
        return html`
            <div class="header">
                <div class="title">
                    <dash-icon name="check-square" size="14"></dash-icon>
                    <span>Tasks</span>
                    <span class="count">${this.completed}/${this.total}</span>
                </div>
                <button class="close-btn" @click="${this._handleClose}">
                    <dash-icon name="x" size="12"></dash-icon>
                </button>
            </div>

            <div class="progress">
                <dash-progress-bar value="${this.progress}" size="sm"></dash-progress-bar>
            </div>

            <div class="list">
                ${this.tasks.length === 0 ? html`
                    <div class="empty">
                        <span class="empty-icon">☐</span>
                        <span class="empty-text">No tasks in this session</span>
                    </div>
                ` : repeat(
                    this.sortedTasks,
                    task => task.id,
                    task => this._renderTask(task)
                )}
            </div>
        `;
    }

    _renderTask(task) {
        const iconName = task.status === 'completed' ? 'check-circle'
            : task.status === 'in_progress' ? 'loader'
            : 'circle';

        return html`
            <div class="task-item ${task.status}">
                <span class="task-icon ${task.status}">
                    <dash-icon name="${iconName}" size="14"></dash-icon>
                </span>
                <div class="task-content">
                    <div class="task-subject">${task.subject}</div>
                    ${task.status === 'in_progress' && task.activeForm ? html`
                        <div class="task-active">${task.activeForm}</div>
                    ` : ''}
                    ${this._renderDeps(task)}
                </div>
            </div>
        `;
    }

    _renderDeps(task) {
        const deps = [];

        if (task.blockedBy?.length > 0) {
            task.blockedBy.forEach(id => {
                deps.push({ id, type: 'blocked' });
            });
        }

        if (task.blocks?.length > 0) {
            task.blocks.forEach(id => {
                deps.push({ id, type: 'blocks' });
            });
        }

        if (deps.length === 0) return '';

        return html`
            <div class="task-deps">
                ${deps.map(dep => html`
                    <span class="dep-badge ${dep.type === 'blocked' ? 'blocked' : ''}">
                        ${dep.type === 'blocked' ? 'blocked by' : 'blocks'} #${dep.id}
                    </span>
                `)}
            </div>
        `;
    }

    _handleClose() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('dash-close', {
            bubbles: true,
            composed: true
        }));
    }

    show() {
        this.open = true;
    }

    hide() {
        this.open = false;
    }

    toggle() {
        this.open = !this.open;
    }
}

customElements.define('dash-task-panel', DashTaskPanel);
export { DashTaskPanel };
