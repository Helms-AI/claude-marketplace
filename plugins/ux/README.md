# UX Plugin

A comprehensive **Aesthetic-First UX Team** for Claude Code with 10 specialized agent personas and 22 skills for distinctive, memorable frontend design.

## Installation

Add this plugin to your Claude Code marketplace:

```bash
claude marketplace add ./plugins/ux
```

## Philosophy

This plugin fights against generic, template-like designs. Every project starts with **aesthetic direction** before implementation, ensuring distinctive visual identity rather than "yet another SaaS landing page."

### Key Principles

- **Aesthetic-First**: Establish visual identity and tone before picking any pixels
- **Team Visibility**: See which agent is working with visible announcements and handoffs
- **Quality Gates**: Pre-finalization checkpoints ensure team review before delivery
- **Agent Collaboration**: Cross-functional partnerships validate decisions across disciplines

## The UX Team

This plugin features a team of 10 specialized agents who collaborate on UI/UX challenges. Each agent has a distinct persona, expertise, and communication style.

### Core Team Members

| Agent | Name | Role | Expertise |
|-------|------|------|-----------|
| **Lead** | Jordan Chen | Team Lead & Design Strategist | Orchestration, stakeholder communication |
| **Aesthetic** | Quinn Martinez | Aesthetic Director | Visual identity, brand differentiation, anti-generic guardian |
| **Typography** | Avery Nakamura | Typography Curator | Font selection, pairing theory, typographic voice |
| **Research** | Maya Torres | Senior User Researcher | Personas, journey maps, JTBD |
| **Architecture** | Alex Kim | Senior Component Architect | React 19, Vue 3.5, Svelte 5 |
| **Systems** | Sam Rivera | Design Systems Lead | Tokens, Tailwind 4.0, OKLCH |
| **Motion** | Jordan Park | Senior Motion Designer | Framer Motion, GSAP, Lottie, Rive |
| **A11y** | Casey Williams | Accessibility Lead | WCAG 2.2, ARIA, screen readers |
| **Responsive** | Riley Chen | Senior CSS Engineer | Container queries, fluid design |
| **Performance** | Taylor Brooks | Senior Performance Engineer | Core Web Vitals, INP optimization |

### Additional Specialists

| Specialist | Name | Focus |
|------------|------|-------|
| **Color** | Morgan Blake | OKLCH color science, emotional palettes |
| **Layout** | Skyler Okonkwo | Grid-breaking spatial composition |
| **Texture** | Indigo Vasquez | Depth, grain, atmospheric effects |
| **Micro-Delight** | Ember Nguyen | Hover states, loading personality |
| **Data Viz** | Drew Patel | Charts, graphs, data storytelling |
| **Progress UI** | Kai Tanaka | Loading states, skeleton screens |
| **Forms** | Jesse Morgan | Form layout, validation, wizards |
| **Navigation** | Sage Martinez | Tabs, breadcrumbs, sidebars |
| **Data Grid** | Reese Kim | Tables, sorting, virtualization |
| **Storybook** | Parker Lee | Component documentation |
| **Figma** | Cameron Reyes | Design token sync |

### Agent Collaborations

The team has built-in collaboration patterns:

- **Quinn ↔ Maya**: Research validates aesthetic direction
- **Avery ↔ Taylor**: Font choices reviewed for performance impact
- **Sam ↔ Casey**: Design tokens enforce accessibility by default

### Team Sessions

For complex, multi-disciplinary questions, invoke a team discussion:

```
/ux-team-session build me a dashboard for analytics
```

The team lead (Jordan Chen) will coordinate input from relevant team members, synthesize recommendations, and provide an action plan.

## Skills Overview

### Orchestration & Collaboration

| Skill | Command | Description |
|-------|---------|-------------|
| **Orchestrator** | `/ux-orchestrator` | Routes requests with quality gates |
| **Team Session** | `/ux-team-session` | Multi-agent team discussions |

### Aesthetic Foundation

| Skill | Command | Description |
|-------|---------|-------------|
| **Aesthetic Director** | `/ux-aesthetic-director` | Visual identity and anti-generic direction |
| **Typography Curator** | `/ux-typography-curator` | Font pairing with personality |
| **Color Alchemist** | `/ux-color-alchemist` | OKLCH color science, emotional palettes |
| **Layout Composer** | `/ux-layout-composer` | Grid-breaking spatial composition |
| **Texture Atmosphere** | `/ux-texture-atmosphere` | Depth, grain, atmospheric effects |
| **Micro Delight** | `/ux-micro-delight` | Hover states, loading personality |

### Implementation

| Skill | Command | Description |
|-------|---------|-------------|
| **Design System** | `/ux-design-system` | Style Dictionary, Tailwind 4.0, multi-theme |
| **Component Architect** | `/ux-component-architect` | React 19 RSC, Vue 3.5, Svelte 5 |
| **Progress UI** | `/ux-progress-ui` | Loading states, skeleton screens, optimistic UI |
| **Form Experience** | `/ux-form-experience` | Form layout, validation, multi-step wizards |
| **Navigation Patterns** | `/ux-navigation-patterns` | Tabs, breadcrumbs, sidebars, pagination |
| **Data Grid** | `/ux-data-grid` | Tables, sorting, filtering, virtualization |

### Quality & Enhancement

| Skill | Command | Description |
|-------|---------|-------------|
| **Motion Designer** | `/ux-motion-designer` | GSAP, Lottie, Rive, Framer Motion |
| **Accessibility Auditor** | `/ux-accessibility-auditor` | WCAG 2.2 AA/AAA, ARIA patterns |
| **Responsive Engineer** | `/ux-responsive-engineer` | Container queries, fluid typography |
| **Performance Engineer** | `/ux-performance-engineer` | LCP/INP/CLS, code splitting |

