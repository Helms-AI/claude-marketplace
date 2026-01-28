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
| **[ux](./plugins/ux)** | 3.0.0 | frontend | Aesthetic-first UX Team with 10 specialized agents and 18 skills for distinctive, memorable frontend design |

## UX Plugin Overview

The flagship plugin provides a complete **Conversational UX Team** for modern frontend development.

### 10 Agent Personas

| Agent | Name | Role |
|-------|------|------|
| **Lead** | Jordan Chen | Team Lead & Design Strategist |
| **Aesthetic** | Quinn | Aesthetic Director |
| **Typography** | Avery | Typography Curator |
| **Research** | Maya Torres | Senior User Researcher |
| **Architecture** | Alex Kim | Senior Component Architect |
| **Systems** | Sam Rivera | Design Systems Lead |
| **Motion** | Jordan Park | Senior Motion Designer |
| **A11y** | Casey Williams | Accessibility Lead |
| **Responsive** | Riley Chen | Senior CSS Engineer |
| **Performance** | Taylor Brooks | Senior Performance Engineer |

### 18 Skills

| Skill | Command | Description |
|-------|---------|-------------|
| **Orchestrator** | `/ux-orchestrator` | Routes requests to specialized skills |
| **Team Session** | `/ux-team-session` | Multi-agent team discussions |
| **Aesthetic Director** | `/ux-aesthetic-director` | Visual identity and aesthetic direction |
| **Typography Curator** | `/ux-typography-curator` | Type systems and font curation |
| **Color Alchemist** | `/ux-color-alchemist` | Color science and palette creation |
| **Layout Composer** | `/ux-layout-composer` | Spatial rhythm and composition |
| **Texture Atmosphere** | `/ux-texture-atmosphere` | Depth, texture, and atmosphere |
| **Micro Delight** | `/ux-micro-delight` | Micro-interactions and delightful moments |
| **Design System** | `/ux-design-system` | Style Dictionary, Tailwind 4.0, multi-theme |
| **Component Architect** | `/ux-component-architect` | React 19 RSC, Vue 3.5, Svelte 5 |
| **Motion Designer** | `/ux-motion-designer` | GSAP, Lottie, Rive, Framer Motion |
| **Accessibility Auditor** | `/ux-accessibility-auditor` | WCAG 2.2 AA/AAA, ARIA patterns |
| **Responsive Engineer** | `/ux-responsive-engineer` | Container queries, fluid typography |
| **Performance Engineer** | `/ux-performance-engineer` | LCP/INP/CLS, code splitting |
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
│   └── ux/                   # UX Team plugin (v3.0.0)
│       ├── .claude-plugin/
│       │   └── plugin.json   # Plugin manifest
│       ├── agents/           # 10 agent personas
│       ├── skills/           # 18 skills
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
