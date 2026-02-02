/**
 * Dashboard Application Entry Point
 *
 * Initializes Lit Web Components and bootstraps the dashboard.
 * Coexists with existing vanilla JS code during migration.
 *
 * @module app
 */

import { AppStore, Actions, Theme } from './store/app-state.js';
import { SSEService, SSEEventType } from './services/sse-service.js';
import { SDKClient } from './services/sdk-client.js';
import { AgentService } from './services/agent-service.js';
import { SkillService } from './services/skill-service.js';
import { ChangesetService } from './services/changeset-service.js';
import { ActivityService } from './services/activity-service.js';

// New services (Phase 3)
import { TaskService } from './services/task-service.js';
import { ErrorService } from './services/error-service.js';
import { ThemeService } from './services/theme-service.js';
import { StorageService } from './services/storage-service.js';
import { KeyboardService } from './services/keyboard-service.js';
import { TabService } from './services/tab-service.js';
import { ModalService } from './services/modal-service.js';
import { ApiService } from './services/api-service.js';
import { PanelService } from './services/panel-service.js';

// Import atoms (self-registering)
import './components/atoms/icon.js';
import './components/atoms/button.js';
import './components/atoms/dot.js';
import './components/atoms/progress-bar.js';
import './components/atoms/spinner.js';
import './components/atoms/avatar.js';
import './components/atoms/tag.js';
import './components/atoms/empty-state.js';
import './components/atoms/divider.js';
import './components/atoms/activity-indicator.js';

// Import molecules (self-registering)
import './components/molecules/search-input.js';
import './components/molecules/tag-list.js';
import './components/molecules/activity-list.js';
import './components/molecules/modal-section.js';
import './components/molecules/modal-identity.js';
import './components/molecules/detail-section.js';
import './components/molecules/activity-item.js';
import './components/molecules/activity-group.js';
import './components/molecules/collapsed-preview.js';
import './components/molecules/tool-activity-badge.js';

// Import organisms (self-registering)
import './components/organisms/token-meter.js';
import './components/organisms/task-panel.js';
import './components/organisms/error-panel.js';
import './components/organisms/timeline-view.js';
import './components/organisms/domain-graph.js';
import './components/organisms/activity-bar.js';
import './components/organisms/process-manager.js';
import './components/organisms/command-palette.js';
import './components/organisms/profile-menu.js';
import './components/organisms/welcome-panel.js';
import './components/organisms/activity-panel.js';
import './components/organisms/agent-detail-modal.js';
import './components/organisms/skill-detail-modal.js';
import './components/organisms/activity-timeline.js';
import './components/organisms/activity-file-tree.js';

// Import all legacy components (self-registering)
import './components/core/icon-button.js';
import './components/core/badge.js';
import './components/core/resizable-panel.js';
import './components/conversation/message-bubble.js';
import './components/conversation/conversation-stream.js';
import './components/conversation/changeset-viewer.js';
import './components/indicators/thinking-indicator.js';
import './components/indicators/connection-status.js';
import './components/tool-cards/tool-card-base.js';
import './components/tool-cards/bash-tool-card.js';
import './components/tool-cards/read-tool-card.js';
import './components/tool-cards/edit-tool-card.js';
import './components/tool-cards/write-tool-card.js';
import './components/tool-cards/glob-tool-card.js';
import './components/tool-cards/grep-tool-card.js';
import './components/tool-cards/task-tool-card.js';
import './components/tool-cards/web-tool-card.js';
import './components/tool-cards/question-tool-card.js';
import './components/terminal/terminal-view.js';
import './components/terminal/terminal-input.js';
import './components/terminal/model-selector.js';
import './components/terminal/session-controls.js';
import './components/explorer/changeset-tree.js';
import './components/explorer/changeset-item.js';
import './components/explorer/agent-tree.js';
import './components/explorer/agent-item.js';
import './components/explorer/skill-tree.js';
import './components/explorer/skill-item.js';
import './components/layout/dashboard-shell.js';
import './components/layout/titlebar.js';
import './components/layout/sidebar-panel.js';
import './components/layout/editor-area.js';
import './components/layout/tab-bar.js';
import './components/layout/status-bar.js';
import './components/layout/activities-aside.js';

class DashboardApp {
    constructor() { this._initialized = false; }

