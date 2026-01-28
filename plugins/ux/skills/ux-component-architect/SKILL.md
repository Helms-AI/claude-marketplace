---
name: ux-component-architect
description: Modern component patterns for React 19, Vue 3.5, and Svelte 5 with distinctive aesthetic expression
---

# Component Architect Skill

When invoked with `/ux-component-architect`, design and implement component architectures using modern patterns and best practices.

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
| design-system | Token system, CSS custom properties, theme variables |
| aesthetic-director | Personality variants, component mood guidelines |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| storybook | Component specs, variant definitions, props documentation |
| performance-engineer | Component complexity analysis, bundle impact assessment |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Alex Kim → Taylor Brooks:** Component library is structured—here's the complexity analysis and recommendations for code-splitting these heavier components."
```

## Aesthetic-First Component Design

**IMPORTANT**: Components should express the aesthetic personality established by `/ux-aesthetic-director`. Avoid creating generic, template-like components.

### Distinctive Component Patterns

Instead of default patterns, consider aesthetic-driven alternatives:

| Default Pattern | Distinctive Alternative |
|-----------------|------------------------|
| **Standard Card** | Bento tile with varied sizes, overlapping cards, cards with bleed images |
| **Rounded Button** | Sharp-cornered with border animation, magnetic button, text-only with underline |
| **Icon + Text List** | Numbered list with large typography, timeline style, asymmetric layout |
| **Equal Grid** | Masonry, bento grid, staggered cards |
| **Generic Modal** | Slide-in panel, full-screen takeover, inline expansion |
| **Standard Tabs** | Pill selector, underline animation, segmented control |

### Component Aesthetic Variants

When building component libraries, include aesthetic variants:

```tsx
// Instead of just size variants, include personality variants
interface ButtonProps {
  // Standard variants
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';

  // Aesthetic personality variants
  personality?: 'default' | 'bold' | 'subtle' | 'playful';
}

// Personality affects more than color:
// - 'bold': Sharp corners, strong shadows, quick hover
// - 'subtle': Soft corners, no shadow, gentle hover
// - 'playful': Rounded, bouncy hover, colorful
```

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to gather requirements:

### Framework Questions

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

### Architecture Questions

```
Question 4: "Composition pattern preference?"
Header: "Patterns"
Options:
- "Compound Components" - Flexible slot-based composition
- "Render Props" - Maximum customization
- "Atomic Design" - Atoms → Molecules → Organisms
- "Feature-based" - Collocated by feature

Question 5: "State management approach?"
Header: "State"
Options:
- "Server state" - TanStack Query, SWR
- "Global store" - Zustand, Pinia, Svelte stores
- "URL state" - nuqs, searchParams
- "Local only" - Component state, Context
```

## React 19+ Patterns

### Server Component (Default)

```tsx
// components/ProductList.tsx (Server Component)
import { db } from '@/lib/db';
import { ProductCard } from './ProductCard';

