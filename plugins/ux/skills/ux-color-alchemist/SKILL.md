---
name: ux-color-alchemist
description: Mood-driven color systems using OKLCH, atmospheric effects, and emotion-first palette creation
---

# Color Alchemist Skill

When invoked with `/ux-color-alchemist`, create color systems that evoke specific emotions and atmospheres, going beyond simple palette generation to build mood-driven, scientifically-grounded color foundations.

## Philosophy: Color as Emotion

Color isn't decoration - it's the fastest way to communicate emotion. Before picking hex values, we establish what the colors should make people *feel*.

### The Anti-Generic Color Manifesto

#### Colors to Question

| Color | Why It's Overused | When It's Right |
|-------|-------------------|-----------------|
| **#6366f1** (Indigo-500) | "AI purple" default, everywhere | Genuinely tech/AI brand identity |
| **#3b82f6** (Blue-500) | "Safe" primary, Tailwind default | Financial, trust-critical contexts |
| **#10b981** (Emerald-500) | "Success green" cliché | Actual success states, eco-brands |
| **#f59e0b** (Amber-500) | Generic warning color | Actual warning states only |
| **#8b5cf6** (Violet-500) | Gradient endpoints | Creative tools, spiritual contexts |

#### Gradients to Avoid

```css
/* These are everywhere - challenge yourself */
background: linear-gradient(135deg, #6366f1, #8b5cf6); /* AI purple */
background: linear-gradient(135deg, #3b82f6, #06b6d4); /* Tech blue-cyan */
background: linear-gradient(135deg, #f472b6, #a855f7); /* Trendy pink-purple */
```

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to understand emotional goals:

### Color Discovery Questions

```
Question 1: "What primary emotion should the color palette evoke?"
Header: "Emotion"
Options:
- "Trust & Stability" - Blues, greens, grounded neutrals
- "Energy & Excitement" - Warm hues, high saturation, vibrant
- "Calm & Serenity" - Muted tones, low contrast, soft
- "Sophistication & Luxury" - Rich darks, muted accents, restraint

Question 2: "What's the palette temperature?"
Header: "Temperature"
Options:
- "Warm" - Red/orange undertones, inviting
- "Cool" - Blue/green undertones, professional
- "Neutral" - Gray-based, versatile
- "Mixed" - Strategic warm/cool contrast

Question 3: "Color complexity preference?"
Header: "Complexity"
Options:
- "Monochromatic" - Single hue variations
- "Analogous" - Neighboring hues, harmonious
- "Complementary" - Opposite hues, high contrast
- "Triadic" - Three balanced hues, dynamic
```

## OKLCH: The Science of Perceptual Color

### Why OKLCH Over HSL

| Aspect | HSL Problem | OKLCH Solution |
|--------|-------------|----------------|
| **Lightness** | 50% yellow ≠ 50% blue perceived | Perceptually uniform lightness |
| **Saturation** | Varies wildly by hue | Consistent chroma across hues |
| **Accessibility** | Hard to predict contrast | Calculate contrast from L value |
| **Gradients** | Gray muddy transitions | Clean color interpolation |

### OKLCH Anatomy

```css
/* oklch(Lightness Chroma Hue) */
/* L: 0 (black) to 1 (white) - PERCEPTUAL */
/* C: 0 (gray) to ~0.4 (maximum saturation) */
/* H: 0-360 degree color wheel */

/* Example: Vibrant blue */
--color-blue: oklch(0.55 0.2 250);
/*           ^ 55% perceived lightness
                   ^ moderately saturated
                        ^ blue hue */
```

### Building Scales with Uniform Perception

```css
/* Traditional approach (inconsistent perception) */
--blue-100: hsl(220, 100%, 95%);  /* Barely visible */
--blue-500: hsl(220, 100%, 50%);  /* Jarring contrast */
--blue-900: hsl(220, 100%, 10%);  /* Nearly black */

/* OKLCH approach (perceptually uniform) */
--blue-100: oklch(0.95 0.03 250); /* Consistently light */
--blue-500: oklch(0.55 0.20 250); /* Predictable mid */
--blue-900: oklch(0.25 0.10 250); /* Rich dark */
```

