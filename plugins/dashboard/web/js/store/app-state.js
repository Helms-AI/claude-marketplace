/**
 * Global Application State Store
 *
 * Uses Preact Signals for reactive state management.
 * All components subscribe to only the signals they need,
 * ensuring fine-grained updates without full re-renders.
 *
 * @module store/app-state
 */

import { signal, computed, effect, batch } from "@preact/signals-core";

// Re-export batch for services that need it
export { batch };

/**
 * Theme modes
 * @enum {string}
 */
export const Theme = {
  LIGHT: "light",
  DARK: "dark",
};

/**
 * Connection states
 * @enum {string}
 */
export const ConnectionState = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
};

/**
 * Explorer tabs
 * @enum {string}
 */
export const ExplorerTab = {
  WORK: "work",
  AGENTS: "agents",
  SKILLS: "skills",
};

/**
 * Main app store - Single source of truth for application state
 */
export const AppStore = {
  // ─────────────────────────────────────────────────────────────
  // Global UI State
  // ─────────────────────────────────────────────────────────────
  theme: signal(localStorage.getItem("theme") || Theme.DARK),
  sidebarVisible: signal(true),
  bottomPanelVisible: signal(true),
  sidebarWidth: signal(
    parseInt(localStorage.getItem("sidebarWidth") || "280", 10),
  ),
  bottomPanelHeight: signal(
    parseInt(localStorage.getItem("bottomPanelHeight") || "200", 10),
  ),

  // ─────────────────────────────────────────────────────────────
  // Connection State
  // ─────────────────────────────────────────────────────────────
  connectionState: signal(ConnectionState.CONNECTING),
  connectionError: signal(null),
  reconnectAttempts: signal(0),

  // ─────────────────────────────────────────────────────────────
  // Navigation State
  // ─────────────────────────────────────────────────────────────
  activeTabId: signal("welcome"),
  openTabs: signal([
    { id: "welcome", title: "Welcome", type: "welcome", closable: false },
  ]),
  activeExplorerTab: signal(ExplorerTab.WORK),
  activeBottomTab: signal("activity"),

  // ─────────────────────────────────────────────────────────────
  // Data State
  // ─────────────────────────────────────────────────────────────
  changesets: signal([]),
  agents: signal([]),
  skills: signal([]),
  selectedChangeset: signal(null),
  selectedAgent: signal(null),
  selectedSkill: signal(null),

  // ─────────────────────────────────────────────────────────────
  // Search/Filter State
  // ─────────────────────────────────────────────────────────────
  changesetFilter: signal(""),
  agentFilter: signal(""),
  skillFilter: signal(""),
  commandPaletteOpen: signal(false),

  // ─────────────────────────────────────────────────────────────
  // Terminal State
  // ─────────────────────────────────────────────────────────────
  terminalMessages: signal([]),
  isStreaming: signal(false),
  terminalModel: signal("opus"),
  sessionId: signal(null),
  sdkConnected: signal(false),

  // ─────────────────────────────────────────────────────────────
  // Streaming State (real-time updates during SDK streaming)
  // ─────────────────────────────────────────────────────────────
  streamingContent: signal(''),
  streamingTools: signal([]),

  // ─────────────────────────────────────────────────────────────
  // Token/Cost Tracking
  // ─────────────────────────────────────────────────────────────
  tokenUsage: signal({
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheCreation: 0,
    total: 0,
  }),
  totalCost: signal(0),

  // ─────────────────────────────────────────────────────────────
  // Task State
  // ─────────────────────────────────────────────────────────────
  tasks: signal([]),
  completedTasks: signal(0),

  // ─────────────────────────────────────────────────────────────
  // Activity/Errors
  // ─────────────────────────────────────────────────────────────
  activities: signal([]),
  errors: signal([]),

  // ─────────────────────────────────────────────────────────────
  // Explorer UI State (for tree expand/collapse)
  // ─────────────────────────────────────────────────────────────
  agentExpandedGroups: signal({}),      // { [domain]: boolean }
  skillExpandedGroups: signal({}),      // { [domain]: boolean }
  changesetExpandedItems: signal({}),   // { [changesetId]: boolean }

  // ─────────────────────────────────────────────────────────────
  // Loading States
  // ─────────────────────────────────────────────────────────────
  loadingAgents: signal(false),
  loadingSkills: signal(false),
  loadingChangesets: signal(false),
  loadingConversation: signal(false),

  // ─────────────────────────────────────────────────────────────
  // Changeset Conversation/Transcript State
  // ─────────────────────────────────────────────────────────────
  conversationEvents: signal([]),       // Events for selected changeset
  transcript: signal(null),             // Transcript data for selected changeset
  conversationViewMode: signal('unified'), // 'unified' | 'transcript' | 'events'
  watchedChangesetId: signal(null),     // Currently watched changeset
};

