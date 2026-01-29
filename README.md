# Claude Marketplace

Enterprise marketplace for sharing Claude Code plugins across organizations. Features a comprehensive multi-domain plugin ecosystem with cross-domain orchestration.

## Quick Start

### Add the Marketplace

```bash
/plugin marketplace add Helms-AI/claude-marketplace
```

### Install Plugins

```bash
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

**Total: 10 plugins, 58 agents, 76 skills**

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
│   └── documentation/        # Documentation Team
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
