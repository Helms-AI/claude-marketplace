---
name: ux-layout-composer
description: Grid-breaking spatial composition - intentional asymmetry, whitespace choreography, and unconventional visual hierarchy
---

# Layout Composer Skill

When invoked with `/ux-layout-composer`, create spatial compositions that break free from predictable grid patterns while maintaining usability and visual coherence.

## The Anti-Grid Manifesto

### Layouts to Question

These aren't bad layouts - they're just *everywhere*:

| Pattern | Why It's Overused | When It's Right |
|---------|-------------------|-----------------|
| **Hero → 3 Cards → CTA** | The SaaS landing page formula | Genuinely comparing 3 equal features |
| **12-column symmetric grid** | Bootstrap/Foundation default | Dense data dashboards |
| **Centered max-width container** | "Safe" responsive approach | Long-form content reading |
| **Equal-padding card grid** | Low-effort component layout | Homogeneous product listings |
| **Sidebar + main content** | Documentation default | Actually hierarchical nav |

### What We Stand For

- **Intentional Asymmetry** - Imbalance that draws the eye deliberately
- **Whitespace as Element** - Negative space as a design tool, not leftover
- **Overlapping Layers** - Depth through spatial intersection
- **Rhythm over Repetition** - Varied spacing that creates visual music
- **Grid Breaking** - Know the rules, then break them purposefully

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to understand spatial needs:

### Layout Discovery Questions

```
Question 1: "What's the primary content type?"
Header: "Content"
Options:
- "Marketing/Landing" - Persuasive, conversion-focused
- "Dashboard/App" - Data-dense, functional
- "Editorial/Blog" - Long-form reading
- "Portfolio/Showcase" - Visual gallery, work display

Question 2: "How should the layout feel?"
Header: "Spatial Feel"
Options:
- "Spacious & Breathing" - Generous whitespace, unhurried
- "Dense & Efficient" - Information-rich, compact
- "Dynamic & Unexpected" - Asymmetric, attention-grabbing
- "Balanced & Calm" - Harmonious, predictable

Question 3: "What's the visual hierarchy style?"
Header: "Hierarchy"
Options:
- "Single Hero" - One dominant element, clear focus
- "Distributed Interest" - Multiple focal points, exploration
- "Narrative Flow" - Sequential, scroll-driven story
- "Grid-Based" - Systematic, modular
```

## Layout Patterns Beyond the Grid

### Pattern 1: The Bento Grid

Asymmetric tile layout with varying cell sizes:

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, minmax(200px, auto));
  gap: var(--spacing-4);
}

/* Feature item spans 2x2 */
.bento-feature {
  grid-column: span 2;
  grid-row: span 2;
}

/* Wide item spans full width */
.bento-wide {
  grid-column: span 4;
}

/* Tall item spans 2 rows */
.bento-tall {
  grid-row: span 2;
}

/* Example layout:
┌───────────────┬───────┬───────┐
│               │       │       │
│   Feature     │ Small │ Small │
│   (2x2)       │       │       │
│               ├───────┴───────┤
│               │     Wide      │
├───────────────┼───────┬───────┤
│     Tall      │ Small │ Small │
│               │       │       │
└───────────────┴───────┴───────┘
*/
```

### Pattern 2: Offset Columns

Intentionally misaligned sections for visual interest:

```css
.offset-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-16);
  align-items: center;
}

.offset-content {
  padding-left: var(--spacing-12);
}

.offset-visual {
  /* Push visual element up to overlap with previous section */
  margin-top: calc(-1 * var(--spacing-24));
}

/* Alternate offset direction for rhythm */
.offset-section:nth-child(even) .offset-content {
  order: 2;
  padding-left: 0;
  padding-right: var(--spacing-12);
}

.offset-section:nth-child(even) .offset-visual {
  margin-top: 0;
  margin-bottom: calc(-1 * var(--spacing-16));
}
```

### Pattern 3: The Editorial Spread

Magazine-inspired asymmetric layout:

```css
.editorial-spread {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: var(--spacing-8);
}

.editorial-sidebar {
  /* Sticky sidebar with meta info */
  position: sticky;
  top: var(--spacing-8);
  align-self: start;
}

.editorial-main {
  /* Main content column */
  max-width: 65ch;
}

