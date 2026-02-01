/**
 * Tab Bar Component - Editor tab management
 * @module components/layout/tab-bar
 *
 * @deprecated Use dash-tab-group with dash-tab components instead.
 * This component is retained for backward compatibility.
 *
 * Migration example:
 * ```html
 * <dash-tab-group active="terminal" tabs-only show-new-tab @tab-change="${handler}">
 *   <dash-tab slot="tabs" name="terminal" icon="terminal" closable>Terminal</dash-tab>
 *   <dash-tab slot="tabs" name="welcome" icon="home">Welcome</dash-tab>
 * </dash-tab-group>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import '../atoms/icon.js';

class TabBar extends LitElement {
    static properties = {
        tabs: { type: Array },
        activeTabId: { type: String, attribute: 'active-tab-id' }
    };

    static styles = css`
        :host {
            display: flex;
            align-items: center;
            height: 35px;
            background: var(--bg-secondary, #f8f9fa);
            border-bottom: 1px solid var(--border-color, #e0e0e0);
            overflow-x: auto;
            scrollbar-width: none;
        }
        :host::-webkit-scrollbar { display: none; }
        .tabs { display: flex; flex: 1; height: 100%; }
        .tab {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: 0 var(--spacing-md, 12px);
            height: 100%;
            border: none;
            background: transparent;
            font-size: var(--font-size-sm, 13px);
            color: var(--text-muted, #999);
            cursor: pointer;
            border-right: 1px solid var(--border-color, #e0e0e0);
            transition: all 0.15s ease;
            white-space: nowrap;
            max-width: 200px;
        }
        .tab:hover { background: var(--bg-tertiary, #e9ecef); color: var(--text-secondary, #666); }
        .tab.active {
            background: var(--bg-primary, white);
            color: var(--text-primary, #333);
            border-bottom: 2px solid var(--accent-color, #4a90d9);
            margin-bottom: -1px;
        }
        .tab-icon { display: flex; align-items: center; flex-shrink: 0; }
        .tab-title {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .tab-close {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            border: none;
            background: transparent;
            border-radius: var(--radius-sm, 4px);
            color: var(--text-muted, #999);
            cursor: pointer;
            opacity: 0;
            transition: all 0.15s ease;
        }
        .tab:hover .tab-close { opacity: 1; }
        .tab-close:hover { background: var(--bg-tertiary, #e9ecef); color: var(--error-color, #dc3545); }
        .tab-modified {
            width: 8px;
            height: 8px;
            background: var(--accent-color, #4a90d9);
            border-radius: 50%;
            flex-shrink: 0;
        }
        .actions {
            display: flex;
            align-items: center;
            padding: 0 var(--spacing-sm, 8px);
        }
        .action-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border: none;
            background: transparent;
            border-radius: var(--radius-sm, 4px);
            color: var(--text-muted, #999);
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .action-btn:hover { background: var(--bg-tertiary, #e9ecef); color: var(--text-secondary, #666); }
    `;

    constructor() {
        super();
        this.tabs = [];
        this.activeTabId = null;
    }

    _handleTabClick(tab) {
        this.activeTabId = tab.id;
        this.dispatchEvent(new CustomEvent('tab-select', { detail: { tab }, bubbles: true, composed: true }));
    }

    _handleTabClose(tab, e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('tab-close', { detail: { tab }, bubbles: true, composed: true }));
    }

    _handleNewTab() {
        this.dispatchEvent(new CustomEvent('tab-new', { bubbles: true, composed: true }));
    }

    // Map tab types to Lucide icon names
    _getTabIconName(tab) {
        const iconMap = {
            'terminal': 'terminal',
            'agent': 'user',
            'skill': 'layers',
            'changeset': 'git-branch',
            'graph': 'share-2'
        };
        return iconMap[tab.type] || 'file';
    }

    render() {
        return html`
            <div class="tabs">
                ${repeat(this.tabs, tab => tab.id, tab => html`
                    <button class="tab ${tab.id === this.activeTabId ? 'active' : ''}" @click=${() => this._handleTabClick(tab)}>
                        <span class="tab-icon">
                            <dash-icon name="${this._getTabIconName(tab)}" size="14"></dash-icon>
                        </span>
                        <span class="tab-title">${tab.title}</span>
                        ${tab.modified ? html`<span class="tab-modified"></span>` : ''}
                        ${tab.closable !== false ? html`
                            <button class="tab-close" @click=${(e) => this._handleTabClose(tab, e)}>
                                <dash-icon name="x" size="10"></dash-icon>
                            </button>
                        ` : ''}
                    </button>
                `)}
            </div>
            <div class="actions">
                <button class="action-btn" @click=${this._handleNewTab} title="New Tab">
                    <dash-icon name="plus" size="14"></dash-icon>
                </button>
            </div>
        `;
    }
}

customElements.define('tab-bar', TabBar);
export { TabBar };
