/**
 * Activities Panel Container - Extensible panel system for Activities Aside
 * @module components/organisms/activities-panel-container
 *
 * Uses a PANEL_REGISTRY pattern for extensibility - new panel types can be
 * registered without modifying this component.
 */
import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore } from '../../store/app-state.js';
import '../atoms/icon.js';
import '../atoms/segmented-control.js';
import './events-panel.js';

/**
 * Panel Registry - Register new panel types here
 *
 * Each panel entry defines:
 * - id: Unique identifier for the panel
 * - label: Display label for the tab
 * - icon: Lucide icon name
 * - component: Tag name of the component to render
 * - badge: Function that returns badge count (optional)
 * - condition: Function that returns whether to show this panel (optional)
 */
export const PANEL_REGISTRY = [
    {
        id: 'tools',
        label: 'Tools',
        icon: 'terminal',
        component: 'activity-timeline',
        badge: () => {
            const activities = AppStore.activities?.value || [];
            return activities.length;
        }
    },
    {
        id: 'files',
        label: 'Files',
        icon: 'folder',
        component: 'activity-file-tree'
    },
    {
        id: 'events',
        label: 'Events',
        icon: 'radio',
        component: 'events-panel',
        badge: () => {
            // Show unread count when paused, otherwise show events/sec if > 0
            const unread = AppStore.sseUnreadCount?.value || 0;
            if (unread > 0) return unread;
            const rate = AppStore.sseEventsPerSecond?.value || 0;
            return rate > 0 ? rate : null;
        }
    },
    {
        id: 'attachments',
        label: 'Attachments',
        icon: 'paperclip',
        component: 'attachment-panel',
        badge: () => {
            const attachments = AppStore.currentAttachments?.value || [];
            return attachments.length;
        },
        // Only show if there are attachments or in an active conversation
        condition: () => {
            const attachments = AppStore.currentAttachments?.value || [];
            return attachments.length > 0;
        }
    }
];

/**
 * Register a new panel type at runtime
 * @param {Object} panelConfig - Panel configuration object
 */
export function registerPanel(panelConfig) {
    const existing = PANEL_REGISTRY.findIndex(p => p.id === panelConfig.id);
    if (existing >= 0) {
        PANEL_REGISTRY[existing] = panelConfig;
    } else {
        PANEL_REGISTRY.push(panelConfig);
    }
}

class ActivitiesPanelContainer extends SignalWatcher(LitElement) {
    static properties = {
        activePanel: { type: String, attribute: 'active-panel' }
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow: hidden;
        }

        .panel-tabs {
            display: flex;
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            border-bottom: 1px solid var(--border-color, #3c3c3c);
            flex-shrink: 0;
            gap: var(--spacing-xs, 4px);
        }

        .panel-tab {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            border: none;
            background: transparent;
            color: var(--text-muted, #9ca3af);
            font-size: var(--font-size-xs, 11px);
            font-weight: 500;
            cursor: pointer;
            border-radius: var(--radius-sm, 4px);
            transition: all var(--transition-fast, 150ms ease);
        }

        .panel-tab:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.05));
            color: var(--text-primary, #e0e0e0);
        }

        .panel-tab.active {
            background: var(--accent-color-alpha, rgba(59, 130, 246, 0.15));
            color: var(--accent-color, #3b82f6);
        }

        .panel-tab .badge {
            font-size: var(--font-size-xs, 10px);
            padding: 0 4px;
            min-width: 16px;
            height: 16px;
            line-height: 16px;
            text-align: center;
            background: var(--bg-tertiary, #3c3c3c);
            border-radius: 8px;
        }

        .panel-tab.active .badge {
            background: var(--accent-color, #3b82f6);
            color: white;
        }

        .panel-content {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        /* Animate panel transitions */
        .panel-content > * {
            animation: panelFadeIn 0.15s ease-out;
        }

        @keyframes panelFadeIn {
            from { opacity: 0; transform: translateX(8px); }
            to { opacity: 1; transform: translateX(0); }
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: var(--spacing-lg, 24px);
            text-align: center;
            color: var(--text-muted, #9ca3af);
        }

        .empty-state dash-icon {
            margin-bottom: var(--spacing-sm, 8px);
            opacity: 0.5;
        }

        .empty-state p {
            font-size: var(--font-size-sm, 12px);
            margin: 0;
        }
    `;

    constructor() {
        super();
        this.activePanel = 'tools';
    }

    connectedCallback() {
        super.connectedCallback();
        this.watchSignals([
            AppStore.activities,
            AppStore.currentAttachments,
            AppStore.sseUnreadCount,
            AppStore.sseEventsPerSecond
        ]);
    }

    /**
     * Get visible panels based on conditions
     * @private
     */
    _getVisiblePanels() {
        return PANEL_REGISTRY.filter(panel => {
            if (typeof panel.condition === 'function') {
                return panel.condition();
            }
            return true;
        });
    }

    /**
     * Handle panel tab click
     * @private
     */
    _handlePanelChange(panelId) {
        this.activePanel = panelId;
        this.dispatchEvent(new CustomEvent('panel-change', {
            detail: { panel: panelId },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Render a panel tab
     * @private
     */
    _renderPanelTab(panel) {
        const isActive = this.activePanel === panel.id;
        const badgeCount = typeof panel.badge === 'function' ? panel.badge() : null;

        return html`
            <button
                class="panel-tab ${isActive ? 'active' : ''}"
                @click=${() => this._handlePanelChange(panel.id)}
                aria-selected="${isActive}"
                role="tab"
            >
                <dash-icon name="${panel.icon}" size="14"></dash-icon>
                <span>${panel.label}</span>
                ${badgeCount > 0 ? html`<span class="badge">${badgeCount}</span>` : ''}
            </button>
        `;
    }

    /**
     * Render active panel content
     * @private
     */
    _renderPanelContent() {
        const activePanel = PANEL_REGISTRY.find(p => p.id === this.activePanel);

        if (!activePanel) {
            return html`
                <div class="empty-state">
                    <dash-icon name="inbox" size="32"></dash-icon>
                    <p>No content available</p>
                </div>
            `;
        }

        // Dynamically render the component by tag name
        const tagName = activePanel.component;
        return html`${this._createComponent(tagName)}`;
    }

    /**
     * Create component element dynamically
     * @private
     */
    _createComponent(tagName) {
        // Use unsafeStatic or dynamic element creation
        // For now, use a switch for known components
        switch (tagName) {
            case 'activity-timeline':
                return html`<activity-timeline></activity-timeline>`;
            case 'activity-file-tree':
                return html`<activity-file-tree></activity-file-tree>`;
            case 'attachment-panel':
                return html`<attachment-panel></attachment-panel>`;
            case 'events-panel':
                return html`<events-panel></events-panel>`;
            default:
                return html`<div class="empty-state"><p>Unknown panel: ${tagName}</p></div>`;
        }
    }

    render() {
        const visiblePanels = this._getVisiblePanels();

        // If only one panel, don't show tabs
        if (visiblePanels.length <= 1) {
            return html`
                <div class="panel-content">
                    ${this._renderPanelContent()}
                </div>
            `;
        }

        return html`
            <div class="panel-tabs" role="tablist">
                ${visiblePanels.map(panel => this._renderPanelTab(panel))}
            </div>
            <div class="panel-content" role="tabpanel">
                ${this._renderPanelContent()}
            </div>
        `;
    }
}

customElements.define('activities-panel-container', ActivitiesPanelContainer);
export { ActivitiesPanelContainer };
