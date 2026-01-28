---
name: ux-responsive-engineer
description: Container queries, fluid typography, CSS subgrid, and responsive design patterns
---

# Responsive Engineer Skill

When invoked with `/ux-responsive-engineer`, implement responsive design using modern CSS features including container queries, fluid typography, and subgrid.

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Riley Chen - Responsive Engineer** is now working on this.
> "Every breakpoint is a design decision, not just a width."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| layout-composer | Grid system, layout patterns, content structure |
| design-system | Spacing tokens, breakpoint definitions, fluid scales |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| performance-engineer | Responsive strategy, image sizing, viewport-specific optimizations |
| component-architect | Responsive patterns, container query implementations, adaptive components |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Riley Chen → Taylor Brooks:** Responsive implementation complete—here's the viewport analysis and recommendations for performance at each breakpoint."
```

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to gather requirements:

### Layout Strategy Questions

```
Question 1: "What's your responsive approach?"
Header: "Strategy (for Riley)"
Options:
- "Mobile-first" - Start small, enhance for larger screens
- "Desktop-first" - Start large, adapt for smaller screens
- "Component-first" - Container queries for component-level responsiveness
- "Fluid" - No breakpoints, fully fluid design

Question 2: "Container queries or viewport queries?"
Header: "Queries"
Options:
- "Container queries" - Components adapt to their container
- "Viewport queries" - Traditional media queries
- "Hybrid" - Mix of both approaches
- "Auto-detect" - Use what fits each component

Question 3: "Target devices/breakpoints?"
Header: "Breakpoints"
MultiSelect: true
Options:
- "Mobile" - 320px - 480px
- "Tablet" - 481px - 768px
- "Laptop" - 769px - 1024px
- "Desktop" - 1025px+
```

### Typography Questions

```
Question 4: "Typography scaling approach?"
Header: "Type Scale"
Options:
- "Fluid clamp()" - Smoothly scales with viewport
- "Step-based" - Jumps at breakpoints
- "Container-based" - Scales with container
- "Fixed" - Same size across all screens

Question 5: "Spacing system?"
Header: "Spacing"
Options:
- "Fluid spacing" - Space scales with viewport/container
- "Fixed scale" - Consistent spacing, grid adjusts
- "Hybrid" - Fluid for large spaces, fixed for small
```

## Container Queries

### Basic Container Query Setup

```css
/* styles/containers.css */
/* Define container types */
.card-container {
  container-type: inline-size;
  container-name: card;
}

.sidebar-container {
  container-type: inline-size;
  container-name: sidebar;
}

/* Component adapts to container size */
.card {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

/* Small container: stack vertically */
@container card (max-width: 300px) {
  .card {
    grid-template-columns: 1fr;
  }
  .card-image {
    aspect-ratio: 16/9;
  }
}

/* Medium container: side by side */
@container card (min-width: 301px) and (max-width: 500px) {
  .card {
    grid-template-columns: 120px 1fr;
  }
  .card-image {
    aspect-ratio: 1;
  }
}

/* Large container: horizontal with more space */
@container card (min-width: 501px) {
  .card {
    grid-template-columns: 200px 1fr auto;
    align-items: center;
  }
}
```

### Container Query Units

```css
/* Container-relative units */
.responsive-text {
  /* 5% of container's inline size */
  font-size: clamp(1rem, 5cqi, 2rem);

  /* Container query width/height units */
  padding-inline: 5cqw;
  padding-block: 3cqh;
}

/* Container minimum/maximum */
.adaptive-element {
  width: min(100cqi, 600px);
  margin-inline: max(2cqi, 1rem);
}
```

### React Component with Container Queries

```tsx
// components/ResponsiveCard.tsx
import styles from './ResponsiveCard.module.css';

interface CardProps {
  image: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function ResponsiveCard({ image, title, description, actions }: CardProps) {
  return (
    <div className={styles.container}>
      <article className={styles.card}>
        <img src={image} alt="" className={styles.image} />
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </article>
    </div>
  );
}
```

```css
/* ResponsiveCard.module.css */
.container {
  container-type: inline-size;
}

.card {
  display: grid;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  background: var(--surface-primary);
  border-radius: var(--radius-lg);
}

.image {
  width: 100%;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.title {
  font-size: clamp(1rem, 4cqi, 1.5rem);
}

.description {
  color: var(--text-secondary);
}

/* Vertical layout for narrow containers */
@container (max-width: 400px) {
  .card {
    grid-template-columns: 1fr;
  }

  .image {
    aspect-ratio: 16/9;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }
}

/* Horizontal layout for wider containers */
@container (min-width: 401px) {
  .card {
    grid-template-columns: 150px 1fr;
    grid-template-rows: auto 1fr auto;
  }

  .image {
    grid-row: span 3;
    aspect-ratio: 1;
    height: 100%;
  }

  .actions {
    display: flex;
    gap: var(--spacing-2);
  }
}
```

## Fluid Typography

### Clamp-based Type Scale

```css
/* styles/typography.css */
:root {
  /* Fluid type scale using clamp() */
  /* Format: clamp(min, preferred, max) */

  --font-size-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --font-size-base: clamp(1rem, 0.925rem + 0.375vw, 1.125rem);
  --font-size-lg: clamp(1.125rem, 1rem + 0.625vw, 1.375rem);
  --font-size-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.625rem);
  --font-size-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 2.25rem);
  --font-size-3xl: clamp(1.875rem, 1.5rem + 1.875vw, 3rem);
  --font-size-4xl: clamp(2.25rem, 1.75rem + 2.5vw, 4rem);

  /* Fluid line heights */
  --line-height-tight: 1.2;
  --line-height-base: 1.5;
  --line-height-relaxed: 1.75;
}

/* Usage */
.heading-hero {
  font-size: var(--font-size-4xl);
  line-height: var(--line-height-tight);
}

.body-text {
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}
```

### Fluid Spacing

```css
/* styles/spacing.css */
:root {
  /* Fluid spacing scale */
  --space-3xs: clamp(0.25rem, 0.2rem + 0.25vw, 0.375rem);
  --space-2xs: clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem);
  --space-xs: clamp(0.75rem, 0.6rem + 0.75vw, 1.125rem);
  --space-sm: clamp(1rem, 0.8rem + 1vw, 1.5rem);
  --space-md: clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem);
  --space-lg: clamp(2rem, 1.6rem + 2vw, 3rem);
  --space-xl: clamp(3rem, 2.4rem + 3vw, 4.5rem);
  --space-2xl: clamp(4rem, 3.2rem + 4vw, 6rem);
}

