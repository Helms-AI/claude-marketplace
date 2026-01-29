---
name: frontend-design-system
description: Design tokens, theming, and styling foundations with Style Dictionary and Tailwind CSS 4.0 - aesthetic-aware implementation
---

# Design System Skill

When invoked with `/frontend-design-system`, create or extend design system foundations including tokens, themes, and styling infrastructure.

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Sam Rivera - Systems Design Lead** is now working on this.
> "Tokens aren't just values—they're the DNA of your design."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| `/frontend-orchestrator` | Requirements, project scope |
| `/user-experience-aesthetic-director` | Personality brief, archetype, tone guidelines |
| `/user-experience-typography-curator` | Font system, type scale, font tokens |
| `/user-experience-color-alchemist` | Color tokens, palette definitions, semantic colors |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| `/frontend-component-architect` | Complete token system, CSS custom properties, theme structure |
| `/frontend-accessibility-auditor` | Contrast tokens, color pairs for WCAG verification |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Sam Rivera → Alex Kim:** Here's the complete token system—semantic colors, spacing scale, and typography tokens are ready for component implementation."
```

## Aesthetic-First Integration

**IMPORTANT**: This skill should consume output from the user-experience plugin when available. Tokens should express the aesthetic personality, not just provide values.

### Anti-Generic Guidelines

| Anti-Pattern | Detection | Alternative |
|--------------|-----------|-------------|
| **AI Purple** | `#6366f1`, `#8b5cf6` in palette | Shift hue for character, or choose different primary |
| **Inter as default** | Inter without rationale | Require intentional font choice with personality |
| **Generic gray scale** | Using Tailwind's neutral without adjustment | Add subtle color cast to neutrals |
| **Uniform spacing** | Same padding everywhere | Create rhythm with varied spacing tokens |
| **Standard shadows** | Copy-paste elevation system | Design shadows that fit the aesthetic |

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to gather requirements:

### Token Foundation Questions

```
Question 1: "What token format do you need?"
Header: "Token Format (for Sam)"
Options:
- "W3C Design Tokens" - Standard JSON format, maximum portability
- "Style Dictionary" - Transforms for multiple platforms
- "CSS Custom Properties" - Direct CSS variables
- "Tailwind Config" - Tailwind-native configuration

Question 2: "Do you have existing brand colors?"
Header: "Brand Colors"
Options:
- "Yes, provide them" - I'll share hex/RGB values
- "Generate palette" - Create a cohesive palette from a primary color
- "Use aesthetic brief" - Colors from user-experience handoff
- "Use preset" - Choose from popular palettes

Question 3: "What theme requirements do you have?"
Header: "Theming"
MultiSelect: true
Options:
- "Light mode" - Default light theme
- "Dark mode" - Dark theme with proper contrast
- "System preference" - Respect prefers-color-scheme
- "Custom themes" - User-selectable brand themes
```

## Implementation: Tailwind CSS 4.0

```css
/* styles/theme.css */
@import "tailwindcss";

@theme {
  /* Color tokens using OKLCH */
  --color-primary-50: oklch(0.97 0.02 250);
  --color-primary-500: oklch(0.55 0.2 250);
  --color-primary-900: oklch(0.25 0.15 250);

  /* Semantic colors */
  --color-background: var(--color-primary-50);
  --color-foreground: var(--color-primary-900);

  /* Typography scale */
  --font-size-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --font-size-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --font-size-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);

  /* Spacing scale (4px base) */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-4: 1rem;
  --spacing-8: 2rem;
  --spacing-16: 4rem;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: var(--color-primary-900);
    --color-foreground: var(--color-primary-50);
  }
}
```

## Implementation: CSS Custom Properties

```css
/* styles/tokens.css */
@layer tokens {
  :root {
    /* Color primitives using OKLCH */
    --color-gray-50: oklch(0.985 0 0);
    --color-gray-100: oklch(0.965 0 0);
    --color-gray-200: oklch(0.925 0 0);
    --color-gray-500: oklch(0.55 0 0);
    --color-gray-900: oklch(0.15 0 0);

    /* Semantic tokens */
    --surface-primary: var(--color-gray-50);
    --surface-secondary: var(--color-gray-100);
    --text-primary: var(--color-gray-900);
    --text-secondary: var(--color-gray-500);
    --border-default: var(--color-gray-200);

    /* Animation tokens */
    --duration-fast: 150ms;
    --duration-normal: 250ms;
    --duration-slow: 400ms;
    --easing-default: cubic-bezier(0.4, 0, 0.2, 1);
  }

  [data-theme="dark"] {
    --surface-primary: var(--color-gray-900);
    --text-primary: var(--color-gray-50);
    --border-default: var(--color-gray-700);
  }
}
```

## Multi-Theme Implementation

```typescript
// lib/theme.ts
type Theme = 'light' | 'dark' | 'system';

export function initTheme() {
  const stored = localStorage.getItem('theme') as Theme | null;
  applyTheme(stored || 'system');
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = prefersDark ? 'dark' : 'light';
  } else {
    root.dataset.theme = theme;
  }

  localStorage.setItem('theme', theme);
}

// React hook
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
    applyTheme(next);
  };

  return { theme, setTheme: (t: Theme) => { setTheme(t); applyTheme(t); }, toggle };
}
```

## Aesthetic Brief Integration

When an Aesthetic Brief is provided (from `/user-experience-aesthetic-director`), translate it into token decisions:

| Brief Section | Token Impact |
|---------------|--------------|
| **Archetype: Brutalist** | Sharp radii, no shadows, high contrast |
| **Archetype: Editorial** | Subtle radii, refined shadows, generous line-height |
| **Archetype: Organic** | Varied radii, soft layered shadows, warm color cast |
| **Archetype: Tech-Forward** | Precise radii, elevation shadows, cool color cast |
| **Tone: Bold** | High saturation, larger scale jumps, quick motion |
| **Tone: Calm** | Muted palette, gentle scale, flowing motion |

## Output Structure

```
src/
├── tokens/
│   ├── color.tokens.json
│   ├── typography.tokens.json
│   └── spacing.tokens.json
├── styles/
│   ├── tokens.css
│   ├── theme.css
│   └── globals.css
├── lib/
│   └── theme.ts
└── tailwind.config.ts
```

## Deliverables Checklist

- [ ] Token files in chosen format
- [ ] CSS custom properties generated
- [ ] Dark mode support implemented
- [ ] Typography scale defined
- [ ] Spacing scale defined
- [ ] Color palette with semantic mappings
- [ ] Aesthetic personality tokens included
- [ ] Theme switching utility (if multi-theme)
- [ ] Documentation of token usage
