---
name: ux-texture-atmosphere
description: Depth, texture, and visual richness - grain overlays, mesh gradients, multi-shadow systems, and atmospheric effects
---

# Texture & Atmosphere Skill

When invoked with `/ux-texture-atmosphere`, add depth, texture, and visual richness to interfaces through grain overlays, mesh gradients, glassmorphism, shadow systems, and other atmospheric effects that make flat designs feel alive.

## Philosophy: Flat is Dead, Long Live Depth

Modern interfaces don't need to choose between flat design and skeuomorphism. The sweet spot is **atmospheric flat**: clean layouts with subtle depth cues, texture overlays, and environmental effects that create visual richness without noise.

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to understand atmospheric needs:

### Atmosphere Discovery Questions

```
Question 1: "What level of visual texture do you want?"
Header: "Texture"
Options:
- "Pristine Clean" - Minimal texture, pure surfaces
- "Subtle Grain" - Light texture for warmth
- "Paper/Organic" - Noticeable texture, handmade feel
- "Noisy/Raw" - Heavy grain, brutalist aesthetic

Question 2: "How should depth be expressed?"
Header: "Depth"
Options:
- "Flat with Borders" - No shadows, clear boundaries
- "Soft Shadows" - Gentle elevation, modern minimal
- "Layered Depth" - Multiple shadow levels, clear hierarchy
- "Dramatic Shadows" - High contrast, theatrical

Question 3: "What atmospheric effects fit the brand?"
Header: "Effects"
MultiSelect: true
Options:
- "Mesh Gradients" - Organic color blending
- "Glassmorphism" - Frosted glass, blur
- "Glow Effects" - Soft color halos
- "Grain Overlays" - Film/paper texture
```

## Grain & Noise Systems

### CSS-Only Noise Overlay

```css
/* Inline SVG noise - no external files needed */
.grain-overlay {
  position: relative;
}

.grain-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: var(--grain-opacity, 0.05);
  pointer-events: none;
  mix-blend-mode: overlay;
  z-index: 1;
}

/* Intensity variants */
.grain-subtle { --grain-opacity: 0.03; }
.grain-medium { --grain-opacity: 0.06; }
.grain-heavy { --grain-opacity: 0.12; }

/* Animated grain for video/premium feel */
.grain-animated::before {
  animation: grain-shift 0.5s steps(10) infinite;
}

@keyframes grain-shift {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-1%, -1%); }
  20% { transform: translate(1%, 1%); }
  30% { transform: translate(-1%, 1%); }
  40% { transform: translate(1%, -1%); }
  50% { transform: translate(-1%, 0); }
  60% { transform: translate(1%, 0); }
  70% { transform: translate(0, 1%); }
  80% { transform: translate(0, -1%); }
  90% { transform: translate(1%, 1%); }
}

@media (prefers-reduced-motion: reduce) {
  .grain-animated::before {
    animation: none;
  }
}
```

### Colored Noise for Warmth

```css
/* Warm sepia-tinted grain */
.grain-warm::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncR type='linear' slope='1.1'/%3E%3CfeFuncG type='linear' slope='0.9'/%3E%3CfeFuncB type='linear' slope='0.8'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.08;
  pointer-events: none;
  mix-blend-mode: multiply;
}

/* Cool blue-tinted grain */
.grain-cool::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncR type='linear' slope='0.85'/%3E%3CfeFuncG type='linear' slope='0.95'/%3E%3CfeFuncB type='linear' slope='1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.06;
  pointer-events: none;
  mix-blend-mode: multiply;
}
```

## Mesh Gradient Systems

### Basic Mesh Gradient

