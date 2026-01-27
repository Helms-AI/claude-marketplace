# UX Plugin

A comprehensive **Conversational UX Team** for Claude Code with 8 specialized agent personas and 11 skills for modern frontend development.

## Installation

Add this plugin to your Claude Code marketplace:

```bash
claude marketplace add ./plugins/ux
```

## The UX Team

This plugin features a team of 8 specialized agents who collaborate on UI/UX challenges. Each agent has a distinct persona, expertise, and communication style.

### Team Members

| Agent | Name | Pronouns | Role | Expertise |
|-------|------|----------|------|-----------|
| **Lead** | Jordan Chen | they/them | Team Lead & Design Strategist | Orchestration, stakeholder communication |
| **Research** | Maya Torres | she/her | Senior User Researcher | Personas, journey maps, JTBD |
| **Architecture** | Alex Kim | he/him | Senior Component Architect | React 19, Vue 3.5, Svelte 5 |
| **Systems** | Sam Rivera | they/them | Design Systems Lead | Tokens, Tailwind 4.0, OKLCH |
| **Motion** | Jordan Park | she/her | Senior Motion Designer | Framer Motion, GSAP, Lottie, Rive |
| **A11y** | Casey Williams | they/them | Accessibility Lead | WCAG 2.2, ARIA, screen readers |
| **Responsive** | Riley Chen | he/him | Senior CSS Engineer | Container queries, fluid design |
| **Performance** | Taylor Brooks | she/her | Senior Performance Engineer | Core Web Vitals, INP optimization |

### Team Sessions

For complex, multi-disciplinary questions, invoke a team discussion:

```
/ux-team-session build me a dashboard for analytics
```

The team lead (Jordan Chen) will coordinate input from relevant team members, synthesize recommendations, and provide an action plan.

#### Example Team Session Flow

```
User: "Build me a dashboard"

Jordan (Lead): "Let me bring in the team..."
Maya (Research): "Who are the dashboard users? What's the JTBD?"
Sam (Systems): "I'll set up status colors and chart tokens using OKLCH"
Alex (Architecture): "Server Components for shell, Client for interactive charts"
Jordan M (Motion): "GSAP stagger animations for data cards, Recharts for viz"
Casey (A11y): "Charts need text alternatives, keyboard nav for widgets"
Taylor (Performance): "200KB JS budget, lazy load charts below fold"
Riley (Responsive): "Container queries for widget cards"
Jordan (Lead): "Here's our synthesized action plan..."
```

## Skills Overview

| Skill | Command | Description |
|-------|---------|-------------|
| **UX Orchestrator** | `/ux-orchestrator` | Routes requests to specialized skills |
| **Team Session** | `/ux-team-session` | Multi-agent team discussions |
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

## Usage

### Quick Start

Use the orchestrator for general UI/UX requests:

```
/ux-orchestrator build me a dashboard for analytics
```

The orchestrator will:
1. Ask clarifying questions about your requirements
2. Route to the appropriate specialized skills (or team session)
3. Synthesize results into a comprehensive deliverable

### Direct Skill Invocation

For specific tasks, invoke skills directly:

```
/ux-design-system create a dark mode theme
/ux-component-architect build a data table component
/ux-accessibility-auditor audit the checkout flow
/ux-performance-engineer optimize Core Web Vitals
/ux-motion-designer add page transitions with GSAP
/ux-data-viz create charts for the analytics page
/ux-storybook document the button component
```

### Team Collaboration

For comprehensive work, invoke a team session:

```
/ux-team-session redesign the onboarding flow
```

## Workflow Hooks

The plugin includes hooks that provide contextual reminders:

### PreToolUse Hooks (when writing code)
- **Casey (A11y)** reminds about ARIA and keyboard support when writing `.tsx`, `.jsx`, `.vue`, `.svelte` files

### PostToolUse Hooks (after writing code)
- **Riley (Responsive)** reminds about container queries when writing `.css` files
- **Jordan M (Motion)** reminds about `prefers-reduced-motion` when writing animation files

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

## Interactive Questions

Each skill uses AskUserQuestion to gather requirements at key decision points:

### Skill-Specific Questions

| Skill | Discovery Questions |
|-------|---------------------|
| Team Session | Challenge type, focus areas |
| Design System | Token format, brand colors, themes |
| Component Architect | Framework, rendering strategy, patterns |
| Motion Designer | Animation library, types, performance |
| Accessibility Auditor | WCAG level, AT support, scope |
| Responsive Engineer | Strategy, queries, breakpoints |
| Performance Engineer | Targets, concerns, build setup |
| User Researcher | Artifacts, existing data, depth |
| Data Viz | Chart type, library, accessibility |
| Storybook | Goal, framework, addons |
| Figma Sync | Sync goal, token format, method |

## Example Workflows

### Building a Dashboard

```
User: Build me an analytics dashboard

1. /ux-team-session coordinates team input
2. Maya identifies user needs and personas
3. Sam sets up dashboard tokens
4. Alex creates RSC shell + Client chart widgets
5. Jordan M adds GSAP stagger animations
6. Casey reviews for accessibility
7. Riley implements container query layouts
8. Taylor sets performance budgets
9. Team synthesizes action plan
```

### Accessibility Audit

```
User: Audit my checkout flow for accessibility

1. /ux-accessibility-auditor asks about WCAG level
2. Casey runs automated checks with axe-core
3. Performs manual audit checklist
4. Provides remediation code examples
5. Documents compliance status
```

### Adding Animations

```
User: Add page transitions to my app

1. /ux-motion-designer asks about animation approach
2. Jordan M recommends GSAP or View Transitions
3. Implements entrance animations
4. Adds scroll-triggered reveals
5. Ensures reduced motion support
6. Documents timing tokens
```

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
│   └── plugin.json              # Plugin manifest with agents + hooks
├── agents/                      # 8 agent personas
│   ├── ux-lead.md               # Jordan Chen - Team Lead
│   ├── maya-researcher.md       # Maya Torres - User Researcher
│   ├── alex-architect.md        # Alex Kim - Component Architect
│   ├── sam-systems.md           # Sam Rivera - Design Systems
│   ├── jordan-motion.md         # Jordan Park - Motion Designer
│   ├── casey-a11y.md            # Casey Williams - Accessibility
│   ├── riley-responsive.md      # Riley Chen - CSS Engineer
│   └── taylor-perf.md           # Taylor Brooks - Performance
├── skills/
│   ├── ux-orchestrator/SKILL.md
│   ├── ux-team-session/SKILL.md
│   ├── ux-design-system/SKILL.md
│   ├── ux-component-architect/SKILL.md
│   ├── ux-motion-designer/SKILL.md
│   ├── ux-accessibility-auditor/SKILL.md
│   ├── ux-responsive-engineer/SKILL.md
│   ├── ux-performance-engineer/SKILL.md
│   ├── ux-user-researcher/SKILL.md
│   ├── ux-data-viz/SKILL.md
│   ├── ux-storybook/SKILL.md
│   └── ux-figma-sync/SKILL.md
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
3. Include AskUserQuestion integration
4. Consider adding a corresponding agent in `agents/`
5. Update this README

## License

MIT
