# Vanilla JS to Lit Components Migration Reference

This document tracks the migration from vanilla JS to Lit Web Components.

## Migration Status Legend
- ✅ Migrated - Functionality exists in Lit components
- 🔄 Partial - Some functionality migrated, some remains
- ⏳ Pending - Not yet migrated
- 📦 Archive - Can be archived after migration complete

## Legacy Files to Migrate

### Core Dashboard (70KB)
| File | Size | Status | Replaced By |
|------|------|--------|-------------|
| `dashboard.js` | 70KB | ✅ | Multiple services + components |
| - Theme logic | - | ✅ | `services/theme-service.js` |
| - Tab management | - | ✅ | `services/tab-service.js` |
| - Panel management | - | ✅ | `services/panel-service.js` |
| - Modal management | - | ✅ | `services/modal-service.js` |
| - Keyboard shortcuts | - | ✅ | `services/keyboard-service.js` |
| - SSE connection | - | ✅ | `services/sse-service.js` |
| - API calls | - | ✅ | `services/api-service.js` |
| - Command palette | - | ✅ | `components/organisms/command-palette.js` |
| - Activity bar | - | ✅ | `components/organisms/activity-bar.js` |
| - Profile menu | - | ✅ | `components/organisms/profile-menu.js` |
| - Process manager | - | ✅ | `components/organisms/process-manager.js` |

### Terminal (102KB combined)
| File | Size | Status | Replaced By |
|------|------|--------|-------------|
| `terminal.js` | 55KB | 🔄 | `components/terminal/*.js` |
| `terminal-conversation.js` | 47KB | 🔄 | `components/conversation/*.js` |

### Data Modules
| File | Size | Status | Replaced By |
|------|------|--------|-------------|
| `agents.js` | 15KB | 🔄 | `services/agent-service.js` + `components/explorer/agent-tree.js` |
| `skills.js` | 22KB | 🔄 | `services/skill-service.js` + `components/explorer/skill-tree.js` |
| `changesets.js` | 34KB | 🔄 | `services/changeset-service.js` + `components/explorer/changeset-tree.js` |
| `tasks.js` | 18KB | ✅ | `services/task-service.js` + `components/organisms/task-panel.js` |
| `graph.js` | 16KB | ✅ | `components/organisms/domain-graph.js` |

### Observability
| File | Size | Status | Replaced By |
|------|------|--------|-------------|
| `error-stream.js` | 10KB | ✅ | `services/error-service.js` + `components/organisms/error-panel.js` |
| `token-meter.js` | 14KB | ✅ | `components/organisms/token-meter.js` |
| `timeline.js` | 5KB | ✅ | `components/organisms/timeline-view.js` |

### Utilities
| File | Size | Status | Replaced By |
|------|------|--------|-------------|
| `conversation-storage.js` | 11KB | ⏳ | `services/storage-service.js` (partial) |
| `tool-icons.js` | 8KB | ✅ | `components/atoms/icon.js` (IconRegistry) |

## New Architecture

### Component Hierarchy (Atomic Design)
```
components/
├── atoms/          # 9 components ✅
│   ├── icon.js
│   ├── button.js
│   ├── input.js
│   ├── select.js
│   ├── toggle.js
│   ├── spinner.js
│   ├── dot.js
│   ├── kbd.js
│   └── progress-bar.js
│
├── molecules/      # 9 components ✅
│   ├── search-input.js
│   ├── tab-button.js
│   ├── dropdown-menu.js
│   ├── tree-node.js
│   ├── modal-header.js
│   ├── keyboard-shortcut.js
│   ├── stat-card.js
│   └── (re-exports indicators/)
│
├── organisms/      # 11 components ✅
│   ├── command-palette.js
│   ├── profile-menu.js
│   ├── welcome-panel.js
│   ├── activity-panel.js
│   ├── token-meter.js
│   ├── task-panel.js
│   ├── error-panel.js
│   ├── timeline-view.js
│   ├── domain-graph.js
│   ├── activity-bar.js
│   └── process-manager.js
│
├── indicators/     # 2 components ✅
│   ├── connection-status.js
│   └── thinking-indicator.js
│
├── conversation/   # 2 components ✅
├── terminal/       # 4 components ✅
├── explorer/       # 6 components ✅
├── tool-cards/     # 10 components ✅
└── layout/         # 6 components ✅
```

### Services Layer
```
services/
├── api-service.js       ✅  HTTP requests
├── sse-service.js       ✅  Server-sent events
├── storage-service.js   ✅  LocalStorage wrapper
├── theme-service.js     ✅  Theme management
├── tab-service.js       ✅  Tab state
├── modal-service.js     ✅  Modal state
├── keyboard-service.js  ✅  Keyboard shortcuts
├── panel-service.js     ✅  Panel resize/collapse
├── agent-service.js     ✅  Agent data
├── skill-service.js     ✅  Skill data
├── changeset-service.js ✅  Changeset data
├── sdk-client.js        ✅  Claude SDK integration
├── task-service.js      ✅  Task state management
└── error-service.js     ✅  Error tracking
```

## Migration Strategy

### Phase 1: Foundation ✅
- [x] Create atoms (9 components)
- [x] Create molecules (9 components)
- [x] Extract services (12 services)

### Phase 2: Organisms ✅
- [x] Create organisms (4 components)
- [x] Verify existing layout components

### Phase 3: Integration ✅
- [x] Wire services to existing vanilla JS
- [x] Create remaining organism components (7 new)
- [x] Update app.js to use services
- [x] Connect SSE events to services

### Phase 4: Cleanup (In Progress)
- [x] Create _archive folder
- [ ] Move vanilla JS files to archive
- [ ] Update index.html to use Lit components exclusively
- [ ] Final testing

## Archive Plan

Once migration is complete, move these files to `js/_archive/`:
```
agents.js
changesets.js
conversation-storage.js
dashboard.js
error-stream.js
graph.js
skills.js
tasks.js
terminal-conversation.js
terminal.js
timeline.js
token-meter.js
tool-icons.js
```

Total to archive: ~325KB of vanilla JS
