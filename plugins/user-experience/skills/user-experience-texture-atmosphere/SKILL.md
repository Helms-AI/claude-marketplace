---
name: user-experience-texture-atmosphere
description: Depth, texture, and visual richness - grain overlays, mesh gradients, multi-shadow systems, and atmospheric effects
---

# Texture & Atmosphere Skill

When invoked with `/user-experience-texture-atmosphere`, add depth, texture, and visual richness to interfaces through grain overlays, mesh gradients, glassmorphism, shadow systems, and other atmospheric effects that make flat designs feel alive.

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Indigo Vasquez - Texture & Atmosphere Specialist** is now working on this.
> "Flat design had its moment. Let's bring back depth—the right way."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| `/user-experience-aesthetic-director` | Aesthetic archetype, atmosphere guidance |
| `/user-experience-color-alchemist` | Gradient presets, glow colors |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| `/frontend-design-system` | Shadow tokens, grain settings, glass presets |
| `/frontend-performance-engineer` | Blur/filter usage for performance review |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Indigo → [Next Team Member]:** Atmosphere specification ready:
- Grain: [intensity] with [color cast]
- Shadows: [depth system]
- Glass effects: [blur level] blur, [opacity]% opacity"
```

## Philosophy: Flat is Dead, Long Live Depth

Modern interfaces don't need to choose between flat design and skeuomorphism. The sweet spot is **atmospheric flat**: clean layouts with subtle depth cues, texture overlays, and environmental effects that create visual richness without noise.

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to understand atmospheric needs:

### Atmosphere Discovery Questions

```
Question 1: "What level of visual texture do you want?"
Header: "Texture (for Indigo)"
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
```

### Mesh Gradient Presets

```css
:root {
  --mesh-calm:
    radial-gradient(at 20% 20%, oklch(0.92 0.04 220 / 0.4) 0px, transparent 50%),
    radial-gradient(at 80% 80%, oklch(0.90 0.05 200 / 0.3) 0px, transparent 50%);

  --mesh-vibrant:
    radial-gradient(at 0% 50%, oklch(0.75 0.18 320 / 0.5) 0px, transparent 50%),
    radial-gradient(at 100% 50%, oklch(0.80 0.15 50 / 0.4) 0px, transparent 50%),
    radial-gradient(at 50% 100%, oklch(0.78 0.16 200 / 0.4) 0px, transparent 50%);

  --mesh-sunset:
    radial-gradient(at 0% 0%, oklch(0.85 0.12 25 / 0.5) 0px, transparent 50%),
    radial-gradient(at 100% 30%, oklch(0.80 0.15 50 / 0.4) 0px, transparent 50%),
    radial-gradient(at 50% 100%, oklch(0.75 0.10 290 / 0.3) 0px, transparent 50%);
}
```

## Glassmorphism System

### Proper Glassmorphism

```css
.glass-card {
  background: oklch(1 0 0 / 0.7);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid oklch(1 0 0 / 0.3);
  box-shadow:
    0 4px 6px -1px oklch(0 0 0 / 0.05),
    0 2px 4px -2px oklch(0 0 0 / 0.05);
  border-radius: var(--radius-lg);
}

.glass-card-dark {
  background: oklch(0.15 0.02 250 / 0.7);
  border: 1px solid oklch(1 0 0 / 0.1);
}
```

## Multi-Shadow Depth System

### Layered Shadow Tokens

```css
:root {
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

  --shadow-primary:
    0 4px 14px oklch(0.55 0.2 250 / 0.25);

  --shadow-glow:
    0 0 20px oklch(0.65 0.15 250 / 0.3),
    0 0 40px oklch(0.65 0.15 250 / 0.2);
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
