# Archived Legacy Files

This folder contains archived vanilla JavaScript files that have been replaced by Lit Web Components.

## Migration Status

The following files have Lit component replacements and can be archived once testing is complete:

### Ready to Archive (Phase 3 Complete)
| Legacy File | Replacement | Status |
|-------------|-------------|--------|
| `tasks.js` | `services/task-service.js` + `components/organisms/task-panel.js` | ✅ Ready |
| `graph.js` | `components/organisms/domain-graph.js` | ✅ Ready |
| `error-stream.js` | `services/error-service.js` + `components/organisms/error-panel.js` | ✅ Ready |
| `token-meter.js` | `components/organisms/token-meter.js` | ✅ Ready |
| `timeline.js` | `components/organisms/timeline-view.js` | ✅ Ready |

### Partially Migrated (Still in Use)
| Legacy File | Notes |
|-------------|-------|
| `dashboard.js` | Core orchestration - services extracted, awaiting full component replacement |
| `terminal.js` | Terminal functionality - components exist, integration ongoing |
| `terminal-conversation.js` | Conversation display - components exist, integration ongoing |
| `agents.js` | Agent data - service exists, tree component active |
| `skills.js` | Skill data - service exists, tree component active |
| `changesets.js` | Changeset data - service exists, tree component active |
| `conversation-storage.js` | Storage utilities - partially migrated to storage-service.js |

### Utilities
| Legacy File | Notes |
|-------------|-------|
| `tool-icons.js` | Icon definitions - integrated into atoms/icon.js IconRegistry |

## Archive Instructions

Once testing confirms all functionality works with Lit components:

1. Move legacy file to this folder:
   ```bash
   mv ../tasks.js ./tasks.js
   ```

2. Update index.html to remove the script tag

3. Verify dashboard still functions correctly

## Migration Timeline

- **Phase 1 (Complete)**: Atoms, molecules, services extracted
- **Phase 2 (Complete)**: Organisms created, layout components verified
- **Phase 3 (Complete)**: Integration - services wired, new components created
- **Phase 4 (In Progress)**: Cleanup - archive legacy files, update index.html