export async function ProductList({ categoryId }: { categoryId: string }) {
  const products = await db.products.findMany({
    where: { categoryId },
    orderBy: { createdAt: 'desc' }
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

### Client Component with use hook

```tsx
// components/ProductSearch.tsx
'use client';

import { use, useState, useTransition } from 'react';
import { searchProducts } from '@/actions/products';

export function ProductSearch({ initialPromise }: {
  initialPromise: Promise<Product[]>
}) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [productsPromise, setProductsPromise] = useState(initialPromise);

  const products = use(productsPromise);

  const handleSearch = (value: string) => {
    setQuery(value);
    startTransition(() => {
      setProductsPromise(searchProducts(value));
    });
  };

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search products..."
        className="w-full px-4 py-2 border rounded-lg"
      />
      <div className="mt-4" data-pending={isPending || undefined}>
        {products.map(p => <ProductItem key={p.id} product={p} />)}
      </div>
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

Card.Header = function CardHeader({ children, className }: {
  children: ReactNode;
  className?: string
}) {
  return (
    <div className={cn('px-6 py-4 border-b border-border-default', className)}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ children, className }: {
  children: ReactNode;
  className?: string
}) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className }: {
  children: ReactNode;
  className?: string
}) {
  return (
    <div className={cn('px-6 py-4 border-t border-border-default', className)}>
      {children}
    </div>
  );
};

// Usage
<Card variant="outlined">
  <Card.Header>
    <h2>Card Title</h2>
  </Card.Header>
  <Card.Body>
    <p>Card content goes here</p>
  </Card.Body>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>
```

## Vue 3.5+ Patterns

### Composition API with defineModel

```vue
<!-- components/SearchInput.vue -->
<script setup lang="ts">
const query = defineModel<string>('query', { default: '' });
const results = defineModel<SearchResult[]>('results', { default: () => [] });

const { data, pending } = await useFetch('/api/search', {
  query: { q: query },
  watch: [query]
});

watchEffect(() => {
  if (data.value) results.value = data.value;
});
</script>

<template>
  <div class="search-container">
    <input
      v-model="query"
      type="search"
      placeholder="Search..."
      class="search-input"
    />
    <div v-if="pending" class="loading">Searching...</div>
  </div>
</template>
```

### Compound Component with Provide/Inject

```vue
<!-- components/Accordion/Accordion.vue -->
<script setup lang="ts">
import { provide, ref } from 'vue';
import type { AccordionContext } from './types';

const props = defineProps<{
  type?: 'single' | 'multiple';
  defaultValue?: string[];
}>();

const openItems = ref<Set<string>>(new Set(props.defaultValue));

const toggle = (id: string) => {
  if (props.type === 'single') {
    openItems.value = openItems.value.has(id) ? new Set() : new Set([id]);
  } else {
    const next = new Set(openItems.value);
    next.has(id) ? next.delete(id) : next.add(id);
    openItems.value = next;
  }
};

provide<AccordionContext>('accordion', {
  openItems,
  toggle
});
</script>

<template>
  <div class="accordion">
    <slot />
  </div>
</template>
```

## Svelte 5 Patterns

### Runes-based Component

```svelte
<!-- components/Counter.svelte -->
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

### Props with Runes

```svelte
<!-- components/UserCard.svelte -->
<script lang="ts">
  interface Props {
    user: User;
    onSelect?: (user: User) => void;
  }

  let { user, onSelect }: Props = $props();

  let isHovered = $state(false);
  let displayName = $derived(user.nickname || user.name);
</script>

<div
  class="user-card"
  class:hovered={isHovered}
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
  onclick={() => onSelect?.(user)}
>
  <img src={user.avatar} alt={displayName} />
  <span>{displayName}</span>
</div>
```

## Component Structure

### Atomic Design Structure

```
src/
├── components/
│   ├── atoms/           # Basic building blocks
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
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
│       ├── DashboardLayout/
│       └── AuthLayout/
```

### Feature-based Structure

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── actions/
│   │   │   └── auth.ts
│   │   └── index.ts
│   ├── products/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── actions/
│   └── checkout/
├── components/          # Shared components
│   └── ui/
└── lib/                 # Shared utilities
```

## Type-Safe Props Pattern

```typescript
// types/components.ts
import type { ComponentPropsWithoutRef, ElementType } from 'react';

type AsProp<C extends ElementType> = { as?: C };

type PropsToOmit<C extends ElementType, P> = keyof (AsProp<C> & P);

type PolymorphicComponentProp<
  C extends ElementType,
  Props = {}
> = Props & AsProp<C> & Omit<ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

// Usage
interface ButtonOwnProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

type ButtonProps<C extends ElementType = 'button'> = PolymorphicComponentProp<C, ButtonOwnProps>;

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

## Live Browser Verification with Playwright MCP

Use the Playwright MCP tools to verify component behavior in a live browser session.

### Component Rendering Verification

```
# Verify components render correctly
1. Navigate to component showcase/Storybook:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:6006" })

2. Take accessibility snapshot:
   mcp__plugin_playwright_playwright__browser_snapshot()

3. Screenshot the component:
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "component-showcase.png" })
```

### Button Component Testing

```
# Test button variants and states
1. Navigate to button story:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:6006/?path=/story/button" })

2. Get button snapshot:
   mcp__plugin_playwright_playwright__browser_snapshot()

3. Test hover state:
   mcp__plugin_playwright_playwright__browser_hover({ ref: "[button-ref]", element: "Primary button" })
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "button-hover.png" })

4. Test disabled state:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const btn = document.querySelector('button[disabled]');
       return btn ? {
         disabled: btn.disabled,
         ariaDisabled: btn.getAttribute('aria-disabled'),
         cursor: getComputedStyle(btn).cursor,
         opacity: getComputedStyle(btn).opacity
       } : null;
     }"
   })