### Research & Documentation

| Skill | Command | Description |
|-------|---------|-------------|
| **User Researcher** | `/ux-user-researcher` | Personas, journey maps, JTBD |
| **Data Visualization** | `/ux-data-viz` | D3, Recharts, Tremor |
| **Storybook** | `/ux-storybook` | Component documentation, CSF3 |
| **Figma Sync** | `/ux-figma-sync` | Figma Variables, Token Studio |

## Usage

### Quick Start

Use the orchestrator for general UI/UX requests:

```
/ux-orchestrator build me a dashboard for analytics
```

The orchestrator will:
1. Ask clarifying questions about your requirements
2. Ask what the design should NOT look like (anti-patterns)
3. Start with aesthetic direction before implementation
4. Route to appropriate specialized skills
5. Run quality gate before final delivery

### Direct Skill Invocation

For specific tasks, invoke skills directly:

```
/ux-aesthetic-director establish the visual direction
/ux-typography-curator select fonts with personality
/ux-design-system create a dark mode theme
/ux-component-architect build a data table component
/ux-form-experience design the checkout form
/ux-navigation-patterns create the app navigation
/ux-data-grid build a sortable user table
/ux-progress-ui design loading states
/ux-accessibility-auditor audit the checkout flow
/ux-performance-engineer optimize Core Web Vitals
/ux-motion-designer add page transitions with GSAP
/ux-data-viz create charts for the analytics page
```

### Aesthetic-First Workflow

For comprehensive work, the orchestrator follows this workflow:

1. **Aesthetic Phase**: `/ux-aesthetic-director` establishes direction
2. **Research Phase**: `/ux-user-researcher` validates with personas
3. **Foundation Phase**: Typography, color, design system tokens
4. **Composition Phase**: Layout, components, forms, navigation
5. **Enhancement Phase**: Motion, micro-delights, progress UI
6. **Quality Phase**: Accessibility audit, performance review

## Quality Gates

Before delivering final output, the orchestrator offers quality verification:

- **Quick verification**: Key checks (a11y, responsive, performance)
- **Full team review**: Each agent validates their domain
- **Conflict resolution**: Discuss trade-offs when concerns are flagged

## Technologies Covered

### Frameworks
- React 19+ with Server Components
- Next.js 15+ with App Router
- Vue 3.5+ with Composition API
- Svelte 5 with Runes
- Astro 5 with Islands Architecture

### Styling
- Tailwind CSS 4.0 with @theme
- CSS Container Queries
- CSS Subgrid
- OKLCH Color Science

### Animation
- GSAP with ScrollTrigger
- Lottie (lottie-react)
- Rive (@rive-app/react-canvas)
- Framer Motion 11
- View Transitions API
- Scroll-driven CSS animations

### Data Visualization
- D3.js
- Recharts
- Tremor

### Design Tokens
- W3C Design Token Format
- Style Dictionary 4.0
- Figma Variables API
- Token Studio

### Testing & Documentation
- Storybook 8 with CSF3
- axe-core for accessibility
- Playwright for E2E
- **Playwright MCP for live browser verification**

## Live Browser Verification

All skills support **Playwright MCP integration** for live browser verification:

- **Verify implementations** in real browsers
- **Measure Core Web Vitals** (LCP, CLS, INP)
- **Test responsive layouts** across viewports
- **Audit accessibility** with keyboard and screen reader testing
- **Record GIFs** for animation documentation
- **Test themes** and design token application

## File Structure

```
plugins/ux/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── agents/                      # 10 agent personas
│   ├── ux-lead.md               # Jordan Chen - Team Lead
│   ├── quinn-aesthetic.md       # Quinn Martinez - Aesthetic Director
│   ├── avery-typography.md      # Avery Nakamura - Typography
│   ├── maya-researcher.md       # Maya Torres - User Researcher
│   ├── alex-architect.md        # Alex Kim - Component Architect
│   ├── sam-systems.md           # Sam Rivera - Design Systems
│   ├── jordan-motion.md         # Jordan Park - Motion Designer
│   ├── casey-a11y.md            # Casey Williams - Accessibility
│   ├── riley-responsive.md      # Riley Chen - CSS Engineer
│   └── taylor-perf.md           # Taylor Brooks - Performance
├── skills/                      # 22 skills
│   ├── ux-orchestrator/
│   ├── ux-team-session/
│   ├── ux-aesthetic-director/
│   ├── ux-typography-curator/
│   ├── ux-color-alchemist/
│   ├── ux-layout-composer/
│   ├── ux-texture-atmosphere/
│   ├── ux-micro-delight/
│   ├── ux-design-system/
│   ├── ux-component-architect/
│   ├── ux-progress-ui/
│   ├── ux-form-experience/
│   ├── ux-navigation-patterns/
│   ├── ux-data-grid/
│   ├── ux-motion-designer/
│   ├── ux-accessibility-auditor/
│   ├── ux-responsive-engineer/
│   ├── ux-performance-engineer/
│   ├── ux-user-researcher/
│   ├── ux-data-viz/
│   ├── ux-storybook/
│   └── ux-figma-sync/
└── README.md
```

## Auto-Trigger Keywords

The orchestrator automatically activates when you mention:
- "user interface", "UI", "UX"
- "frontend", "design"
- "build me a [component/page/app]"
- "create a [dashboard/form/layout]"

## Contributing

To add new skills or improve existing ones:

1. Create a new skill file in `skills/[skill-name]/SKILL.md`
2. Follow the YAML frontmatter format
3. Include Agent Announcement section
4. Include Handoff Protocol section
5. Include AskUserQuestion integration with agent attribution
6. Consider adding a corresponding agent in `agents/`
7. Update this README

## License

MIT