.editorial-pullquote {
  /* Extends into the right column */
  grid-column: 2 / 4;
  font-size: var(--font-size-2xl);
  font-family: var(--font-display);
  padding-left: var(--spacing-8);
  border-left: 4px solid var(--color-accent);
}

.editorial-full-bleed {
  /* Full width breakout */
  grid-column: 1 / -1;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  width: 100vw;
}
```

### Pattern 4: Overlapping Cards

Cards that intentionally overlap for depth:

```css
.overlap-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0; /* No gap - overlap handled manually */
  padding: var(--spacing-12);
}

.overlap-card {
  background: var(--color-surface-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-8);
  box-shadow: var(--shadow-lg);
  transition: transform 0.3s ease, z-index 0s 0.3s;
}

.overlap-card:nth-child(2) {
  margin-top: var(--spacing-8);
  margin-left: calc(-1 * var(--spacing-6));
  margin-right: calc(-1 * var(--spacing-6));
  z-index: 1;
}

.overlap-card:nth-child(3) {
  margin-top: var(--spacing-16);
}

.overlap-card:hover {
  transform: translateY(-8px) scale(1.02);
  z-index: 10;
  transition: transform 0.3s ease, z-index 0s 0s;
}
```

### Pattern 5: Diagonal Flow

Content that follows a diagonal visual path:

```css
.diagonal-flow {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--spacing-6);
}

.diagonal-item:nth-child(1) {
  grid-column: 1 / 6;
  grid-row: 1;
}

.diagonal-item:nth-child(2) {
  grid-column: 4 / 9;
  grid-row: 2;
}

.diagonal-item:nth-child(3) {
  grid-column: 7 / 12;
  grid-row: 3;
}

.diagonal-item:nth-child(4) {
  grid-column: 10 / 13;
  grid-row: 4;
}

/* Creates a visual diagonal from top-left to bottom-right */
```

## Whitespace Choreography

### Rhythm Through Varied Spacing

```css
:root {
  /* Spacing tokens with intentional rhythm */
  --space-xs: 0.25rem;    /* 4px - micro adjustments */
  --space-sm: 0.5rem;     /* 8px - tight groupings */
  --space-md: 1rem;       /* 16px - related elements */
  --space-lg: 2rem;       /* 32px - section breathing */
  --space-xl: 4rem;       /* 64px - major sections */
  --space-2xl: 8rem;      /* 128px - dramatic pauses */
  --space-3xl: 12rem;     /* 192px - hero breathing room */
}

/* Section spacing rhythm (not uniform!) */
.section-hero {
  padding-block: var(--space-3xl);
}

.section-features {
  padding-block: var(--space-xl) var(--space-2xl);
}

.section-cta {
  padding-block: var(--space-2xl);
}

/* Varying inner spacing for visual interest */
.feature-grid {
  gap: var(--space-lg);
}

.feature-grid > :nth-child(3n+2) {
  margin-top: var(--space-md); /* Slight offset for rhythm */
}
```

### Dramatic Negative Space

```css
.hero-dramatic {
  min-height: 100vh;
  display: grid;
  grid-template-rows: 1fr auto 2fr;
  /* 1:2 ratio - content sits in golden section */
}

.hero-content {
  grid-row: 2;
  max-width: 60ch;
  /* Large surrounding space creates importance */
}

/* Pull quote with generous breathing room */
.pullquote-dramatic {
  padding-block: var(--space-2xl);
  padding-inline: var(--space-xl);
  margin-block: var(--space-3xl);
  text-align: center;
  /* Surrounding whitespace makes the quote feel important */
}
```

## Visual Hierarchy Patterns

### F-Pattern (Natural Reading)

```css
.f-pattern-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: auto auto auto;
  gap: var(--space-lg);
}

.f-primary {
  grid-column: 1 / -1;
  /* Full width top - first horizontal scan */
}

.f-secondary {
  grid-column: 1;
  /* Left column - second horizontal scan */
}

.f-aside {
  grid-column: 2;
  grid-row: 2 / 4;
  /* Right sidebar - scanned quickly */
}

