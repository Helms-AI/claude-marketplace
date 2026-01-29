---
name: user-experience-color-alchemist
description: Mood-driven color systems using OKLCH, atmospheric effects, and emotion-first palette creation
---

# Color Alchemist Skill

When invoked with `/user-experience-color-alchemist`, create distinctive color palettes that evoke specific emotions and support the aesthetic direction. Focus on OKLCH color science for perceptually uniform palettes.

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Morgan Blake - Color Alchemist** is now working on this.
> "Color isn't decoration—it's emotion. Let's craft a palette that makes people feel something."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| `/user-experience-aesthetic-director` | Color direction, tone profile, temperature |
| `/user-experience-typography-curator` | Typography tone for color alignment |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| `/frontend-design-system` | Full color tokens, semantic colors, gradients |
| `/user-experience-texture-atmosphere` | Gradient presets, glow colors |
| `/frontend-accessibility-auditor` | Color contrast values for WCAG review |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Morgan → [Next Team Member]:** Color palette ready:
- Primary: [color] - [emotional note]
- Mood: [warm/cool/neutral]
- Special: [any signature color treatment]"
```

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to establish color direction:

### Color Discovery Questions

```
Question 1: "What emotional temperature should the color palette have?"
Header: "Temperature (for Morgan)"
Options:
- "Warm" - Reds, oranges, yellows, earth tones
- "Cool" - Blues, teals, purples, steel
- "Neutral" - Balanced grays, subtle undertones
- "Mixed" - Warm and cool in intentional contrast

Question 2: "What's the primary emotional goal?"
Header: "Emotion"
Options:
- "Trust & Calm" - Blues, greens, muted tones
- "Energy & Action" - Oranges, reds, vibrant saturation
- "Premium & Luxury" - Deep neutrals, gold/copper accents
- "Fresh & Natural" - Greens, earth tones, organic feel

Question 3: "How vibrant should the palette be?"
Header: "Vibrancy"
Options:
- "Muted & Sophisticated" - Low saturation, refined
- "Balanced & Versatile" - Moderate saturation
- "Bold & Expressive" - High saturation, impactful
- "Duotone/Limited" - Two-color system, maximum contrast
```

## OKLCH Color Science

### Why OKLCH?

OKLCH provides perceptually uniform color manipulation:

```css
/* OKLCH format: oklch(lightness chroma hue) */
/* Lightness: 0-1 (black to white) */
/* Chroma: 0-0.4+ (gray to vivid) */
/* Hue: 0-360 (color wheel) */

/* Example: Vibrant blue */
--color-primary: oklch(0.55 0.2 250);

/* Darken by reducing lightness (uniform perception) */
--color-primary-dark: oklch(0.40 0.2 250);

/* Lighten by increasing lightness */
--color-primary-light: oklch(0.70 0.2 250);