    async init() {
        if (this._initialized) { console.warn('[App] Already initialized'); return; }
        console.log('[App] Initializing Dashboard with Lit Components...');

        this._initTheme();
        this._initSSE();
        await this._initSDK();
        this._initKeyboardShortcuts();
        this._initLegacyBridge();
        await this._loadInitialData();
        this._initDefaultTabs();

        this._initialized = true;
        console.log('[App] Dashboard initialized');
        window.dispatchEvent(new CustomEvent('dashboard-ready', { detail: { store: AppStore, actions: Actions } }));
    }

    async _loadInitialData() {
        console.log('[App] Loading initial data...');
        try {
            await Promise.all([
                AgentService.init(),
                SkillService.init(),
                ChangesetService.init()
            ]);
            console.log('[App] Initial data loaded');
        } catch (error) {
            console.error('[App] Error loading initial data:', error);
        }
    }

    _initDefaultTabs() {
        // Open terminal tab and make it active
        Actions.openTab({ id: 'terminal', title: 'Terminal', type: 'terminal' });
        Actions.setActiveTab('terminal');
        console.log('[App] Default tabs initialized');
    }

    _initTheme() {
        const savedTheme = localStorage.getItem('theme') || Theme.DARK;
        Actions.setTheme(savedTheme);
        console.log(`[App] Theme set to: ${savedTheme}`);
    }

    _initSSE() {
        // Central SSE event router - dispatches events to appropriate services
        SSEService.subscribe((eventType, data) => {
            // Skip heartbeat logging
            if (eventType === SSEEventType.HEARTBEAT || data?.type === 'heartbeat') {
                return;
            }

            // Debug logging (can be disabled in production)
            console.log(`[SSE] ${eventType}:`, data);

            // Determine the actual event type (can come from named event or data.type)
            const type = eventType !== 'message' ? eventType : (data?.type || eventType);

            // Route changeset events to ChangesetService
            if (type === 'changeset_created' || type === 'changeset_updated' || type === 'changeset_deleted') {
                ChangesetService.handleSSEEvent({ type, data: data?.data || data });

                // Add activity feed entry for changeset events
                if (type === 'changeset_created') {
                    const changesetId = data?.data?.id || data?.id || data?.changeset_id;
                    Actions.addActivity({
                        type: 'changeset',
                        message: `Changeset ${changesetId} created`,
                        changesetId
                    });
                }
            }

            // Route transcript messages to conversation AND terminal (real-time updates)
            if (type === 'transcript_message') {
                const msgData = data?.data || data;
                const watchedId = AppStore.watchedChangesetId.value;
                const terminalSessionId = AppStore.sessionId.value;
                const eventSessionId = msgData.session_id;

                console.log('[SSE] transcript_message received:', {
                    changeset_id: msgData.changeset_id,
                    session_id: eventSessionId,
                    watchedId,
                    terminalSessionId,
                    source: msgData.source,
                    role: msgData.message?.role
                });

                // Route to ChangesetViewer if watching this changeset
                if (watchedId && msgData.changeset_id === watchedId) {
                    Actions.addConversationEvent({
                        type: 'transcript_message',
                        message: msgData.message,
                        source: msgData.source,
                        changeset_id: msgData.changeset_id,
                        timestamp: msgData.timestamp
                    });
                    console.log('[SSE] Added transcript_message to conversation events');

                    // Extract tool calls and route to ActivityService for Activities Aside
                    const toolCalls = msgData.message?.tool_calls || [];
                    if (toolCalls.length > 0) {
                        console.log(`[SSE] Extracting ${toolCalls.length} tool calls for ActivityService`);
                        toolCalls.forEach(toolCall => {
                            const toolId = toolCall.id || crypto.randomUUID();

                            // Determine if this tool call has completed (has result or output)
                            const hasResult = toolCall.result !== undefined ||
                                              toolCall.output !== undefined ||
                                              toolCall.content !== undefined;
                            const isError = toolCall.status === 'error' || toolCall.is_error;

                            if (hasResult) {
                                // Tool has completed - send as completed activity
                                ActivityService.handleToolEvent({
                                    type: 'tool_result',
                                    data: {
                                        name: toolCall.name,
                                        tool_use_id: toolId,
                                        input: toolCall.input,
                                        output: toolCall.result || toolCall.output || toolCall.content,
                                        is_error: isError,
                                        changeset_id: msgData.changeset_id,
                                        timestamp: msgData.timestamp
                                    }
                                });
                            } else {
                                // Tool is still running - send as tool_use
                                ActivityService.handleToolEvent({
                                    type: 'tool_use',
                                    data: {
                                        name: toolCall.name,
                                        tool_use_id: toolId,
                                        input: toolCall.input,
                                        status: toolCall.status,
                                        changeset_id: msgData.changeset_id,
                                        timestamp: msgData.timestamp
                                    }
                                });
                            }
                        });
                    }
                }

                // Route to Terminal if session ID matches the terminal's session
                // This allows the terminal to show real-time updates from file watching
                if (terminalSessionId && eventSessionId && terminalSessionId === eventSessionId) {
                    const message = msgData.message;
                    if (message && message.role) {
                        // Only add messages from the main transcript (not subagents) to terminal
                        // since the terminal represents the main conversation
                        if (msgData.source === 'main') {
                            // Check if this message already exists in terminal (avoid duplicates)
                            const existingMessages = AppStore.terminalMessages.value;
                            const isDuplicate = existingMessages.some(m =>
                                m.role === message.role &&
                                m.content === message.text &&
                                Math.abs(new Date(m.timestamp || 0) - new Date(message.timestamp || 0)) < 1000
                            );

                            if (!isDuplicate) {
                                Actions.addTerminalMessage({
                                    role: message.role,
                                    content: message.text || '',
                                    tools: message.tool_calls || [],
                                    timestamp: message.timestamp,
                                    fromSSE: true // Mark as from SSE for potential styling
                                });
                                console.log('[SSE] Added transcript_message to terminal');
                            }
                        }
                    }
                }
            }

            // Route conversation events
            if (type === 'conversation_event') {
                const eventData = data?.data || data;
                const watchedId = AppStore.watchedChangesetId.value;

                if (watchedId && eventData.changeset_id === watchedId) {
                    Actions.addConversationEvent(eventData);
                }
            }

            // Route task events to TaskService
            if (type === SSEEventType.TASK_STATE_CHANGE || type === 'task_state_change') {
                TaskService.handleTaskEvent(data);
            }

            // Route tool events to ActivityService (batched handling)
            if (type === 'tool_use' || type === 'tool_result') {
                ActivityService.handleToolEvent({ type, data: data?.data || data });
            }
        });

        SSEService.connect('/api/stream');
    }

