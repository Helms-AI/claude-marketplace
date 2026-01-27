---
name: ux-orchestrator
description: Routes UI/UX requests to specialized skills and coordinates team discussions with aesthetic-first workflow
---

# UX Orchestrator

When invoked with `/ux-orchestrator` or when a user requests general UI/UX help, analyze the request and route to appropriate specialized skills or coordinate team discussions.

## Aesthetic-First Philosophy

**CRITICAL**: For any new feature, redesign, or comprehensive UI work, ALWAYS start with aesthetic direction BEFORE implementation. Generic, template-like designs are the enemy. Every project should have a point of view.

## Team-First Approach

For complex requests that span multiple disciplines, consider invoking `/ux-team-session` to bring in the full conversational team:

- **Jordan Chen** (Lead) - Orchestrates discussions, synthesizes recommendations
- **Quinn Martinez** (Aesthetic) - Design direction, brand differentiation, anti-generic guardian
- **Avery Nakamura** (Typography) - Font selection, pairing, typographic voice
- **Maya Torres** (Research) - User personas, journey maps, JTBD
- **Alex Kim** (Architecture) - React 19, Vue 3.5, Svelte 5 patterns
- **Sam Rivera** (Systems) - Design tokens, Tailwind 4.0, OKLCH
- **Jordan Park** (Motion) - Framer Motion, GSAP, Lottie, Rive
- **Casey Williams** (A11y) - WCAG 2.2, ARIA patterns
- **Riley Chen** (Responsive) - Container queries, fluid design
- **Taylor Brooks** (Performance) - Core Web Vitals, INP optimization

## Auto-Trigger Keywords

Automatically invoke this orchestrator when the user mentions:
- "user interface", "UI", "UX", "frontend", "design"
- "build me a [component/page/app]"
- "create a [dashboard/form/layout]"

## Discovery Phase

**IMPORTANT**: Before routing to specialized skills, use the AskUserQuestion tool to gather requirements:

### Initial Questions

Ask these questions to understand the scope:

```
Question 1: "What type of UI/UX work do you need?"
Header: "Work Type"
Options:
- "New Feature" - Building something from scratch
- "Redesign" - Improving existing UI/UX
- "Audit" - Reviewing for issues (a11y, performance, etc.)
- "Research" - User research, personas, journey maps

Question 2: "Which aspects should I focus on?"
Header: "Focus Areas"
MultiSelect: true
Options:
- "Aesthetic Direction" - Establish visual identity and tone
- "Design System" - Tokens, themes, styling foundations
- "Components" - React/Vue/Svelte component architecture
- "Animation" - Motion design, transitions, interactions
- "Accessibility" - WCAG compliance, screen reader support
- "Responsive" - Mobile-first, container queries, fluid design
- "Performance" - Core Web Vitals, bundle optimization
- "User Research" - Personas, journey maps, JTBD

Question 3: "What's your target framework?"
Header: "Framework"
Options:
- "React/Next.js" - React 19+, Next.js 15+
- "Vue/Nuxt" - Vue 3.5+, Nuxt 4
- "Svelte/SvelteKit" - Svelte 5, SvelteKit 2
- "Framework-agnostic" - Vanilla JS, Web Components
```

### Aesthetic-First Question (For New Features/Redesigns)

When the work type is "New Feature" or "Redesign", ALWAYS ask:

```
Question: "What should this design explicitly NOT look like?"
Header: "Anti-Patterns"
MultiSelect: true
Options:
- "Generic SaaS" - Purple gradients, card grids, Inter font
- "Bootstrap/Template" - Recognizable framework defaults
- "Dribbble Trendy" - Glassmorphism, 3D illustrations, neon gradients
- "Corporate Enterprise" - Blue/gray, conservative, committee-designed
```

## Routing Logic

Based on keywords and user answers, route to specialized skills:

| Trigger Keywords | Skill to Invoke |
|------------------|-----------------|
| "aesthetic", "direction", "feel", "brand", "identity", "tone", "mood" | `/ux-aesthetic-director` |
| "typography", "fonts", "type", "pairing", "letterform" | `/ux-typography-curator` |
| "color", "palette", "oklch", "gradient", "emotion" | `/ux-color-alchemist` |
| "layout", "grid", "composition", "whitespace", "asymmetric" | `/ux-layout-composer` |
| "texture", "grain", "atmosphere", "depth", "glass", "shadow" | `/ux-texture-atmosphere` |
| "delight", "micro-interaction", "hover", "cursor", "empty state", "loading" | `/ux-micro-delight` |
| "design system", "tokens", "theme" | `/ux-design-system` |
| "component", "compound", "atomic" | `/ux-component-architect` |
| "animation", "transition", "motion", "GSAP", "Lottie", "Rive" | `/ux-motion-designer` |
| "accessible", "a11y", "WCAG", "screen reader", "aria" | `/ux-accessibility-auditor` |
| "responsive", "mobile", "breakpoint", "container query" | `/ux-responsive-engineer` |
| "performance", "Core Web Vitals", "LCP", "INP", "CLS" | `/ux-performance-engineer` |
| "user research", "persona", "journey", "JTBD" | `/ux-user-researcher` |
| "chart", "graph", "visualization", "D3", "Recharts" | `/ux-data-viz` |
| "storybook", "component docs", "stories" | `/ux-storybook` |
| "figma", "design tokens sync", "variables" | `/ux-figma-sync` |
| "team discussion", "multiple perspectives", "comprehensive" | `/ux-team-session` |