/* Section spacing */
.section {
  padding-block: var(--space-xl);
}

/* Card padding */
.card {
  padding: var(--space-sm);
}

/* Gap in grids */
.grid {
  gap: var(--space-md);
}
```

## CSS Subgrid

### Form Layout with Subgrid

```css
/* Subgrid for aligned form fields */
.form {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-sm) var(--space-md);
}

.form-field {
  display: grid;
  grid-column: span 2;
  grid-template-columns: subgrid;
  align-items: start;
}

.form-label {
  padding-block: 0.5rem;
}

.form-input {
  width: 100%;
}

/* Full-width fields */
.form-field--full {
  grid-template-columns: 1fr;
}

.form-field--full .form-label {
  margin-bottom: var(--space-2xs);
}
```

### Card Grid with Subgrid

```css
/* Cards with aligned content using subgrid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
}

.card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: var(--space-sm);
}

/* When cards need aligned content across columns */
@supports (grid-template-rows: subgrid) {
  .card-grid {
    grid-template-rows: repeat(3, auto);
  }

  .card {
    grid-row: span 3;
    grid-template-rows: subgrid;
  }
}
```

## Modern Layout Patterns

### Holy Grail Layout

```css
.layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: minmax(200px, 1fr) minmax(0, 3fr) minmax(200px, 1fr);
  min-height: 100dvh;
}

.header {
  grid-column: 1 / -1;
}

.footer {
  grid-column: 1 / -1;
}

/* Responsive: stack on mobile */
@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: 2;
  }
}
```

### Auto-fit Grid

```css
/* Responsive grid without media queries */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: var(--space-md);
}

/* With container query alternative */
.cq-grid-container {
  container-type: inline-size;
}

.cq-grid {
  display: grid;
  gap: var(--space-md);
}

@container (min-width: 0) {
  .cq-grid { grid-template-columns: 1fr; }
}

@container (min-width: 400px) {
  .cq-grid { grid-template-columns: repeat(2, 1fr); }
}

@container (min-width: 700px) {
  .cq-grid { grid-template-columns: repeat(3, 1fr); }
}

@container (min-width: 1000px) {
  .cq-grid { grid-template-columns: repeat(4, 1fr); }
}
```

### Responsive Sidebar Layout

```css
.sidebar-layout {
  display: grid;
  grid-template-columns: fit-content(300px) minmax(50%, 1fr);
  gap: var(--space-lg);
}

/* Collapsible sidebar */
.sidebar-layout:has(.sidebar[data-collapsed]) {
  grid-template-columns: auto 1fr;
}

.sidebar[data-collapsed] {
  width: 60px;
}

