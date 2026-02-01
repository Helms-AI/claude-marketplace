/**
 * Sidebar Panel Component - Collapsible sidebar with tabs
 * @module components/layout/sidebar-panel
 */

import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions } from '../../store/app-state.js';

// Import tab components
import '../atoms/tab-group.js';
import '../atoms/filter-input.js';

// Import explorer tree components for direct rendering
import '../explorer/changeset-tree.js';
import '../explorer/agent-tree.js';
import '../explorer/skill-tree.js';

class SidebarPanel extends SignalWatcher(LitElement) {
    static properties = {
        collapsed: { type: Boolean, reflect: true },
        activeTab: { type: String, attribute: 'active-tab' },
        width: { type: Number },
        minWidth: { type: Number, attribute: 'min-width' },
        maxWidth: { type: Number, attribute: 'max-width' },
        _resizing: { type: Boolean, state: true }
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: var(--bg-primary, white);
            border-right: 1px solid var(--border-color, #e0e0e0);
            transition: width 0.2s ease;
            position: relative;
        }
        :host([collapsed]) { width: 0 !important; overflow: hidden; border-right: none; }

        dash-tab-group {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .filter-bar {
            flex-shrink: 0;
            padding: 8px;
            border-bottom: 1px solid var(--border-color, #3d3d3d);
        }

        .tree-content {
            flex: 1;
            overflow: hidden;
            min-height: 0;
        }

        .resize-handle {
            position: absolute;
            top: 0;
            right: -3px;
            width: 6px;
            height: 100%;
            cursor: col-resize;
            z-index: 10;
        }
        .resize-handle:hover {
            background: var(--accent-color, #4a90d9);
            opacity: 0.3;
        }
        :host([collapsed]) .resize-handle { display: none; }
    `;

    constructor() {
        super();
        this.collapsed = false;
        this.activeTab = 'work';
        this.width = 280;
        this.minWidth = 200;
        this.maxWidth = 500;
        this._resizing = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this._boundMouseMove = this._handleMouseMove.bind(this);
        this._boundMouseUp = this._handleMouseUp.bind(this);
        this.watchSignals([
            AppStore.agents,
            AppStore.skills,
            AppStore.changesets,
            AppStore.agentFilter,
            AppStore.skillFilter,
            AppStore.changesetFilter
        ]);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('mousemove', this._boundMouseMove);
        document.removeEventListener('mouseup', this._boundMouseUp);
    }

    updated(changedProperties) {
        if (changedProperties.has('width') && !this.collapsed) {
            this.style.width = `${this.width}px`;
        }
    }

    _handleTabChange(e) {
        this.activeTab = e.detail.tab;
        this.dispatchEvent(new CustomEvent('tab-change', { detail: { tab: this.activeTab }, bubbles: true, composed: true }));
    }

    _handleWorkFilter(e) {
        Actions.setChangesetFilter(e.detail.value);
    }

    _handleAgentFilter(e) {
        Actions.setAgentFilter(e.detail.value);
    }

    _handleSkillFilter(e) {
        Actions.setSkillFilter(e.detail.value);
    }

    _handleResizeStart(e) {
        e.preventDefault();
        this._resizing = true;
        this._startX = e.clientX;
        this._startWidth = this.width;
        document.addEventListener('mousemove', this._boundMouseMove);
        document.addEventListener('mouseup', this._boundMouseUp);
    }

    _handleMouseMove(e) {
        if (!this._resizing) return;
        const delta = e.clientX - this._startX;
        const newWidth = Math.min(this.maxWidth, Math.max(this.minWidth, this._startWidth + delta));
        this.width = newWidth;
        this.style.width = `${newWidth}px`;
    }

    _handleMouseUp() {
        this._resizing = false;
        document.removeEventListener('mousemove', this._boundMouseMove);
        document.removeEventListener('mouseup', this._boundMouseUp);
        this.dispatchEvent(new CustomEvent('resize', { detail: { width: this.width }, bubbles: true, composed: true }));
    }

    render() {
        return html`
            <dash-tab-group active="${this.activeTab}" @tab-change="${this._handleTabChange}">
                <dash-tab slot="tabs" name="work" icon="clipboard">Work</dash-tab>
                <dash-tab slot="tabs" name="agents" icon="users">Agents</dash-tab>
                <dash-tab slot="tabs" name="skills" icon="layers">Skills</dash-tab>

                <dash-tab-panel name="work">
                    <div class="filter-bar">
                        <dash-filter-input
                            placeholder="Filter changesets..."
                            debounce="150"
                            .value="${AppStore.changesetFilter.value}"
                            @dash-input="${this._handleWorkFilter}"
                        ></dash-filter-input>
                    </div>
                    <div class="tree-content">
                        <changeset-tree></changeset-tree>
                    </div>
                </dash-tab-panel>

                <dash-tab-panel name="agents">
                    <div class="filter-bar">
                        <dash-filter-input
                            placeholder="Filter agents..."
                            debounce="150"
                            .value="${AppStore.agentFilter.value}"
                            @dash-input="${this._handleAgentFilter}"
                        ></dash-filter-input>
                    </div>
                    <div class="tree-content">
                        <agent-tree></agent-tree>
                    </div>
                </dash-tab-panel>

                <dash-tab-panel name="skills">
                    <div class="filter-bar">
                        <dash-filter-input
                            placeholder="Filter skills..."
                            debounce="150"
                            .value="${AppStore.skillFilter.value}"
                            @dash-input="${this._handleSkillFilter}"
                        ></dash-filter-input>
                    </div>
                    <div class="tree-content">
                        <skill-tree></skill-tree>
                    </div>
                </dash-tab-panel>
            </dash-tab-group>

            <div class="resize-handle" @mousedown="${this._handleResizeStart}"></div>
        `;
    }
}

customElements.define('sidebar-panel', SidebarPanel);
export { SidebarPanel };
