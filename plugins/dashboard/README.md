# Dashboard Plugin

Real-time web dashboard for visualizing Claude Marketplace agents, skills, changesets, and cross-domain orchestration.

## Features

- **Agent Explorer**: Grid/list of all 58+ agents across 10 domains with search/filter
- **Skill Browser**: All 72+ skills organized by domain with handoff relationships
- **Changeset Viewer**: Real-time conversation display with live event streaming
- **Domain Graph**: D3.js visualization of domain collaboration relationships
- **Handoff Timeline**: Visual swimlane timeline of cross-domain handoffs
- **SDK Terminal**: Interactive Claude terminal with streaming responses
- **Dark/Light Theme**: Automatic theme persistence

## SDK Terminal Features

The dashboard includes an interactive SDK terminal powered by the Claude Agent SDK:

### Configuration Options
- **Model Selection**: Switch between `sonnet`, `opus`, and `haiku`
- **Extended Thinking**: View Claude's reasoning process in collapsible blocks
- **Cost Tracking**: Real-time query and session cost display
- **Max Turns/Budget**: Configurable safety limits

### Advanced Features
- **Session Management**: Create, continue, fork, and close conversation sessions
- **File Checkpointing**: Undo file changes with checkpoint rewind
- **Security Hooks**: Automatic blocking of dangerous commands
- **Retry Logic**: Automatic retry with exponential backoff for transient errors
- **MCP Tools**: Marketplace-specific tools for searching plugins/agents

### View Modes
- **Conversation View**: Rich card-based display with tool previews
- **Terminal View**: Classic terminal-style output

## Quick Start

### Using the Skill

```
/dashboard
```

### Manual Launch

```bash
cd plugins/dashboard
python -m server.app --open-browser
```

The dashboard will be available at `http://localhost:24282`

## Architecture

### Backend (Flask)

```
plugins/dashboard/server/
├── app.py               # Flask application entry
├── auth.py              # Token-based authentication
├── sse.py               # Server-Sent Events manager
├── models.py            # Data models
├── parsers/             # File parsers
│   ├── agent_parser.py
│   ├── skill_parser.py
│   └── capability_parser.py
├── services/            # Core services
│   ├── agent_registry.py
│   ├── skill_registry.py
│   ├── changeset_tracker.py
│   ├── event_store.py
│   ├── file_watcher.py
│   ├── marketplace_sdk_bridge.py  # SDK integration
│   ├── marketplace_mcp.py         # MCP tools
│   └── sdk_hooks.py               # Security hooks
└── routes/              # API endpoints
    ├── agents.py
    ├── skills.py
    ├── changesets.py
    ├── events.py
    ├── stream.py
    ├── input.py         # SDK terminal endpoints
    └── capabilities.py
```

### Frontend (Lit + Preact Signals)

The frontend uses **Atomic Design** with **Lit Web Components** and **Preact Signals** for state management.

#### Technology Stack

| Technology | Purpose |
|------------|---------|
| **Lit 3.x** | Web Components framework |
| **Preact Signals** | Reactive state management |
| **Lucide** | Icon library |
| **D3.js** | Graph visualizations |
| **Marked** | Markdown parsing |

All dependencies load via CDN (zero-build).

#### Component Hierarchy