5. Test loading state:
   mcp__plugin_playwright_playwright__browser_click({ ref: "[loading-button-ref]", element: "Loading button" })
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const btn = document.querySelector('button[data-loading]');
       return {
         hasSpinner: !!btn?.querySelector('.spinner, [class*=\"spin\"]'),
         isDisabled: btn?.disabled
       };
     }"
   })
```

### Form Component Testing

```
# Test input, select, and form components
1. Navigate to form components:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000/demo/form" })

2. Get form snapshot:
   mcp__plugin_playwright_playwright__browser_snapshot()

3. Test input focus:
   mcp__plugin_playwright_playwright__browser_click({ ref: "[input-ref]", element: "Email input" })
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "input-focus.png" })

4. Type in input:
   mcp__plugin_playwright_playwright__browser_type({
     ref: "[input-ref]",
     text: "test@example.com",
     element: "Email input"
   })

5. Test validation:
   mcp__plugin_playwright_playwright__browser_type({
     ref: "[input-ref]",
     text: "invalid-email",
     element: "Email input"
   })
   mcp__plugin_playwright_playwright__browser_press_key({ key: "Tab" })
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const input = document.querySelector('input[type=\"email\"]');
       return {
         valid: input?.validity.valid,
         validationMessage: input?.validationMessage,
         hasErrorClass: input?.classList.contains('error')
       };
     }"
   })
```

### Modal/Dialog Component Testing

```
# Test modal open, close, and focus management
1. Navigate to modal demo:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000/demo/modal" })

2. Click to open modal:
   mcp__plugin_playwright_playwright__browser_click({ ref: "[modal-trigger-ref]", element: "Open modal button" })

3. Verify modal is open:
   mcp__plugin_playwright_playwright__browser_snapshot()
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const dialog = document.querySelector('[role=\"dialog\"]');
       return {
         visible: dialog?.offsetParent !== null,
         ariaModal: dialog?.getAttribute('aria-modal'),
         focusedElement: document.activeElement?.tagName
       };
     }"
   })

4. Test focus trap:
   mcp__plugin_playwright_playwright__browser_press_key({ key: "Tab" })
   mcp__plugin_playwright_playwright__browser_press_key({ key: "Tab" })
   mcp__plugin_playwright_playwright__browser_press_key({ key: "Tab" })
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const dialog = document.querySelector('[role=\"dialog\"]');
       const focused = document.activeElement;
       return {
         focusInsideDialog: dialog?.contains(focused),
         focusedElement: focused?.tagName
       };
     }"
   })

5. Test Escape to close:
   mcp__plugin_playwright_playwright__browser_press_key({ key: "Escape" })
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => ({
       dialogClosed: !document.querySelector('[role=\"dialog\"]')?.offsetParent,
       focusReturned: document.activeElement?.textContent
     })"
   })
```

### Tabs Component Testing

```
# Test tab navigation and keyboard controls
1. Navigate to tabs demo:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000/demo/tabs" })

2. Get tabs structure:
   mcp__plugin_playwright_playwright__browser_snapshot()

3. Click second tab:
   mcp__plugin_playwright_playwright__browser_click({ ref: "[tab-2-ref]", element: "Second tab" })

4. Verify tab panel changed:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const tabs = document.querySelectorAll('[role=\"tab\"]');
       const panels = document.querySelectorAll('[role=\"tabpanel\"]');
       return {
         activeTab: Array.from(tabs).findIndex(t => t.getAttribute('aria-selected') === 'true'),
         visiblePanel: Array.from(panels).findIndex(p => !p.hidden)
       };
     }"
   })

5. Test keyboard navigation (Arrow keys):
   mcp__plugin_playwright_playwright__browser_click({ ref: "[tab-1-ref]", element: "First tab" })
   mcp__plugin_playwright_playwright__browser_press_key({ key: "ArrowRight" })
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => document.activeElement?.textContent"
   })
```

### Accordion Component Testing

```
# Test accordion expand/collapse
1. Navigate to accordion:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000/demo/accordion" })

2. Get initial state:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const items = document.querySelectorAll('[data-accordion-item]');
       return Array.from(items).map(item => ({
         expanded: item.querySelector('[aria-expanded]')?.getAttribute('aria-expanded'),
         contentVisible: item.querySelector('[data-accordion-content]')?.offsetHeight > 0
       }));
     }"
   })

