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
import { groupChangesetsByTime, getDefaultExpansionState } from '../services/time-grouping.js';

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
 * Tool render modes
 * @enum {string}
 */
export const ToolRenderMode = {
  INLINE: "inline",     // Always render in conversation (interactive tools)
  ASIDE: "aside",       // Always render in activities aside (operational tools)
  HYBRID: "hybrid",     // User can choose (future feature)
};

/**
 * Tool rendering configuration
 * Determines where each tool type renders: inline in conversation or in activities aside
 *
 * - INLINE: Tools that require user interaction (must stay in conversation)
 * - ASIDE: Operational tools that don't need inline display
 * - HYBRID: Future - user can toggle between inline/aside
 */
export const TOOL_RENDER_CONFIG = {
  // Interactive tools - ALWAYS inline (require user input)
  AskUserQuestion: { mode: ToolRenderMode.INLINE, reason: "requires-user-input" },

  // Operational tools - ALWAYS aside
  Read: { mode: ToolRenderMode.ASIDE },
  Write: { mode: ToolRenderMode.ASIDE },
  Edit: { mode: ToolRenderMode.ASIDE },
  Bash: { mode: ToolRenderMode.ASIDE },
  Glob: { mode: ToolRenderMode.ASIDE },
  Grep: { mode: ToolRenderMode.ASIDE },
  Task: { mode: ToolRenderMode.ASIDE },
  TaskCreate: { mode: ToolRenderMode.ASIDE },
  TaskUpdate: { mode: ToolRenderMode.ASIDE },
  TaskList: { mode: ToolRenderMode.ASIDE },
  TaskGet: { mode: ToolRenderMode.ASIDE },
  WebFetch: { mode: ToolRenderMode.ASIDE },
  WebSearch: { mode: ToolRenderMode.ASIDE },
  NotebookEdit: { mode: ToolRenderMode.ASIDE },
  ToolSearch: { mode: ToolRenderMode.ASIDE },
  Skill: { mode: ToolRenderMode.ASIDE },
  EnterPlanMode: { mode: ToolRenderMode.ASIDE },
  ExitPlanMode: { mode: ToolRenderMode.ASIDE },

  // Default for unknown tools
  _default: { mode: ToolRenderMode.ASIDE },
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
  // Terminal State (shared across conversations)
  // ─────────────────────────────────────────────────────────────
  terminalMessages: signal([]),  // LEGACY: kept for backwards compatibility
  isStreaming: signal(false),    // LEGACY: use conversations Map instead
  terminalModel: signal("opus"),
  sessionId: signal(null),       // Shared Claude session ID
  sdkConnected: signal(false),

  // ─────────────────────────────────────────────────────────────
  // Per-Tab Conversation State (NEW)
  // ─────────────────────────────────────────────────────────────
  // Map<string, ConversationState> where key is "type:id"
  // ConversationState = { id, messages[], isStreaming, streamingContent, streamingTools[], contextPrefix?, lastActivity }
  conversations: signal(new Map()),
  activeStreamingId: signal(null),  // Which conversation is currently streaming { type, id }

  // ─────────────────────────────────────────────────────────────
  // Streaming State (real-time updates during SDK streaming)
  // ─────────────────────────────────────────────────────────────
  streamingContent: signal(''),  // LEGACY: kept for backwards compatibility
  streamingTools: signal([]),    // LEGACY: kept for backwards compatibility

  // ─────────────────────────────────────────────────────────────
  // Tool Activity Indicator State (real-time tool display)
  // ─────────────────────────────────────────────────────────────
  // Current streaming tool for activity indicator display
  // Structure: { tool: 'Read', input: {...}, id: '...', startTime: Date.now() }
  currentStreamingTool: signal(null),
  // Current agent context (if available from subagent)
  // Structure: { name: 'Ryan Helms', role: 'Researcher', domain: 'frontend' }
  currentStreamingAgent: signal(null),

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
  changesetTimeGroups: signal(getDefaultExpansionState()), // { [groupId]: boolean }

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

  // ─────────────────────────────────────────────────────────────
  // Activities Aside Panel State
  // ─────────────────────────────────────────────────────────────
  activitiesAsideCollapsed: signal(true),      // Collapsed by default
  activitiesAsideWidth: signal(320),           // Default expanded width (320px)
  activitiesViewMode: signal('timeline'),      // 'timeline' | 'files'
  activitiesFilter: signal(''),                // Filter string for activities

  // ─────────────────────────────────────────────────────────────
  // Attachment State (for terminal input attachments)
  // ─────────────────────────────────────────────────────────────
  currentAttachments: signal([]),              // Array of current attachments pending send

  // ─────────────────────────────────────────────────────────────
  // Passthrough Mode State (command queue)
  // ─────────────────────────────────────────────────────────────
  pendingCommand: signal(null),                // { message, contextId, timestamp }
  passthroughActive: signal(false),            // Is parent Claude session active?

  // ─────────────────────────────────────────────────────────────
  // Artifact Viewer State
  // ─────────────────────────────────────────────────────────────
  artifacts: signal(new Map()),               // Map<id, ArtifactMetadata + content>
  artifactTabs: signal([]),                   // Ordered array of artifact IDs
  activeArtifactId: signal(null),             // Currently selected artifact tab
  artifactLoadStates: signal(new Map()),      // Map<id, 'loading' | 'loaded' | 'error'>

  // ─────────────────────────────────────────────────────────────
  // SSE Events Monitor State
  // ─────────────────────────────────────────────────────────────
  sseEvents: signal([]),                       // Circular buffer of SSE events
  sseEventCount: signal(0),                    // Total running count of events received
  sseEventsFilter: signal(''),                 // Keyword filter string
  sseEventsFilterType: signal('all'),          // Category filter (all/changeset/activity/etc)
  sseEventsPaused: signal(false),              // Auto-scroll pause state
  sseLastEventTime: signal(null),              // Last event timestamp
  sseEventsPerSecond: signal(0),               // Rolling throughput metric
  sseUnreadCount: signal(0),                   // Events received while paused
  sseEventBufferSize: signal(500),             // Configurable buffer limit (100-2000)
  sseHiddenEventTypes: signal(['heartbeat']),  // Event types to hide (default: heartbeat)
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

/**
 * Changesets grouped by time hierarchy
 * Returns { active: [], timeGroups: TimeGroup[] }
 */
export const changesetsByTime = computed(() =>
  groupChangesetsByTime(AppStore.changesets.value),
);

export const domainList = computed(() => {
  const domains = new Set();
  AppStore.agents.value.forEach((a) => domains.add(a.domain || "external"));
  AppStore.skills.value.forEach((s) => domains.add(s.domain || "external"));
  return Array.from(domains).sort();
});

/**
 * Tool activities from the activities store
 * ActivityService adds tool events here via Actions.addActivity
 *
 * Note: This now uses AppStore.activities instead of conversationEvents
 * because tool events are extracted from transcript_messages in app.js
 * and routed to ActivityService which adds them to activities store.
 */
export const toolActivities = computed(() => {
  // Return activities that have tool information
  return AppStore.activities.value.filter(a =>
    a.tool || a.type === 'tool_use' || a.type === 'tool_result'
  );
});

/**
 * Filtered tool activities based on the aside filter string
 */
export const filteredToolActivities = computed(() => {
  const filter = AppStore.activitiesFilter.value.toLowerCase();
  if (!filter) return toolActivities.value;
  return toolActivities.value.filter(activity => {
    const toolName = activity.content?.tool || activity.tool || '';
    const filePath = activity.content?.file || activity.file || '';
    return toolName.toLowerCase().includes(filter) ||
           filePath.toLowerCase().includes(filter);
  });
});

/**
 * SSE Events filtered by category and keyword, excluding hidden event types
 */
export const filteredSSEEvents = computed(() => {
  const events = AppStore.sseEvents.value;
  const filter = AppStore.sseEventsFilter.value.toLowerCase();
  const filterType = AppStore.sseEventsFilterType.value;
  const hiddenTypes = AppStore.sseHiddenEventTypes.value;

  return events.filter(event => {
    // Filter out hidden event types
    if (hiddenTypes.includes(event.type)) return false;

    // Filter by category
    if (filterType !== 'all') {
      const eventCategory = getSSEEventCategory(event.type);
      if (eventCategory !== filterType) return false;
    }

    // Filter by keyword
    if (filter) {
      const searchText = JSON.stringify(event).toLowerCase();
      if (!searchText.includes(filter)) return false;
    }

    return true;
  });
});

/**
 * Get the category for an SSE event type
 */
function getSSEEventCategory(type) {
  if (!type) return 'system';
  const t = type.toLowerCase();
  if (t.includes('changeset')) return 'changeset';
  if (t.includes('activity') || t.includes('tool')) return 'activity';
  if (t.includes('conversation') || t.includes('transcript')) return 'conversation';
  if (t.includes('graph') || t.includes('handoff')) return 'graph';
  return 'system';
}

/**
 * SSE Event statistics by type
 */
export const sseEventStats = computed(() => {
  const events = AppStore.sseEvents.value;
  const hiddenTypes = AppStore.sseHiddenEventTypes.value;

  const stats = {
    total: events.length,
    visible: 0,
    byCategory: {
      all: 0,
      changeset: 0,
      activity: 0,
      conversation: 0,
      graph: 0,
      system: 0
    },
    byType: {}
  };

  events.forEach(event => {
    const type = event.type || 'unknown';
    const category = getSSEEventCategory(type);

    // Count by type
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    // Count visible (not hidden)
    if (!hiddenTypes.includes(type)) {
      stats.visible++;
      stats.byCategory.all++;
      stats.byCategory[category]++;
    }
  });

  return stats;
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
    // Use provided id (tool_use_id) or generate new one
    // This preserves the tool_use_id for matching with tool_result
    const newActivity = {
      ...activity,
      id: activity.id || crypto.randomUUID(),
      timestamp: activity.timestamp || Date.now(),
    };

    // Keep only 30 most recent activities
    // Running activities are always kept, limit applies to completed ones
    const currentActivities = AppStore.activities.value;
    const runningActivities = currentActivities.filter(a => a.status === 'running');
    const completedActivities = currentActivities.filter(a => a.status !== 'running');

    // If new activity is running, add to running list
    // If completed, add to completed list and trim to 30
    if (newActivity.status === 'running') {
      AppStore.activities.value = [
        newActivity,
        ...runningActivities,
        ...completedActivities.slice(0, 30),
      ];
    } else {
      AppStore.activities.value = [
        ...runningActivities,
        newActivity,
        ...completedActivities.slice(0, 29),
      ];
    }
  },

  /**
   * Update an existing activity by id (tool_use_id)
   * Used when tool_result arrives to update running → completed
   */
  updateActivity(id, updates) {
    const currentActivities = AppStore.activities.value;
    const index = currentActivities.findIndex(a => a.id === id);

    if (index === -1) {
      // Activity not found - might have been pruned, add as new
      this.addActivity({ id, ...updates });
      return;
    }

    // Update the activity in place
    const updatedActivity = {
      ...currentActivities[index],
      ...updates,
    };

    // Re-sort: move from running to completed if status changed
    const newActivities = [...currentActivities];
    newActivities[index] = updatedActivity;

    // Re-filter and re-organize
    const runningActivities = newActivities.filter(a => a.status === 'running');
    const completedActivities = newActivities.filter(a => a.status !== 'running');

    AppStore.activities.value = [
      ...runningActivities,
      ...completedActivities.slice(0, 30),
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
      AppStore.currentStreamingTool.value = null;
      AppStore.currentStreamingAgent.value = null;
    });
  },

  // Tool Activity Indicator Actions
  setCurrentStreamingTool(toolData) {
    AppStore.currentStreamingTool.value = toolData ? {
      ...toolData,
      startTime: Date.now()
    } : null;
  },

  clearCurrentStreamingTool() {
    AppStore.currentStreamingTool.value = null;
  },

  setCurrentStreamingAgent(agentData) {
    AppStore.currentStreamingAgent.value = agentData;
  },

  clearCurrentStreamingAgent() {
    AppStore.currentStreamingAgent.value = null;
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

  toggleChangesetTimeGroup(groupId) {
    const expanded = { ...AppStore.changesetTimeGroups.value };
    expanded[groupId] = !expanded[groupId];
    AppStore.changesetTimeGroups.value = expanded;
  },

  isChangesetTimeGroupExpanded(groupId) {
    const state = AppStore.changesetTimeGroups.value;
    // Check if explicitly set, otherwise use default
    if (groupId in state) {
      return state[groupId];
    }
    // Default: 'today' and 'today.last-hour' are expanded
    return groupId === 'today' || groupId === 'today.last-hour';
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

  addConversationEvent(event) {
    // Append a single event for real-time updates
    const newEvent = {
      ...event,
      id: event.id || crypto.randomUUID(),
      timestamp: event.timestamp || Date.now(),
    };
    AppStore.conversationEvents.value = [
      ...AppStore.conversationEvents.value,
      newEvent,
    ];
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

  // ─────────────────────────────────────────────────────────────
  // Activities Aside Actions
  // ─────────────────────────────────────────────────────────────
  toggleActivitiesAside() {
    AppStore.activitiesAsideCollapsed.value = !AppStore.activitiesAsideCollapsed.value;
  },

  setActivitiesAsideCollapsed(collapsed) {
    AppStore.activitiesAsideCollapsed.value = collapsed;
  },

  setActivitiesAsideWidth(width) {
    // Clamp between min (240) and max (480)
    AppStore.activitiesAsideWidth.value = Math.max(240, Math.min(480, width));
  },

  setActivitiesViewMode(mode) {
    if (mode === 'timeline' || mode === 'files') {
      AppStore.activitiesViewMode.value = mode;
    }
  },

  setActivitiesFilter(filter) {
    AppStore.activitiesFilter.value = filter;
  },

  // ─────────────────────────────────────────────────────────────
  // Per-Tab Conversation Actions (NEW)
  // ─────────────────────────────────────────────────────────────

  /**
   * Serialize a ConversationId to a Map key
   * @param {{type: string, id: string}} conversationId
   * @returns {string}
   */
  _serializeConversationId(conversationId) {
    return `${conversationId.type}:${conversationId.id}`;
  },

  /**
   * Initialize a conversation for a tab (if not already exists)
   * @param {{type: string, id: string}} conversationId
   * @param {Object} options - { contextPrefix?: string }
   */
  initConversation(conversationId, options = {}) {
    const key = this._serializeConversationId(conversationId);
    const conversations = new Map(AppStore.conversations.value);

    if (!conversations.has(key)) {
      conversations.set(key, {
        id: conversationId,
        messages: [],
        isStreaming: false,
        streamingContent: '',
        streamingTools: [],
        contextPrefix: options.contextPrefix || null,
        lastActivity: Date.now()
      });
      AppStore.conversations.value = conversations;
    }
  },

  /**
   * Get conversation state by ID
   * @param {{type: string, id: string}} conversationId
   * @returns {Object|null}
   */
  getConversation(conversationId) {
    const key = this._serializeConversationId(conversationId);
    return AppStore.conversations.value.get(key) || null;
  },

  /**
   * Add message to a specific conversation
   * @param {{type: string, id: string}} conversationId
   * @param {Object} message
   */
  addConversationMessage(conversationId, message) {
    const key = this._serializeConversationId(conversationId);
    const conversations = new Map(AppStore.conversations.value);
    const conv = conversations.get(key);

    if (conv) {
      const newMessage = {
        ...message,
        id: message.id || crypto.randomUUID(),
        timestamp: message.timestamp || Date.now(),
        conversationId
      };

      conversations.set(key, {
        ...conv,
        messages: [...conv.messages, newMessage],
        lastActivity: Date.now()
      });
      AppStore.conversations.value = conversations;
    }
  },

  /**
   * Set streaming state for a specific conversation
   * @param {{type: string, id: string}} conversationId
   * @param {boolean} isStreaming
   */
  setConversationStreaming(conversationId, isStreaming) {
    const key = this._serializeConversationId(conversationId);
    const conversations = new Map(AppStore.conversations.value);
    const conv = conversations.get(key);

    if (conv) {
      conversations.set(key, { ...conv, isStreaming });
      AppStore.conversations.value = conversations;
    }
  },

  /**
   * Append streaming content to a specific conversation
   * @param {{type: string, id: string}} conversationId
   * @param {string} text
   */
  appendConversationStreamingContent(conversationId, text) {
    const key = this._serializeConversationId(conversationId);
    const conversations = new Map(AppStore.conversations.value);
    const conv = conversations.get(key);

    if (conv) {
      conversations.set(key, {
        ...conv,
        streamingContent: conv.streamingContent + text
      });
      AppStore.conversations.value = conversations;
    }
  },

  /**
   * Set streaming content for a specific conversation
   * @param {{type: string, id: string}} conversationId
   * @param {string} content
   */
  setConversationStreamingContent(conversationId, content) {
    const key = this._serializeConversationId(conversationId);
    const conversations = new Map(AppStore.conversations.value);
    const conv = conversations.get(key);

    if (conv) {
      conversations.set(key, { ...conv, streamingContent: content });
      AppStore.conversations.value = conversations;
    }
  },

  /**
   * Update a streaming tool in a specific conversation
   * @param {{type: string, id: string}} conversationId
   * @param {Object} tool
   */
  updateConversationStreamingTool(conversationId, tool) {
    const key = this._serializeConversationId(conversationId);
    const conversations = new Map(AppStore.conversations.value);
    const conv = conversations.get(key);

    if (conv) {
      const tools = [...conv.streamingTools];
      const existingIndex = tools.findIndex(t => t.id === tool.id);

      if (existingIndex >= 0) {
        tools[existingIndex] = { ...tools[existingIndex], ...tool };
      } else {
        tools.push(tool);
      }

      conversations.set(key, { ...conv, streamingTools: tools });
      AppStore.conversations.value = conversations;
    }
  },

  /**
   * Clear streaming state for a specific conversation
   * @param {{type: string, id: string}} conversationId
   */
  clearConversationStreamingState(conversationId) {
    const key = this._serializeConversationId(conversationId);
    const conversations = new Map(AppStore.conversations.value);
    const conv = conversations.get(key);

    if (conv) {
      conversations.set(key, {
        ...conv,
        isStreaming: false,
        streamingContent: '',
        streamingTools: []
      });
      AppStore.conversations.value = conversations;
    }

    // Clear active streaming if this was it
    const activeId = AppStore.activeStreamingId.value;
    if (activeId && activeId.type === conversationId.type && activeId.id === conversationId.id) {
      AppStore.activeStreamingId.value = null;
    }
  },

  /**
   * Set the active streaming conversation ID
   * @param {{type: string, id: string}|null} conversationId
   */
  setActiveStreamingId(conversationId) {
    AppStore.activeStreamingId.value = conversationId;
  },

  /**
   * Clear messages for a specific conversation
   * @param {{type: string, id: string}} conversationId
   */
  clearConversationMessages(conversationId) {
    const key = this._serializeConversationId(conversationId);
    const conversations = new Map(AppStore.conversations.value);
    const conv = conversations.get(key);

    if (conv) {
      conversations.set(key, { ...conv, messages: [] });
      AppStore.conversations.value = conversations;
    }
  },

  /**
   * Update context prefix for a conversation
   * @param {{type: string, id: string}} conversationId
   * @param {string} contextPrefix
   */
  setConversationContextPrefix(conversationId, contextPrefix) {
    const key = this._serializeConversationId(conversationId);
    const conversations = new Map(AppStore.conversations.value);
    const conv = conversations.get(key);

    if (conv) {
      conversations.set(key, { ...conv, contextPrefix });
      AppStore.conversations.value = conversations;
    }
  },

  /**
   * Set the terminal model preference
   * @param {string} model
   */
  setTerminalModel(model) {
    AppStore.terminalModel.value = model;
  },

  // ─────────────────────────────────────────────────────────────
  // Attachment Actions
  // ─────────────────────────────────────────────────────────────

  /**
   * Add one or more attachments to the pending list
   * @param {Array|Object} attachments - Single attachment or array
   */
  addAttachments(attachments) {
    const items = Array.isArray(attachments) ? attachments : [attachments];
    const current = AppStore.currentAttachments.value;
    // Dedupe by id
    const newItems = items.filter(item =>
      !current.some(existing => existing.id === item.id)
    );
    AppStore.currentAttachments.value = [...current, ...newItems];
  },

  /**
   * Remove an attachment by ID
   * @param {string} attachmentId
   */
  removeAttachment(attachmentId) {
    AppStore.currentAttachments.value = AppStore.currentAttachments.value.filter(
      att => att.id !== attachmentId
    );
  },

  /**
   * Clear all pending attachments
   */
  clearAttachments() {
    AppStore.currentAttachments.value = [];
  },

  /**
   * Get pending attachments as array
   * @returns {Array}
   */
  getAttachments() {
    return AppStore.currentAttachments.value;
  },

  // ─────────────────────────────────────────────────────────────
  // Passthrough Mode Actions
  // ─────────────────────────────────────────────────────────────

  /**
   * Set a pending command
   * @param {Object} command - { message, contextId, timestamp }
   */
  setPendingCommand(command) {
    AppStore.pendingCommand.value = command;
  },

  /**
   * Clear pending command for a context
   * @param {string} contextId - Context to clear
   */
  clearPendingCommand(contextId) {
    const current = AppStore.pendingCommand.value;
    if (current && current.contextId === contextId) {
      AppStore.pendingCommand.value = null;
    }
  },

  /**
   * Set passthrough active state
   * @param {boolean} active - Whether parent session is active
   */
  setPassthroughActive(active) {
    AppStore.passthroughActive.value = active;
  },

  /**
   * Check if a command is pending for a context
   * @param {string} contextId - Context to check
   * @returns {boolean}
   */
  isPendingForContext(contextId) {
    const current = AppStore.pendingCommand.value;
    return current && current.contextId === contextId;
  },

  // ─────────────────────────────────────────────────────────────
  // SSE Events Monitor Actions
  // ─────────────────────────────────────────────────────────────

  /**
   * Add an SSE event to the circular buffer
   * @param {Object} event - The SSE event data
   */
  addSSEEvent(event) {
    const newEvent = {
      ...event,
      id: event.id || crypto.randomUUID(),
      receivedAt: Date.now(),
    };

    const maxSize = AppStore.sseEventBufferSize.value;
    const events = AppStore.sseEvents.value;

    // Add to front, trim to buffer size
    const newEvents = [newEvent, ...events].slice(0, maxSize);

    batch(() => {
      AppStore.sseEvents.value = newEvents;
      AppStore.sseEventCount.value += 1;
      AppStore.sseLastEventTime.value = Date.now();

      // Increment unread count if paused
      if (AppStore.sseEventsPaused.value) {
        AppStore.sseUnreadCount.value += 1;
      }
    });
  },

  /**
   * Set the SSE events keyword filter
   * @param {string} filter - Keyword filter string
   */
  setSSEEventsFilter(filter) {
    AppStore.sseEventsFilter.value = filter;
  },

  /**
   * Set the SSE events category filter type
   * @param {string} filterType - Category filter (all/changeset/activity/etc)
   */
  setSSEEventsFilterType(filterType) {
    AppStore.sseEventsFilterType.value = filterType;
    this.saveEventPreferences();
  },

  /**
   * Set the SSE events paused state
   * @param {boolean} paused - Whether auto-scroll is paused
   */
  setSSEEventsPaused(paused) {
    batch(() => {
      AppStore.sseEventsPaused.value = paused;
      if (!paused) {
        AppStore.sseUnreadCount.value = 0;
      }
    });
  },

  /**
   * Clear all SSE events
   */
  clearSSEEvents() {
    batch(() => {
      AppStore.sseEvents.value = [];
      AppStore.sseEventCount.value = 0;
      AppStore.sseUnreadCount.value = 0;
      AppStore.sseEventsPerSecond.value = 0;
    });
  },

  /**
   * Update the events per second metric
   * @param {number} rate - Events per second
   */
  updateSSEEventsPerSecond(rate) {
    AppStore.sseEventsPerSecond.value = rate;
  },

  /**
   * Set the event buffer size
   * @param {number} size - Buffer size (100-2000)
   */
  setEventBufferSize(size) {
    const clampedSize = Math.max(100, Math.min(2000, size));
    AppStore.sseEventBufferSize.value = clampedSize;

    // Trim existing events if needed
    const events = AppStore.sseEvents.value;
    if (events.length > clampedSize) {
      AppStore.sseEvents.value = events.slice(0, clampedSize);
    }

    this.saveEventPreferences();
  },

  /**
   * Toggle visibility of an event type
   * @param {string} eventType - Event type to toggle
   */
  toggleEventTypeVisibility(eventType) {
    const hidden = [...AppStore.sseHiddenEventTypes.value];
    const index = hidden.indexOf(eventType);

    if (index >= 0) {
      hidden.splice(index, 1);
    } else {
      hidden.push(eventType);
    }

    AppStore.sseHiddenEventTypes.value = hidden;
    this.saveEventPreferences();
  },

  /**
   * Load event preferences from localStorage
   */
  loadEventPreferences() {
    try {
      const stored = localStorage.getItem('dashboard-events-preferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.bufferSize) AppStore.sseEventBufferSize.value = prefs.bufferSize;
        if (prefs.hiddenEventTypes) AppStore.sseHiddenEventTypes.value = prefs.hiddenEventTypes;
        if (prefs.filterType) AppStore.sseEventsFilterType.value = prefs.filterType;
        if (prefs.filter) AppStore.sseEventsFilter.value = prefs.filter;
      }
    } catch (e) {
      console.warn('[AppStore] Failed to load event preferences:', e);
    }
  },

  /**
   * Save event preferences to localStorage
   */
  saveEventPreferences() {
    try {
      const prefs = {
        bufferSize: AppStore.sseEventBufferSize.value,
        hiddenEventTypes: AppStore.sseHiddenEventTypes.value,
        filterType: AppStore.sseEventsFilterType.value,
        filter: AppStore.sseEventsFilter.value
      };
      localStorage.setItem('dashboard-events-preferences', JSON.stringify(prefs));
    } catch (e) {
      console.warn('[AppStore] Failed to save event preferences:', e);
    }
  },

  // ─────────────────────────────────────────────────────────────
  // Artifact Viewer Actions
  // ─────────────────────────────────────────────────────────────

  /**
   * Add an artifact to the store
   * @param {Object} artifact - { id, path, filename, extension, mimeType, content, size }
   */
  addArtifact(artifact) {
    const artifacts = new Map(AppStore.artifacts.value);
    artifacts.set(artifact.id, {
      ...artifact,
      loadedAt: Date.now()
    });
    AppStore.artifacts.value = artifacts;
  },

  /**
   * Open an artifact tab (adds to tabs if not present, sets active)
   * @param {string} id - Artifact ID
   */
  openArtifactTab(id) {
    const tabs = [...AppStore.artifactTabs.value];
    if (!tabs.includes(id)) {
      tabs.push(id);
      AppStore.artifactTabs.value = tabs;
    }
    AppStore.activeArtifactId.value = id;
  },

  /**
   * Close an artifact tab
   * @param {string} id - Artifact ID to close
   */
  closeArtifactTab(id) {
    const tabs = AppStore.artifactTabs.value.filter(t => t !== id);
    batch(() => {
      AppStore.artifactTabs.value = tabs;

      // Update active tab if closing the active one
      if (AppStore.activeArtifactId.value === id) {
        AppStore.activeArtifactId.value = tabs[tabs.length - 1] || null;
      }

      // Optionally remove from artifacts map to free memory
      // Commented out to allow re-opening without refetch
      // const artifacts = new Map(AppStore.artifacts.value);
      // artifacts.delete(id);
      // AppStore.artifacts.value = artifacts;
    });
  },

  /**
   * Set the active artifact tab
   * @param {string} id - Artifact ID to activate
   */
  setActiveArtifact(id) {
    if (AppStore.artifactTabs.value.includes(id)) {
      AppStore.activeArtifactId.value = id;
    }
  },

  /**
   * Set the load state for an artifact
   * @param {string} id - Artifact ID
   * @param {string} state - 'loading' | 'loaded' | 'error'
   */
  setArtifactLoadState(id, state) {
    const loadStates = new Map(AppStore.artifactLoadStates.value);
    loadStates.set(id, state);
    AppStore.artifactLoadStates.value = loadStates;
  },

  /**
   * Get artifact by ID
   * @param {string} id - Artifact ID
   * @returns {Object|null}
   */
  getArtifact(id) {
    return AppStore.artifacts.value.get(id) || null;
  },

  /**
   * Clear all artifacts and close all tabs
   */
  clearAllArtifacts() {
    batch(() => {
      AppStore.artifacts.value = new Map();
      AppStore.artifactTabs.value = [];
      AppStore.activeArtifactId.value = null;
      AppStore.artifactLoadStates.value = new Map();
    });
  },

  /**
   * Load an artifact by path (convenience method)
   * Creates ID, sets loading state, and opens tab
   * @param {string} path - File path
   * @param {string} changesetId - Optional changeset context
   * @returns {string} - The generated artifact ID
   */
  prepareArtifactLoad(path, changesetId = null) {
    const id = changesetId ? `${changesetId}:${path}` : path;
    const filename = path.split('/').pop();
    const extension = filename.includes('.') ? `.${filename.split('.').pop()}` : '';

    batch(() => {
      // Add placeholder artifact
      this.addArtifact({
        id,
        path,
        filename,
        extension,
        changesetId,
        content: null
      });

      // Set loading state
      this.setArtifactLoadState(id, 'loading');

      // Open tab
      this.openArtifactTab(id);
    });

    return id;
  },

  /**
   * Complete artifact load with content
   * @param {string} id - Artifact ID
   * @param {Object} data - { content, mimeType, size }
   */
  completeArtifactLoad(id, data) {
    const artifact = AppStore.artifacts.value.get(id);
    if (artifact) {
      batch(() => {
        this.addArtifact({
          ...artifact,
          ...data
        });
        this.setArtifactLoadState(id, 'loaded');
      });
    }
  },

  /**
   * Mark artifact load as failed
   * @param {string} id - Artifact ID
   * @param {string} error - Error message
   */
  failArtifactLoad(id, error) {
    const artifact = AppStore.artifacts.value.get(id);
    if (artifact) {
      batch(() => {
        this.addArtifact({
          ...artifact,
          error
        });
        this.setArtifactLoadState(id, 'error');
      });
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