```
web/js/components/
├── atoms/              # 22 basic building blocks
│   ├── button.js       # dash-button
│   ├── icon.js         # dash-icon (Lucide-powered)
│   ├── input.js        # dash-input
│   ├── spinner.js      # dash-spinner
│   ├── avatar.js       # dash-avatar
│   ├── tag.js          # dash-tag
│   ├── toggle.js       # dash-toggle
│   ├── slider.js       # dash-slider
│   ├── progress-bar.js # dash-progress
│   ├── tab.js          # dash-tab, dash-tab-panel, dash-tab-group
│   └── ...             # 22 total
│
├── molecules/          # 20 atom combinations
│   ├── search-input.js     # Search with icon
│   ├── dropdown-menu.js    # Menu with items
│   ├── modal-header.js     # Modal title bar
│   ├── stat-card.js        # Stat display
│   ├── activity-list.js    # Activity timeline
│   ├── tag-list.js         # Tag collection
│   ├── keyboard-shortcut.js
│   └── ...                 # 20 total
│
├── organisms/          # 14 complex sections
│   ├── command-palette.js      # Cmd+K palette
│   ├── agent-detail-modal.js   # Agent modal view
│   ├── skill-detail-modal.js   # Skill modal view
│   ├── domain-graph.js         # D3 visualization
│   ├── token-meter.js          # Cost tracking
│   ├── process-manager.js      # Task panel
│   └── ...                     # 14 total
│
├── layout/             # 7 page structures
│   ├── dashboard-shell.js  # Root container
│   ├── titlebar.js         # Top navigation
│   ├── sidebar-panel.js    # Left sidebar
│   ├── editor-area.js      # Main content
│   ├── tab-bar.js          # Tab navigation
│   ├── status-bar.js       # Bottom bar
│   └── index.js
│
├── explorer/           # 7 tree components
│   ├── tree-item-base.js   # Base styles
│   ├── agent-tree.js       # Agent explorer
│   ├── agent-item.js       # Agent row
│   ├── skill-tree.js       # Skill explorer
│   ├── skill-item.js       # Skill row
│   ├── changeset-tree.js   # Changeset list
│   └── changeset-item.js   # Changeset row
│
├── terminal/           # 6 SDK terminal
│   ├── terminal-view.js    # Main container
│   ├── terminal-input.js   # User input
│   ├── model-selector.js   # Model picker
│   ├── session-controls.js # Session mgmt
│   └── settings-panel.js   # Config panel
│
├── tool-cards/         # 11 tool renderers
│   ├── tool-card-base.js   # Base class (400+ lines CSS)
│   ├── bash-tool-card.js   # Bash execution
│   ├── read-tool-card.js   # File reading
│   ├── edit-tool-card.js   # File editing
│   ├── write-tool-card.js  # File writing
│   ├── glob-tool-card.js   # File globbing
│   ├── grep-tool-card.js   # Text search
│   ├── task-tool-card.js   # Task mgmt
│   ├── web-tool-card.js    # Web fetch
│   └── question-tool-card.js
│
├── conversation/       # 3 transcript viewers
│   ├── conversation-stream.js
│   ├── message-bubble.js
│   └── changeset-viewer.js
│
├── indicators/         # 2 status displays
│   ├── connection-status.js
│   └── thinking-indicator.js
│
└── core/               # 3 base classes
    ├── signal-watcher.js   # Store subscription mixin
    ├── icon-button.js
    └── badge.js
```

#### State Management

State is centralized in `store/app-state.js` using Preact Signals:

```javascript
// Store structure
AppStore = {
    // UI State
    theme: signal('dark'),
    sidebarVisible: signal(true),
    activeTabId: signal('welcome'),

    // Data State
    agents: signal([]),
    skills: signal([]),
    changesets: signal([]),

    // Selection State
    selectedAgent: signal(null),
    selectedSkill: signal(null),

    // Terminal State
    terminalMessages: signal([]),
    isStreaming: signal(false),
    tokenUsage: signal({ input: 0, output: 0 }),

    // Connection State
    connectionState: signal('connecting')
};

// Computed values (auto-update)
const filteredAgents = computed(() => /* filter logic */);
const agentsByDomain = computed(() => /* grouping logic */);

// Actions (state mutations)
Actions.setSelectedAgent(agent);
Actions.toggleSidebar();
Actions.addTerminalMessage(msg);
```

#### Service Layer

```
web/js/services/
├── api-service.js        # HTTP client
├── sse-service.js        # Real-time events
├── sdk-client.js         # Claude SDK bridge
├── agent-service.js      # Agent data + caching
├── skill-service.js      # Skill data + caching
├── changeset-service.js  # Changeset data
├── theme-service.js      # Light/dark theme
├── modal-service.js      # Modal state
├── tab-service.js        # Tab management
├── keyboard-service.js   # Shortcuts
└── formatters.js         # Date/time utils
```

#### Key Patterns

