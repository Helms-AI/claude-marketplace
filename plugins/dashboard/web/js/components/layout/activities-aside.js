/**
 * Activities Aside Layout Component - Collapsible tool activities panel
 * @module components/layout/activities-aside
 *
 * Main container for the activities aside panel that handles:
 * - Collapsed/expanded states with animation
 * - Resizing (240-480px range)
 * - View mode toggling (timeline/files)
 * - Accessibility (ARIA, keyboard nav, screen reader announcements)
 */
import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions, toolActivities } from '../../store/app-state.js';
import { ActivityService } from '../../services/activity-service.js';
import '../atoms/icon.js';
import '../molecules/collapsed-preview.js';
import '../organisms/activity-timeline.js';
import '../organisms/activity-file-tree.js';
import '../organisms/activities-panel-container.js';
import '../organisms/attachment-panel.js';

class ActivitiesAside extends SignalWatcher(LitElement) {
    static properties = {
        _isResizing: { state: true },
        _resizeStartX: { state: true },
        _resizeStartWidth: { state: true }
    };

    static styles = css`
        :host {
            display: flex;
            flex-shrink: 0;
            height: 100%;
            position: relative;
        }

        .aside-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: var(--bg-sidebar, #252526);
            border-left: 1px solid var(--border-color, #3c3c3c);
            transition: width var(--aside-animation-duration, 250ms) var(--aside-animation-easing, ease-out);
            overflow: hidden;
        }

        /* Collapsed state */
        .aside-container.collapsed {
            width: var(--aside-width-collapsed, 48px);
        }

        /* Expanded state */
        .aside-container.expanded {
            min-width: var(--aside-width-min, 240px);
            max-width: var(--aside-width-max, 480px);
        }

        /* Resize handle */
        .resize-handle {
            position: absolute;
            left: 0;
            top: 0;
            width: 4px;
            height: 100%;
            cursor: ew-resize;
            background: transparent;
            transition: background var(--transition-fast, 150ms ease);
            z-index: 10;
        }

        .resize-handle:hover,
        .resize-handle.active {
            background: var(--accent-color, #3b82f6);
            opacity: 0.5;
        }

        .aside-container.collapsed .resize-handle {
            display: none;
        }

        /* Header */
        .aside-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border-bottom: 1px solid var(--border-color, #3c3c3c);
            flex-shrink: 0;
        }

        .header-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--accent-color, #3b82f6);
        }

        .header-title {
            flex: 1;
            font-size: var(--font-size-sm, 12px);
            font-weight: 600;
            color: var(--text-primary, #e0e0e0);
        }

        .aside-container.collapsed .header-title {
            display: none;
        }

        .activity-badge {
            font-size: var(--font-size-xs, 11px);
            font-weight: 500;
            padding: 1px 6px;
            background: var(--accent-color, #3b82f6);
            color: white;
            border-radius: 10px;
            min-width: 18px;
            text-align: center;
        }

        .activity-badge.running {
            animation: badge-pulse 1.5s ease-in-out infinite;
        }

        @keyframes badge-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }

        .toggle-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border: none;
            background: transparent;
            color: var(--text-muted, #9ca3af);
            cursor: pointer;
            border-radius: var(--radius-sm, 4px);
            transition: all var(--transition-fast, 150ms ease);
        }

        .toggle-btn:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.05));
            color: var(--text-primary, #e0e0e0);
        }

        /* Collapsed header - vertical layout */
        .aside-container.collapsed .aside-header {
            flex-direction: column;
            padding: var(--spacing-sm, 8px) var(--spacing-xs, 4px);
        }

        .aside-container.collapsed .toggle-btn {
            transform: rotate(180deg);
        }

        /* Panel container fills the content area */
        activities-panel-container {
            flex: 1;
            overflow: hidden;
        }

        .aside-container.collapsed activities-panel-container {
            display: none;
        }

        /* Content area */
        .aside-content {
            flex: 1;
            overflow: hidden;
        }

        /* Collapsed preview */
        .collapsed-content {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .aside-container.expanded .collapsed-content {
            display: none;
        }

        .aside-container.collapsed .expanded-content {
            display: none;
        }

        /* Screen reader announcements */
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
    `;

    constructor() {
        super();
        this._isResizing = false;
        this._resizeStartX = 0;
        this._resizeStartWidth = 320;
        this._boundMouseMove = this._handleMouseMove.bind(this);
        this._boundMouseUp = this._handleMouseUp.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        this.watchSignals([
            AppStore.activitiesAsideCollapsed,
            AppStore.activitiesAsideWidth,
            AppStore.conversationEvents,
            AppStore.activities,
            AppStore.currentAttachments
        ]);

        // Add keyboard listener for Escape to collapse
        this.addEventListener('keydown', this._handleKeyDown.bind(this));
    }

