# IDE Dashboard Refactor - Implementation Plan

## Executive Summary

Transform the Claude Marketplace Dashboard from a tab-based navigation interface into a VS Code/IntelliJ-inspired IDE layout while preserving all existing functionality.

**Font**: IBM Plex Sans (primary) + IBM Plex Mono (code/timestamps)

---

## Expert Team Analysis

### The IDE UX Architect (IDA)

> "The current dashboard uses a horizontal tab navigation pattern that forces full context switches. An IDE layout maintains persistent visibility of key elements while allowing deep focus."

**Key Insights**:
1. **Activity Bar** provides one-click access to main sections without losing editor context
2. **Collapsible sidebar** lets users maximize editor space when needed
3. **Tab system** enables multiple changesets open simultaneously
4. **Bottom panel** consolidates activity feed + tasks into familiar output panel pattern

**Recommended Pattern**: VS Code's 3-region layout (sidebar | editor | panel)

---

### The Visual Systems Designer (VSD)

> "IBM Plex Sans brings the technical precision needed for a developer tool while maintaining excellent readability at small sizes."

**Typography Decisions**:
- **IBM Plex Sans**: All UI text, headers, navigation
- **IBM Plex Mono**: Timestamps, code snippets, tool outputs
- **Weight ladder**: 400 (body), 500 (labels), 600 (headers)

**Visual Density Strategy**:
- Reduce padding compared to current cards (16px → 12px)
- Tighter line-height in tree views (1.5 → 1.4)
- Smaller badges (12px → 10px)
- Condensed status bar (28px → 24px)

---

### The Interaction Engineer (INE)

> "The key is making panel manipulation feel instant and predictable. Users should never wonder what will happen when they click."

**Interaction Patterns**:
1. **Resize handles**: 4px drag zones between panels
2. **Collapse toggles**: Double-click header to collapse/expand
3. **Tab drag**: Reorder and split-view support
4. **Keyboard-first**: Full keyboard navigation (Cmd+B, Cmd+J, etc.)

---

### The Integration Lead (INT)

> "This refactor preserves all functionality while reorganizing information architecture. The feature mapping is 1:1 with clearer hierarchy."

**Feature Mapping Summary**:

| Current Feature | IDE Location | Migration Complexity |
|-----------------|--------------|---------------------|
| Agents View | Sidebar Tree (Agents section) | Medium |
| Skills View | Sidebar Tree (Skills section) | Medium |
| Changesets View | Sidebar Tree + Editor Tabs | High |
| Conversation | Editor Area | Low (mostly styling) |
| Graph | Editor Tab | Low |
| Activity Feed | Bottom Panel (Activity tab) | Medium |
| Task List | Bottom Panel (Tasks tab) | Low |
| Search | Command Palette | Medium |
| Modals | Editor Tabs / Secondary Sidebar | Medium |

---

## Implementation Phases

### Phase 1: Foundation (CSS Layout Restructure)
**Duration**: 1-2 sessions
**Risk**: Medium

**Tasks**:
1. Create new CSS grid/flex layout structure
2. Implement Activity Bar (48px left rail)
3. Implement Primary Sidebar container (resizable)
4. Implement Editor Area container
5. Implement Bottom Panel container
6. Implement Status Bar (24px)
7. Add IBM Plex Sans font loading

**Files Modified**:
- `plugins/dashboard/server/static/dashboard.css` (major restructure)
- `plugins/dashboard/server/templates/index.html` (layout structure)

**CSS Architecture**:
```css
.app {
  display: grid;
  grid-template-rows: 32px 1fr 24px;
  grid-template-columns: 48px auto 1fr;
  grid-template-areas:
    "titlebar titlebar titlebar"
    "activitybar sidebar editor"
    "statusbar statusbar statusbar";
}

.bottom-panel {
  /* Positioned absolutely or via resize */
}
```

---

### Phase 2: Activity Bar + Sidebar
**Duration**: 1 session
**Risk**: Low

**Tasks**:
1. Create Activity Bar component with icons
2. Implement icon-to-panel toggle behavior
3. Create sidebar section headers (Explorer, Changesets)
4. Implement tree view container
5. Add collapse/expand animations
6. Wire Activity Bar icons to sidebar sections

**Files Modified**:
- `plugins/dashboard/server/static/dashboard.js` (new component)
- `plugins/dashboard/server/static/dashboard.css`

**New JavaScript Module**:
```javascript
// activitybar.js
class ActivityBar {
  constructor() {
    this.activePanel = 'explorer';
    this.panels = ['explorer', 'changesets', 'search', 'graph'];
  }

  toggle(panel) {
    if (this.activePanel === panel) {
      this.collapseSidebar();
    } else {
      this.showPanel(panel);
    }
  }
}
```

---

### Phase 3: Tree View Components
**Duration**: 1-2 sessions
**Risk**: Medium