## Emotion-Driven Palette Templates

### Template 1: Trust & Authority

```css
:root {
  /* Primary: Deep, trustworthy blue */
  --color-primary: oklch(0.45 0.15 240);

  /* Supporting: Professional navy */
  --color-secondary: oklch(0.30 0.08 250);

  /* Accent: Confident teal */
  --color-accent: oklch(0.60 0.12 195);

  /* Neutrals: Cool gray foundation */
  --color-neutral-50: oklch(0.98 0.005 250);
  --color-neutral-100: oklch(0.95 0.008 250);
  --color-neutral-200: oklch(0.90 0.010 250);
  --color-neutral-500: oklch(0.55 0.015 250);
  --color-neutral-800: oklch(0.25 0.020 250);
  --color-neutral-950: oklch(0.12 0.025 250);
}
```

### Template 2: Energy & Optimism

```css
:root {
  /* Primary: Energetic orange */
  --color-primary: oklch(0.70 0.18 55);

  /* Supporting: Warm coral */
  --color-secondary: oklch(0.65 0.15 25);

  /* Accent: Sunny yellow */
  --color-accent: oklch(0.85 0.15 90);

  /* Neutrals: Warm cream foundation */
  --color-neutral-50: oklch(0.98 0.01 85);
  --color-neutral-100: oklch(0.95 0.015 80);
  --color-neutral-200: oklch(0.90 0.02 75);
  --color-neutral-500: oklch(0.55 0.03 70);
  --color-neutral-800: oklch(0.28 0.04 60);
  --color-neutral-950: oklch(0.15 0.05 55);
}
```

### Template 3: Calm & Wellness

```css
:root {
  /* Primary: Serene sage */
  --color-primary: oklch(0.60 0.08 145);

  /* Supporting: Soft earth */
  --color-secondary: oklch(0.55 0.05 75);

  /* Accent: Peaceful lavender */
  --color-accent: oklch(0.70 0.08 290);

  /* Neutrals: Warm, natural foundation */
  --color-neutral-50: oklch(0.98 0.01 95);
  --color-neutral-100: oklch(0.95 0.012 90);
  --color-neutral-200: oklch(0.90 0.015 85);
  --color-neutral-500: oklch(0.55 0.02 80);
  --color-neutral-800: oklch(0.28 0.025 75);
  --color-neutral-950: oklch(0.15 0.03 70);
}
```

### Template 4: Premium & Luxury

```css
:root {
  /* Primary: Rich burgundy */
  --color-primary: oklch(0.35 0.12 15);

  /* Supporting: Deep gold */
  --color-secondary: oklch(0.55 0.12 85);

  /* Accent: Refined emerald */
  --color-accent: oklch(0.45 0.10 160);

  /* Neutrals: Warm charcoal foundation */
  --color-neutral-50: oklch(0.97 0.005 60);
  --color-neutral-100: oklch(0.92 0.008 55);
  --color-neutral-200: oklch(0.85 0.01 50);
  --color-neutral-500: oklch(0.50 0.015 45);
  --color-neutral-800: oklch(0.22 0.02 40);
  --color-neutral-950: oklch(0.10 0.025 35);
}
```

## Atmospheric Color Effects

### Mesh Gradients

```css
/* CSS mesh gradient using radial gradients */
.mesh-background {
  background-color: oklch(0.98 0.02 250);
  background-image:
    radial-gradient(at 40% 20%, oklch(0.90 0.08 290) 0px, transparent 50%),
    radial-gradient(at 80% 0%, oklch(0.85 0.06 200) 0px, transparent 50%),
    radial-gradient(at 0% 50%, oklch(0.92 0.05 180) 0px, transparent 50%),
    radial-gradient(at 80% 50%, oklch(0.88 0.07 260) 0px, transparent 50%),
    radial-gradient(at 0% 100%, oklch(0.90 0.06 230) 0px, transparent 50%);
}
```

