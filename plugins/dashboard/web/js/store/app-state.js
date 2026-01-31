/**
 * Global Application State Store
 *
 * Uses Preact Signals for reactive state management.
 * All components subscribe to only the signals they need,
 * ensuring fine-grained updates without full re-renders.
 *
 * @module store/app-state
 */

import { signal, computed, effect, batch } from '@preact/signals-core';

/**
 * Theme modes
 * @enum {string}
 */
export const Theme = {
    LIGHT: 'light',
    DARK: 'dark'
};

/**
 * Connection states
 * @enum {string}
 */
export const ConnectionState = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error'
};

/**
 * Explorer tabs
 * @enum {string}
 */
export const ExplorerTab = {
    WORK: 'work',
    AGENTS: 'agents',
    SKILLS: 'skills'
};

/**
 * Main app store
 * Single source of truth for application state
 */
export const AppStore = {
    // ─────────────────────────────────────────────────────────────
    // Global UI State
    // ─────────────────────────────────────────────────────────────

    /** @type {Signal<string>} Current theme */
    theme: signal(localStorage.getItem('theme') || Theme.LIGHT),

    /** @type {Signal<boolean>} Sidebar visibility */
    sidebarVisible: signal(true),

    /** @type {Signal<boolean>} Bottom panel visibility */
    bottomPanelVisible: signal(true),

    /** @type {Signal<number>} Sidebar width in pixels */
    sidebarWidth: signal(parseInt(localStorage.getItem('sidebarWidth') || '280', 10)),

    /** @type {Signal<number>} Bottom panel height in pixels */
    bottomPanelHeight: signal(parseInt(localStorage.getItem('bottomPanelHeight') || '200', 10)),

    // ─────────────────────────────────────────────────────────────
    // Connection State
    // ─────────────────────────────────────────────────────────────

    /** @type {Signal<string>} SSE connection state */
    connectionState: signal(ConnectionState.CONNECTING),

    /** @type {Signal<string|null>} Error message if connection fails */
    connectionError: signal(null),

    /** @type {Signal<number>} Reconnection attempt count */
    reconnectAttempts: signal(0),

    // ─────────────────────────────────────────────────────────────
    // Navigation State
    // ─────────────────────────────────────────────────────────────

    /** @type {Signal<string>} Active editor tab ID */
    activeTabId: signal('welcome'),

    /** @type {Signal<Array>} Open tabs */
    openTabs: signal([
        { id: 'welcome', title: 'Welcome', type: 'welcome', closable: false }
    ]),

    /** @type {Signal<string>} Active explorer tab */
    activeExplorerTab: signal(ExplorerTab.WORK),

    /** @type {Signal<string>} Active bottom panel tab */
    activeBottomTab: signal('activity'),

    // ─────────────────────────────────────────────────────────────
    // Data State
    // ─────────────────────────────────────────────────────────────

    /** @type {Signal<Array>} Changesets from server */
    changesets: signal([]),

    /** @type {Signal<Array>} Agents from server */
    agents: signal([]),

    /** @type {Signal<Array>} Skills from server */
    skills: signal([]),

    /** @type {Signal<Object|null>} Selected changeset */
    selectedChangeset: signal(null),

    /** @type {Signal<Object|null>} Selected agent */
    selectedAgent: signal(null),

    /** @type {Signal<Object|null>} Selected skill */
    selectedSkill: signal(null),

    // ─────────────────────────────────────────────────────────────
    // Search/Filter State
    // ─────────────────────────────────────────────────────────────

    /** @type {Signal<string>} Changeset search filter */
    changesetFilter: signal(''),

    /** @type {Signal<string>} Agent search filter */
    agentFilter: signal(''),

    /** @type {Signal<string>} Skill search filter */
    skillFilter: signal(''),

    /** @type {Signal<boolean>} Command palette open state */
    commandPaletteOpen: signal(false),

    // ─────────────────────────────────────────────────────────────
    // Terminal State
    // ─────────────────────────────────────────────────────────────

    /** @type {Signal<Array>} Terminal conversation messages */
    terminalMessages: signal([]),

    /** @type {Signal<boolean>} Whether terminal is streaming */
    isStreaming: signal(false),

    /** @type {Signal<string>} Current terminal view mode */
    terminalViewMode: signal('conversation'), // 'conversation' or 'terminal'

    /** @type {Signal<string>} Selected model for terminal */
    terminalModel: signal('sonnet'),

    /** @type {Signal<string|null>} Current session ID */
    sessionId: signal(null),

    // ─────────────────────────────────────────────────────────────
    // Token/Cost Tracking
    // ─────────────────────────────────────────────────────────────

    /** @type {Signal<Object>} Token usage stats */
    tokenUsage: signal({
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheCreation: 0,
        total: 0
    }),

    /** @type {Signal<number>} Total cost in dollars */
    totalCost: signal(0),

    // ─────────────────────────────────────────────────────────────
    // Task State
    // ─────────────────────────────────────────────────────────────

    /** @type {Signal<Array>} Active tasks */
    tasks: signal([]),

    /** @type {Signal<number>} Completed task count */
    completedTasks: signal(0),

    // ─────────────────────────────────────────────────────────────
    // Activity/Errors
    // ─────────────────────────────────────────────────────────────

    /** @type {Signal<Array>} Activity log entries */
    activities: signal([]),

    /** @type {Signal<Array>} Error entries */
    errors: signal([])
};