```css
.mesh-gradient-hero {
  background-color: oklch(0.98 0.01 250);
  background-image:
    radial-gradient(at 0% 0%, oklch(0.85 0.12 290 / 0.6) 0px, transparent 50%),
    radial-gradient(at 100% 0%, oklch(0.90 0.08 200 / 0.5) 0px, transparent 50%),
    radial-gradient(at 100% 100%, oklch(0.88 0.10 250 / 0.4) 0px, transparent 50%),
    radial-gradient(at 0% 100%, oklch(0.92 0.06 180 / 0.3) 0px, transparent 50%);
}

/* Dark mode version */
[data-theme="dark"] .mesh-gradient-hero {
  background-color: oklch(0.12 0.02 250);
  background-image:
    radial-gradient(at 0% 0%, oklch(0.25 0.08 290 / 0.4) 0px, transparent 50%),
    radial-gradient(at 100% 0%, oklch(0.20 0.06 200 / 0.3) 0px, transparent 50%),
    radial-gradient(at 100% 100%, oklch(0.18 0.07 250 / 0.3) 0px, transparent 50%),
    radial-gradient(at 0% 100%, oklch(0.22 0.05 180 / 0.2) 0px, transparent 50%);
}
```

### Animated Mesh Gradient

```css
.mesh-gradient-animated {
  background-color: oklch(0.95 0.02 250);
  position: relative;
  overflow: hidden;
}

.mesh-gradient-animated::before {
  content: '';
  position: absolute;
  inset: -50%;
  background:
    radial-gradient(circle at 20% 30%, oklch(0.80 0.15 290 / 0.5) 0%, transparent 40%),
    radial-gradient(circle at 80% 20%, oklch(0.85 0.12 200 / 0.4) 0%, transparent 35%),
    radial-gradient(circle at 70% 80%, oklch(0.82 0.14 250 / 0.4) 0%, transparent 45%),
    radial-gradient(circle at 30% 70%, oklch(0.88 0.10 180 / 0.3) 0%, transparent 40%);
  animation: mesh-float 20s ease-in-out infinite;
}

@keyframes mesh-float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(5%, -5%) rotate(2deg);
  }
  50% {
    transform: translate(-3%, 3%) rotate(-1deg);
  }
  75% {
    transform: translate(-5%, -3%) rotate(1deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mesh-gradient-animated::before {
    animation: none;
    inset: 0;
  }
}
```

### Mesh Gradient Presets

```css
:root {
  /* Calm/Professional */
  --mesh-calm:
    radial-gradient(at 20% 20%, oklch(0.92 0.04 220 / 0.4) 0px, transparent 50%),
    radial-gradient(at 80% 80%, oklch(0.90 0.05 200 / 0.3) 0px, transparent 50%);

  /* Energetic/Vibrant */
  --mesh-vibrant:
    radial-gradient(at 0% 50%, oklch(0.75 0.18 320 / 0.5) 0px, transparent 50%),
    radial-gradient(at 100% 50%, oklch(0.80 0.15 50 / 0.4) 0px, transparent 50%),
    radial-gradient(at 50% 100%, oklch(0.78 0.16 200 / 0.4) 0px, transparent 50%);

  /* Sunset/Warm */
  --mesh-sunset:
    radial-gradient(at 0% 0%, oklch(0.85 0.12 25 / 0.5) 0px, transparent 50%),
    radial-gradient(at 100% 30%, oklch(0.80 0.15 50 / 0.4) 0px, transparent 50%),
    radial-gradient(at 50% 100%, oklch(0.75 0.10 290 / 0.3) 0px, transparent 50%);

  /* Aurora/Cool */
  --mesh-aurora:
    radial-gradient(at 0% 0%, oklch(0.70 0.12 180 / 0.5) 0px, transparent 50%),
    radial-gradient(at 100% 0%, oklch(0.75 0.15 290 / 0.4) 0px, transparent 50%),
    radial-gradient(at 50% 100%, oklch(0.80 0.10 145 / 0.4) 0px, transparent 50%);
}

/* Usage */
.hero-calm {
  background-color: oklch(0.98 0.01 220);
  background-image: var(--mesh-calm);
}
```

## Glassmorphism System

### Proper Glassmorphism

