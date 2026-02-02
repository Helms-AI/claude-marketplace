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

## Real-time Updates (SSE System)

The dashboard uses a sophisticated **Server-Sent Events (SSE)** system for real-time updates between the Python backend and JavaScript frontend.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SSE EVENT FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  BACKEND (Python)                    FRONTEND (JavaScript)                  │
│  ──────────────────                  ────────────────────────               │
│                                                                              │
│  ┌─────────────────┐                ┌─────────────────┐                     │
│  │ ChangesetWatcher│────broadcast──▶│  SSEService     │                     │
│  │ TranscriptWatcher│               │  (EventSource)  │                     │
│  │ EventStore      │                └────────┬────────┘                     │
│  └────────┬────────┘                         │                              │
│           │                                  │ _handleEvent()               │
│           ▼                                  ▼                              │
│  ┌─────────────────┐                ┌─────────────────┐                     │
│  │   SSEManager    │                │    app.js       │                     │
│  │  (Queue-based)  │                │ (Central Router)│                     │
│  └────────┬────────┘                └────────┬────────┘                     │
│           │                                  │                              │
│           │ generate_stream()                │ dispatch to services         │
│           ▼                                  ▼                              │
│  ┌─────────────────┐                ┌─────────────────┐                     │
│  │  Flask endpoint │                │  AppStore       │                     │
│  │  /api/stream    │                │ (Preact Signals)│                     │
│  └─────────────────┘                └────────┬────────┘                     │
│                                              │                              │
│                                              │ SignalWatcher                │
│                                              ▼                              │
│                                     ┌─────────────────┐                     │
│                                     │  Components     │                     │
│                                     │  (auto-render)  │                     │
│                                     └─────────────────┘                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Event Types

| Type | Direction | Frequency | Source | Purpose |
|------|-----------|-----------|--------|---------|
| `connected` | Backend→Frontend | Once | SSEManager | Connection confirmation |
| `heartbeat` | Backend→Frontend | Every 3s | SSEManager | Keep-alive signal |
| `changeset_created` | Backend→Frontend | Per changeset | ChangesetWatcher | New changeset detected |
| `changeset_updated` | Backend→Frontend | When changed | ChangesetScanner | Changeset metadata updated |
| `changeset_deleted` | Backend→Frontend | When removed | ChangesetWatcher | Changeset removed |
| `transcript_message` | Backend→Frontend | Per message | TranscriptWatcher | New conversation message |
| `task_state_change` | Backend→Frontend | Per task tool | TranscriptWatcher | Task lifecycle event |
| `conversation_event` | Backend→Frontend | Per event | EventStore listener | General conversation event |
| `graph_activity` | Backend→Frontend | Debounced 500ms | Custom broadcast | Domain node activity |
| `graph_handoff` | Backend→Frontend | Per handoff | Custom broadcast | Inter-domain handoff |
| `activity` | Backend→Frontend | Per action | App | Generic activity log |
| `error` | Backend→Frontend | Per error | App | Error notifications |

### Basic Usage

```javascript
// Simple connection
const eventSource = new EventSource('/api/stream');

// Named event listeners (recommended)
eventSource.addEventListener('changeset_created', (e) => {
    const data = JSON.parse(e.data);
    console.log('New changeset:', data.changeset_id);
});

eventSource.addEventListener('transcript_message', (e) => {
    const data = JSON.parse(e.data);
    console.log('New message from:', data.source);
});

// Fallback for generic messages
eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Event:', data.type, data);
};

// Connection status
eventSource.onopen = () => console.log('SSE Connected');
eventSource.onerror = () => console.log('SSE Error/Disconnected');
```

### Using the SSEService

The dashboard provides a higher-level `SSEService` with automatic reconnection:

```javascript
import { SSEService, SSEEventType } from './services/sse-service.js';

// Connect to SSE endpoint
SSEService.connect('/api/stream');

// Subscribe to all events
const unsubscribe = SSEService.subscribe((eventType, data) => {
    switch (eventType) {
        case SSEEventType.CHANGESET_CREATED:
            console.log('New changeset:', data);
            break;
        case SSEEventType.TRANSCRIPT_MESSAGE:
            console.log('Transcript update:', data);
            break;
    }
});

// Later: unsubscribe
unsubscribe();

// Disconnect
SSEService.disconnect();

// Check connection status
console.log('Connected:', SSEService.isConnected);
```

### Implementing New Event Types

#### Step 1: Define Event Type (Backend)

In `server/sse.py`, events are broadcast using:

```python
# Simple broadcast
sse_manager.broadcast(
    {'changeset_id': '...', 'data': '...'},
    event_type='my_custom_event'
)

# With debouncing (for high-frequency events)
sse_manager.broadcast_graph_activity(
    node_id='frontend',
    agent_id='chris-nakamura',
    activity_type='skill'
)
```

#### Step 2: Generate Events (Backend)

In `server/app.py` or your watcher/service:

```python
from server.sse import sse_manager

# From a Flask route
@app.route('/api/my-action', methods=['POST'])
def my_action():
    # Do something...
    result = process_action()

    # Broadcast to all connected clients
    sse_manager.broadcast({
        'action': 'completed',
        'result': result,
        'timestamp': datetime.now().isoformat()
    }, event_type='my_custom_event')

    return jsonify({'success': True})

# From a background thread/watcher
def my_watcher_loop():
    while True:
        changes = detect_changes()
        if changes:
            sse_manager.broadcast({
                'changes': changes
            }, event_type='my_custom_event')
        time.sleep(1)
```

