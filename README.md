# Claude Marketplace

Enterprise marketplace for sharing Claude Code plugins across organizations. Features a comprehensive multi-domain plugin ecosystem with cross-domain orchestration.

---

## ✨ New: Real-Time Dashboard (v1.7.0)

**Visualize your Claude Code sessions in real-time with the new Dashboard plugin.**

```bash
/dashboard
```

<p align="center">
  <img src="https://img.shields.io/badge/Agents-58-blue" alt="58 Agents">
  <img src="https://img.shields.io/badge/Skills-77-green" alt="77 Skills">
  <img src="https://img.shields.io/badge/Domains-10-orange" alt="10 Domains">
  <img src="https://img.shields.io/badge/Real--time-SSE-purple" alt="Real-time SSE">
</p>

### Features

| Feature | Description |
|---------|-------------|
| **Agent Explorer** | Browse 58 agents across 10 domains with search & filter |
| **Skill Browser** | Explore 77 skills with collapsible domain groups |
| **Session Viewer** | Live conversation streaming with inline subagent threads |
| **Task List Overlay** | Real-time task progress tracking (pending → in_progress → completed) |
| **Domain Graph** | D3.js visualization of cross-domain interactions |
| **Handoff Timeline** | Visual swimlane view of domain handoffs |

### Task List Overlay

Track Claude's task progress in real-time with the new Task List panel:

```
┌─────────────────────────────────────────┐
│ ✓ Tasks          2/5  ████░░░░  📌 ▼   │
├─────────────────────────────────────────┤
│ ◯ Implement user auth                   │
│ ⟳ Implementing login flow...            │
│ ○ Add logout button                     │
│ ✓ Set up database                       │
│ ✓ Create API endpoints                  │
└─────────────────────────────────────────┘
```

- **◯** Pending tasks
- **⟳** In-progress with live status text
- **✓** Completed tasks
- Pin below conversation or float as overlay
- Progress bar shows completion percentage

**Launch:** `/dashboard` or visit `http://localhost:24282`

---

## Quick Start

### Add the Marketplace

```bash
/plugin marketplace add Helms-AI/claude-marketplace
```

### Install Plugins

```bash
# Install the real-time dashboard (recommended first!)
/plugin install dashboard@helms-ai-marketplace

# Install the PM broker for cross-domain orchestration
/plugin install pm@helms-ai-marketplace

# Install domain plugins
/plugin install user-experience@helms-ai-marketplace
/plugin install frontend@helms-ai-marketplace
/plugin install architecture@helms-ai-marketplace
/plugin install backend@helms-ai-marketplace
/plugin install testing@helms-ai-marketplace
/plugin install devops@helms-ai-marketplace
/plugin install data@helms-ai-marketplace
/plugin install security@helms-ai-marketplace
/plugin install documentation@helms-ai-marketplace
```

### List Available Plugins

```bash
/plugin list helms-ai-marketplace
```

## Available Plugins

| Plugin | Version | Category | Agents | Skills | Description |
|--------|---------|----------|--------|--------|-------------|
| **[pm](./plugins/pm)** | 1.0.0 | orchestration | 1 | 3 | Cross-domain orchestration broker |
| **[user-experience](./plugins/user-experience)** | 4.0.0 | design | 8 | 9 | Design thinking and ideation (pre-code) |
| **[frontend](./plugins/frontend)** | 1.0.0 | frontend | 14 | 15 | Component implementation and engineering |
| **[architecture](./plugins/architecture)** | 1.0.0 | architecture | 5 | 7 | System design and patterns |
| **[backend](./plugins/backend)** | 1.0.0 | backend | 5 | 7 | APIs, databases, services |
| **[testing](./plugins/testing)** | 1.0.0 | testing | 5 | 7 | Test strategy and implementation |
| **[devops](./plugins/devops)** | 1.0.0 | devops | 5 | 7 | CI/CD and infrastructure |
| **[data](./plugins/data)** | 1.0.0 | data | 5 | 7 | Data modeling and pipelines |
| **[security](./plugins/security)** | 1.0.0 | security | 5 | 7 | Security audits and compliance |
| **[documentation](./plugins/documentation)** | 1.0.0 | documentation | 5 | 7 | Technical writing and docs |
| **[dashboard](./plugins/dashboard)** | 1.7.0 | observability | - | 1 | Real-time web dashboard with task tracking |

**Total: 11 plugins, 58 agents, 77 skills**

## Architecture Overview

