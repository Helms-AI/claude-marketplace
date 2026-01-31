/**
 * Dashboard Application Entry Point
 *
 * This module initializes the Lit Web Components system and
 * bootstraps the dashboard application. It coexists with the
 * existing vanilla JS code during migration.
 *
 * @module app
 */

// Import store and actions
import { AppStore, Actions, Theme } from './store/app-state.js';

// Import services
import { SSEService, SSEEventType } from './services/sse-service.js';
import { SDKClient } from './services/sdk-client.js';

// Import all components (self-registering)
// Core components
import './components/core/icon-button.js';
import './components/core/badge.js';
import './components/core/resizable-panel.js';

// Conversation components
import './components/conversation/message-bubble.js';
import './components/conversation/conversation-stream.js';

// Indicator components
import './components/indicators/thinking-indicator.js';
import './components/indicators/connection-status.js';

// Tool card components
import './components/tool-cards/tool-card-base.js';
import './components/tool-cards/bash-tool-card.js';
import './components/tool-cards/read-tool-card.js';

/**
 * Dashboard Application
 */
class DashboardApp {
    constructor() {
        this._initialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this._initialized) {
            console.warn('[App] Already initialized');
            return;
        }

        console.log('[App] Initializing Dashboard...');

        // Apply saved theme
        this._initTheme();

        // Connect to SSE
        this._initSSE();

        // Initialize SDK client
        await this._initSDK();

        // Set up keyboard shortcuts
        this._initKeyboardShortcuts();

        // Bridge with existing vanilla JS
        this._initLegacyBridge();

        this._initialized = true;
        console.log('[App] Dashboard initialized');

        // Dispatch ready event for legacy code
        window.dispatchEvent(new CustomEvent('dashboard-ready', {
            detail: { store: AppStore, actions: Actions }
        }));
    }

    /**
     * Initialize theme from stored preference
     */
    _initTheme() {
        const savedTheme = localStorage.getItem('theme') || Theme.LIGHT;
        Actions.setTheme(savedTheme);
        console.log(`[App] Theme set to: ${savedTheme}`);
    }

    /**
     * Initialize SSE connection
     */
    _initSSE() {
        SSEService.subscribe((eventType, data) => {
            // Log events for debugging
            if (eventType !== SSEEventType.HEARTBEAT) {
                console.log(`[SSE] ${eventType}:`, data);
            }
        });

        SSEService.connect('/api/events');
    }

    /**
     * Initialize SDK client
     */
    async _initSDK() {
        const available = await SDKClient.checkAvailability();
        if (available) {
            console.log('[App] SDK bridge available');
        } else {
            console.warn('[App] SDK bridge not available');
        }
    }

    /**
     * Initialize keyboard shortcuts
     */
    _initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Command palette (Cmd/Ctrl + K)
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                Actions.toggleCommandPalette();
            }

            // Toggle sidebar (Cmd/Ctrl + B)
            if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
                e.preventDefault();
                Actions.toggleSidebar();
            }

            // Toggle bottom panel (Cmd/Ctrl + J)
            if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
                e.preventDefault();
                Actions.toggleBottomPanel();
            }

            // Close command palette (Escape)
            if (e.key === 'Escape' && AppStore.commandPaletteOpen.value) {
                Actions.toggleCommandPalette();
            }
        });
    }

    /**
     * Bridge between new Lit components and existing vanilla JS
     * This allows gradual migration
     */
    _initLegacyBridge() {
        // Expose store and actions globally for legacy code
        window.DashboardStore = AppStore;
        window.DashboardActions = Actions;
        window.DashboardServices = {
            SSE: SSEService,
            SDK: SDKClient
        };

        // Listen for legacy events and update store
        window.addEventListener('theme-change', (e) => {
            Actions.setTheme(e.detail.theme);
        });

        window.addEventListener('sidebar-toggle', () => {
            Actions.toggleSidebar();
        });

        // Sync store changes to legacy DOM when needed
        // This will be removed as components are migrated
    }

    /**
     * Clean up resources
     */
    destroy() {
        SSEService.disconnect();
        this._initialized = false;
    }
}

// Create app instance
const app = new DashboardApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Export for external access
export { app, AppStore, Actions };