3. Click to expand:
   mcp__plugin_playwright_playwright__browser_click({ ref: "[accordion-trigger-ref]", element: "Accordion item 1" })

4. Verify expansion:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const trigger = document.querySelector('[data-accordion-trigger]');
       const content = document.querySelector('[data-accordion-content]');
       return {
         expanded: trigger?.getAttribute('aria-expanded'),
         contentHeight: content?.offsetHeight
       };
     }"
   })
```

### Dropdown/Select Component Testing

```
# Test dropdown menu behavior
1. Navigate to dropdown:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000/demo/dropdown" })

2. Click to open dropdown:
   mcp__plugin_playwright_playwright__browser_click({ ref: "[dropdown-trigger-ref]", element: "Dropdown button" })

3. Verify dropdown is open:
   mcp__plugin_playwright_playwright__browser_snapshot()

4. Navigate with keyboard:
   mcp__plugin_playwright_playwright__browser_press_key({ key: "ArrowDown" })
   mcp__plugin_playwright_playwright__browser_press_key({ key: "ArrowDown" })
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => ({
       focusedOption: document.activeElement?.textContent
     })"
   })

5. Select with Enter:
   mcp__plugin_playwright_playwright__browser_press_key({ key: "Enter" })
```

### Card Component Visual Testing

```
# Verify card layout and variants
1. Navigate to card showcase:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000/demo/cards" })

2. Screenshot all variants:
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", fullPage: true, filename: "cards-all.png" })

3. Verify compound component structure:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const card = document.querySelector('.card');
       return {
         hasHeader: !!card?.querySelector('.card-header, [class*=\"CardHeader\"]'),
         hasBody: !!card?.querySelector('.card-body, [class*=\"CardBody\"]'),
         hasFooter: !!card?.querySelector('.card-footer, [class*=\"CardFooter\"]')
       };
     }"
   })
```

### Complete Component Verification Workflow

```
# Full component verification using Playwright MCP:

1. **Setup**
   - Start dev server or Storybook
   - Navigate to component showcase

2. **Visual Verification**
   - Screenshot each component variant
   - Verify styling matches design tokens

3. **Interactive Testing**
   - Test hover states
   - Test focus states
   - Test click/selection

4. **Keyboard Navigation**
   - Tab through all interactive elements
   - Test arrow key navigation where applicable
   - Verify focus indicators

5. **State Testing**
   - Test disabled states
   - Test loading states
   - Test error states
   - Test empty states

6. **Accessibility Verification**
   - Verify ARIA attributes
   - Test screen reader announcements
   - Check focus management

7. **Documentation**
   - Export screenshots for docs
   - Record GIFs for interactions
```

## Shadcn/ui Customization Guide

When using shadcn/ui, don't stop at the defaults. Make components distinctive:

```tsx
// Default shadcn button
<Button variant="default">Default</Button>

// Customized with aesthetic personality
// 1. Update the button.tsx variants to include personality
// 2. Modify CSS variables in globals.css for brand expression
// 3. Add distinctive hover states beyond scale/opacity

// Example: Editorial aesthetic button
const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all",
  {
    variants: {
      personality: {
        editorial: [
          "rounded-none",
          "border-b-2 border-foreground",
          "hover:bg-foreground hover:text-background",
          "px-0 pb-1",
        ],
        brutalist: [
          "rounded-none",
          "border-2 border-foreground",
          "shadow-[4px_4px_0_0_currentColor]",
          "hover:shadow-none hover:translate-x-1 hover:translate-y-1",
        ],
        organic: [
          "rounded-full",
          "shadow-lg shadow-primary/20",
          "hover:shadow-xl hover:shadow-primary/30",
          "hover:-translate-y-0.5",
        ],
      },
    },
  }
);
```

## Deliverables Checklist

- [ ] Component architecture defined
- [ ] Base components implemented (Button, Input, Card, etc.)
- [ ] **Aesthetic personality variants included**
- [ ] **Distinctive patterns used (not template defaults)**
- [ ] Compound components where appropriate
- [ ] TypeScript types for all props
- [ ] Unit tests for components
- [ ] Storybook stories (if applicable)
- [ ] Component documentation
- [ ] Export barrel files configured
- [ ] **Playwright MCP component verification completed**
