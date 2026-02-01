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
- **Already bumped? Bump patch**: If `git diff` shows the version was already bumped but not committed, always increment the patch version (Z) for any additional changes in the same uncommitted batch.

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
    ├── documentation/        # Documentation Team (API docs, guides, runbooks)
    └── dashboard/            # Web Dashboard (visualization, monitoring, real-time)
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

### Dashboard Plugin (v2.25.0)
Location: `plugins/dashboard/`

Real-time web dashboard for visualizing the marketplace:
- **Skills**: dashboard
- **Purpose**: View all agents, skills, changesets, and domain interactions in a web UI
- **Features**:
  - Agent Explorer: 58 agents across 10 domains with search/filter
  - Skill Browser: 77 skills with handoff relationships
  - Changeset Viewer: Real-time conversation tracking via SSE
  - Domain Graph: D3.js visualization of domain collaborations
  - Handoff Timeline: Visual swimlane view of cross-domain handoffs
  - SDK Terminal: Interactive Claude terminal with streaming responses
- **Tech**: Flask server, Lit Web Components, Preact Signals, D3.js
- **Launch**: `/dashboard` or `python -m server.app --open-browser`
- **URL**: http://localhost:24282

See [Dashboard Frontend Architecture](#dashboard-frontend-architecture) for component development requirements.

## Cross-Domain Orchestration

### Taxonomy

The centralized taxonomy at `.claude-plugin/taxonomy.json` defines:
- **Domains**: user-experience, frontend, architecture, backend, testing, devops, data, security, documentation
- **Verbs**: create, audit, improve, document, test, deploy, migrate, design
- **Artifacts**: code (component, service, test), documentation (adr, api-spec), configuration, design

### Design-to-Code Workflow

The user-experience and frontend plugins work in sequence:
1. **User Experience** creates aesthetic briefs, typography specs, color systems, layout compositions
2. **Handoff** passes design context to frontend via `.claude/changesets/`
3. **Frontend** implements components using design specifications

### Capability Registry

Each plugin should have a `.claude-plugin/capabilities.json` that declares:
- Domain and subdomains
- Collaboration targets (other domains it works with)
- Capabilities with verbs, artifacts, keywords, intent patterns
- Orchestrator skill reference

### Changeset Protocol

Cross-domain workflows use file-based changesets in `.claude/changesets/`:

```
.claude/
└── changesets/
    └── 20260129-143052-implement-user-auth/
        ├── changeset.json      # Changeset metadata, accumulated decisions
        ├── handoff_001.json    # Individual handoff context between domains
        ├── handoff_002.json
        └── artifacts/          # Shared artifacts created during workflow
            └── api-spec.md
```

**Directory naming format**: `{YYYYMMDD}-{HHMMSS}-{normalized-task-description}`
- Date/time: Sortable format `20260129-143052`
- Task description: Max 30 characters, hyphenated, lowercase

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

## Dashboard Frontend Architecture

**CRITICAL: All frontend development in `plugins/dashboard/web/` MUST follow these patterns.**

### Technology Stack

- **Lit 3.x** - Web Components framework (CDN, zero-build)
- **Preact Signals** - Fine-grained reactive state management
- **Lucide Icons** - Icon library
- **D3.js** - Graph visualizations
- **Marked** - Markdown parsing

### Atomic Design Hierarchy

Components are organized following atomic design principles. **Always place new components in the correct layer:**

```
plugins/dashboard/web/js/components/
├── atoms/          # 22 basic building blocks (buttons, inputs, icons)
├── molecules/      # 20 atom combinations (search inputs, tab buttons)
├── organisms/      # 14 complex sections (modals, panels, graphs)
├── layout/         # 7 page structures (shell, sidebar, editor)
├── explorer/       # 7 tree view components
├── terminal/       # 6 SDK terminal components
├── tool-cards/     # 11 tool result renderers
├── conversation/   # 3 transcript viewers
├── indicators/     # 2 status components
└── core/           # 3 base classes and mixins
```

#### Layer Definitions

| Layer | Purpose | Examples |
|-------|---------|----------|
| **Atoms** | Indivisible UI primitives | `dash-button`, `dash-input`, `dash-icon`, `dash-spinner` |
| **Molecules** | Atom combinations with simple behavior | `search-input`, `tab-button`, `dropdown-menu` |
| **Organisms** | Complex sections with business logic | `command-palette`, `agent-detail-modal`, `domain-graph` |
| **Layout** | Page structure and containers | `dashboard-shell`, `sidebar-panel`, `editor-area` |

### Component Requirements

**1. Use SignalWatcher Mixin for Store-Connected Components**
```javascript
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions } from '../../store/app-state.js';

class MyComponent extends SignalWatcher(LitElement) {
    render() {
        // Accessing signals auto-subscribes to changes
        return html`Count: ${AppStore.agents.value.length}`;
    }
}
```

**2. Self-Register Components**
```javascript
class DashButton extends LitElement {
    static properties = { /* ... */ };
    static styles = css`/* ... */`;
    render() { return html`/* ... */`; }
}
customElements.define('dash-button', DashButton);
export { DashButton };
```

**3. Use CSS Variables for Theming**
```css
.my-component {
    background: var(--bg-primary);
    color: var(--text-primary);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
}
```

**4. Domain Colors** - Apply using `domain-{name}` classes:
```javascript
const domainClass = `domain-${item.domain}`;
return html`<span class="item-name ${domainClass}">${item.name}</span>`;
```

### State Management Pattern

All state lives in `store/app-state.js` using Preact Signals:

```javascript
// Reading state (auto-subscribes in SignalWatcher components)
const agents = AppStore.agents.value;

// Mutating state (use Actions)
Actions.setSelectedAgent(agent);
Actions.toggleSidebar();

// Computed values for derived state
const filtered = filteredAgents.value;  // Auto-updates when dependencies change
```

**Never mutate signals directly in components.** Always use Actions.

### Service Layer

Services handle data fetching and business logic:

```javascript
import { AgentService } from '../../services/agent-service.js';

// Services are singletons
const agents = await AgentService.fetchAgents();
```

Available services:
- `AgentService`, `SkillService`, `ChangesetService` - Domain data
- `SSEService` - Real-time event streaming
- `SDKClient` - Claude SDK integration
- `ThemeService`, `ModalService`, `TabService` - UI services

### Event Communication

**Child → Parent**: Custom events
```javascript
this.dispatchEvent(new CustomEvent('agent-select', {
    detail: { agent },
    bubbles: true,
    composed: true
}));
```

**Parent → Child**: Properties
```javascript
<agent-item .agent=${agent} ?selected=${isSelected}></agent-item>
```

**Sibling ↔ Sibling**: Store
```javascript
// Component A
Actions.setSelectedAgent(agent);

// Component B (SignalWatcher)
render() {
    return html`Selected: ${AppStore.selectedAgent.value?.name}`;
}
```

### File Naming Conventions

- **Components**: `kebab-case.js` → `dash-button.js`, `agent-tree.js`
- **Services**: `kebab-case.js` → `agent-service.js`, `sse-service.js`
- **Custom element names**: `dash-*` for atoms/molecules, descriptive for organisms

### Creating New Components

1. **Determine the layer** (atom, molecule, organism, etc.)
2. **Create file** in appropriate folder
3. **Add export** to layer's `index.js`
4. **Use SignalWatcher** if component needs store access
5. **Follow patterns** from existing components in same layer

Example atom:
```javascript
// components/atoms/my-badge.js
import { LitElement, html, css } from 'lit';

class MyBadge extends LitElement {
    static properties = {
        label: { type: String },
        variant: { type: String }
    };

    static styles = css`
        :host { display: inline-flex; }
        .badge {
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--radius-sm);
            font-size: var(--font-size-xs);
        }
    `;

    render() {
        return html`<span class="badge ${this.variant}">${this.label}</span>`;
    }
}

customElements.define('my-badge', MyBadge);
export { MyBadge };
```

### Inheritance Patterns

**Tool Cards** - Inherit from `ToolCardBase`:
```javascript
import { ToolCardBase, toolCardBaseStyles } from './tool-card-base.js';

class MyToolCard extends ToolCardBase {
    static styles = [toolCardBaseStyles, css`/* additional */`];
    // ...
}
```

**Tree Items** - Use `treeItemBaseStyles`:
```javascript
import { treeItemBaseStyles } from './tree-item-base.js';

class MyTreeItem extends LitElement {
    static styles = [treeItemBaseStyles, css`/* additional */`];
}
```