**1. SignalWatcher Mixin** - Components auto-update when signals change:
```javascript
class MyComponent extends SignalWatcher(LitElement) {
    render() {
        return html`Agents: ${AppStore.agents.value.length}`;
    }
}
```

**2. Domain Colors** - Consistent coloring across all domains:
```javascript
const domainClass = `domain-${agent.domain}`;
return html`<span class="${domainClass}">${agent.name}</span>`;
```

**3. Self-Registering Components**:
```javascript
customElements.define('dash-button', DashButton);
export { DashButton };
```

### File Structure

```
plugins/dashboard/
├── .claude-plugin/
│   ├── plugin.json           # Plugin manifest
│   └── capabilities.json     # Capability declarations
├── server/                   # Backend (Flask)
├── web/
│   ├── index.html            # SPA entry (import map)
│   ├── css/
│   │   ├── dashboard.css     # 4800+ lines, theme support
│   │   └── tool-cards.css    # Tool card styles
│   └── js/
│       ├── app.js            # Bootstrap & initialization
│       ├── store/
│       │   └── app-state.js  # Preact Signals store
│       ├── services/         # Service layer (14 services)
│       └── components/       # Lit components (95+ total)
├── tests/
│   ├── test_sdk_bridge.py
│   ├── test_terminal_e2e.py
│   └── test_input_routes.py
└── skills/
    └── dashboard/
        └── SKILL.md          # /dashboard skill
```

## API Reference

### SDK Terminal

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/input/sdk/query` | POST | Stream query via SDK |
| `/api/input/sdk/config` | GET | Get SDK configuration |
| `/api/input/sdk/agents` | GET | List marketplace agents |
| `/api/input/sdk/plugins` | GET | List loaded plugins |
| `/api/input/sdk/interrupt` | POST | Interrupt current query |
| `/api/input/sdk/session` | GET | Get current session ID |
| `/api/input/sdk/sessions` | GET/POST | List/create sessions |
| `/api/input/sdk/sessions/<id>` | DELETE | Close a session |
| `/api/input/sdk/sessions/<id>/continue` | POST | Continue session (streaming) |
| `/api/input/sdk/sessions/<id>/fork` | POST | Fork a session |
| `/api/input/sdk/rewind` | POST | Rewind files to checkpoint |
| `/api/input/sdk/hooks/stats` | GET | Get hook statistics |
| `/api/input/sdk/hooks/logs` | GET | Get hook logs |

### Query Request

```json
{
  "prompt": "Your message to Claude",
  "model": "sonnet",           // Optional: 'sonnet', 'opus', 'haiku'
  "max_turns": 50,             // Optional: safety limit for turns
  "max_budget_usd": 5.0,       // Optional: budget limit
  "enable_thinking": true,     // Optional: enable extended thinking
  "output_format": {},         // Optional: JSON schema for structured output
  "enable_checkpointing": true // Optional: enable file checkpointing
}
```

### Session Response

```json
{
  "session_id": "abc123",
  "success": true
}
```

### Agents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | Get all agents |
| `/api/agents/<domain>` | GET | Get agents by domain |
| `/api/agents/id/<id>` | GET | Get agent by ID |
| `/api/agents/id/<id>/activity` | GET | Get agent activity |
| `/api/agents/recent` | GET | Get recently active agents |
| `/api/domains` | GET | Get all domains |
| `/api/domains/<domain>` | GET | Get domain info |

### Skills

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/skills` | GET | Get all skills |
| `/api/skills/<domain>` | GET | Get skills by domain |
| `/api/skills/id/<id>` | GET | Get skill by ID |
| `/api/skills/id/<id>/invocations` | GET | Get skill invocations |
| `/api/skills/recent` | GET | Get recently invoked skills |
| `/api/skills/handoff-graph` | GET | Get skill handoff graph |

