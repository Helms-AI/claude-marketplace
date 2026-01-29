---
name: frontend-responsive-engineer
description: Container queries, fluid typography, CSS subgrid, and responsive design patterns
---

# Responsive Engineer Skill

When invoked with `/frontend-responsive-engineer`, implement responsive design using modern CSS features including container queries, fluid typography, and subgrid.

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
| `/user-experience-layout-composer` | Grid system, layout patterns, content structure |
| `/frontend-design-system` | Spacing tokens, breakpoint definitions, fluid scales |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| `/frontend-performance-engineer` | Responsive strategy, image sizing, viewport-specific optimizations |
| `/frontend-component-architect` | Responsive patterns, container query implementations, adaptive components |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Riley Chen → Taylor Brooks:** Responsive implementation complete—here's the viewport analysis and recommendations for performance at each breakpoint."
```

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to gather requirements:

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

Question 3: "Typography scaling approach?"
Header: "Type Scale"
Options:
- "Fluid clamp()" - Smoothly scales with viewport
- "Step-based" - Jumps at breakpoints
- "Container-based" - Scales with container
```

## Container Queries

### Basic Container Query Setup

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

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
}

/* Medium container: side by side */
@container card (min-width: 301px) and (max-width: 500px) {
  .card {
    grid-template-columns: 120px 1fr;
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
.responsive-text {
  font-size: clamp(1rem, 5cqi, 2rem);
  padding-inline: 5cqw;
  padding-block: 3cqh;
}
```

## Fluid Typography

```css
:root {
  --font-size-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --font-size-base: clamp(1rem, 0.925rem + 0.375vw, 1.125rem);
  --font-size-lg: clamp(1.125rem, 1rem + 0.625vw, 1.375rem);
  --font-size-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.625rem);
  --font-size-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 2.25rem);
  --font-size-3xl: clamp(1.875rem, 1.5rem + 1.875vw, 3rem);
  --font-size-4xl: clamp(2.25rem, 1.75rem + 2.5vw, 4rem);
}
```

## Fluid Spacing

```css
:root {
  --space-3xs: clamp(0.25rem, 0.2rem + 0.25vw, 0.375rem);
  --space-2xs: clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem);
  --space-xs: clamp(0.75rem, 0.6rem + 0.75vw, 1.125rem);
  --space-sm: clamp(1rem, 0.8rem + 1vw, 1.5rem);
  --space-md: clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem);
  --space-lg: clamp(2rem, 1.6rem + 2vw, 3rem);
  --space-xl: clamp(3rem, 2.4rem + 3vw, 4.5rem);
}
```

## CSS Subgrid

### Form Layout with Subgrid

```css
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
```

### Card Grid with Subgrid

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
}

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

### Auto-fit Grid

```css
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: var(--space-md);
}
```

### Responsive Sidebar Layout

```css
.sidebar-layout {
  display: grid;
  grid-template-columns: fit-content(300px) minmax(50%, 1fr);
  gap: var(--space-lg);
}

@media (max-width: 768px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
  }
}
```

## Responsive Images

```tsx
export function ResponsiveImage({
  src,
  alt,
  sizes = '100vw',
  aspectRatio = '16/9',
  priority = false
}: ResponsiveImageProps) {
  const widths = [320, 640, 768, 1024, 1280, 1920];
  const srcSet = widths.map(w => `${src}?w=${w} ${w}w`).join(', ');

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
```

## Breakpoint Utilities

```typescript
// hooks/useBreakpoint.ts
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export function useBreakpoint(breakpoint: keyof typeof breakpoints) {
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