// ─────────────────────────────────────────────────────────────────
// Computed Values
// ─────────────────────────────────────────────────────────────────
export const agentCount = computed(() => AppStore.agents.value.length);
export const skillCount = computed(() => AppStore.skills.value.length);
export const changesetCount = computed(() => AppStore.changesets.value.length);

export const connectionStatusText = computed(() => {
  const state = AppStore.connectionState.value;
  switch (state) {
    case ConnectionState.CONNECTING:
      return "Connecting...";
    case ConnectionState.CONNECTED:
      return "Connected";
    case ConnectionState.DISCONNECTED:
      return "Disconnected";
    case ConnectionState.ERROR:
      return AppStore.connectionError.value || "Connection Error";
    default:
      return "Unknown";
  }
});

export const isConnected = computed(
  () => AppStore.connectionState.value === ConnectionState.CONNECTED,
);

export const filteredChangesets = computed(() => {
  const filter = AppStore.changesetFilter.value.toLowerCase();
  if (!filter) return AppStore.changesets.value;
  return AppStore.changesets.value.filter(
    (c) =>
      c.id?.toLowerCase().includes(filter) ||
      c.task?.toLowerCase().includes(filter),
  );
});

export const filteredAgents = computed(() => {
  const filter = AppStore.agentFilter.value.toLowerCase();
  if (!filter) return AppStore.agents.value;
  return AppStore.agents.value.filter(
    (a) =>
      a.name?.toLowerCase().includes(filter) ||
      a.role?.toLowerCase().includes(filter) ||
      a.domain?.toLowerCase().includes(filter),
  );
});

export const filteredSkills = computed(() => {
  const filter = AppStore.skillFilter.value.toLowerCase();
  if (!filter) return AppStore.skills.value;
  return AppStore.skills.value.filter(
    (s) =>
      s.name?.toLowerCase().includes(filter) ||
      s.description?.toLowerCase().includes(filter) ||
      s.domain?.toLowerCase().includes(filter),
  );
});

export const taskProgress = computed(() => {
  const total = AppStore.tasks.value.length;
  if (total === 0) return 0;
  return Math.round((AppStore.completedTasks.value / total) * 100);
});

export const errorCount = computed(() => AppStore.errors.value.length);
export const formattedCost = computed(
  () => `$${AppStore.totalCost.value.toFixed(4)}`,
);

// Grouped data computed values
export const agentsByDomain = computed(() => {
  const agents = AppStore.agents.value;
  const groups = {};

  agents.forEach((agent) => {
    const domain = agent.domain || "external";
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(agent);
  });

  // Sort: alphabetically but 'external' last
  return Object.entries(groups).sort(([a], [b]) =>
    a === "external" ? 1 : b === "external" ? -1 : a.localeCompare(b),
  );
});

export const skillsByDomain = computed(() => {
  const skills = AppStore.skills.value;
  const groups = {};

  skills.forEach((skill) => {
    const domain = skill.domain || "external";
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(skill);
  });

  return Object.entries(groups).sort(([a], [b]) =>
    a === "external" ? 1 : b === "external" ? -1 : a.localeCompare(b),
  );
});

export const activeChangesets = computed(() =>
  AppStore.changesets.value.filter(
    (c) => c.phase === "active" || c.status === "active",
  ),
);

export const completedChangesets = computed(() =>
  AppStore.changesets.value.filter(
    (c) => c.phase !== "active" && c.status !== "active",
  ),
);

export const domainList = computed(() => {
  const domains = new Set();
  AppStore.agents.value.forEach((a) => domains.add(a.domain || "external"));
  AppStore.skills.value.forEach((s) => domains.add(s.domain || "external"));
  return Array.from(domains).sort();
});