```
                         ┌─────────────────┐
                         │      /pm        │
                         │  (thin broker)  │
                         └────────┬────────┘
                                  │ routes by intent/capability
        ┌─────────┬───────┬──────┴──────┬───────┬─────────┬─────────┬─────────┐
        ▼         ▼       ▼             ▼       ▼         ▼         ▼         ▼
   ┌────────┐┌────────┐┌────────┐┌──────────┐┌────────┐┌────────┐┌────────┐┌────────┐
   │  U/E   ││Frontend││  Arch  ││ Backend  ││ DevOps ││  Data  ││Security││  Docs  │
   └────────┘└────────┘└────────┘└──────────┘└────────┘└────────┘└────────┘└────────┘
        │         │
        └────┬────┘
             ▼
      Design → Code
       Handoff
```

### Design-to-Code Workflow

The **user-experience** and **frontend** plugins work together:

1. **User Experience** (pre-code): Aesthetic direction, typography, color, layout, research
2. **Handoff**: Creates aesthetic brief with design specifications
3. **Frontend** (code): Implements components, design systems, accessibility, performance

### Cross-Domain Orchestration

The **PM (Project Manager)** plugin acts as a broker that:
1. Analyzes user intent to detect involved domains
2. Matches capabilities across installed plugins
3. Creates workflow handoff chains
4. Tracks decisions and artifacts
5. Surfaces conflicts for user resolution

**Example multi-domain request:**
```
/pm build a user dashboard with real-time analytics
```

This automatically routes through:
- Architecture → system design
- User Experience → aesthetic direction
- Frontend → components, design system
- Backend → API endpoints, database schema
- Data → analytics pipeline
- Testing → E2E tests
- DevOps → CI/CD pipeline
- Documentation → API docs, user guide

## Domain Plugins

### PM - Project Manager Broker

The orchestration layer for cross-domain work.

| Skill | Command | Description |
|-------|---------|-------------|
| PM | `/pm` | Main broker - routes to domain plugins |
| Status | `/pm-status` | View workflow status and decisions |
| Resolve | `/pm-resolve` | Resolve conflicts between domains |

### User Experience Plugin (v4.0.0)

Design thinking and ideation team with 8 specialized agents and 9 skills. Pre-code design phase.

**Agents:** Dana Reyes (Lead), Quinn Martinez (Aesthetic), Avery Nakamura (Typography), Maya Torres (Research), Morgan Blake (Color), Skyler Okonkwo (Layout), Indigo Vasquez (Texture), Ember Nguyen (Micro-Delight)

**Skills:** `/user-experience-orchestrator`, `/user-experience-team-session`, `/user-experience-aesthetic-director`, `/user-experience-typography-curator`, `/user-experience-color-alchemist`, `/user-experience-layout-composer`, `/user-experience-texture-atmosphere`, `/user-experience-micro-delight`, `/user-experience-user-researcher`

See [plugins/user-experience/README.md](./plugins/user-experience/README.md) for full details.

### Frontend Plugin (v1.0.0)

Component implementation team with 14 specialized agents and 15 skills. Production-ready code.

**Agents:** Chris Nakamura (Lead), Alex Kim (Architecture), Sam Rivera (Systems), Jordan Park (Motion), Casey Williams (A11y), Riley Chen (Responsive), Taylor Brooks (Performance), Drew Patel (Data Viz), Kai Tanaka (Progress UI), Jesse Morgan (Forms), Sage Martinez (Navigation), Reese Kim (Data Grid), Parker Lee (Storybook), Cameron Reyes (Figma Sync)

**Skills:** `/frontend-orchestrator`, `/frontend-team-session`, `/frontend-design-system`, `/frontend-component-architect`, `/frontend-motion-designer`, `/frontend-accessibility-auditor`, `/frontend-responsive-engineer`, `/frontend-performance-engineer`, `/frontend-progress-ui`, `/frontend-form-experience`, `/frontend-navigation-patterns`, `/frontend-data-grid`, `/frontend-data-viz`, `/frontend-storybook`, `/frontend-figma-sync`

See [plugins/frontend/README.md](./plugins/frontend/README.md) for full details.

### Architecture Plugin

System design, patterns, and technical decisions.

| Agent | Role |
|-------|------|
| Sofia Reyes | Architecture Lead |
| Marcus Chen | Systems Architect |
| Elena Kowalski | Patterns Specialist |
| James Okonjo | Decision Recorder (ADRs) |
| Priya Sharma | API Designer |

**Skills:** `/arch-orchestrator`, `/arch-team-session`, `/arch-system-designer`, `/arch-pattern-advisor`, `/arch-adr-writer`, `/arch-diagram-creator`, `/arch-api-designer`

