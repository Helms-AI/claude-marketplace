# PM Plugin - Project Manager Broker

Cross-domain orchestration plugin for the Claude Code enterprise marketplace. Routes requests to specialized domain plugins and manages workflow handoffs.

## Overview

The PM (Project Manager) plugin acts as a thin broker layer that:
- Analyzes user intent to detect involved domains
- Matches capabilities across installed plugins
- Creates and manages handoff chains
- Tracks decisions and artifacts
- Surfaces conflicts for user resolution

## Skills

| Skill | Command | Description |
|-------|---------|-------------|
| PM | `/pm` | Main broker - capability discovery, intent matching, workflow orchestration |
| Status | `/pm-status` | View current workflow status, handoff chain, decisions |
| Resolve | `/pm-resolve` | List and resolve pending conflicts between domains |

## Agent

- **Alex Morgan** - PM Broker: Efficient routing, transparent decisions, neutral domain handling

## How It Works

### 1. Intent Analysis

When you invoke `/pm` or make a multi-domain request:
```
/pm build a user dashboard with real-time analytics
```

PM analyzes the request to identify:
- **Verbs**: build, create
- **Artifacts**: dashboard, analytics
- **Domains**: architecture, user-experience, frontend, backend, data, testing, devops, docs

### 2. Capability Matching

PM reads capability registries from installed plugins:
```
plugins/<name>/.claude-plugin/capabilities.json
```

Matches your intent to available capabilities using:
- Keyword matching
- Intent pattern analysis
- Taxonomy-based routing

### 3. Workflow Creation

Creates a phased handoff chain:

```
Phase 1: Design
  └─→ /arch-system-designer

Phase 2: Foundation (parallel)
  ├─→ /user-experience-aesthetic-director
  ├─→ /backend-database-modeler
  └─→ /data-modeler

Phase 3: Implementation (parallel)
  ├─→ /frontend-component-architect
  ├─→ /backend-api-builder
  └─→ /data-analytics-engineer

Phase 4: Quality (parallel)
  ├─→ /testing-e2e-engineer
  ├─→ /security-auditor
  └─→ /frontend-accessibility-auditor

Phase 5: Deployment
  └─→ /devops-ci-architect

Phase 6: Documentation
  ├─→ /docs-api-writer
  └─→ /docs-guide-writer
```

### 4. State Management

Workflow state is stored in `.claude/handoffs/<session-id>/`:
- `session.json` - Session metadata, decisions, artifacts
- `handoff_001.json` - Individual handoff context

## Supported Domains

| Domain | Plugin | Description |
|--------|--------|-------------|
| `user-experience` | user-experience | Design thinking, aesthetic direction, typography, color |
| `frontend` | frontend | Components, implementation, accessibility, performance |
| `architecture` | architecture | System design, patterns, decisions |
| `backend` | backend | APIs, databases, services |
| `testing` | testing | QA, test strategies, coverage |
| `devops` | devops | CI/CD, deployment, infrastructure |
| `data` | data | Data modeling, pipelines, analytics |
| `security` | security | Audits, threat modeling, compliance |
| `documentation` | documentation | Technical writing, API docs |

## Usage Examples

### Multi-Domain Request
```
/pm build an e-commerce checkout flow with payment integration
```

### Single-Domain Routing
```
/pm create API documentation for the user service
```
Routes directly to `/docs-api-writer`

### Check Status
```
/pm-status
```

### Resolve Conflicts
```
/pm-resolve
```

## Configuration

PM automatically discovers capabilities from installed plugins. No additional configuration required.

## Version History

- **1.0.0** - Initial release with broker capabilities, handoff protocol, conflict resolution