/* Stack on mobile */
@media (max-width: 768px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: fixed;
    inset-inline-start: 0;
    inset-block: 0;
    width: min(80vw, 300px);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar[data-open] {
    transform: translateX(0);
  }
}
```

## Responsive Images

```tsx
// components/ResponsiveImage.tsx
interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: string;
  aspectRatio?: string;
  priority?: boolean;
}

export function ResponsiveImage({
  src,
  alt,
  sizes = '100vw',
  aspectRatio = '16/9',
  priority = false
}: ResponsiveImageProps) {
  // Generate srcset for different sizes
  const widths = [320, 640, 768, 1024, 1280, 1920];
  const srcSet = widths
    .map(w => `${src}?w=${w} ${w}w`)
    .join(', ');

  return (
    <img
      src={`${src}?w=1280`}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      style={{ aspectRatio }}
      className="w-full h-auto object-cover"
    />
  );
}

// Usage
<ResponsiveImage
  src="/images/hero.jpg"
  alt="Hero image"
  sizes="(max-width: 768px) 100vw, 50vw"
  aspectRatio="16/9"
  priority
/>
```

## Breakpoint Utilities

```typescript
// hooks/useBreakpoint.ts
import { useState, useEffect } from 'react';

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

type Breakpoint = keyof typeof breakpoints;

export function useBreakpoint(breakpoint: Breakpoint) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const query = `(min-width: ${breakpoints[breakpoint]}px)`;
    const mq = window.matchMedia(query);

    setMatches(mq.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);

    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);

  return matches;
}

// Usage
const isDesktop = useBreakpoint('lg');
```

## Live Browser Verification with Playwright MCP

Use the Playwright MCP tools to verify responsive behavior across viewports.

### Multi-Viewport Testing

```
# Test at standard breakpoints
# Mobile (320px)
1. Resize to mobile:
   mcp__plugin_playwright_playwright__browser_resize({ width: 320, height: 568 })

2. Navigate and screenshot:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000" })
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "mobile-320.png" })

3. Get accessibility snapshot for layout analysis:
   mcp__plugin_playwright_playwright__browser_snapshot()

# Tablet (768px)
4. Resize to tablet:
   mcp__plugin_playwright_playwright__browser_resize({ width: 768, height: 1024 })
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "tablet-768.png" })

# Desktop (1280px)
5. Resize to desktop:
   mcp__plugin_playwright_playwright__browser_resize({ width: 1280, height: 800 })
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "desktop-1280.png" })

# Wide (1920px)
6. Resize to wide desktop:
   mcp__plugin_playwright_playwright__browser_resize({ width: 1920, height: 1080 })
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "wide-1920.png" })
```

### Container Query Behavior Verification

```
# Test container query components at different sizes
1. Navigate to component showcase:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000/components" })

2. Verify container query styles:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const containers = document.querySelectorAll('[style*=\"container-type\"], .card-container');
       return Array.from(containers).map(c => {
         const rect = c.getBoundingClientRect();
         const styles = getComputedStyle(c);
         return {
           width: rect.width,
           containerType: styles.containerType,
           childLayout: c.querySelector('.card')?.style.gridTemplateColumns
         };
       });
     }"
   })

3. Resize and verify layout changes:
   mcp__plugin_playwright_playwright__browser_resize({ width: 400, height: 800 })
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const card = document.querySelector('.card');
       const styles = getComputedStyle(card);
       return {
         display: styles.display,
         gridTemplateColumns: styles.gridTemplateColumns,
         flexDirection: styles.flexDirection
       };
     }"
   })
```

### Fluid Typography Verification

```
# Verify typography scales correctly
1. At mobile width:
   mcp__plugin_playwright_playwright__browser_resize({ width: 320, height: 568 })
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const elements = {
         h1: document.querySelector('h1'),
         h2: document.querySelector('h2'),
         p: document.querySelector('p')
       };
       return Object.entries(elements).reduce((acc, [tag, el]) => {
         if (el) {
           acc[tag] = {
             fontSize: getComputedStyle(el).fontSize,
             lineHeight: getComputedStyle(el).lineHeight
           };
         }
         return acc;
       }, {});
     }"
   })

2. At desktop width:
   mcp__plugin_playwright_playwright__browser_resize({ width: 1280, height: 800 })
   # Repeat measurement - font sizes should be larger