#### Step 3: Register Event Type (Frontend)

In `web/js/services/sse-service.js`:

```javascript
// Add to SSEEventType enum
export const SSEEventType = {
    // ... existing types
    MY_CUSTOM_EVENT: 'my_custom_event'
};

// In connect() method, add listener
this._eventSource.addEventListener('my_custom_event', (e) =>
    this._handleEvent(SSEEventType.MY_CUSTOM_EVENT, this._parseData(e))
);
```

#### Step 4: Route Events (Frontend)

In `web/js/app.js`, add routing in the SSE subscriber:

```javascript
SSEService.subscribe((eventType, data) => {
    // ... existing routing

    if (eventType === 'my_custom_event') {
        // Option A: Update store directly
        Actions.handleMyCustomEvent(data);

        // Option B: Route to a service
        MyService.handleEvent(data);

        // Option C: Add to activity feed
        Actions.addActivity({
            type: 'custom',
            message: `Custom event: ${data.action}`,
            data
        });
    }
});
```

#### Step 5: Update Store (Frontend)

In `web/js/store/app-state.js`:

```javascript
// Add state signal
export const AppStore = {
    // ... existing state
    myCustomData: signal([])
};

// Add action
export const Actions = {
    // ... existing actions
    handleMyCustomEvent(data) {
        AppStore.myCustomData.value = [
            data,
            ...AppStore.myCustomData.value.slice(0, 99)  // Keep last 100
        ];
    }
};
```

#### Step 6: React in Components (Frontend)

```javascript
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore } from '../../store/app-state.js';

class MyComponent extends SignalWatcher(LitElement) {
    connectedCallback() {
        super.connectedCallback();
        // Subscribe to specific signals
        this.watchSignals([AppStore.myCustomData]);
    }

    render() {
        const data = AppStore.myCustomData.value;
        return html`
            <ul>
                ${data.map(item => html`<li>${item.action}</li>`)}
            </ul>
        `;
    }
}
```

### Complete Example: Adding "Agent Invoked" Events

Here's a complete example of adding a new event type:

**Backend (`server/app.py`):**
```python
# In the hook event handler or watcher
def on_agent_invoked(agent_id, skill, domain):
    sse_manager.broadcast({
        'agent_id': agent_id,
        'skill': skill,
        'domain': domain,
        'timestamp': datetime.now().isoformat()
    }, event_type='agent_invoked')
```

**Frontend (`sse-service.js`):**
```javascript
export const SSEEventType = {
    // ...
    AGENT_INVOKED: 'agent_invoked'
};

// In connect():
this._eventSource.addEventListener('agent_invoked', (e) =>
    this._handleEvent(SSEEventType.AGENT_INVOKED, this._parseData(e))
);
```

**Frontend (`app.js`):**
```javascript
SSEService.subscribe((eventType, data) => {
    if (eventType === 'agent_invoked') {
        // Update agent's last activity
        Actions.updateAgentActivity(data.agent_id, data);

        // Trigger graph animation
        Actions.addActivity({
            type: 'agent',
            message: `${data.agent_id} invoked ${data.skill}`,
            domain: data.domain
        });
    }
});
```

**Frontend (`app-state.js`):**
```javascript
Actions = {
    updateAgentActivity(agentId, data) {
        const agents = [...AppStore.agents.value];
        const index = agents.findIndex(a => a.id === agentId);
        if (index !== -1) {
            agents[index] = {
                ...agents[index],
                lastActivity: data.timestamp,
                lastSkill: data.skill
            };
            AppStore.agents.value = agents;
        }
    }
};
```

### Data Normalization

When receiving events from the backend, always normalize field names:

```javascript
// Backend sends: { changeset_id: '...' }
// Frontend expects: { id: '...' }

handleSSEEvent({type, data}) {
    case 'changeset_created':
        const normalized = {
            ...data,
            id: data.id || data.changeset_id,  // Normalize ID
            name: data.name || data.changeset_id  // Provide display name
        };
        Actions.addChangeset(normalized);
        break;
}
```

### Connection States

The SSEService tracks connection state automatically:

```
┌─────────────────────┐
│   DISCONNECTED      │
└──────────┬──────────┘
           │ connect()
           ▼
┌─────────────────────┐
│   CONNECTING        │
└──────────┬──────────┘
           │ onopen
           ▼
┌─────────────────────┐
│   CONNECTED         │◄──────────┐
└──────────┬──────────┘           │
           │ onerror              │ reconnect success
           ▼                       │
┌─────────────────────┐           │
│   DISCONNECTED      ├───────────┘
└──────────┬──────────┘
           │ exponential backoff (1s → 30s max)
           ▼
       auto-reconnect
```

### Performance Considerations

1. **Queue Limits**: Each client has a 100-item queue to prevent memory issues
2. **Activity Debouncing**: High-frequency events (graph animations) are debounced at 500ms
3. **Event Trimming**: In-memory EventStore keeps max 10,000 events
4. **Heartbeat**: 3-second intervals prevent connection timeouts
5. **Fine-Grained Reactivity**: Preact Signals minimize re-renders

### Debugging

```bash
# Check SSE status
curl http://localhost:24282/api/debug/sse-status

# Health check
curl http://localhost:24282/api/heartbeat

# Watch raw SSE stream
curl -N http://localhost:24282/api/stream
```

In browser DevTools:
- Network tab → Filter "EventStream"
- Watch for `event:` and `data:` lines

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