// ─────────────────────────────────────────────────────────────────
// Actions (State Mutations)
// ─────────────────────────────────────────────────────────────────
export const Actions = {
  toggleTheme() {
    const newTheme =
      AppStore.theme.value === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
    AppStore.theme.value = newTheme;
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  },

  setTheme(theme) {
    AppStore.theme.value = theme;
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  },

  toggleSidebar() {
    AppStore.sidebarVisible.value = !AppStore.sidebarVisible.value;
  },

  toggleBottomPanel() {
    AppStore.bottomPanelVisible.value = !AppStore.bottomPanelVisible.value;
  },

  setConnectionState(state, error = null) {
    batch(() => {
      AppStore.connectionState.value = state;
      AppStore.connectionError.value = error;
      if (state === ConnectionState.CONNECTED) {
        AppStore.reconnectAttempts.value = 0;
      }
    });
  },

  openTab(tab) {
    const existing = AppStore.openTabs.value.find((t) => t.id === tab.id);
    if (existing) {
      AppStore.activeTabId.value = tab.id;
      return;
    }
    batch(() => {
      AppStore.openTabs.value = [
        ...AppStore.openTabs.value,
        { ...tab, closable: true },
      ];
      AppStore.activeTabId.value = tab.id;
    });
  },

  closeTab(tabId) {
    const tabs = AppStore.openTabs.value;
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab || !tab.closable) return;
    const newTabs = tabs.filter((t) => t.id !== tabId);
    batch(() => {
      AppStore.openTabs.value = newTabs;
      if (AppStore.activeTabId.value === tabId) {
        AppStore.activeTabId.value =
          newTabs[newTabs.length - 1]?.id || "welcome";
      }
    });
  },

  setActiveTab(tabId) {
    AppStore.activeTabId.value = tabId;
  },

  setChangesets(changesets) {
    AppStore.changesets.value = changesets;
  },

  setAgents(agents) {
    AppStore.agents.value = agents;
  },

  setSkills(skills) {
    AppStore.skills.value = skills;
  },

  addTerminalMessage(message) {
    AppStore.terminalMessages.value = [
      ...AppStore.terminalMessages.value,
      {
        ...message,
        id: message.id || crypto.randomUUID(),
        timestamp: Date.now(),
      },
    ];
  },

  updateTerminalMessage(messageId, updates) {
    AppStore.terminalMessages.value = AppStore.terminalMessages.value.map(
      (msg) => (msg.id === messageId ? { ...msg, ...updates } : msg),
    );
  },

  updateTokenUsage(usage) {
    batch(() => {
      const current = AppStore.tokenUsage.value;
      AppStore.tokenUsage.value = {
        input: current.input + (usage.input || 0),
        output: current.output + (usage.output || 0),
        cacheRead: current.cacheRead + (usage.cacheRead || 0),
        cacheCreation: current.cacheCreation + (usage.cacheCreation || 0),
        total: current.total + (usage.input || 0) + (usage.output || 0),
      };
      const cost =
        (usage.input || 0) * 0.000003 + (usage.output || 0) * 0.000015;
      AppStore.totalCost.value += cost;
    });
  },

  addActivity(activity) {
    const newActivity = {
      ...activity,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    AppStore.activities.value = [
      newActivity,
      ...AppStore.activities.value.slice(0, 99),
    ];
  },

  addError(error) {
    const newError = {
      ...error,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    AppStore.errors.value = [newError, ...AppStore.errors.value.slice(0, 99)];
  },

  clearTerminal() {
    AppStore.terminalMessages.value = [];
  },

  setSDKConnected(connected) {
    AppStore.sdkConnected.value = connected;
  },

  // Streaming state actions - real-time updates during SDK streaming
  appendStreamingContent(text) {
    AppStore.streamingContent.value += text;
  },

  setStreamingContent(content) {
    AppStore.streamingContent.value = content;
  },

  updateStreamingTool(tool) {
    const tools = [...AppStore.streamingTools.value];
    const existingIndex = tools.findIndex(t => t.id === tool.id);
    if (existingIndex >= 0) {
      tools[existingIndex] = { ...tools[existingIndex], ...tool };
    } else {
      tools.push(tool);
    }
    AppStore.streamingTools.value = tools;
  },

  clearStreamingState() {
    batch(() => {
      AppStore.streamingContent.value = '';
      AppStore.streamingTools.value = [];
    });
  },

  resetSession() {
    batch(() => {
      AppStore.terminalMessages.value = [];
      AppStore.sessionId.value = null;
      AppStore.tokenUsage.value = {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheCreation: 0,
        total: 0,
      };
      AppStore.totalCost.value = 0;
      AppStore.tasks.value = [];
      AppStore.completedTasks.value = 0;
    });
  },

  toggleCommandPalette() {
    AppStore.commandPaletteOpen.value = !AppStore.commandPaletteOpen.value;
  },

  // Selection actions
  setSelectedAgent(agent) {
    AppStore.selectedAgent.value = agent;
  },

  setSelectedSkill(skill) {
    AppStore.selectedSkill.value = skill;
  },

  setSelectedChangeset(changeset) {
    AppStore.selectedChangeset.value = changeset;
  },

  // Explorer UI actions
  toggleAgentGroup(domain) {
    const expanded = { ...AppStore.agentExpandedGroups.value };
    expanded[domain] = expanded[domain] === false;
    AppStore.agentExpandedGroups.value = expanded;
  },

  toggleSkillGroup(domain) {
    const expanded = { ...AppStore.skillExpandedGroups.value };
    expanded[domain] = expanded[domain] === false;
    AppStore.skillExpandedGroups.value = expanded;
  },

  toggleChangesetExpanded(changesetId) {
    const expanded = { ...AppStore.changesetExpandedItems.value };
    expanded[changesetId] = !expanded[changesetId];
    AppStore.changesetExpandedItems.value = expanded;
  },

  isAgentGroupExpanded(domain) {
    return AppStore.agentExpandedGroups.value[domain] !== false;
  },

  isSkillGroupExpanded(domain) {
    return AppStore.skillExpandedGroups.value[domain] !== false;
  },

  // Loading state actions
  setLoadingAgents(loading) {
    AppStore.loadingAgents.value = loading;
  },

  setLoadingSkills(loading) {
    AppStore.loadingSkills.value = loading;
  },

  setLoadingChangesets(loading) {
    AppStore.loadingChangesets.value = loading;
  },

  setLoadingConversation(loading) {
    AppStore.loadingConversation.value = loading;
  },

  // Conversation/Transcript actions
  setConversationEvents(events) {
    AppStore.conversationEvents.value = events;
  },

  setTranscript(transcript) {
    AppStore.transcript.value = transcript;
  },

  setConversationViewMode(mode) {
    AppStore.conversationViewMode.value = mode;
  },

  setWatchedChangeset(changesetId) {
    AppStore.watchedChangesetId.value = changesetId;
  },

  // Filter actions
  setAgentFilter(filter) {
    AppStore.agentFilter.value = filter;
  },

  setSkillFilter(filter) {
    AppStore.skillFilter.value = filter;
  },

  setChangesetFilter(filter) {
    AppStore.changesetFilter.value = filter;
  },

  // Batch update for efficiency
  updateAgentActivity(agentId) {
    const agents = [...AppStore.agents.value];
    const index = agents.findIndex((a) => a.id === agentId || a.name === agentId);
    if (index !== -1) {
      agents[index] = {
        ...agents[index],
        last_active: new Date().toISOString(),
      };
      AppStore.agents.value = agents;
    }
  },

  updateSkillActivity(skillId) {
    const skills = [...AppStore.skills.value];
    const index = skills.findIndex((s) => s.id === skillId || s.name === skillId);
    if (index !== -1) {
      skills[index] = {
        ...skills[index],
        last_invoked: new Date().toISOString(),
        invocation_count: (skills[index].invocation_count || 0) + 1,
      };
      AppStore.skills.value = skills;
    }
  },

  // Changeset mutations
  addChangeset(changeset) {
    const exists = AppStore.changesets.value.some((c) => c.id === changeset.id);
    if (!exists) {
      AppStore.changesets.value = [changeset, ...AppStore.changesets.value];
    }
  },

  updateChangeset(changesetId, updates) {
    const changesets = [...AppStore.changesets.value];
    const index = changesets.findIndex((c) => c.id === changesetId);
    if (index !== -1) {
      changesets[index] = { ...changesets[index], ...updates };
      AppStore.changesets.value = changesets;
    }
  },

  removeChangeset(changesetId) {
    AppStore.changesets.value = AppStore.changesets.value.filter(
      (c) => c.id !== changesetId,
    );
    if (AppStore.selectedChangeset.value?.id === changesetId) {
      AppStore.selectedChangeset.value = null;
    }
  },
};

// ─────────────────────────────────────────────────────────────────
// Effects (Side Effects)
// ─────────────────────────────────────────────────────────────────
effect(() => {
  document.documentElement.setAttribute("data-theme", AppStore.theme.value);
});

effect(() => {
  localStorage.setItem("sidebarWidth", String(AppStore.sidebarWidth.value));
});

effect(() => {
  localStorage.setItem(
    "bottomPanelHeight",
    String(AppStore.bottomPanelHeight.value),
  );
});

// Export for debugging
if (typeof window !== "undefined") {
  window.__APP_STORE__ = AppStore;
  window.__ACTIONS__ = Actions;
}
