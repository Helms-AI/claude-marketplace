# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an enterprise marketplace for sharing Claude Code plugins. It contains reusable skills, agents, hooks, and MCP servers that can be installed across projects. The marketplace features a multi-domain plugin ecosystem with cross-domain orchestration via the PM broker.

## Plugin Versioning Schema

**CRITICAL:** All plugins use semantic versioning `{X}.{Y}.{Z}` with these rules:

| Segment | When to Increment | Examples |
|---------|-------------------|----------|
| **Z (Patch)** | Modify existing agents, skills, hooks | Fix typo in skill prompt, update agent instructions |
| **Y (Minor)** | Add, modify, or delete agents, skills, hooks | Add new skill, remove deprecated agent, add hook |
| **X (Major)** | Global changes affecting plugin behavior | Restructure plugin architecture, breaking changes |

**Version Increment Rules:**
- **Once per commit**: Only increment the version ONCE per commit, regardless of how many changes are made. If you add 3 skills and modify 2 agents before committing, that's still only ONE version bump.
- **Highest level wins**: If changes span multiple levels (e.g., both patch and minor changes), only increment the highest level (minor in this case).
- **Check before incrementing**: Before bumping a version, check if it was already incremented in the current uncommitted changes using `git diff`.

**After changes to a plugin** (once per commit), update the version in:
1. `plugins/<name>/.claude-plugin/plugin.json` - the `version` field
2. `.claude-plugin/marketplace.json` - the corresponding plugin's `version` field

## Architecture

```
claude-marketplace/
├── .claude-plugin/
│   ├── marketplace.json      # Registry of all plugins with metadata
│   └── taxonomy.json         # Centralized domain taxonomy
└── plugins/
    ├── pm/                   # Project Manager broker (cross-domain orchestration)
    ├── user-experience/      # User Experience Team (design thinking, ideation - pre-code)
    ├── frontend/             # Frontend Team (component implementation, engineering - code)
    ├── architecture/         # Architecture Team (system design, patterns, ADRs)
    ├── backend/              # Backend Team (APIs, databases, services)
    ├── testing/              # Testing Team (unit, integration, E2E)
    ├── devops/               # DevOps Team (CI/CD, infrastructure, monitoring)
    ├── data/                 # Data Team (modeling, pipelines, analytics)
    ├── security/             # Security Team (audits, compliance, secrets)
    └── documentation/        # Documentation Team (API docs, guides, runbooks)
```

### Plugin Types

- **Skills**: User-invocable commands via `/<skill-name>` - defined in `skills/<name>/SKILL.md`
- **Agents**: Domain-specific assistants - defined in `agents/<name>.md`
- **Hooks**: Event-triggered actions (PreToolUse, PostToolUse) - defined in `plugin.json`
- **MCP Servers**: External tool integrations - defined in `plugin.json` under `mcpServers`
- **Capabilities**: Cross-domain routing metadata - defined in `.claude-plugin/capabilities.json`

### Marketplace Registration

When adding/modifying plugins, update `.claude-plugin/marketplace.json` with:
- `name`, `source`, `description`, `version`
- `author` (object with `name`)
- `category`, `tags` for discoverability

**Note:** Only these fields are valid in marketplace.json. Additional metadata (skills list, agents list, technologies) should be documented in the plugin's README.md instead.

## Current Plugins

### PM Plugin (v1.0.0)
Location: `plugins/pm/`

Cross-domain orchestration broker:
- **Agent**: Alex Morgan (PM Broker)
- **Skills**: pm (main broker), pm-status (workflow status), pm-resolve (conflict resolution)
- **Purpose**: Routes requests to domain plugins, manages handoffs, tracks decisions

### User Experience Plugin (v4.0.0)
Location: `plugins/user-experience/`

