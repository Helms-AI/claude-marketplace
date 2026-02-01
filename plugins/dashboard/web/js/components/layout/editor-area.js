/**
 * Editor Area Component - Main content area with tabs
 * @module components/layout/editor-area
 *
 * Uses unified dash-tab-group with dash-tab-panel for consistent tab styling
 * and proper content persistence across tab switches.
 */

import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions } from '../../store/app-state.js';
import { SDKClient } from '../../services/sdk-client.js';
import '../atoms/tab-group.js';
import '../atoms/tab-panel.js';
import '../atoms/icon.js';
import '../terminal/terminal-view.js';
import '../organisms/welcome-panel.js';
import '../conversation/changeset-viewer.js';

class EditorArea extends SignalWatcher(LitElement) {
    static properties = {
        tabs: { type: Array },
        activeTabId: { type: String, attribute: 'active-tab-id' }
    };

    static styles = css`
        :host { display: flex; flex-direction: column; height: 100%; background: var(--bg-primary, white); }
        dash-tab-group { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    `;

    constructor() {
        super();
        this.tabs = [];
        this.activeTabId = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.watchSignals([
            AppStore.openTabs,
            AppStore.activeTabId,
            AppStore.sdkConnected,
            AppStore.terminalMessages,
            AppStore.isStreaming,
            AppStore.terminalModel,
            AppStore.sessionId,
            AppStore.streamingContent,
            AppStore.streamingTools
        ]);
    }

    _handleTabChange(e) {
        const tabName = e.detail.tab;
        Actions.setActiveTab(tabName);
    }

    _handleTabClose(e) {
        const tabName = e.detail.tab;
        Actions.closeTab(tabName);
    }

    _handleTabNew() {
        // Open a new welcome tab or show new tab dialog
        const newTabId = `tab-${Date.now()}`;
        Actions.openTab({ id: newTabId, title: 'New Tab', type: 'welcome' });
    }

    // Terminal event handlers
    _handleSendMessage(e) {
        const { message, model, settings } = e.detail;
        SDKClient.sendMessage(message, { model, settings });
    }

    _handleInterrupt() {
        SDKClient.interrupt();
    }

    _handleClearMessages() {
        Actions.clearTerminal();
    }

    _handleModelChange(e) {
        AppStore.terminalModel.value = e.detail.model;
    }

    _handleNewSession() {
        SDKClient.resetSession();
    }

    async _handleReconnect() {
        const available = await SDKClient.checkAvailability();
        Actions.setSDKConnected(available);
    }

    async _handleSessionSelect(e) {
        const { sessionId } = e.detail;
        await SDKClient.switchSession(sessionId);
    }

    // Map tab types to Lucide icon names
    _getTabIconName(tab) {
        const iconMap = {
            'terminal': 'terminal',
            'agent': 'user',
            'skill': 'layers',
            'changeset': 'git-branch',
            'graph': 'share-2',
            'welcome': 'home'
        };
        return iconMap[tab.type] || 'file';
    }

    /**
     * Render content for a specific tab
     * Each tab type has its own content renderer
     */
    _renderTabContent(tab) {
        // Check if this is a changeset tab
        if (tab.type === 'changeset' && tab.changesetId) {
            return html`<changeset-viewer changeset-id="${tab.changesetId}"></changeset-viewer>`;
        }

        switch(tab.type) {
            case 'terminal':
                return html`
                    <terminal-view
                        .messages=${AppStore.terminalMessages.value}
                        ?streaming=${AppStore.isStreaming.value}
                        ?connected=${AppStore.sdkConnected.value}
                        .model=${AppStore.terminalModel.value}
                        .sessionId=${AppStore.sessionId.value}
                        .streamingContent=${AppStore.streamingContent.value}
                        @send-message=${this._handleSendMessage}
                        @interrupt=${this._handleInterrupt}
                        @clear-messages=${this._handleClearMessages}
                        @model-change=${this._handleModelChange}
                        @new-session=${this._handleNewSession}
                        @reconnect=${this._handleReconnect}
                        @session-select=${this._handleSessionSelect}
                    ></terminal-view>
                `;
            case 'welcome':
            default:
                return html`<welcome-panel></welcome-panel>`;
        }
    }

    render() {
        // Use store values directly
        const tabs = AppStore.openTabs.value;
        const activeId = AppStore.activeTabId.value;

        return html`
            <dash-tab-group
                active="${activeId}"
                show-new-tab
                @tab-change=${this._handleTabChange}
                @tab-close=${this._handleTabClose}
                @tab-new=${this._handleTabNew}
            >
                ${repeat(tabs, tab => tab.id, tab => html`
                    <dash-tab
                        slot="tabs"
                        name="${tab.id}"
                        icon="${this._getTabIconName(tab)}"
                        ?closable=${tab.closable !== false}
                        ?modified=${tab.modified}
                    >${tab.title}</dash-tab>
                `)}
                ${repeat(tabs, tab => tab.id, tab => html`
                    <dash-tab-panel name="${tab.id}">
                        ${this._renderTabContent(tab)}
                    </dash-tab-panel>
                `)}
            </dash-tab-group>
        `;
    }
}

customElements.define('editor-area', EditorArea);
export { EditorArea };
