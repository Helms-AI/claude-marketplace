---
name: dashboard
description: Launch the Claude Marketplace Dashboard to view agents, skills, changesets, and domain interactions
---

# Dashboard Skill

When invoked with `/dashboard`, launch the Claude Marketplace Dashboard web interface.

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing:

```
**Dashboard** is now launching the marketplace visualization interface.
```

## What the Dashboard Provides

The dashboard is a real-time web UI that visualizes:

1. **Agent Registry** - All 58+ agent personas across 10 domains
   - Searchable and filterable by domain
   - Agent details including role, tools, and key phrases
   - Activity tracking for recently active agents

2. **Skill Browser** - All 72+ skills organized by domain
   - Backing agent information
   - Handoff relationships (inputs and outputs)
   - Invocation history and counts

3. **Changeset Viewer** - Real-time conversation tracking
   - Live event stream via Server-Sent Events
   - Conversation transcripts with agent announcements
   - Tool calls and user responses

4. **Domain Interaction Graph** - D3.js visualization
   - Nodes represent domains
   - Edges show collaboration relationships
   - Interactive zoom and drag

5. **Handoff Timeline** - Visual swimlane timeline
   - Shows cross-domain handoffs
   - Color-coded by domain
   - Temporal ordering

## How to Launch

The dashboard server can be started in two ways:

### Method 1: MCP Server (Auto-start)

If the dashboard plugin is installed, the MCP server will auto-start when Claude Code loads:

```
Dashboard server starting on http://localhost:24282
```

### Method 2: Manual Launch

Run the server directly:

```bash
cd plugins/dashboard
python -m server.app --open-browser
```

Options:
- `--port PORT` - Port to listen on (default: 24282)
- `--host HOST` - Host to bind to (default: 127.0.0.1)
- `--open-browser` - Open browser on startup
- `--remote` - Allow remote connections (requires auth token)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | All agents with metadata |
| `/api/agents/<domain>` | GET | Agents for specific domain |
| `/api/agents/id/<id>` | GET | Single agent details |
| `/api/agents/id/<id>/activity` | GET | Agent activity history |
| `/api/skills` | GET | All skills |
| `/api/skills/<domain>` | GET | Skills for specific domain |
| `/api/skills/id/<id>` | GET | Single skill details |
| `/api/skills/id/<id>/invocations` | GET | Skill invocation history |
| `/api/changesets` | GET | All active changesets |
| `/api/changesets/<id>` | GET | Single changeset details |
| `/api/changesets/<id>/conversation` | GET | Full conversation transcript |
| `/api/changesets/<id>/timeline` | GET | Handoff timeline data |
| `/api/handoffs` | GET | Recent cross-domain handoffs |
| `/api/capabilities` | GET | Full capability registry |
| `/api/collaboration-graph` | GET | Domain collaboration graph |
| `/api/events` | POST | Receive hook events |
| `/api/stream` | GET | SSE stream for real-time updates |
| `/api/heartbeat` | GET | Health check |

## Event Tracking

The dashboard captures events via PostToolUse hooks:

- **Skill Invocations** - When `/skill-name` is called
- **Agent Activations** - When an agent announces itself
- **Tool Calls** - All tool usage (Read, Edit, Bash, etc.)
- **User Responses** - AskUserQuestion interactions
- **Handoffs** - Cross-domain context transfers
- **Artifacts** - Generated outputs

## Authentication

- **Local Mode (default)**: Binds to `127.0.0.1`, no auth required
- **Remote Mode**: Binds to `0.0.0.0` with token-based auth
  - Token stored in `.claude/dashboard-token`
  - Requires `Authorization: Bearer <token>` header

## Technology Stack

- **Backend**: Flask with Server-Sent Events
- **Frontend**: Vanilla JavaScript + D3.js
- **Styling**: CSS Variables with light/dark theme support
- **Real-time**: SSE for push-based updates

## Output

When the dashboard launches successfully:

```
Dashboard is now available at http://localhost:24282

Features:
- Agent Registry: View all 58 agents across 10 domains
- Skill Browser: Browse all 72 skills with handoff relationships
- Changeset Viewer: Real-time conversation tracking
- Domain Graph: Interactive visualization of domain collaborations

The browser should open automatically. If not, visit the URL above.
```