Design thinking and ideation team with 8 agent personas and 9 skills (pre-code phase):
- **Agents**: Dana Reyes (Lead), Quinn Martinez (Aesthetic), Avery Nakamura (Typography), Maya Torres (Research), Morgan Blake (Color), Skyler Okonkwo (Layout), Indigo Vasquez (Texture), Ember Nguyen (Micro-Delight)
- **Skills**: user-experience-orchestrator, user-experience-team-session, user-experience-aesthetic-director, user-experience-typography-curator, user-experience-color-alchemist, user-experience-layout-composer, user-experience-texture-atmosphere, user-experience-micro-delight, user-experience-user-researcher

### Frontend Plugin (v1.0.0)
Location: `plugins/frontend/`

Component implementation team with 14 agent personas and 15 skills (code phase):
- **Agents**: Chris Nakamura (Lead), Alex Kim (Architecture), Sam Rivera (Systems), Jordan Park (Motion), Casey Williams (A11y), Riley Chen (Responsive), Taylor Brooks (Performance), Drew Patel (Data Viz), Kai Tanaka (Progress UI), Jesse Morgan (Forms), Sage Martinez (Navigation), Reese Kim (Data Grid), Parker Lee (Storybook), Cameron Reyes (Figma Sync)
- **Skills**: frontend-orchestrator, frontend-team-session, frontend-design-system, frontend-component-architect, frontend-motion-designer, frontend-accessibility-auditor, frontend-responsive-engineer, frontend-performance-engineer, frontend-progress-ui, frontend-form-experience, frontend-navigation-patterns, frontend-data-grid, frontend-data-viz, frontend-storybook, frontend-figma-sync

### Architecture Plugin (v1.0.0)
Location: `plugins/architecture/`

System design and patterns with 5 agents and 7 skills:
- **Agents**: Sofia Reyes (Lead), Marcus Chen (Systems), Elena Kowalski (Patterns), James Okonjo (Decisions), Priya Sharma (API)
- **Skills**: arch-orchestrator, arch-team-session, arch-system-designer, arch-pattern-advisor, arch-adr-writer, arch-diagram-creator, arch-api-designer

### Backend Plugin (v1.0.0)
Location: `plugins/backend/`

APIs and services with 5 agents and 7 skills:
- **Agents**: David Park (Lead), Sarah Mitchell (API), Raj Patel (Database), Lisa Wong (Auth), Omar Hassan (Services)
- **Skills**: backend-orchestrator, backend-team-session, backend-api-builder, backend-database-modeler, backend-auth-architect, backend-service-builder, backend-integration-specialist

### Testing Plugin (v1.0.0)
Location: `plugins/testing/`

Test strategy and implementation with 5 agents and 7 skills:
- **Agents**: Amanda Torres (Lead), Kevin O'Brien (Strategy), Nina Johansson (Unit), Carlos Mendez (Integration), Rachel Kim (E2E)
- **Skills**: testing-orchestrator, testing-team-session, testing-strategy-advisor, testing-unit-specialist, testing-integration-specialist, testing-e2e-engineer, testing-coverage-analyzer

### DevOps Plugin (v1.0.0)
Location: `plugins/devops/`

CI/CD and infrastructure with 5 agents and 7 skills:
- **Agents**: Michael Chang (Lead), Emma Watson (CI), Alex Rivera (Deploy), Tom Anderson (Infra), Aisha Patel (Monitoring)
- **Skills**: devops-orchestrator, devops-team-session, devops-ci-architect, devops-deployment-engineer, devops-infrastructure-specialist, devops-monitoring-engineer, devops-container-specialist

### Data Plugin (v1.0.0)
Location: `plugins/data/`

Data modeling and pipelines with 5 agents and 7 skills:
- **Agents**: Jennifer Wu (Lead), Robert Garcia (Modeling), Anna Schmidt (Pipelines), Chris Lee (Analytics), Maria Santos (Governance)
- **Skills**: data-orchestrator, data-team-session, data-modeler, data-pipeline-architect, data-analytics-engineer, data-warehouse-specialist, data-governance-advisor