    disconnectedCallback() {
        // Clean up resize listeners
        document.removeEventListener('mousemove', this._boundMouseMove);
        document.removeEventListener('mouseup', this._boundMouseUp);
        super.disconnectedCallback();
    }

    /**
     * Handle keyboard events
     * @private
     */
    _handleKeyDown(e) {
        if (e.key === 'Escape' && !AppStore.activitiesAsideCollapsed.value) {
            Actions.setActivitiesAsideCollapsed(true);
            this._announceToScreenReader('Activities panel collapsed');
        }
    }

    /**
     * Toggle collapsed state
     * @private
     */
    _handleToggle() {
        Actions.toggleActivitiesAside();
        const isCollapsed = AppStore.activitiesAsideCollapsed.value;
        this._announceToScreenReader(
            isCollapsed ? 'Activities panel collapsed' : 'Activities panel expanded'
        );
    }

    /**
     * Start resize operation
     * @private
     */
    _handleResizeStart(e) {
        if (AppStore.activitiesAsideCollapsed.value) return;

        e.preventDefault();
        this._isResizing = true;
        this._resizeStartX = e.clientX;
        this._resizeStartWidth = AppStore.activitiesAsideWidth.value;

        document.addEventListener('mousemove', this._boundMouseMove);
        document.addEventListener('mouseup', this._boundMouseUp);
    }

    /**
     * Handle resize mouse move
     * @private
     */
    _handleMouseMove(e) {
        if (!this._isResizing) return;

        // Resize from left edge, so delta is inverted
        const delta = this._resizeStartX - e.clientX;
        const newWidth = this._resizeStartWidth + delta;

        Actions.setActivitiesAsideWidth(newWidth);
    }

    /**
     * Handle resize mouse up
     * @private
     */
    _handleMouseUp() {
        this._isResizing = false;
        document.removeEventListener('mousemove', this._boundMouseMove);
        document.removeEventListener('mouseup', this._boundMouseUp);
    }

    /**
     * Announce message to screen readers
     * @private
     */
    _announceToScreenReader(message) {
        const announcement = this.shadowRoot.querySelector('.sr-only');
        if (announcement) {
            announcement.textContent = message;
        }
    }

    /**
     * Get activity count for badge
     * @private
     */
    _getActivityCount() {
        return toolActivities.value.length;
    }

    /**
     * Check if any tools are running
     * @private
     */
    _hasRunningTools() {
        return ActivityService.hasRunningTools();
    }

    /**
     * Get recent activities for collapsed preview
     * @private
     */
    _getRecentActivities() {
        return toolActivities.value.slice(0, 3);
    }

    render() {
        const isCollapsed = AppStore.activitiesAsideCollapsed.value;
        const width = AppStore.activitiesAsideWidth.value;
        const activityCount = this._getActivityCount();
        const hasRunning = this._hasRunningTools();

        const containerClass = isCollapsed ? 'aside-container collapsed' : 'aside-container expanded';
        const containerStyle = isCollapsed ? '' : `width: ${width}px`;

        return html`
            <aside
                class="${containerClass}"
                style="${containerStyle}"
                role="complementary"
                aria-label="Tool Activities"
            >
                <!-- Resize handle (only when expanded) -->
                <div
                    class="resize-handle ${this._isResizing ? 'active' : ''}"
                    @mousedown=${this._handleResizeStart}
                    aria-hidden="true"
                ></div>

                <!-- Header -->
                <div class="aside-header">
                    <span class="header-icon">
                        <dash-icon name="zap" size="16"></dash-icon>
                    </span>
                    <span class="header-title">Activities</span>
                    ${activityCount > 0 ? html`
                        <span class="activity-badge ${hasRunning ? 'running' : ''}">
                            ${activityCount}
                        </span>
                    ` : ''}
                    <button
                        class="toggle-btn"
                        @click=${this._handleToggle}
                        aria-expanded="${!isCollapsed}"
                        aria-label="${isCollapsed ? 'Expand activities panel' : 'Collapse activities panel'}"
                        title="${isCollapsed ? 'Expand' : 'Collapse'}"
                    >
                        <dash-icon name="chevron-left" size="16"></dash-icon>
                    </button>
                </div>

                <!-- Collapsed content -->
                <div class="collapsed-content">
                    <collapsed-preview
                        .activities=${this._getRecentActivities()}
                    ></collapsed-preview>
                </div>

                <!-- Expanded content with extensible panel system -->
                <activities-panel-container
                    active-panel="tools"
                ></activities-panel-container>

                <!-- Screen reader announcement region -->
                <div
                    class="sr-only"
                    role="status"
                    aria-live="polite"
                ></div>
            </aside>
        `;
    }
}

customElements.define('activities-aside', ActivitiesAside);
export { ActivitiesAside };
