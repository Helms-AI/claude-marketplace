/**
 * TabGroup Atom - Container that manages tab state
 * @module components/atoms/tab-group
 *
 * Usage:
 * <dash-tab-group active="work" @tab-change="${handleChange}">
 *   <dash-tab slot="tabs" name="work" icon="clipboard">Work</dash-tab>
 *   <dash-tab slot="tabs" name="agents" icon="users">Agents</dash-tab>
 *   <button slot="actions">+</button>
 *   <dash-tab-panel name="work">Work content</dash-tab-panel>
 *   <dash-tab-panel name="agents">Agents content</dash-tab-panel>
 * </dash-tab-group>
 */
import { LitElement, html, css } from 'lit';
import './tab.js';
import './tab-panel.js';
import './icon.js';

class DashTabGroup extends LitElement {
    static properties = {
        /** Currently active tab name */
        active: { type: String, reflect: true },
        /** Height of the tab bar */
        tabHeight: { type: Number, attribute: 'tab-height' },
        /** Show "new tab" button */
        showNewTab: { type: Boolean, attribute: 'show-new-tab' },
        /** Hide panels (tabs only mode for external panel management) */
        tabsOnly: { type: Boolean, attribute: 'tabs-only' }
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .tab-bar {
            display: flex;
            align-items: stretch;
            height: var(--tab-height, 35px);
            background: var(--bg-secondary, #252526);
            border-bottom: 1px solid var(--border-color, #3d3d3d);
            overflow: hidden;
        }

        .tab-list {
            display: flex;
            flex: 1;
            overflow-x: auto;
            scrollbar-width: none;
        }

        .tab-list::-webkit-scrollbar {
            display: none;
        }

        /* Gradient fade to fill empty space after tabs */
        .tab-list-spacer {
            flex: 1;
            min-width: 12px;
            background: linear-gradient(
                to right,
                var(--bg-secondary, #252526) 0%,
                var(--bg-tertiary, #2d2d2d) 100%
            );
        }

        .tab-actions {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 0 8px;
            border-left: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
        }

        .new-tab-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border: none;
            background: transparent;
            border-radius: var(--radius-sm, 4px);
            color: var(--text-muted, #808080);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .new-tab-btn:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.08));
            color: var(--text-secondary, #b0b0b0);
        }

        .panels {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        :host([tabs-only]) .panels {
            display: none;
        }

        ::slotted(dash-tab-panel) {
            flex: 1;
            min-height: 0;
        }

        /* Slotted action buttons */
        ::slotted([slot="actions"]) {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 24px;
            height: 24px;
            border: none;
            background: transparent;
            border-radius: var(--radius-sm, 4px);
            color: var(--text-muted, #808080);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        ::slotted([slot="actions"]:hover) {
            background: var(--bg-hover, rgba(255, 255, 255, 0.08));
            color: var(--text-secondary, #b0b0b0);
        }
    `;

    constructor() {
        super();
        this.active = '';
        this.tabHeight = 35;
        this.showNewTab = false;
        this.tabsOnly = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('tab-click', this._handleTabClick);
        this.addEventListener('tab-close', this._handleTabClose);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('tab-click', this._handleTabClick);
        this.removeEventListener('tab-close', this._handleTabClose);
    }

    updated(changedProperties) {
        if (changedProperties.has('active')) {
            this._updateActiveStates();
        }
        if (changedProperties.has('tabHeight')) {
            this.style.setProperty('--tab-height', `${this.tabHeight}px`);
        }
    }

    firstUpdated() {
        this._updateActiveStates();
        if (this.tabHeight) {
            this.style.setProperty('--tab-height', `${this.tabHeight}px`);
        }
    }

    _handleTabClick = (e) => {
        const tabName = e.detail.name;
        if (tabName && tabName !== this.active) {
            this.active = tabName;
            this.dispatchEvent(new CustomEvent('tab-change', {
                bubbles: true,
                composed: true,
                detail: { tab: tabName }
            }));
        }
    };

    _handleTabClose = (e) => {
        const tabName = e.detail.name;
        // Re-emit as tab-close at the group level
        this.dispatchEvent(new CustomEvent('tab-close', {
            bubbles: true,
            composed: true,
            detail: { tab: tabName }
        }));
    };

    _handleNewTab = () => {
        this.dispatchEvent(new CustomEvent('tab-new', {
            bubbles: true,
            composed: true
        }));
    };

    _updateActiveStates() {
        // Update tabs
        const tabs = this.querySelectorAll('dash-tab');
        tabs.forEach(tab => {
            tab.active = tab.name === this.active;
        });

        // Update panels
        const panels = this.querySelectorAll('dash-tab-panel');
        panels.forEach(panel => {
            panel.active = panel.name === this.active;
        });
    }

    /**
     * Programmatically activate a tab
     * @param {string} name - Tab name to activate
     */
    selectTab(name) {
        if (name && name !== this.active) {
            this.active = name;
            this._updateActiveStates();
            this.dispatchEvent(new CustomEvent('tab-change', {
                bubbles: true,
                composed: true,
                detail: { tab: name }
            }));
        }
    }

    /**
     * Get all tab elements
     * @returns {NodeListOf<Element>}
     */
    getTabs() {
        return this.querySelectorAll('dash-tab');
    }

    render() {
        return html`
            <div class="tab-bar">
                <div class="tab-list" role="tablist">
                    <slot name="tabs"></slot>
                    <div class="tab-list-spacer"></div>
                </div>
                <div class="tab-actions">
                    <slot name="actions"></slot>
                    ${this.showNewTab ? html`
                        <button class="new-tab-btn" @click="${this._handleNewTab}" title="New Tab">
                            <dash-icon name="plus" size="14"></dash-icon>
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="panels">
                <slot></slot>
            </div>
        `;
    }
}

customElements.define('dash-tab-group', DashTabGroup);
export { DashTabGroup };