### Gradient Animation

```css
.animated-gradient {
  background: linear-gradient(
    135deg,
    oklch(0.65 0.15 250),
    oklch(0.55 0.18 290),
    oklch(0.60 0.16 320),
    oklch(0.65 0.15 250)
  );
  background-size: 300% 300%;
  animation: gradient-shift 8s ease infinite;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .animated-gradient {
    animation: none;
    background-size: 100% 100%;
  }
}
```

### Glassmorphism Done Right

```css
.glass-card {
  /* Semi-transparent background */
  background: oklch(1 0 0 / 0.6);

  /* Strong blur */
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);

  /* Subtle border for definition */
  border: 1px solid oklch(1 0 0 / 0.2);

  /* Soft shadow for depth */
  box-shadow:
    0 4px 6px oklch(0 0 0 / 0.05),
    0 10px 15px oklch(0 0 0 / 0.1);
}

/* Dark mode glass */
[data-theme="dark"] .glass-card {
  background: oklch(0.15 0.02 250 / 0.6);
  border: 1px solid oklch(1 0 0 / 0.1);
}
```

### Grain Overlay

```css
/* SVG noise overlay for texture */
.grain-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.04;
  pointer-events: none;
  mix-blend-mode: overlay;
}
```

## Semantic Color System

### Complete Token Structure

```css
:root {
  /* === PRIMITIVE COLORS (raw values) === */
  /* Primary hue scale */
  --primitive-primary-100: oklch(0.95 0.03 250);
  --primitive-primary-200: oklch(0.88 0.06 250);
  --primitive-primary-300: oklch(0.78 0.10 250);
  --primitive-primary-400: oklch(0.65 0.15 250);
  --primitive-primary-500: oklch(0.55 0.18 250);
  --primitive-primary-600: oklch(0.48 0.16 250);
  --primitive-primary-700: oklch(0.40 0.14 250);
  --primitive-primary-800: oklch(0.32 0.10 250);
  --primitive-primary-900: oklch(0.25 0.08 250);

  /* Neutral scale (with slight color cast) */
  --primitive-neutral-50: oklch(0.99 0.002 250);
  --primitive-neutral-100: oklch(0.96 0.004 250);
  --primitive-neutral-200: oklch(0.92 0.006 250);
  --primitive-neutral-300: oklch(0.87 0.008 250);
  --primitive-neutral-400: oklch(0.70 0.010 250);
  --primitive-neutral-500: oklch(0.55 0.012 250);
  --primitive-neutral-600: oklch(0.45 0.012 250);
  --primitive-neutral-700: oklch(0.35 0.012 250);
  --primitive-neutral-800: oklch(0.25 0.010 250);
  --primitive-neutral-900: oklch(0.18 0.008 250);
  --primitive-neutral-950: oklch(0.12 0.006 250);

  /* === SEMANTIC COLORS (contextual meaning) === */
  /* Surfaces */
  --color-surface-primary: var(--primitive-neutral-50);
  --color-surface-secondary: var(--primitive-neutral-100);
  --color-surface-tertiary: var(--primitive-neutral-200);
  --color-surface-inverse: var(--primitive-neutral-900);

  /* Text */
  --color-text-primary: var(--primitive-neutral-900);
  --color-text-secondary: var(--primitive-neutral-600);
  --color-text-tertiary: var(--primitive-neutral-500);
  --color-text-inverse: var(--primitive-neutral-50);
  --color-text-link: var(--primitive-primary-600);

  /* Borders */
  --color-border-default: var(--primitive-neutral-200);
  --color-border-strong: var(--primitive-neutral-300);
  --color-border-focus: var(--primitive-primary-500);

  /* Interactions */
  --color-interactive-primary: var(--primitive-primary-500);
  --color-interactive-primary-hover: var(--primitive-primary-600);
  --color-interactive-primary-active: var(--primitive-primary-700);

  /* Status colors */
  --color-status-success: oklch(0.55 0.15 145);
  --color-status-warning: oklch(0.75 0.15 85);
  --color-status-error: oklch(0.55 0.18 25);
  --color-status-info: oklch(0.55 0.12 230);

  /* === ATMOSPHERIC COLORS === */
  --color-atmosphere-glow: oklch(0.70 0.12 250 / 0.3);
  --color-atmosphere-gradient-start: var(--primitive-primary-200);
  --color-atmosphere-gradient-end: oklch(0.90 0.08 290);
  --grain-opacity: 0.04;
}

/* Dark mode overrides */
[data-theme="dark"] {
  --color-surface-primary: var(--primitive-neutral-950);
  --color-surface-secondary: var(--primitive-neutral-900);
  --color-surface-tertiary: var(--primitive-neutral-800);
  --color-surface-inverse: var(--primitive-neutral-50);

  --color-text-primary: var(--primitive-neutral-50);
  --color-text-secondary: var(--primitive-neutral-400);
  --color-text-tertiary: var(--primitive-neutral-500);
  --color-text-inverse: var(--primitive-neutral-900);

  --color-border-default: var(--primitive-neutral-800);
  --color-border-strong: var(--primitive-neutral-700);

  --grain-opacity: 0.06;
}
```