```css
.glass-card {
  /* Semi-transparent background */
  background: oklch(1 0 0 / 0.7);

  /* Strong blur is key */
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);

  /* Subtle border for edge definition */
  border: 1px solid oklch(1 0 0 / 0.3);

  /* Soft shadow for floating effect */
  box-shadow:
    0 4px 6px -1px oklch(0 0 0 / 0.05),
    0 2px 4px -2px oklch(0 0 0 / 0.05);

  /* Smooth edges */
  border-radius: var(--radius-lg);
}

/* Glass on dark backgrounds */
.glass-card-dark {
  background: oklch(0.15 0.02 250 / 0.7);
  border: 1px solid oklch(1 0 0 / 0.1);
  box-shadow:
    0 4px 6px -1px oklch(0 0 0 / 0.2),
    inset 0 1px 0 oklch(1 0 0 / 0.05);
}

/* Glass button */
.glass-button {
  background: oklch(1 0 0 / 0.2);
  backdrop-filter: blur(8px);
  border: 1px solid oklch(1 0 0 / 0.2);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  transition: background 0.2s ease, transform 0.2s ease;
}

.glass-button:hover {
  background: oklch(1 0 0 / 0.3);
  transform: translateY(-1px);
}
```

### Glass Variants

```css
:root {
  /* Light glass on light bg */
  --glass-light: oklch(1 0 0 / 0.7);
  --glass-light-border: oklch(1 0 0 / 0.3);

  /* Dark glass on dark bg */
  --glass-dark: oklch(0.1 0.02 250 / 0.7);
  --glass-dark-border: oklch(1 0 0 / 0.1);

  /* Tinted glass */
  --glass-tinted: oklch(0.6 0.1 250 / 0.3);
  --glass-tinted-border: oklch(0.7 0.08 250 / 0.3);

  /* Blur levels */
  --glass-blur-sm: blur(8px);
  --glass-blur-md: blur(16px);
  --glass-blur-lg: blur(24px);
}
```

## Multi-Shadow Depth System

### Layered Shadow Tokens

```css
:root {
  /* Elevation levels (Material-inspired but refined) */
  --shadow-1: 0 1px 2px oklch(0 0 0 / 0.05);

  --shadow-2:
    0 1px 3px oklch(0 0 0 / 0.05),
    0 1px 2px oklch(0 0 0 / 0.03);

  --shadow-3:
    0 4px 6px -1px oklch(0 0 0 / 0.05),
    0 2px 4px -2px oklch(0 0 0 / 0.03);

  --shadow-4:
    0 10px 15px -3px oklch(0 0 0 / 0.05),
    0 4px 6px -4px oklch(0 0 0 / 0.03);

  --shadow-5:
    0 20px 25px -5px oklch(0 0 0 / 0.05),
    0 8px 10px -6px oklch(0 0 0 / 0.02);

  --shadow-6:
    0 25px 50px -12px oklch(0 0 0 / 0.15);

  /* Colored shadows for character */
  --shadow-primary:
    0 4px 14px oklch(0.55 0.2 250 / 0.25);

  --shadow-glow:
    0 0 20px oklch(0.65 0.15 250 / 0.3),
    0 0 40px oklch(0.65 0.15 250 / 0.2);
}
```

### Interactive Shadow Transitions

```css
.card-elevated {
  box-shadow: var(--shadow-2);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.card-elevated:hover {
  box-shadow: var(--shadow-4);
  transform: translateY(-2px);
}

.card-elevated:active {
  box-shadow: var(--shadow-1);
  transform: translateY(0);
}

/* Button with colored shadow */
.button-glow {
  background: oklch(0.55 0.2 250);
  color: white;
  box-shadow:
    var(--shadow-2),
    0 4px 12px oklch(0.55 0.2 250 / 0.3);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.button-glow:hover {
  box-shadow:
    var(--shadow-3),
    0 8px 20px oklch(0.55 0.2 250 / 0.4);
  transform: translateY(-2px);
}
```

### Inset Shadows for Depth

```css
/* Pressed/inset state */
.input-field {
  box-shadow:
    inset 0 1px 2px oklch(0 0 0 / 0.05),
    0 1px 0 oklch(1 0 0 / 0.5);
  border: 1px solid var(--color-border-default);
}

.input-field:focus {
  box-shadow:
    inset 0 1px 2px oklch(0 0 0 / 0.05),
    0 0 0 3px oklch(0.55 0.2 250 / 0.15);
  border-color: var(--color-primary);
}

/* Embossed text */
.text-embossed {
  text-shadow:
    0 1px 0 oklch(1 0 0 / 0.8),
    0 -1px 0 oklch(0 0 0 / 0.1);
}

/* Debossed/inset text */
.text-debossed {
  text-shadow:
    0 1px 0 oklch(0 0 0 / 0.1),
    0 -1px 0 oklch(1 0 0 / 0.3);
}
```