.f-tertiary {
  grid-column: 1;
  /* Left column continues vertical scan */
}
```

### Z-Pattern (Call to Action Flow)

```css
.z-pattern-hero {
  display: grid;
  grid-template-areas:
    "logo . . nav"
    ". . . ."
    "headline headline headline ."
    ". . . ."
    ". . . cta";
  grid-template-columns: auto 1fr 1fr auto;
  grid-template-rows: auto 1fr auto 1fr auto;
  min-height: 100vh;
  padding: var(--space-lg);
}

/* Eye travels: logo → nav → headline → CTA */
.z-logo { grid-area: logo; }
.z-nav { grid-area: nav; }
.z-headline { grid-area: headline; }
.z-cta { grid-area: cta; }
```

### Broken Grid (Intentional Disruption)

```css
.broken-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-sm);
}

.broken-image {
  grid-column: 2 / 8;
  grid-row: 1 / 3;
}

.broken-text {
  grid-column: 6 / 11;
  grid-row: 2 / 4;
  background: var(--color-surface-primary);
  padding: var(--space-lg);
  margin-top: var(--space-xl);
  z-index: 1;
  /* Overlaps the image intentionally */
}

.broken-accent {
  grid-column: 10 / 13;
  grid-row: 1;
  /* Small element positioned off-grid */
  transform: translateY(var(--space-lg));
}
```

## Responsive Layout Strategies

### Container Queries for Component-Level Adaptation

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

.card {
  display: grid;
  grid-template-areas: "image" "content";
  gap: var(--space-md);
}

@container card (min-width: 400px) {
  .card {
    grid-template-areas: "image content";
    grid-template-columns: 1fr 2fr;
  }
}

@container card (min-width: 600px) {
  .card {
    grid-template-columns: 1fr 1fr;
  }
}
```

### Fluid Grid with clamp()

```css
.fluid-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(clamp(250px, 30vw, 400px), 1fr)
  );
  gap: clamp(var(--space-md), 3vw, var(--space-xl));
}
```

### Layout Shifts at Breakpoints

```css
.adaptive-layout {
  display: grid;
  gap: var(--space-lg);
}

/* Mobile: Stack */
@media (max-width: 639px) {
  .adaptive-layout {
    grid-template-columns: 1fr;
  }
}

/* Tablet: Asymmetric 2-column */
@media (min-width: 640px) and (max-width: 1023px) {
  .adaptive-layout {
    grid-template-columns: 2fr 1fr;
  }
}

/* Desktop: Bento */
@media (min-width: 1024px) {
  .adaptive-layout {
    grid-template-columns: 1fr 2fr 1fr;
    grid-template-rows: auto auto;
  }

  .adaptive-feature {
    grid-column: 2;
    grid-row: 1 / 3;
  }
}
```

## Layout Animation

### Scroll-Driven Layout Reveals

```css
.scroll-reveal-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
  align-items: center;
}

.scroll-reveal-content {
  animation: slide-in-left linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 50%;
}

.scroll-reveal-visual {
  animation: slide-in-right linear both;
  animation-timeline: view();
  animation-range: entry 10% entry 60%;
}

@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-reveal-content,
  .scroll-reveal-visual {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

## Output: Layout Specification

```markdown
# Layout Specification

## Layout Strategy
[Description of overall spatial approach]

## Grid System
- Columns: [X columns, asymmetric/symmetric]
- Gutter: [size tokens]
- Margins: [responsive values]

## Key Layout Patterns
1. **[Pattern Name]**
   - Usage: [context]
   - Code: [CSS snippet]

## Whitespace Rhythm
| Section Type | Top Padding | Bottom Padding |
|--------------|-------------|----------------|
| Hero | X | X |
| Feature | X | X |
| CTA | X | X |

## Visual Hierarchy
[Description of F/Z/custom pattern]

## Responsive Breakpoints
| Breakpoint | Layout Behavior |
|------------|-----------------|
| Mobile | [description] |
| Tablet | [description] |
| Desktop | [description] |

## Animation Considerations
[Scroll reveals, transitions between layouts]
```

## Deliverables Checklist

- [ ] Layout discovery completed
- [ ] Grid system defined (or intentionally broken)
- [ ] Whitespace rhythm documented
- [ ] Visual hierarchy patterns chosen
- [ ] Responsive strategy outlined
- [ ] Container queries where applicable
- [ ] Layout animation considered
- [ ] Anti-patterns explicitly avoided
