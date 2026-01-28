# Claude Marketplace

Enterprise marketplace for sharing Claude Code plugins across organizations.

## Quick Start

### Add the Marketplace

```bash
/plugin marketplace add Helms-AI/claude-marketplace
```

### Install the UX Plugin

```bash
/plugin install ux@helms-ai-marketplace
```

### List Available Plugins

```bash
/plugin list helms-ai-marketplace
```

## Available Plugins

| Plugin | Version | Category | Description |
|--------|---------|----------|-------------|
| **[ux](./plugins/ux)** | 3.1.0 | frontend | Aesthetic-first UX Team with 10 specialized agents and 22 skills for distinctive, memorable frontend design |

## UX Plugin Overview

The flagship plugin provides a complete **Conversational UX Team** for modern frontend development with an aesthetic-first philosophy.

### Key Features

- **Aesthetic-First Workflow**: Every project starts with visual identity before implementation
- **Team Visibility**: See which agent is working and watch handoffs between specialists
- **Quality Gates**: Pre-finalization checkpoints with team review protocol
- **Agent Collaboration**: Cross-functional partnerships (Research↔Aesthetic, Typography↔Performance, Systems↔Accessibility)

### 10 Agent Personas

| Agent | Name | Role |
|-------|------|------|
| **Lead** | Jordan Chen | Team Lead & Design Strategist |
| **Aesthetic** | Quinn Martinez | Aesthetic Director |
| **Typography** | Avery Nakamura | Typography Curator |
| **Color** | Morgan Blake | Color Alchemist |
| **Layout** | Skyler Okonkwo | Layout Composer |
| **Research** | Maya Torres | Senior User Researcher |
| **Architecture** | Alex Kim | Senior Component Architect |
| **Systems** | Sam Rivera | Design Systems Lead |
| **Motion** | Jordan Park | Senior Motion Designer |
| **A11y** | Casey Williams | Accessibility Lead |
| **Responsive** | Riley Chen | Senior CSS Engineer |
| **Performance** | Taylor Brooks | Senior Performance Engineer |

*Plus 6 additional specialists for texture, micro-interactions, data visualization, forms, navigation, and data grids.*

### 22 Skills

#### Orchestration & Collaboration
| Skill | Command | Description |
|-------|---------|-------------|
| **Orchestrator** | `/ux-orchestrator` | Routes requests to specialized skills with quality gates |
| **Team Session** | `/ux-team-session` | Multi-agent team discussions with visible handoffs |

#### Aesthetic Foundation
| Skill | Command | Description |
|-------|---------|-------------|
| **Aesthetic Director** | `/ux-aesthetic-director` | Visual identity, tone, and anti-generic direction |
| **Typography Curator** | `/ux-typography-curator` | Font pairing with personality, not defaults |
| **Color Alchemist** | `/ux-color-alchemist` | OKLCH color science, emotional palettes |
| **Layout Composer** | `/ux-layout-composer` | Grid-breaking spatial composition |
| **Texture Atmosphere** | `/ux-texture-atmosphere` | Depth, grain, and atmospheric effects |
| **Micro Delight** | `/ux-micro-delight` | Hover states, empty states, loading personality |

#### Implementation
| Skill | Command | Description |
|-------|---------|-------------|
| **Design System** | `/ux-design-system` | Style Dictionary, Tailwind 4.0, multi-theme |
| **Component Architect** | `/ux-component-architect` | React 19 RSC, Vue 3.5, Svelte 5 |
| **Progress UI** | `/ux-progress-ui` | Loading states, skeleton screens, optimistic UI |
| **Form Experience** | `/ux-form-experience` | Form layout, validation, multi-step wizards |
| **Navigation Patterns** | `/ux-navigation-patterns` | Tabs, breadcrumbs, sidebars, pagination |
| **Data Grid** | `/ux-data-grid` | Tables, sorting, filtering, virtualization |

#### Quality & Enhancement
| Skill | Command | Description |
|-------|---------|-------------|
| **Motion Designer** | `/ux-motion-designer` | GSAP, Lottie, Rive, Framer Motion |
| **Accessibility Auditor** | `/ux-accessibility-auditor` | WCAG 2.2 AA/AAA, ARIA patterns |
| **Responsive Engineer** | `/ux-responsive-engineer` | Container queries, fluid typography |
| **Performance Engineer** | `/ux-performance-engineer` | LCP/INP/CLS, code splitting |

#### Research & Documentation
| Skill | Command | Description |
|-------|---------|-------------|
| **User Researcher** | `/ux-user-researcher` | Personas, journey maps, JTBD |
| **Data Visualization** | `/ux-data-viz` | D3, Recharts, Tremor |
| **Storybook** | `/ux-storybook` | Component documentation, CSF3 |
| **Figma Sync** | `/ux-figma-sync` | Figma Variables, Token Studio |

### Technologies

- **Frameworks**: React 19, Vue 3.5, Svelte 5, Next.js 15, Astro 5
- **Styling**: Tailwind CSS 4.0, CSS Container Queries, OKLCH Color Science
- **Animation**: GSAP, Lottie, Rive, Framer Motion, View Transitions API
- **Data Viz**: D3.js, Recharts, Tremor
- **Accessibility**: WCAG 2.2, ARIA, axe-core
- **Design Tokens**: W3C Format, Style Dictionary 4.0, Figma Variables

## Directory Structure

```
claude-marketplace/
├── .claude-plugin/
│   └── marketplace.json      # Registry of all plugins
├── plugins/
│   └── ux/                   # UX Team plugin (v3.1.0)
│       ├── .claude-plugin/
│       │   └── plugin.json   # Plugin manifest
│       ├── agents/           # 10 agent personas
│       ├── skills/           # 22 skills
│       └── README.md
├── .github/                  # GitHub templates
├── CLAUDE.md                 # Claude Code instructions
├── CONTRIBUTING.md           # Contribution guidelines
└── LICENSE                   # MIT license
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Adding a New Plugin

1. Fork this repository
2. Create your plugin in `plugins/<plugin-name>/`
3. Add a `.claude-plugin/plugin.json` manifest
4. Register in `.claude-plugin/marketplace.json`
5. Submit a pull request

### Plugin Structure

```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest (required)
├── skills/                   # Slash commands
│   └── <skill-name>/
│       └── SKILL.md
├── agents/                   # Agent personas
│   └── <agent-name>.md
├── scripts/                  # Hook scripts
└── README.md                 # Documentation (required)
```

### Plugin Manifest

```json
{
  "name": "plugin-name",
  "description": "What this plugin does",
  "version": "1.0.0",
  "skills": ["./skills/"]
}
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