```

### Horizontal Overflow Detection (WCAG 1.4.10)

```
# Check for horizontal scrolling at 320px
mcp__plugin_playwright_playwright__browser_resize({ width: 320, height: 568 })
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const html = document.documentElement;
    const hasOverflow = html.scrollWidth > html.clientWidth;

    // Find elements causing overflow
    const overflowingElements = [];
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth || rect.left < 0) {
        overflowingElements.push({
          tag: el.tagName,
          class: el.className,
          width: rect.width,
          right: rect.right
        });
      }
    });

    return {
      hasHorizontalOverflow: hasOverflow,
      scrollWidth: html.scrollWidth,
      clientWidth: html.clientWidth,
      overflowingElements: overflowingElements.slice(0, 5)
    };
  }"
})
```

### Touch Target Size Verification

```
# Verify touch targets are at least 44x44 (Apple) or 48x48 (Material)
mcp__plugin_playwright_playwright__browser_resize({ width: 375, height: 812 })
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const interactive = document.querySelectorAll('button, a, input, select, [role=\"button\"], [onclick]');
    const issues = [];
    const good = [];

    interactive.forEach(el => {
      const rect = el.getBoundingClientRect();
      const size = { width: rect.width, height: rect.height };
      const info = {
        tag: el.tagName,
        text: el.textContent?.trim().slice(0, 20),
        ...size
      };

      if (size.width < 44 || size.height < 44) {
        issues.push(info);
      } else {
        good.push(info);
      }
    });

    return {
      totalInteractive: interactive.length,
      passingCount: good.length,
      failingCount: issues.length,
      issues: issues
    };
  }"
})
```

### Mobile Navigation Testing

```
# Test mobile menu behavior
1. Resize to mobile:
   mcp__plugin_playwright_playwright__browser_resize({ width: 375, height: 812 })

2. Check for hamburger menu:
   mcp__plugin_playwright_playwright__browser_snapshot()

3. Click hamburger menu:
   mcp__plugin_playwright_playwright__browser_click({ ref: "[menu-button-ref]", element: "Mobile menu button" })

4. Verify menu opens:
   mcp__plugin_playwright_playwright__browser_snapshot()

5. Test menu keyboard navigation:
   mcp__plugin_playwright_playwright__browser_press_key({ key: "Tab" })
   mcp__plugin_playwright_playwright__browser_press_key({ key: "Tab" })

6. Close with Escape:
   mcp__plugin_playwright_playwright__browser_press_key({ key: "Escape" })
```

### Grid Layout Verification

```
# Verify grid responds to viewport changes
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const grids = document.querySelectorAll('[class*=\"grid\"], [style*=\"display: grid\"]');
    return Array.from(grids).map(grid => {
      const styles = getComputedStyle(grid);
      const children = grid.children;
      return {
        columns: styles.gridTemplateColumns,
        rows: styles.gridTemplateRows,
        gap: styles.gap,
        childCount: children.length,
        firstChildWidth: children[0]?.getBoundingClientRect().width
      };
    });
  }"
})
```

### Responsive Image Verification

```
# Verify images use responsive attributes
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const images = document.querySelectorAll('img');
    return Array.from(images).map(img => ({
      src: img.src.split('/').pop(),
      srcset: img.srcset ? 'has srcset' : 'missing srcset',
      sizes: img.sizes || 'missing sizes',
      loading: img.loading,
      width: img.width,
      height: img.height,
      naturalWidth: img.naturalWidth,
      displayed: img.getBoundingClientRect().width
    }));
  }"
})
```

### Complete Responsive Audit Workflow

```
# Full responsive audit using Playwright MCP:

1. **Mobile First (320px)**
   - Resize to 320px width
   - Screenshot full page
   - Check for horizontal overflow
   - Verify touch targets
   - Test mobile navigation
   - Check font sizes are readable

2. **Small Mobile (375px - iPhone)**
   - Resize to 375x812
   - Screenshot
   - Verify layout

3. **Tablet Portrait (768px)**
   - Resize to 768x1024
   - Screenshot
   - Check grid transitions

4. **Tablet Landscape (1024px)**
   - Resize to 1024x768
   - Screenshot
   - Verify navigation changes

5. **Desktop (1280px)**
   - Resize to 1280x800
   - Screenshot
   - Full layout verification

6. **Wide Desktop (1920px)**
   - Resize to 1920x1080
   - Screenshot
   - Check max-width constraints

7. **Report Generation**
   - Compare screenshots
   - Document layout shifts
   - Note any overflow issues
   - List touch target problems
```

## Deliverables Checklist

- [ ] Container query setup for components
- [ ] Fluid typography scale implemented
- [ ] Fluid spacing scale implemented
- [ ] Responsive layouts created
- [ ] Subgrid used where appropriate
- [ ] Responsive images configured
- [ ] Breakpoint utilities available
- [ ] Mobile navigation implemented
- [ ] Touch targets appropriately sized
- [ ] Tested across target devices
- [ ] **Playwright MCP multi-viewport verification completed**