### Security Plugin (v1.0.0)
Location: `plugins/security/`

Security audits and compliance with 5 agents and 7 skills (defensive security only):
- **Agents**: Nathan Brooks (Lead), Diana Chen (Audit), Victor Okonkwo (Threat), Sarah Johnson (Compliance), Mark Thompson (Secrets)
- **Skills**: security-orchestrator, security-team-session, security-auditor, security-threat-modeler, security-compliance-advisor, security-secrets-manager, security-penetration-advisor

### Documentation Plugin (v1.0.0)
Location: `plugins/documentation/`

Technical writing with 5 agents and 7 skills:
- **Agents**: Patricia Moore (Lead), Andrew Kim (API), Laura Hernandez (Guides), Steven Brown (Arch), Michelle Lee (Runbooks)
- **Skills**: docs-orchestrator, docs-team-session, docs-api-writer, docs-guide-writer, docs-architecture-documenter, docs-runbook-writer, docs-onboarding-creator

## Cross-Domain Orchestration

### Taxonomy

The centralized taxonomy at `.claude-plugin/taxonomy.json` defines:
- **Domains**: user-experience, frontend, architecture, backend, testing, devops, data, security, documentation
- **Verbs**: create, audit, improve, document, test, deploy, migrate, design
- **Artifacts**: code (component, service, test), documentation (adr, api-spec), configuration, design

### Design-to-Code Workflow

The user-experience and frontend plugins work in sequence:
1. **User Experience** creates aesthetic briefs, typography specs, color systems, layout compositions
2. **Handoff** passes design context to frontend via `.claude/handoffs/`
3. **Frontend** implements components using design specifications

### Capability Registry

Each plugin should have a `.claude-plugin/capabilities.json` that declares:
- Domain and subdomains
- Collaboration targets (other domains it works with)
- Capabilities with verbs, artifacts, keywords, intent patterns
- Orchestrator skill reference

### Handoff Protocol

Cross-domain workflows use file-based handoffs in `.claude/handoffs/`:
- `session.json` - Session metadata, accumulated decisions
- `handoff_NNN.json` - Individual handoff context between domains
- `artifacts/` - Shared artifacts created during workflow

## Validation

Test plugins locally before committing:
```bash
/plugin validate ./plugins/<plugin-name>
```

## File Formats

### plugin.json (Valid Schema)
```json
{
  "name": "plugin-name",
  "description": "What this plugin does",
  "version": "1.0.0",
  "skills": ["./skills/"]
}
```

**Note:** The `agents` and `hooks` fields have strict schema requirements that may cause validation errors. Currently, only `skills` is reliably supported. Agent personas should be implemented as skills or included in skill prompts.

### capabilities.json (Cross-Domain Routing)
```json
{
  "plugin": { "name": "plugin-name", "version": "1.0.0" },
  "domain": {
    "primary": "domain-name",
    "subdomains": ["subdomain1", "subdomain2"],
    "collaborates_with": ["other-domain1", "other-domain2"]
  },
  "capabilities": [
    {
      "id": "domain.verb.artifact",
      "verb": "create",
      "artifacts": ["component"],
      "keywords": ["keyword1", "keyword2"],
      "intent_patterns": ["pattern with * wildcard"],
      "skill": "/skill-name",
      "priority": 8
    }
  ],
  "orchestrator": { "skill": "/domain-orchestrator" }
}
```

### SKILL.md
```markdown
---
name: skill-name
description: Brief description
---
# Instructions here
```

Use `${CLAUDE_PLUGIN_ROOT}` to reference files within the plugin directory.

### Agent Files
```markdown
# Agent Name

You are **Agent Name**, the [Role] - [brief description].

## Persona
- Name, role, expertise

## Personality Traits
- Trait descriptions

## Communication Style
- How the agent communicates

## Key Responsibilities
- What the agent does
```
