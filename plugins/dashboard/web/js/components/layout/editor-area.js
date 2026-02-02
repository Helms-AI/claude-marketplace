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
import './activities-aside.js';
import './artifact-shell.js';

class EditorArea extends SignalWatcher(LitElement) {
    static properties = {
        tabs: { type: Array },
        activeTabId: { type: String, attribute: 'active-tab-id' }
    };

    static styles = css`
        :host { display: flex; flex-direction: column; height: 100%; background: var(--bg-primary, white); }
        dash-tab-group { flex: 1; display: flex; flex-direction: column; min-height: 0; }

        /* Wrapper for content + activities aside within each tab pane */
        .tab-content-wrapper {
            display: flex;
            height: 100%;
            overflow: hidden;
        }

        .tab-content-wrapper .main-content {
            flex: 1;
            min-width: 0;
            overflow: hidden;
        }

        .tab-content-wrapper activities-aside {
            flex-shrink: 0;
        }
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
            AppStore.terminalMessages,  // Legacy - keep for backwards compatibility
            AppStore.isStreaming,       // Legacy - keep for backwards compatibility
            AppStore.terminalModel,
            AppStore.sessionId,
            AppStore.streamingContent,  // Legacy - keep for backwards compatibility
            AppStore.streamingTools,
            AppStore.activitiesAsideCollapsed,
            AppStore.conversations,     // NEW: Per-tab conversations
            AppStore.activeStreamingId, // NEW: Active streaming target
            AppStore.artifactTabs,      // Artifact viewer tabs
            AppStore.activeArtifactId   // Active artifact
        ]);
    }

    /**
     * Get the conversation ID for the main terminal
     * @private
     */
    get _terminalConversationId() {
        return { type: 'terminal', id: 'main' };
    }

    /**
     * Get the terminal conversation state from the per-tab conversations Map
     * @private
     */
    get _terminalConversation() {
        return Actions.getConversation(this._terminalConversationId);
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
        const { message, model, settings, attachments } = e.detail;
        // Initialize conversation if needed and send with terminal:main conversationId
        Actions.initConversation(this._terminalConversationId);
        SDKClient.sendMessage(message, {
            conversationId: this._terminalConversationId,
            model,
            settings,
            attachments: attachments || [],
            resumeSession: true
        });
    }

    _handleInterrupt() {
        SDKClient.interrupt();
    }

    _handleClearMessages() {
        // Clear the per-conversation messages for terminal:main
        Actions.clearConversationMessages(this._terminalConversationId);
        // Also clear legacy terminal for backwards compatibility
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
            'welcome': 'home',
            'artifacts': 'files'
        };
        return iconMap[tab.type] || 'file';
    }

    /**
     * Wrap content with activities aside for tabs that show tool activity
     * @private
     */
    _wrapWithActivitiesAside(content) {
        return html`
            <div class="tab-content-wrapper">
                <div class="main-content">
                    ${content}
                </div>
                <activities-aside></activities-aside>
            </div>
        `;
    }

    /**
     * Render content for a specific tab
     * Each tab type has its own content renderer
     */
    _renderTabContent(tab) {
        // Check if this is a changeset tab
        if (tab.type === 'changeset' && tab.changesetId) {
            const content = html`<changeset-viewer changeset-id="${tab.changesetId}"></changeset-viewer>`;
            return this._wrapWithActivitiesAside(content);
        }

        switch(tab.type) {
            case 'terminal':
                // Use per-conversation state for terminal:main
                const terminalConv = this._terminalConversation;
                const terminalMessages = terminalConv?.messages || [];
                const terminalIsStreaming = terminalConv?.isStreaming || false;
                const terminalStreamingContent = terminalConv?.streamingContent || '';

                const terminalContent = html`
                    <terminal-view
                        .messages=${terminalMessages}
                        ?streaming=${terminalIsStreaming}
                        ?connected=${AppStore.sdkConnected.value}
                        .model=${AppStore.terminalModel.value}
                        .sessionId=${AppStore.sessionId.value}
                        .streamingContent=${terminalStreamingContent}
                        .inputHistory=${terminalMessages.filter(m => m.role === 'user').map(m => m.content)}
                        @send-message=${this._handleSendMessage}
                        @interrupt=${this._handleInterrupt}
                        @clear-messages=${this._handleClearMessages}
                        @model-change=${this._handleModelChange}
                        @new-session=${this._handleNewSession}
                        @reconnect=${this._handleReconnect}
                        @session-select=${this._handleSessionSelect}
                    ></terminal-view>
                `;
                return this._wrapWithActivitiesAside(terminalContent);
            case 'artifacts':
                // Artifact viewer tab with full file viewer
                return html`<artifact-shell></artifact-shell>`;
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