**Tasks**:
1. Create collapsible tree node component
2. Migrate Agents data to tree structure
3. Migrate Skills data to tree structure
4. Migrate Changesets data to tree structure
5. Implement tree node selection state
6. Implement tree node activity indicators
7. Add inline search/filter
8. Implement keyboard navigation (arrow keys)

**Files Modified**:
- `plugins/dashboard/server/static/agents.js` → refactor to tree
- `plugins/dashboard/server/static/skills.js` → refactor to tree
- `plugins/dashboard/server/static/changesets.js` → refactor to tree
- New: `plugins/dashboard/server/static/treeview.js`

**Tree Node Data Structure**:
```javascript
{
  id: 'domain-architecture',
  label: 'architecture',
  icon: '🟣',
  count: 5,
  expanded: false,
  children: [
    { id: 'agent-sofia-lead', label: 'sofia-lead', type: 'agent' },
    { id: 'agent-marcus-systems', label: 'marcus-systems', type: 'agent' },
    // ...
  ]
}
```

---

### Phase 4: Editor Tabs System
**Duration**: 1-2 sessions
**Risk**: High

**Tasks**:
1. Create tab bar component with tab rendering
2. Implement tab state management (open, close, reorder)
3. Migrate changeset selection to open-as-tab behavior
4. Add Graph as permanent/openable tab
5. Implement tab close button + middle-click
6. Add "modified" indicator for active streams
7. Implement breadcrumb bar below tabs
8. Add split-view capability (drag to edge)

**Files Modified**:
- New: `plugins/dashboard/server/static/tabs.js`
- `plugins/dashboard/server/static/changesets.js`
- `plugins/dashboard/server/static/graph.js`
- `plugins/dashboard/server/static/dashboard.css`

**Tab State Management**:
```javascript
// tabs.js
class TabManager {
  constructor() {
    this.tabs = [];
    this.activeTab = null;
  }

  openTab(type, id, data) {
    const existing = this.tabs.find(t => t.id === id);
    if (existing) {
      this.activateTab(existing);
    } else {
      this.tabs.push({ type, id, data, modified: false });
      this.activateTab(this.tabs[this.tabs.length - 1]);
    }
  }

  closeTab(id) {
    this.tabs = this.tabs.filter(t => t.id !== id);
    // Activate previous or next tab
  }
}
```

---

### Phase 5: Conversation Styling
**Duration**: 1 session
**Risk**: Low

**Tasks**:
1. Add left gutter with domain color + timestamp
2. Update message bubble styling for IDE aesthetic
3. Enhance tool call cards (collapsible)
4. Improve handoff divider design
5. Add optional minimap (scrollbar preview)
6. Update typography to IBM Plex Sans

**Files Modified**:
- `plugins/dashboard/server/static/conversation.js`
- `plugins/dashboard/server/static/dashboard.css`

---

### Phase 6: Bottom Panel
**Duration**: 1 session
**Risk**: Low

**Tasks**:
1. Create bottom panel container with tabs
2. Migrate Activity Feed to Activity tab
3. Migrate Task List to Tasks tab
4. Add Timeline tab (placeholder visualization)
5. Add Console tab (debug output)
6. Implement panel resize (drag handle)
7. Implement panel maximize/close

**Files Modified**:
- `plugins/dashboard/server/static/tasks.js` (relocate)
- New: `plugins/dashboard/server/static/bottompanel.js`
- `plugins/dashboard/server/static/dashboard.css`

---

### Phase 7: Status Bar
**Duration**: 0.5 sessions
**Risk**: Low

**Tasks**:
1. Create status bar component
2. Add connection status segment (SSE)
3. Add PM status segment
4. Add domain count segment
5. Add task progress segment
6. Add theme toggle segment
7. Add version segment
8. Wire segments to actions (click handlers)

**Files Modified**:
- New: `plugins/dashboard/server/static/statusbar.js`
- `plugins/dashboard/server/static/dashboard.js`
- `plugins/dashboard/server/static/dashboard.css`

---

### Phase 8: Command Palette
**Duration**: 1 session
**Risk**: Medium

**Tasks**:
1. Create command palette overlay component
2. Implement fuzzy search across all entities
3. Add recent items section
4. Add quick actions section
5. Wire Cmd+K keyboard shortcut
6. Implement keyboard navigation (arrow + enter)
7. Add ">" prefix for command mode

**Files Modified**:
- New: `plugins/dashboard/server/static/commandpalette.js`
- `plugins/dashboard/server/static/dashboard.js`
- `plugins/dashboard/server/static/dashboard.css`