### Backend Plugin

APIs, databases, authentication, and services.

| Agent | Role |
|-------|------|
| David Park | Backend Lead |
| Sarah Mitchell | API Engineer |
| Raj Patel | Database Architect |
| Lisa Wong | Auth Specialist |
| Omar Hassan | Services Engineer |

**Skills:** `/backend-orchestrator`, `/backend-team-session`, `/backend-api-builder`, `/backend-database-modeler`, `/backend-auth-architect`, `/backend-service-builder`, `/backend-integration-specialist`

### Testing Plugin

Test strategy, unit tests, integration tests, E2E, and coverage.

| Agent | Role |
|-------|------|
| Amanda Torres | QA Lead |
| Kevin O'Brien | Test Strategist |
| Nina Johansson | Unit Test Specialist |
| Carlos Mendez | Integration Specialist |
| Rachel Kim | E2E Engineer |

**Skills:** `/testing-orchestrator`, `/testing-team-session`, `/testing-strategy-advisor`, `/testing-unit-specialist`, `/testing-integration-specialist`, `/testing-e2e-engineer`, `/testing-coverage-analyzer`

### DevOps Plugin

CI/CD, deployment, infrastructure, and monitoring.

| Agent | Role |
|-------|------|
| Michael Chang | DevOps Lead |
| Emma Watson | CI/CD Architect |
| Alex Rivera | Deployment Engineer |
| Tom Anderson | Infrastructure Specialist |
| Aisha Patel | Monitoring Engineer |

**Skills:** `/devops-orchestrator`, `/devops-team-session`, `/devops-ci-architect`, `/devops-deployment-engineer`, `/devops-infrastructure-specialist`, `/devops-monitoring-engineer`, `/devops-container-specialist`

### Data Plugin

Data modeling, pipelines, analytics, and governance.

| Agent | Role |
|-------|------|
| Jennifer Wu | Data Lead |
| Robert Garcia | Data Modeler |
| Anna Schmidt | Pipeline Architect |
| Chris Lee | Analytics Engineer |
| Maria Santos | Governance Advisor |

**Skills:** `/data-orchestrator`, `/data-team-session`, `/data-modeler`, `/data-pipeline-architect`, `/data-analytics-engineer`, `/data-warehouse-specialist`, `/data-governance-advisor`

### Security Plugin

Security audits, threat modeling, compliance, and secrets management.

| Agent | Role |
|-------|------|
| Nathan Brooks | Security Lead |
| Diana Chen | Security Auditor |
| Victor Okonkwo | Threat Modeler |
| Sarah Johnson | Compliance Advisor |
| Mark Thompson | Secrets Manager |

**Skills:** `/security-orchestrator`, `/security-team-session`, `/security-auditor`, `/security-threat-modeler`, `/security-compliance-advisor`, `/security-secrets-manager`, `/security-penetration-advisor`

### Documentation Plugin

API docs, guides, architecture documentation, and runbooks.

| Agent | Role |
|-------|------|
| Patricia Moore | Docs Lead |
| Andrew Kim | API Doc Writer |
| Laura Hernandez | Guide Writer |
| Steven Brown | Architecture Documenter |
| Michelle Lee | Runbook Writer |

**Skills:** `/docs-orchestrator`, `/docs-team-session`, `/docs-api-writer`, `/docs-guide-writer`, `/docs-architecture-documenter`, `/docs-runbook-writer`, `/docs-onboarding-creator`

### Dashboard Plugin (v1.7.0)

Real-time web dashboard for visualizing the marketplace ecosystem.

| Feature | Description |
|---------|-------------|
| Agent Explorer | Browse all 58 agents with domain filtering |
| Skill Browser | Explore 77 skills with collapsible groups |
| Session Viewer | Live conversation with inline subagents |
| Task List Overlay | Real-time task progress tracking |
| Domain Graph | D3.js interactive visualization |
| Handoff Timeline | Visual swimlane of domain handoffs |

**Launch Command:** `/dashboard`

**URL:** `http://localhost:24282`

**Tech Stack:**
- Backend: Flask with SSE (Server-Sent Events)
- Frontend: Vanilla JS, D3.js for graphs
- Real-time: Transcript file watching with live updates

See [plugins/dashboard/README.md](./plugins/dashboard/README.md) for full details.

## Directory Structure

