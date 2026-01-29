---
name: frontend-component-architect
description: Modern component patterns for React 19, Vue 3.5, and Svelte 5 with distinctive aesthetic expression
---

# Component Architect Skill

When invoked with `/frontend-component-architect`, design and implement component architectures using modern patterns and best practices.

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Alex Kim - Component Architect** is now working on this.
> "Components should express personality, not just render data."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| `/frontend-design-system` | Token system, CSS custom properties, theme variables |
| `/user-experience-aesthetic-director` | Personality variants, component mood guidelines |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| `/frontend-storybook` | Component specs, variant definitions, props documentation |
| `/frontend-performance-engineer` | Component complexity analysis, bundle impact assessment |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Alex Kim → Taylor Brooks:** Component library is structured—here's the complexity analysis and recommendations for code-splitting these heavier components."
```

## Aesthetic-First Component Design

**IMPORTANT**: Components should express the aesthetic personality established by the user-experience plugin. Avoid creating generic, template-like components.

### Distinctive Component Patterns

| Default Pattern | Distinctive Alternative |
|-----------------|------------------------|
| **Standard Card** | Bento tile with varied sizes, overlapping cards |
| **Rounded Button** | Sharp-cornered with border animation, magnetic button |
| **Icon + Text List** | Numbered list with large typography, timeline style |
| **Equal Grid** | Masonry, bento grid, staggered cards |
| **Generic Modal** | Slide-in panel, full-screen takeover |
| **Standard Tabs** | Pill selector, underline animation |

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to gather requirements:

```
Question 1: "Which framework are you using?"
Header: "Framework (for Alex)"
Options:
- "React 19+" - With Server Components, use hook
- "Vue 3.5+" - Composition API, defineModel
- "Svelte 5" - Runes, fine-grained reactivity
- "Astro 5" - Islands architecture

Question 2: "What's your rendering strategy?"
Header: "Rendering"
Options:
- "Server Components" - RSC-first, minimal client JS
- "Client-side" - Traditional SPA approach
- "Hybrid" - Mix of server and client components
- "Static" - Build-time rendering

Question 3: "Component library approach?"
Header: "Library"
Options:
- "Headless UI" - Unstyled, full control (Radix, Headless UI)
- "Styled library" - Pre-styled (shadcn/ui, Chakra)
- "Custom" - Build from scratch
- "Extend existing" - Add to current library
```

## React 19+ Patterns

### Server Component (Default)

```tsx
// components/ProductList.tsx (Server Component)
import { db } from '@/lib/db';
import { ProductCard } from './ProductCard';

export async function ProductList({ categoryId }: { categoryId: string }) {
  const products = await db.products.findMany({
    where: { categoryId }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Compound Component Pattern

```tsx
// components/ui/Card.tsx
import { createContext, useContext, type ReactNode } from 'react';

type CardContextValue = { variant: 'default' | 'outlined' };
const CardContext = createContext<CardContextValue>({ variant: 'default' });

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'outlined';
  className?: string;
}

export function Card({ children, variant = 'default', className }: CardProps) {
  return (
    <CardContext.Provider value={{ variant }}>
      <div className={cn(
        'rounded-lg',
        variant === 'default' && 'bg-surface-primary shadow-md',
        variant === 'outlined' && 'border border-border-default',
        className
      )}>
        {children}
      </div>
    </CardContext.Provider>
  );
}

Card.Header = function CardHeader({ children, className }) {
  return (
    <div className={cn('px-6 py-4 border-b border-border-default', className)}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ children, className }) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className }) {
  return (
    <div className={cn('px-6 py-4 border-t border-border-default', className)}>
      {children}
    </div>
  );
};
```

## Vue 3.5+ Patterns

### Composition API with defineModel

```vue
<script setup lang="ts">
const query = defineModel<string>('query', { default: '' });
const results = defineModel<SearchResult[]>('results', { default: () => [] });

const { data, pending } = await useFetch('/api/search', {
  query: { q: query },
  watch: [query]
});
</script>

<template>
  <div class="search-container">
    <input v-model="query" type="search" placeholder="Search..." />
    <div v-if="pending" class="loading">Searching...</div>
  </div>
</template>
```

## Svelte 5 Patterns

### Runes-based Component

```svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);

  function increment() {
    count++;
  }

  $effect(() => {
    console.log(`Count changed to ${count}`);
  });
</script>

<button onclick={increment}>
  Count: {count} (doubled: {doubled})
</button>
```

## Component Structure

### Atomic Design Structure

```
src/
├── components/
│   ├── atoms/           # Basic building blocks
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Icon/
│   ├── molecules/       # Combinations of atoms
│   │   ├── SearchBar/
│   │   ├── FormField/
│   │   └── Card/
│   ├── organisms/       # Complex UI sections
│   │   ├── Header/
│   │   ├── ProductGrid/
│   │   └── CheckoutForm/
│   └── templates/       # Page layouts
│       └── DashboardLayout/
```

## Type-Safe Props Pattern

```typescript
type ButtonProps<C extends ElementType = 'button'> = {
  as?: C;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
} & Omit<ComponentPropsWithoutRef<C>, 'as' | 'variant' | 'size' | 'loading'>;

export function Button<C extends ElementType = 'button'>({
  as,
  variant = 'primary',
  size = 'md',
  loading,
  children,
  ...props
}: ButtonProps<C>) {
  const Component = as || 'button';

  return (
    <Component
      className={cn(buttonVariants({ variant, size }))}
      disabled={loading}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </Component>
  );
}
```

## Deliverables Checklist

- [ ] Component architecture defined
- [ ] Base components implemented (Button, Input, Card, etc.)
- [ ] Aesthetic personality variants included
- [ ] Distinctive patterns used (not template defaults)
- [ ] Compound components where appropriate
- [ ] TypeScript types for all props
- [ ] Unit tests for components
- [ ] Storybook stories (if applicable)
- [ ] Component documentation