### Changesets

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/changesets` | GET | Get all changesets |
| `/api/changesets/<id>` | GET | Get changeset by ID |
| `/api/changesets/<id>/conversation` | GET | Get conversation transcript |
| `/api/changesets/<id>/timeline` | GET | Get handoff timeline |
| `/api/handoffs` | GET | Get recent handoffs |
| `/api/handoffs/<id>` | GET | Get handoff by ID |

### Events & Streaming

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | POST | Receive hook events |
| `/api/events/recent` | GET | Get recent events |
| `/api/stream` | GET | SSE event stream |
| `/api/heartbeat` | GET | Health check |

### Capabilities

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/capabilities` | GET | Get all capabilities |
| `/api/capabilities/<domain>` | GET | Get capabilities by domain |
| `/api/collaboration-graph` | GET | Get domain collaboration graph |
| `/api/search?q=<query>` | GET | Search capabilities |

### Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rescan` | POST | Rescan plugins |
| `/api/auth/token` | GET | Get auth token (local only) |

## Real-time Updates

The dashboard uses Server-Sent Events (SSE) for real-time updates:

```javascript
const eventSource = new EventSource('/api/stream');

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'conversation_event') {
        // Handle new event
    }
};
```

Event types:
- `connected` - Initial connection
- `heartbeat` - Keep-alive (every 15s)
- `conversation_event` - Agent/skill activity

## SDK Terminal Usage

### Basic Query

```javascript
const response = await fetch('/api/input/sdk/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        prompt: 'Create a simple React component',
        model: 'sonnet',
        enable_thinking: true
    })
});

// Stream SSE response
const reader = response.body.getReader();
// ... process stream
```

### Session Management

```javascript
// Create session
const { session_id } = await fetch('/api/input/sdk/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'opus' })
}).then(r => r.json());

// Continue session
await fetch(`/api/input/sdk/sessions/${session_id}/continue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Now add tests' })
});

// Fork session
const { session_id: forked_id } = await fetch(
    `/api/input/sdk/sessions/${session_id}/fork`,
    { method: 'POST' }
).then(r => r.json());
```

### Hook System

The SDK bridge includes a security hook system that:
- Blocks dangerous commands (e.g., `rm -rf /`, fork bombs)
- Logs all tool usage for monitoring
- Provides customizable allow/block lists

```python
from server.services.sdk_hooks import hook_manager

# Add custom blocked pattern
hook_manager.add_blocked_pattern(r'rm\s+sensitive', 'Removing sensitive file')

# Add to allow list
hook_manager.add_to_allow_list('--dry-run')

# Get statistics
stats = hook_manager.get_stats()
# {'total_tool_calls': 100, 'blocked_count': 5, 'block_rate': 0.05}
```

## MCP Tools

The marketplace provides custom MCP tools:

- `marketplace_search` - Search plugins by name/description/tags
- `marketplace_agent_info` - Get agent details
- `marketplace_skill_info` - Get skill details
- `marketplace_capabilities` - List cross-domain capabilities
- `marketplace_domain_agents` - List agents for a domain
- `marketplace_taxonomy` - Get domain taxonomy
- `marketplace_plugins_summary` - Get plugin summary

## Authentication

### Local Mode (Default)

- Binds to `127.0.0.1`
- No authentication required
- Ideal for development

### Remote Mode

Enable with `--remote` flag:

```bash
python -m server.app --remote
```

- Binds to `0.0.0.0`
- Token-based authentication required
- Token stored in `.claude/dashboard-token`

Include token in requests:
```
Authorization: Bearer <token>
```

Or as query parameter:
```
/api/agents?token=<token>
```

## Testing

Run tests:

```bash
# Unit tests
python -m pytest tests/test_sdk_bridge.py -v

# E2E tests (requires dashboard running)
python -m pytest tests/test_terminal_e2e.py -v

# All tests
python -m pytest tests/ -v
```

## Dependencies

- Python 3.9+
- Flask
- PyYAML (for parsing agent/skill files)
- claude-agent-sdk (optional, for SDK terminal)
- flask-sock (optional, for WebSocket support)
- playwright (optional, for E2E tests)

## Configuration

Environment variables:
- `MARKETPLACE_ROOT` - Path to marketplace root (auto-detected)
- `DASHBOARD_PORT` - Server port (default: 24282)
- `CLAUDE_MARKETPLACE_PATH` - Override marketplace path

## Version

2.25.0
