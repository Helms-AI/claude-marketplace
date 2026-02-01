/**
 * Dashboard Shell Component - Root layout container
 * @module components/layout/dashboard-shell
 */

import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, isConnected, domainList, ConnectionState } from '../../store/app-state.js';
import './titlebar.js';
import './sidebar-panel.js';
import './editor-area.js';
import './status-bar.js';

class DashboardShell extends SignalWatcher(LitElement) {
    static properties = {
        theme: { type: String, reflect: true },
        sidebarCollapsed: { type: Boolean, attribute: 'sidebar-collapsed', reflect: true },
        sidebarWidth: { type: Number, attribute: 'sidebar-width' },
        bottomPanelVisible: { type: Boolean, attribute: 'bottom-panel-visible', reflect: true },
        bottomPanelHeight: { type: Number, attribute: 'bottom-panel-height' },
        connected: { type: Boolean, reflect: true }
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100vh;
            overflow: hidden;
            background: var(--bg-primary, white);
            color: var(--text-primary, #333);
            font-family: var(--font-sans, 'IBM Plex Sans', system-ui, sans-serif);
        }
        :host([theme="dark"]) {
            --bg-primary: #1e1e1e;
            --bg-secondary: #252526;
            --bg-tertiary: #2d2d2d;
            --text-primary: #e0e0e0;
            --text-secondary: #b0b0b0;
            --text-muted: #808080;
            --border-color: #3d3d3d;
        }
        dashboard-titlebar { flex-shrink: 0; }
        .main { display: flex; flex: 1; overflow: hidden; }
        .activity-bar {
            display: flex;
            flex-direction: column;
            width: 48px;
            background: var(--bg-secondary, #f8f9fa);
            border-right: 1px solid var(--border-color, #e0e0e0);
        }
        .activity-top, .activity-bottom { display: flex; flex-direction: column; }
        .activity-top { flex: 1; }
        .activity-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border: none;
            background: transparent;
            color: var(--text-muted, #999);
            cursor: pointer;
            transition: all 0.15s ease;
            position: relative;
        }
        .activity-btn::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 2px;
            height: 0;
            background: var(--accent-color, #4a90d9);
            transition: height 0.15s ease;
        }
        .activity-btn:hover { color: var(--text-secondary, #666); }
        .activity-btn.active { color: var(--text-primary, #333); }
        .activity-btn.active::before { height: 24px; }
        .activity-btn svg { width: 20px; height: 20px; }
        sidebar-panel { flex-shrink: 0; }
        editor-area { flex: 1; min-width: 0; }
        .activity-bar-right {
            display: flex;
            flex-direction: column;
            width: 48px;
            background: var(--bg-secondary, #f8f9fa);
            border-left: 1px solid var(--border-color, #e0e0e0);
        }
        .activity-bar-right .activity-top,
        .activity-bar-right .activity-bottom { display: flex; flex-direction: column; }
        .activity-bar-right .activity-top { flex: 1; }
        .bottom-panel {
            display: none;
            flex-direction: column;
            border-top: 1px solid var(--border-color, #e0e0e0);
            background: var(--bg-secondary, #f8f9fa);
        }
        :host([bottom-panel-visible]) .bottom-panel { display: flex; }
        .panel-resize {
            height: 4px;
            cursor: ns-resize;
            background: transparent;
            transition: background 0.15s ease;
        }
        .panel-resize:hover { background: var(--accent-color, #4a90d9); opacity: 0.3; }
        .panel-content { flex: 1; overflow: hidden; }
        status-bar { flex-shrink: 0; }
    `;

    constructor() {
        super();
        this.theme = 'dark';
        this.sidebarCollapsed = false;
        this.sidebarWidth = 280;
        this.bottomPanelVisible = false;  // Hidden by default - no content slotted
        this.bottomPanelHeight = 200;
        this.connected = false;
    }

    connectedCallback() {
        super.connectedCallback();
        // Watch store signals for reactive updates
        // Include agents and skills to trigger re-render when domainList changes
        this.watchSignals([
            AppStore.connectionState,
            AppStore.theme,
            AppStore.sidebarVisible,
            AppStore.bottomPanelVisible,
            AppStore.tasks,
            AppStore.completedTasks,
            AppStore.tokenUsage,
            AppStore.totalCost,
            AppStore.agents,
            AppStore.skills
        ]);
    }

    _handleMenuToggle() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        this.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { collapsed: this.sidebarCollapsed }, bubbles: true, composed: true }));
    }

    _handleThemeToggle() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: this.theme }, bubbles: true, composed: true }));
    }

    _handleCommandPalette() {
        this.dispatchEvent(new CustomEvent('command-palette', { bubbles: true, composed: true }));
    }

    _handleActivityClick(panel) {
        this.dispatchEvent(new CustomEvent('activity-change', { detail: { panel }, bubbles: true, composed: true }));
    }

    render() {
        return html`
            <dashboard-titlebar
                title="Claude Code Console"
                ?connected=${AppStore.connectionState.value === ConnectionState.CONNECTED}
                theme=${AppStore.theme.value}
                @menu-toggle=${this._handleMenuToggle}
                @theme-toggle=${this._handleThemeToggle}
                @command-palette=${this._handleCommandPalette}
            ></dashboard-titlebar>

            <div class="main">
                <nav class="activity-bar">
                    <div class="activity-top">
                        <button class="activity-btn active" @click=${() => this._handleActivityClick('explorer')} title="Explorer">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </button>
                        <button class="activity-btn" @click=${() => this._handleActivityClick('search')} title="Search">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="M21 21l-4.35-4.35"></path>
                            </svg>
                        </button>
                        <button class="activity-btn" @click=${() => this._handleActivityClick('graph')} title="Graph">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="12" cy="12" r="2"></circle>
                                <circle cx="12" cy="5" r="2"></circle>
                                <circle cx="19" cy="12" r="2"></circle>
                                <circle cx="5" cy="12" r="2"></circle>
                                <circle cx="12" cy="19" r="2"></circle>
                            </svg>
                        </button>
                    </div>
                    <div class="activity-bottom">
                        <button class="activity-btn" @click=${() => this._handleActivityClick('settings')} title="Settings">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                        </button>
                    </div>
                </nav>

                <sidebar-panel
                    ?collapsed=${this.sidebarCollapsed}
                    .width=${this.sidebarWidth}
                >
                    <slot name="sidebar"></slot>
                </sidebar-panel>

                <editor-area>
                    <slot name="editor"></slot>
                </editor-area>

                <aside class="activity-bar-right">
                    <div class="activity-top">
                        <!-- Right sidebar buttons will go here -->
                    </div>
                    <div class="activity-bottom">
                        <!-- Right sidebar bottom actions will go here -->
                    </div>
                </aside>
            </div>

            <div class="bottom-panel" style="height: ${this.bottomPanelHeight}px">
                <div class="panel-resize"></div>
                <div class="panel-content">
                    <slot name="panel"></slot>
                </div>
            </div>

            <status-bar
                ?connected=${AppStore.connectionState.value === ConnectionState.CONNECTED}
                theme=${AppStore.theme.value}
                .domainCount=${domainList.value.length}
                .tasksDone=${AppStore.completedTasks.value}
                .tasksTotal=${AppStore.tasks.value.length}
                .tokenCount=${AppStore.tokenUsage.value.total}
                .tokenCost=${AppStore.totalCost.value}
                @theme-toggle=${this._handleThemeToggle}
            ></status-bar>
        `;
    }
}

customElements.define('dashboard-shell', DashboardShell);
export { DashboardShell };