```
claude-marketplace/
├── .claude-plugin/
│   ├── marketplace.json      # Registry of all plugins
│   └── taxonomy.json         # Centralized domain taxonomy
├── plugins/
│   ├── pm/                   # Project Manager broker
│   ├── user-experience/      # User Experience Team (v4.0.0)
│   ├── frontend/             # Frontend Team (v1.0.0)
│   ├── architecture/         # Architecture Team
│   ├── backend/              # Backend Team
│   ├── testing/              # Testing Team
│   ├── devops/               # DevOps Team
│   ├── data/                 # Data Team
│   ├── security/             # Security Team
│   ├── documentation/        # Documentation Team
│   └── dashboard/            # Real-time Web Dashboard (v1.7.0)
├── CLAUDE.md                 # Claude Code instructions
├── CONTRIBUTING.md           # Contribution guidelines
└── LICENSE                   # MIT license
```

## Handoff Protocol

Cross-domain workflows use file-based handoffs stored in `.claude/handoffs/`:

```
.claude/
└── handoffs/
    └── <session-id>/
        ├── session.json          # Session metadata
        ├── handoff_001.json      # First handoff
        ├── handoff_002.json      # Second handoff
        └── artifacts/            # Shared artifacts
```

## OpenClaw Automated Analysis

The marketplace includes an automated daily analysis job powered by [OpenClaw](https://openclaw.ai) that continuously improves the agent system.

### What It Does

| Step | Description |
|------|-------------|
| **1. Check for PR** | Looks for existing OpenClaw enhancement PRs |
| **2. Clone Repository** | Fresh clone to `/tmp/` with appropriate branch |
| **3. Analyze System** | Reviews all agents, skills, hooks, and dashboard code |
| **4. Update Memory** | Stores findings in OpenClaw memory for continuity |
| **5. Generate Enhancements** | Identifies improvements for collaboration & quality |
| **6. Create PR** | Commits changes and creates/updates a pull request |

### Analysis Focus Areas

- **Agent Collaboration** - Better handoff protocols, clearer responsibilities
- **Skill Effectiveness** - More powerful prompts, better tool restrictions
- **Hook Coverage** - Additional safety/quality gates
- **Dashboard Features** - Better visualization, monitoring, UX
- **Cross-Domain Workflows** - Smoother orchestration, reduced friction
- **Output Quality** - Better code generation, documentation, testing

### Schedule

- **Automatic**: Runs every hour at :00
- **On-demand**: Can be triggered manually

### Manual Execution

**Option 1:** Ask OpenClaw directly:
```
"Run the agent analysis"
"Analyze and improve the agents"
```

**Option 2:** Trigger via OpenClaw MCP tool:
```javascript
mcp__openclaw__openclaw_cron_run({
  jobId: "7d6edef1-351a-47bf-a105-e5748d146421"
})
```

**Option 3:** Use the OpenClaw CLI:
```bash
openclaw cron run claude-marketplace-agent-analysis
```

### Job Details

| Field | Value |
|-------|-------|
| **Job ID** | `7d6edef1-351a-47bf-a105-e5748d146421` |
| **Name** | `claude-marketplace-agent-analysis` |
| **Schedule** | `0 * * * *` (every hour at :00) |
| **Session** | Isolated (dedicated session per run) |

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Adding a New Plugin

1. Fork this repository
2. Create your plugin in `plugins/<plugin-name>/`
3. Add `.claude-plugin/plugin.json` manifest
4. Add `.claude-plugin/capabilities.json` for cross-domain routing
5. Register in `.claude-plugin/marketplace.json`
6. Submit a pull request

### Plugin Structure

```
plugins/<plugin-name>/
├── .claude-plugin/
│   ├── plugin.json           # Plugin manifest (required)
│   └── capabilities.json     # Capability registry (recommended)
├── skills/                   # Slash commands
│   └── <skill-name>/
│       └── SKILL.md
├── agents/                   # Agent personas
│   └── <agent-name>.md
├── scripts/                  # Hook scripts
└── README.md                 # Documentation (required)
```

### Versioning

Plugins use semantic versioning `X.Y.Z`:
- **Z (Patch)**: Modify existing agents, skills, hooks
- **Y (Minor)**: Add, modify, or delete agents, skills, hooks
- **X (Major)**: Breaking changes or architecture restructures

## Validation

Test plugins locally before committing:

```bash
/plugin validate ./plugins/<plugin-name>
```

## Support

- **Issues**: [GitHub Issues](https://github.com/Helms-AI/claude-marketplace/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Helms-AI/claude-marketplace/discussions)

## License

MIT License - See [LICENSE](./LICENSE) for details.