## Glow Effects

### Soft Color Glow

```css
.glow-accent {
  position: relative;
}

.glow-accent::after {
  content: '';
  position: absolute;
  inset: -10%;
  background: radial-gradient(
    circle at center,
    oklch(0.65 0.18 250 / 0.3) 0%,
    transparent 70%
  );
  z-index: -1;
  filter: blur(20px);
}

/* Pulsing glow for emphasis */
.glow-pulse::after {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

@media (prefers-reduced-motion: reduce) {
  .glow-pulse::after {
    animation: none;
    opacity: 0.6;
  }
}
```

### Neon Glow (Use Sparingly)

```css
.neon-text {
  color: oklch(0.85 0.18 250);
  text-shadow:
    0 0 5px oklch(0.85 0.18 250 / 0.8),
    0 0 10px oklch(0.75 0.2 250 / 0.6),
    0 0 20px oklch(0.65 0.22 250 / 0.4),
    0 0 40px oklch(0.55 0.24 250 / 0.2);
}

.neon-border {
  border: 2px solid oklch(0.75 0.2 250);
  box-shadow:
    0 0 5px oklch(0.75 0.2 250 / 0.5),
    0 0 10px oklch(0.65 0.22 250 / 0.3),
    inset 0 0 5px oklch(0.75 0.2 250 / 0.2);
}
```

## Texture Overlays

### Paper Texture

```css
.paper-texture {
  position: relative;
  background: oklch(0.98 0.01 85); /* Warm off-white */
}

.paper-texture::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' stitchTiles='stitch'/%3E%3CfeDiffuseLighting in='noise' lighting-color='%23fff' surfaceScale='2'%3E%3CfeDistantLight azimuth='45' elevation='60'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  mix-blend-mode: multiply;
}
```

### Fabric/Linen Texture

```css
.linen-texture {
  background-color: oklch(0.96 0.02 75);
  background-image:
    repeating-linear-gradient(
      0deg,
      oklch(0 0 0 / 0.03) 0px,
      oklch(0 0 0 / 0.03) 1px,
      transparent 1px,
      transparent 4px
    ),
    repeating-linear-gradient(
      90deg,
      oklch(0 0 0 / 0.03) 0px,
      oklch(0 0 0 / 0.03) 1px,
      transparent 1px,
      transparent 4px
    );
}
```

## Performance Considerations

### Efficient Backdrop Filter

```css
/* Use will-change for glass effects */
.glass-card {
  will-change: backdrop-filter;
}

/* Limit blur radius for performance */
.glass-performant {
  backdrop-filter: blur(10px); /* Not blur(50px) */
}

/* Fallback for unsupported browsers */
@supports not (backdrop-filter: blur(10px)) {
  .glass-card {
    background: oklch(1 0 0 / 0.9);
  }
}
```

### GPU-Friendly Grain

```css
/* Use transform for grain animation, not filter changes */
.grain-performant::before {
  transform: translateZ(0); /* Force GPU layer */
  will-change: transform;
}
```

## Output: Atmosphere Specification

```markdown
# Atmosphere Specification

## Texture Approach
- Grain: [intensity, color]
- Additional textures: [paper, linen, etc.]

## Gradient System
- Mesh gradient: [preset or custom]
- Usage: [where applied]

## Glass Effects
- Blur level: [px]
- Background opacity: [%]
- Border treatment: [description]

## Shadow System
| Level | Usage | Value |
|-------|-------|-------|
| 1 | [context] | [value] |
| 2 | [context] | [value] |
| ... | ... | ... |

## Glow Effects
- Primary glow: [color, spread]
- Usage guidelines: [when to use]

## Performance Notes
- [Any performance considerations]
```

## Deliverables Checklist

- [ ] Atmosphere discovery completed
- [ ] Grain overlay configured
- [ ] Mesh gradient created
- [ ] Glassmorphism system defined
- [ ] Shadow elevation scale implemented
- [ ] Glow effects prepared (if applicable)
- [ ] Performance optimizations applied
- [ ] Fallbacks for unsupported browsers
- [ ] Dark mode variants created