**Search Architecture**:
```javascript
// commandpalette.js
class CommandPalette {
  constructor() {
    this.isOpen = false;
    this.query = '';
    this.results = [];
    this.selectedIndex = 0;
  }

  search(query) {
    const agents = this.searchAgents(query);
    const skills = this.searchSkills(query);
    const changesets = this.searchChangesets(query);
    const commands = this.searchCommands(query);

    this.results = [...commands, ...agents, ...skills, ...changesets]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  execute(result) {
    switch (result.type) {
      case 'agent': this.openAgentTab(result.id); break;
      case 'skill': this.openSkillTab(result.id); break;
      case 'changeset': this.openChangesetTab(result.id); break;
      case 'command': result.action(); break;
    }
  }
}
```

---

### Phase 9: Keyboard Shortcuts
**Duration**: 0.5 sessions
**Risk**: Low

**Tasks**:
1. Create keyboard shortcut registry
2. Implement Cmd+B (toggle sidebar)
3. Implement Cmd+J (toggle bottom panel)
4. Implement Cmd+K (command palette)
5. Implement Cmd+W (close tab)
6. Implement Cmd+\ (split editor)
7. Implement Cmd+Shift+E/G/F/D (focus panels)
8. Add vim-style J/K for message navigation

**Files Modified**:
- New: `plugins/dashboard/server/static/keybindings.js`
- `plugins/dashboard/server/static/dashboard.js`

---

### Phase 10: Polish & Animations
**Duration**: 1 session
**Risk**: Low

**Tasks**:
1. Add panel open/close transitions
2. Add tab switch transitions
3. Add tree expand/collapse animations
4. Add status bar segment transitions
5. Add command palette fade in/out
6. Optimize SSE handling for new layout
7. Test responsive breakpoints
8. Update theme colors for IDE aesthetic

**Files Modified**:
- `plugins/dashboard/server/static/dashboard.css`
- Various JS files for animation triggers

---

## File Structure After Refactor

```
plugins/dashboard/server/static/
├── dashboard.js          (main app, theme, keyboard)
├── dashboard.css         (complete restructure)
├── activitybar.js        (NEW)
├── sidebar.js            (NEW - container)
├── treeview.js           (NEW - tree component)
├── tabs.js               (NEW - tab management)
├── bottompanel.js        (NEW - panel container)
├── statusbar.js          (NEW)
├── commandpalette.js     (NEW)
├── keybindings.js        (NEW)
├── agents.js             (refactored for tree)
├── skills.js             (refactored for tree)
├── changesets.js         (refactored for tabs)
├── conversation.js       (styling updates)
├── graph.js              (tab integration)
├── tasks.js              (moved to bottom panel)
└── timeline.js           (unchanged)
```

---

## Risk Mitigation

### High Risk: Tab System
**Risk**: Complex state management, potential memory leaks with multiple open tabs
**Mitigation**:
- Implement tab limit (max 10)
- Add "Close All" action
- Lazy-load tab content
- Unit test tab lifecycle

### Medium Risk: Tree View
**Risk**: Performance with large datasets (58 agents, 77 skills)
**Mitigation**:
- Virtual scrolling for large lists
- Debounce search input
- Memoize tree node rendering

### Medium Risk: Layout Resize
**Risk**: CSS complexity, cross-browser issues
**Mitigation**:
- Use CSS Grid for main layout
- Implement resize with JavaScript (not CSS resize)
- Store panel sizes in localStorage
- Test on Chrome, Firefox, Safari

---

## Success Criteria

1. ✅ All current features remain accessible
2. ✅ IDE layout with Activity Bar, Sidebar, Editor, Bottom Panel, Status Bar
3. ✅ IBM Plex Sans typography throughout
4. ✅ Multiple changesets openable as tabs
5. ✅ Command palette with fuzzy search (Cmd+K)
6. ✅ Collapsible tree views for Agents/Skills/Changesets
7. ✅ Bottom panel with Activity + Tasks tabs
8. ✅ Keyboard navigation (Cmd+B, Cmd+J, etc.)
9. ✅ Light/dark theme support
10. ✅ Responsive mobile layout

---

## Estimated Total Effort

| Phase | Sessions | Priority |
|-------|----------|----------|
| Phase 1: Foundation | 1-2 | P0 |
| Phase 2: Activity Bar | 1 | P0 |
| Phase 3: Tree Views | 1-2 | P0 |
| Phase 4: Tab System | 1-2 | P0 |
| Phase 5: Conversation | 1 | P1 |
| Phase 6: Bottom Panel | 1 | P0 |
| Phase 7: Status Bar | 0.5 | P1 |
| Phase 8: Command Palette | 1 | P1 |
| Phase 9: Keyboard | 0.5 | P2 |
| Phase 10: Polish | 1 | P2 |
| **Total** | **9-12** | |

---

## Approval Checklist

Before implementation, confirm:

- [ ] IBM Plex Sans as global font family (confirmed by user)
- [ ] VS Code-style layout preferred over IntelliJ
- [ ] Activity Bar on left (not right)
- [ ] Bottom panel default visible or collapsed?
- [ ] Tab limit preference?
- [ ] Keyboard shortcuts acceptable?
- [ ] Mobile layout priority?