/* Desaturate by reducing chroma */
--color-primary-muted: oklch(0.55 0.1 250);
```

### Generating Scales in OKLCH

```css
/* Primary color scale */
:root {
  --color-primary-50: oklch(0.97 0.02 250);
  --color-primary-100: oklch(0.93 0.04 250);
  --color-primary-200: oklch(0.87 0.08 250);
  --color-primary-300: oklch(0.77 0.12 250);
  --color-primary-400: oklch(0.67 0.16 250);
  --color-primary-500: oklch(0.55 0.20 250);  /* Base */
  --color-primary-600: oklch(0.47 0.18 250);
  --color-primary-700: oklch(0.40 0.16 250);
  --color-primary-800: oklch(0.33 0.14 250);
  --color-primary-900: oklch(0.27 0.12 250);
  --color-primary-950: oklch(0.20 0.10 250);
}
```

## Color Palette Templates

### Warm Trust Palette

```css
:root {
  /* Primary: Warm coral */
  --color-primary: oklch(0.65 0.18 25);

  /* Secondary: Soft sand */
  --color-secondary: oklch(0.88 0.04 85);

  /* Accent: Deep terracotta */
  --color-accent: oklch(0.50 0.15 35);

  /* Neutrals: Warm gray family */
  --color-neutral-50: oklch(0.98 0.01 85);
  --color-neutral-900: oklch(0.20 0.02 85);
}
```

### Cool Professional Palette

```css
:root {
  /* Primary: Confident navy */
  --color-primary: oklch(0.35 0.12 250);

  /* Secondary: Steel blue */
  --color-secondary: oklch(0.75 0.08 230);

  /* Accent: Teal accent */
  --color-accent: oklch(0.55 0.12 195);

  /* Neutrals: Cool slate */
  --color-neutral-50: oklch(0.98 0.01 250);
  --color-neutral-900: oklch(0.15 0.02 250);
}
```

### Vibrant Energy Palette

```css
:root {
  /* Primary: Electric orange */
  --color-primary: oklch(0.70 0.22 50);

  /* Secondary: Hot pink */
  --color-secondary: oklch(0.65 0.25 350);

  /* Accent: Lime */
  --color-accent: oklch(0.80 0.20 130);

  /* Neutrals: Warm charcoal */
  --color-neutral-50: oklch(0.97 0.01 50);
  --color-neutral-900: oklch(0.18 0.02 50);
}
```

## Semantic Color Tokens

```css
:root {
  /* Background layers */
  --color-bg-primary: oklch(0.99 0.005 var(--hue-neutral));
  --color-bg-secondary: oklch(0.96 0.01 var(--hue-neutral));
  --color-bg-tertiary: oklch(0.93 0.015 var(--hue-neutral));
  --color-bg-elevated: oklch(1 0 var(--hue-neutral));

  /* Text hierarchy */
  --color-text-primary: oklch(0.15 0.02 var(--hue-neutral));
  --color-text-secondary: oklch(0.40 0.02 var(--hue-neutral));
  --color-text-tertiary: oklch(0.55 0.02 var(--hue-neutral));
  --color-text-inverted: oklch(0.98 0.005 var(--hue-neutral));

  /* Interactive states */
  --color-interactive-default: var(--color-primary-500);
  --color-interactive-hover: var(--color-primary-600);
  --color-interactive-active: var(--color-primary-700);
  --color-interactive-focus: oklch(from var(--color-primary-500) l c h / 0.25);

  /* Status colors */
  --color-status-success: oklch(0.55 0.15 145);
  --color-status-warning: oklch(0.75 0.15 85);
  --color-status-error: oklch(0.55 0.20 25);
  --color-status-info: oklch(0.55 0.15 230);

  /* Border colors */
  --color-border-default: oklch(0.85 0.01 var(--hue-neutral));
  --color-border-emphasis: oklch(0.70 0.02 var(--hue-neutral));
}
```

## Dark Mode Strategy

### Approach 1: Lightness Inversion

```css
[data-theme="dark"] {
  /* Invert lightness values */
  --color-bg-primary: oklch(0.15 0.02 var(--hue-neutral));
  --color-bg-secondary: oklch(0.18 0.02 var(--hue-neutral));
  --color-text-primary: oklch(0.95 0.01 var(--hue-neutral));

  /* Reduce chroma for dark mode */
  --color-primary: oklch(0.65 0.15 var(--hue-primary));
}
```

### Approach 2: Separate Palettes

```css
[data-theme="dark"] {
  /* Carefully tuned dark palette */
  --color-bg-primary: oklch(0.12 0.02 250);
  --color-bg-elevated: oklch(0.18 0.025 250);
  --color-primary: oklch(0.70 0.18 250);  /* Lighter, less saturated */
}
```

## Gradient Systems

### Mesh Gradient Presets

```css
:root {
  --gradient-warm-glow:
    radial-gradient(at 0% 0%, oklch(0.85 0.12 25 / 0.5) 0%, transparent 50%),
    radial-gradient(at 100% 100%, oklch(0.80 0.10 50 / 0.4) 0%, transparent 50%);

  --gradient-cool-atmosphere:
    radial-gradient(at 20% 20%, oklch(0.75 0.10 250 / 0.4) 0%, transparent 50%),
    radial-gradient(at 80% 80%, oklch(0.70 0.12 200 / 0.3) 0%, transparent 50%);
}
```

## Output: Color Specification

```markdown
# Color Specification

## Palette Philosophy
[2-3 sentences on emotional direction]

## Core Colors (OKLCH)

### Primary
- **Base:** oklch([l] [c] [h])
- **Emotion:** [What it communicates]
- **Usage:** [Where it's used]

### Secondary
- **Base:** oklch([l] [c] [h])
- **Emotion:** [What it communicates]
- **Usage:** [Where it's used]

### Accent
- **Base:** oklch([l] [c] [h])
- **Usage:** [Specific moments]

## Neutral Scale
[Full scale from 50-950]

## Semantic Tokens
[Full semantic token list]

## Dark Mode Approach
[Strategy and values]

## Gradient Presets
[If applicable]

## Accessibility Notes
- Primary on white: [contrast ratio]
- Primary on dark: [contrast ratio]
```

## Deliverables Checklist

- [ ] Color discovery completed
- [ ] Emotional direction aligned with aesthetic brief
- [ ] Core palette defined in OKLCH
- [ ] Full color scales generated
- [ ] Semantic tokens mapped
- [ ] Dark mode palette created
- [ ] Contrast ratios verified (WCAG AA minimum)
- [ ] Gradient presets defined
- [ ] Specification documented
