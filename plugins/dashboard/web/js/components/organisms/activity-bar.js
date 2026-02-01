/**
 * ActivityBar Organism - Left sidebar navigation bar
 * @module components/organisms/activity-bar
 */
import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';

/**
 * Activity bar panel definitions
 */
const PANELS = [
    { id: 'explorer', icon: 'files', label: 'Explorer', shortcut: '⌘⇧E' },
    { id: 'search', icon: 'search', label: 'Search', shortcut: '⌘K' },
    { id: 'changesets', icon: 'git-branch', label: 'Changesets', shortcut: '⌘⇧G' },
    { id: 'graph', icon: 'share-2', label: 'Graph', shortcut: '⌘⇧D' }
];

/**
 * @fires dash-panel-select - When a panel is selected
 * @fires dash-settings-click - When settings button is clicked
 */
class DashActivityBar extends LitElement {
    static properties = {
        activePanel: { type: String, attribute: 'active-panel' },
        badges: { type: Object }
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            width: 48px;
            background: var(--bg-tertiary, #e5e7eb);
            border-right: 1px solid var(--border-color, #e5e7eb);
        }

        .panel-buttons {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 8px 0;
        }

        .activity-btn {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 48px;
            border: none;
            background: transparent;
            color: var(--text-muted, #9ca3af);
            cursor: pointer;
            transition: all 0.15s;
        }

        .activity-btn:hover {
            color: var(--text-secondary, #6b7280);
        }

        .activity-btn.active {
            color: var(--text-primary, #1f2937);
        }

        .activity-btn.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 12px;
            bottom: 12px;
            width: 2px;
            background: var(--accent-color, #3b82f6);
            border-radius: 0 2px 2px 0;
        }

        .activity-btn:focus {
            outline: none;
        }

        .activity-btn:focus-visible {
            outline: 2px solid var(--accent-color, #3b82f6);
            outline-offset: -2px;
        }

        .badge {
            position: absolute;
            top: 8px;
            right: 8px;
            min-width: 16px;
            height: 16px;
            padding: 0 4px;
            font-size: 9px;
            font-weight: 600;
            color: white;
            background: var(--accent-color, #3b82f6);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .bottom-actions {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 8px 0;
            border-top: 1px solid var(--border-color, #e5e7eb);
        }

        .tooltip {
            position: absolute;
            left: 100%;
            margin-left: 8px;
            padding: 4px 8px;
            font-size: 11px;
            color: var(--text-primary, #1f2937);
            background: var(--bg-primary, #ffffff);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.15s;
            z-index: 1000;
        }

        .activity-btn:hover .tooltip {
            opacity: 1;
        }

        .tooltip-shortcut {
            margin-left: 8px;
            color: var(--text-muted, #9ca3af);
        }
    `;

    constructor() {
        super();
        this.activePanel = 'explorer';
        this.badges = {};
    }

    render() {
        return html`
            <div class="panel-buttons">
                ${PANELS.map(panel => html`
                    <button
                        class="activity-btn ${this.activePanel === panel.id ? 'active' : ''}"
                        @click="${() => this._handlePanelClick(panel.id)}"
                        title="${panel.label}"
                        data-panel="${panel.id}"
                    >
                        <dash-icon name="${panel.icon}" size="20"></dash-icon>
                        ${this.badges[panel.id] ? html`
                            <span class="badge">${this.badges[panel.id]}</span>
                        ` : ''}
                        <span class="tooltip">
                            ${panel.label}
                            ${panel.shortcut ? html`<span class="tooltip-shortcut">${panel.shortcut}</span>` : ''}
                        </span>
                    </button>
                `)}
            </div>

            <div class="bottom-actions">
                <button
                    class="activity-btn"
                    @click="${this._handleSettingsClick}"
                    title="Settings"
                >
                    <dash-icon name="settings" size="20"></dash-icon>
                    <span class="tooltip">Settings</span>
                </button>
            </div>
        `;
    }

    _handlePanelClick(panelId) {
        this.activePanel = panelId;
        this.dispatchEvent(new CustomEvent('dash-panel-select', {
            bubbles: true,
            composed: true,
            detail: { panel: panelId }
        }));
    }

    _handleSettingsClick() {
        this.dispatchEvent(new CustomEvent('dash-settings-click', {
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Set a badge count on a panel
     * @param {string} panelId
     * @param {number|null} count - null to remove badge
     */
    setBadge(panelId, count) {
        if (count === null || count === 0) {
            const { [panelId]: removed, ...rest } = this.badges;
            this.badges = rest;
        } else {
            this.badges = { ...this.badges, [panelId]: count };
        }
    }

    /**
     * Activate a specific panel
     * @param {string} panelId
     */
    activate(panelId) {
        this.activePanel = panelId;
    }
}

customElements.define('dash-activity-bar', DashActivityBar);
export { DashActivityBar };
