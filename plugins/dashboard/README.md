# Dashboard Plugin

Real-time web dashboard for visualizing Claude Marketplace agents, skills, changesets, and cross-domain orchestration.

## Features

- **Agent Explorer**: Grid/list of all 58+ agents across 10 domains with search/filter
- **Skill Browser**: All 72+ skills organized by domain with handoff relationships
- **Changeset Viewer**: Real-time conversation display with live event streaming
- **Domain Graph**: D3.js visualization of domain collaboration relationships
- **Handoff Timeline**: Visual swimlane timeline of cross-domain handoffs
- **Dark/Light Theme**: Automatic theme persistence

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

```
plugins/dashboard/
├── .claude-plugin/
│   ├── plugin.json           # Plugin manifest
│   └── capabilities.json     # Capability declarations
├── server/
│   ├── app.py               # Flask application
│   ├── auth.py              # Token-based authentication
│   ├── sse.py               # Server-Sent Events manager
│   ├── models.py            # Data models
│   ├── parsers/             # File parsers
│   │   ├── agent_parser.py
│   │   ├── skill_parser.py
│   │   └── capability_parser.py
│   ├── services/            # Core services
│   │   ├── agent_registry.py
│   │   ├── skill_registry.py
│   │   ├── changeset_tracker.py
│   │   ├── event_store.py
│   │   └── file_watcher.py
│   └── routes/              # API endpoints
│       ├── agents.py
│       ├── skills.py
│       ├── changesets.py
│       ├── events.py
│       ├── stream.py
│       └── capabilities.py
├── web/
│   ├── index.html           # Dashboard SPA
│   ├── css/
│   │   └── dashboard.css    # Styles with theme support
│   └── js/
│       ├── dashboard.js     # Main app + SSE client
│       ├── agents.js        # Agent explorer
│       ├── skills.js        # Skill browser
│       ├── changesets.js    # Changeset viewer
│       ├── conversation.js  # Transcript rendering
│       ├── timeline.js      # Handoff timeline
│       └── graph.js         # D3.js visualization
└── skills/
    └── dashboard/
        └── SKILL.md         # /dashboard skill
```

## API Reference

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

## Hook Integration

To capture real-time events, add PostToolUse hooks to your workflow:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": { "toolName": "*" },
        "hooks": [{
          "type": "command",
          "command": "curl -s -X POST http://localhost:24282/api/events -H 'Content-Type: application/json' -d '{\"tool\": \"$TOOL_NAME\", \"result\": \"$TOOL_OUTPUT\", \"session_id\": \"$SESSION_ID\"}'"
        }]
      }
    ]
  }
}
```

## Dependencies

- Python 3.9+
- Flask
- PyYAML (for parsing agent/skill files)

## Configuration

Environment variables:
- `MARKETPLACE_ROOT` - Path to marketplace root (auto-detected)
- `DASHBOARD_PORT` - Server port (default: 24282)

## Version

2.1.1