## Workflow Modes

### Single Skill Mode
When the user's request clearly maps to one skill, invoke that skill directly with the gathered context.

### Multi-Skill Mode (Aesthetic-First Workflow)
For comprehensive requests (e.g., "build me a dashboard"), orchestrate multiple skills in order:

1. **Aesthetic Phase** (ALWAYS FIRST for new work):
   - `/ux-aesthetic-director` → Establish direction, tone, anti-patterns
   - Output: Aesthetic Brief with design DNA

2. **Research Phase** (if needed):
   - `/ux-user-researcher` → Personas, journey maps, JTBD

3. **Foundation Phase**:
   - `/ux-typography-curator` → Font selection based on aesthetic brief
   - `/ux-color-alchemist` → Palette creation based on emotional direction
   - `/ux-design-system` → Token implementation, theming
   - `/ux-figma-sync` → Design tool integration

4. **Composition Phase**:
   - `/ux-layout-composer` → Spatial design, grid systems
   - `/ux-component-architect` → Component architecture
   - `/ux-storybook` → Documentation

5. **Enhancement Phase**:
   - `/ux-motion-designer` → Animation, transitions
   - `/ux-texture-atmosphere` → Depth, grain, atmospheric effects
   - `/ux-micro-delight` → Polish, hover states, loading personality
   - `/ux-responsive-engineer` → Adaptive layouts
   - `/ux-data-viz` → Charts, visualizations

6. **Quality Phase**:
   - `/ux-accessibility-auditor` → WCAG compliance
   - `/ux-performance-engineer` → Core Web Vitals

### Team Session Mode
For complex, cross-cutting requests, invoke `/ux-team-session` to get input from all 8 team agents:
- Use when the request touches 3+ disciplines
- Use when trade-offs need to be discussed
- Use when the user asks for "team input" or "multiple perspectives"

### Audit Mode
For review/audit requests, run these skills in parallel:
- `/ux-accessibility-auditor`
- `/ux-performance-engineer`

## Context Passing

When invoking sub-skills, pass this context:
- User's original request
- Answers from discovery questions
- Target framework
- Existing codebase patterns (if detected)
- Previous skill outputs (for chained workflows)

## Output Format

After all skills complete, provide a synthesis:

```markdown
## UX Implementation Summary

### Skills Invoked
- [List skills used and why]

### Key Decisions Made
- [Framework]: [Choice and rationale]
- [Design System]: [Approach taken]
- [Components]: [Patterns implemented]

### Files Created/Modified
- [List all files with brief descriptions]

### Next Steps
- [Recommended follow-up actions]

### Quick Reference
- Design tokens: `src/styles/tokens.css`
- Components: `src/components/`
- Tests: `src/__tests__/`
```

## Example Interaction

**User**: "Build me a dashboard UI for analytics"

**Orchestrator**:
1. Asks discovery questions via AskUserQuestion
2. User selects: New Feature, Focus on [Aesthetic Direction, Design System, Components, Responsive], React/Next.js
3. Asks anti-pattern question: User selects "Generic SaaS" and "Dribbble Trendy"
4. Routes to (in order):
   - `/ux-aesthetic-director` → Establishes direction: "Tech-Forward & Precise" archetype, confident tone
   - `/ux-typography-curator` → Selects JetBrains Mono + IBM Plex Sans based on aesthetic brief
   - `/ux-color-alchemist` → Creates palette with intentional color cast, avoiding AI purple
   - `/ux-design-system` → Implements tokens with aesthetic personality
   - `/ux-component-architect` → Creates dashboard components with distinctive patterns
   - `/ux-layout-composer` → Designs bento grid layout with intentional asymmetry
   - `/ux-responsive-engineer` → Adds responsive behavior
5. Synthesizes results into summary with aesthetic rationale

**Key Difference**: The dashboard won't look like every other analytics dashboard because it started with aesthetic intent, not just technical requirements.

## Live Browser Verification

All specialized skills support **Playwright MCP verification** for testing implementations in a live browser:

### Verification Capabilities by Skill

| Skill | Verification Features |
|-------|----------------------|
| **ux-design-system** | Theme switching, token extraction, color contrast |
| **ux-component-architect** | Component rendering, interaction states, keyboard nav |
| **ux-motion-designer** | Animation playback, GIF recording, reduced motion |
| **ux-accessibility-auditor** | Keyboard nav, focus management, ARIA verification |
| **ux-responsive-engineer** | Multi-viewport testing, overflow detection, touch targets |
| **ux-performance-engineer** | Core Web Vitals measurement, network analysis |

### When to Use Browser Verification

- After implementing components to verify behavior
- During accessibility audits to test real interactions
- When measuring performance metrics
- To document animations with GIF recordings
- When testing responsive layouts at different viewports

The orchestrator can suggest running verification after implementation phases complete.