    async _initSDK() {
        // Initialize SDK client and restore session from localStorage
        await SDKClient.init();

        const available = await SDKClient.checkAvailability();
        Actions.setSDKConnected(available);
        console.log(available ? '[App] SDK bridge available' : '[App] SDK bridge not available');

        // Log if we have a restored session
        if (SDKClient.sessionId) {
            console.log('[App] Session restored:', SDKClient.sessionId);
        }
    }

    _initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); Actions.toggleCommandPalette(); }
            if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); Actions.toggleSidebar(); }
            if ((e.metaKey || e.ctrlKey) && e.key === 'j') { e.preventDefault(); Actions.toggleBottomPanel(); }
            if (e.key === 'Escape' && AppStore.commandPaletteOpen.value) Actions.toggleCommandPalette();
        });
    }

    _initLegacyBridge() {
        window.DashboardStore = AppStore;
        window.DashboardActions = Actions;
        window.DashboardServices = {
            SSE: SSEService,
            SDK: SDKClient,
            Agent: AgentService,
            Skill: SkillService,
            Changeset: ChangesetService,
            Activity: ActivityService,
            // New services (Phase 3)
            Task: TaskService,
            Error: ErrorService,
            Theme: ThemeService,
            Storage: StorageService,
            Keyboard: KeyboardService,
            Tab: TabService,
            Modal: ModalService,
            Api: ApiService,
            Panel: PanelService
        };
        window.addEventListener('theme-change', (e) => Actions.setTheme(e.detail.theme));
        window.addEventListener('sidebar-toggle', () => Actions.toggleSidebar());
        // Note: SSE event routing is now consolidated in _initSSE()
    }

    destroy() { SSEService.disconnect(); this._initialized = false; }
}

const app = new DashboardApp();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => app.init());
else app.init();

export { app, AppStore, Actions };