// ─────────────────────────────────────────────────────────────────
// Computed Values
// ─────────────────────────────────────────────────────────────────

/**
 * Computed: Number of agents
 */
export const agentCount = computed(() => AppStore.agents.value.length);

/**
 * Computed: Number of skills
 */
export const skillCount = computed(() => AppStore.skills.value.length);

/**
 * Computed: Number of changesets
 */
export const changesetCount = computed(() => AppStore.changesets.value.length);

/**
 * Computed: Connection status text
 */
export const connectionStatusText = computed(() => {
    const state = AppStore.connectionState.value;
    switch (state) {
        case ConnectionState.CONNECTING:
            return 'Connecting...';
        case ConnectionState.CONNECTED:
            return 'Connected';
        case ConnectionState.DISCONNECTED:
            return 'Disconnected';
        case ConnectionState.ERROR:
            return AppStore.connectionError.value || 'Connection Error';
        default:
            return 'Unknown';
    }
});

/**
 * Computed: Whether connected
 */
export const isConnected = computed(() =>
    AppStore.connectionState.value === ConnectionState.CONNECTED
);

/**
 * Computed: Filtered changesets
 */
export const filteredChangesets = computed(() => {
    const filter = AppStore.changesetFilter.value.toLowerCase();
    if (!filter) return AppStore.changesets.value;
    return AppStore.changesets.value.filter(c =>
        c.id?.toLowerCase().includes(filter) ||
        c.task?.toLowerCase().includes(filter)
    );
});

/**
 * Computed: Filtered agents
 */
export const filteredAgents = computed(() => {
    const filter = AppStore.agentFilter.value.toLowerCase();
    if (!filter) return AppStore.agents.value;
    return AppStore.agents.value.filter(a =>
        a.name?.toLowerCase().includes(filter) ||
        a.role?.toLowerCase().includes(filter) ||
        a.domain?.toLowerCase().includes(filter)
    );
});

/**
 * Computed: Filtered skills
 */
export const filteredSkills = computed(() => {
    const filter = AppStore.skillFilter.value.toLowerCase();
    if (!filter) return AppStore.skills.value;
    return AppStore.skills.value.filter(s =>
        s.name?.toLowerCase().includes(filter) ||
        s.description?.toLowerCase().includes(filter) ||
        s.domain?.toLowerCase().includes(filter)
    );
});

/**
 * Computed: Task progress percentage
 */
export const taskProgress = computed(() => {
    const total = AppStore.tasks.value.length;
    if (total === 0) return 0;
    return Math.round((AppStore.completedTasks.value / total) * 100);
});

/**
 * Computed: Error count
 */
export const errorCount = computed(() => AppStore.errors.value.length);

/**
 * Computed: Formatted cost string
 */
export const formattedCost = computed(() => {
    return `$${AppStore.totalCost.value.toFixed(4)}`;
});

// ─────────────────────────────────────────────────────────────────
// Actions (State Mutations)
// ─────────────────────────────────────────────────────────────────

/**
 * Actions for mutating state
 * Using batch() for multiple updates to prevent intermediate renders
 */