## Color Accessibility

### Contrast Calculator for OKLCH

```javascript
// WCAG contrast using OKLCH lightness approximation
function getContrastRatio(color1L, color2L) {
  const l1 = Math.max(color1L, color2L);
  const l2 = Math.min(color1L, color2L);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Check WCAG compliance
function checkWCAG(fgLightness, bgLightness) {
  const ratio = getContrastRatio(fgLightness, bgLightness);
  return {
    ratio: ratio.toFixed(2),
    AA_normal: ratio >= 4.5,
    AA_large: ratio >= 3,
    AAA_normal: ratio >= 7,
    AAA_large: ratio >= 4.5
  };
}

// Example: Dark text on light background
checkWCAG(0.15, 0.98); // { ratio: "6.87", AA_normal: true, ... }
```

### Accessible Palette Generation

```css
/* Ensuring text colors meet WCAG AA on backgrounds */

/* Light backgrounds (L > 0.7) need dark text (L < 0.4) */
.light-surface {
  background: oklch(0.95 0.02 250); /* L = 0.95 */
  color: oklch(0.20 0.02 250);      /* L = 0.20, contrast ~7:1 */
}

/* Dark backgrounds (L < 0.3) need light text (L > 0.7) */
.dark-surface {
  background: oklch(0.15 0.02 250); /* L = 0.15 */
  color: oklch(0.90 0.02 250);      /* L = 0.90, contrast ~7:1 */
}

/* Mid-tone colors (L 0.4-0.6) are problematic for text */
/* Use them for accents, not large text areas */
```

## Output: Color Specification

```markdown
# Color Specification

## Emotional Direction
[Description of intended emotional response]

## Palette Overview
| Role | Color | OKLCH Value | Usage |
|------|-------|-------------|-------|
| Primary | [swatch] | oklch(X X X) | [context] |
| Secondary | [swatch] | oklch(X X X) | [context] |
| Accent | [swatch] | oklch(X X X) | [context] |

## Complete Token Set
[Full CSS custom properties]

## Atmospheric Effects
[Mesh gradients, grain overlays, glassmorphism presets]

## Accessibility Verification
| Combination | Contrast | WCAG |
|-------------|----------|------|
| [text on bg] | X.XX:1 | AA/AAA |

## Dark Mode Strategy
[Approach and overrides]
```

## Deliverables Checklist

- [ ] Emotional direction established
- [ ] Primary palette defined in OKLCH
- [ ] Neutral scale with intentional color cast
- [ ] Semantic token layer created
- [ ] Atmospheric effects prepared
- [ ] Dark mode strategy defined
- [ ] Accessibility verified (WCAG AA minimum)
- [ ] Gradient alternatives to generic patterns
- [ ] Color tokens ready for design system