export const Actions = {
    /**
     * Toggle theme between light and dark
     */
    toggleTheme() {
        const newTheme = AppStore.theme.value === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
        AppStore.theme.value = newTheme;
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    },

    /**
     * Set theme explicitly
     * @param {string} theme
     */
    setTheme(theme) {
        AppStore.theme.value = theme;
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    },

    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        AppStore.sidebarVisible.value = !AppStore.sidebarVisible.value;
    },

    /**
     * Toggle bottom panel visibility
     */
    toggleBottomPanel() {
        AppStore.bottomPanelVisible.value = !AppStore.bottomPanelVisible.value;
    },

    /**
     * Set connection state
     * @param {string} state
     * @param {string|null} error
     */
    setConnectionState(state, error = null) {
        batch(() => {
            AppStore.connectionState.value = state;
            AppStore.connectionError.value = error;
            if (state === ConnectionState.CONNECTED) {
                AppStore.reconnectAttempts.value = 0;
            }
        });
    },

    /**
     * Open a new tab
     * @param {Object} tab - Tab configuration
     */
    openTab(tab) {
        const existing = AppStore.openTabs.value.find(t => t.id === tab.id);
        if (existing) {
            AppStore.activeTabId.value = tab.id;
            return;
        }

        batch(() => {
            AppStore.openTabs.value = [...AppStore.openTabs.value, { ...tab, closable: true }];
            AppStore.activeTabId.value = tab.id;
        });
    },

    /**
     * Close a tab
     * @param {string} tabId
     */
    closeTab(tabId) {
        const tabs = AppStore.openTabs.value;
        const tab = tabs.find(t => t.id === tabId);
        if (!tab || !tab.closable) return;

        const newTabs = tabs.filter(t => t.id !== tabId);
        batch(() => {
            AppStore.openTabs.value = newTabs;
            if (AppStore.activeTabId.value === tabId) {
                AppStore.activeTabId.value = newTabs[newTabs.length - 1]?.id || 'welcome';
            }
        });
    },

    /**
     * Set active tab
     * @param {string} tabId
     */
    setActiveTab(tabId) {
        AppStore.activeTabId.value = tabId;
    },

    /**
     * Update changesets
     * @param {Array} changesets
     */
    setChangesets(changesets) {
        AppStore.changesets.value = changesets;
    },

    /**
     * Update agents
     * @param {Array} agents
     */
    setAgents(agents) {
        AppStore.agents.value = agents;
    },

    /**
     * Update skills
     * @param {Array} skills
     */
    setSkills(skills) {
        AppStore.skills.value = skills;
    },

    /**
     * Add a terminal message
     * @param {Object} message
     */
    addTerminalMessage(message) {
        AppStore.terminalMessages.value = [
            ...AppStore.terminalMessages.value,
            { ...message, id: message.id || crypto.randomUUID(), timestamp: Date.now() }
        ];
    },

    /**
     * Update token usage
     * @param {Object} usage
     */
    updateTokenUsage(usage) {
        batch(() => {
            const current = AppStore.tokenUsage.value;
            AppStore.tokenUsage.value = {
                input: current.input + (usage.input || 0),
                output: current.output + (usage.output || 0),
                cacheRead: current.cacheRead + (usage.cacheRead || 0),
                cacheCreation: current.cacheCreation + (usage.cacheCreation || 0),
                total: current.total + (usage.input || 0) + (usage.output || 0)
            };

            // Calculate cost (approximate pricing)
            const cost =
                (usage.input || 0) * 0.000003 +  // $3 per 1M input tokens
                (usage.output || 0) * 0.000015;  // $15 per 1M output tokens
            AppStore.totalCost.value += cost;
        });
    },

    /**
     * Add activity entry
     * @param {Object} activity
     */
    addActivity(activity) {
        const newActivity = {
            ...activity,
            id: crypto.randomUUID(),
            timestamp: Date.now()
        };
        AppStore.activities.value = [newActivity, ...AppStore.activities.value.slice(0, 99)];
    },

    /**
     * Add error entry
     * @param {Object} error
     */
    addError(error) {
        const newError = {
            ...error,
            id: crypto.randomUUID(),
            timestamp: Date.now()
        };
        AppStore.errors.value = [newError, ...AppStore.errors.value.slice(0, 99)];
    },

    /**
     * Clear terminal messages
     */
    clearTerminal() {
        AppStore.terminalMessages.value = [];
    },

    /**
     * Reset session
     */
    resetSession() {
        batch(() => {
            AppStore.terminalMessages.value = [];
            AppStore.sessionId.value = null;
            AppStore.tokenUsage.value = {
                input: 0, output: 0, cacheRead: 0, cacheCreation: 0, total: 0
            };
            AppStore.totalCost.value = 0;
            AppStore.tasks.value = [];
            AppStore.completedTasks.value = 0;
        });
    },

    /**
     * Toggle command palette
     */
    toggleCommandPalette() {
        AppStore.commandPaletteOpen.value = !AppStore.commandPaletteOpen.value;
    }
};

// ─────────────────────────────────────────────────────────────────
// Effects (Side Effects)
// ─────────────────────────────────────────────────────────────────

// Persist theme changes to DOM
effect(() => {
    document.documentElement.setAttribute('data-theme', AppStore.theme.value);
});

// Persist sidebar width
effect(() => {
    localStorage.setItem('sidebarWidth', String(AppStore.sidebarWidth.value));
});

// Persist bottom panel height
effect(() => {
    localStorage.setItem('bottomPanelHeight', String(AppStore.bottomPanelHeight.value));
});

// Export for debugging
if (typeof window !== 'undefined') {
    window.__APP_STORE__ = AppStore;
    window.__ACTIONS__ = Actions;
}
