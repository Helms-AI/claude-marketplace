---
name: frontend-performance-engineer
description: Core Web Vitals optimization, code splitting, and bundle optimization
---

# Performance Engineer Skill

When invoked with `/frontend-performance-engineer`, optimize frontend performance focusing on Core Web Vitals, bundle size, and runtime performance.

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Taylor Brooks - Performance Engineer** is now working on this.
> "Fast is a feature. Perceived performance is everything."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| `/user-experience-typography-curator` | Font payload, loading strategy, subsetting requirements |
| `/frontend-motion-designer` | Animation budget, GSAP/Lottie bundle impact, frame rate targets |
| `/user-experience-texture-atmosphere` | Filter usage, gradient complexity, GPU-intensive effects |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| `/frontend-design-system` | Optimized tokens, performance-safe defaults, lazy-load boundaries |
| `/frontend-orchestrator` | Performance report, Core Web Vitals status, optimization roadmap |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Taylor Brooks → Chris Nakamura:** Performance audit complete—Core Web Vitals are green, here's the optimization report and remaining opportunities."
```

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to gather requirements:

```
Question 1: "What are your performance targets?"
Header: "Targets (for Taylor)"
Options:
- "Core Web Vitals green" - LCP < 2.5s, INP < 200ms, CLS < 0.1
- "E-commerce grade" - Aggressive targets for conversion
- "Content site" - Focus on FCP and LCP
- "Web app" - Focus on INP and runtime

Question 2: "What are your main performance concerns?"
Header: "Concerns"
MultiSelect: true
Options:
- "Initial load" - First Contentful Paint, LCP
- "Interactivity" - INP, Time to Interactive
- "Visual stability" - Cumulative Layout Shift
- "Bundle size" - JavaScript/CSS payload

Question 3: "What's your build setup?"
Header: "Build"
Options:
- "Next.js/Turbopack" - Next.js 15+ with Turbopack
- "Vite" - Vite with Rollup
- "Webpack" - Traditional webpack setup
```

## Core Web Vitals

### LCP (Largest Contentful Paint) < 2.5s

```tsx
// Optimize LCP hero image
import Image from 'next/image';

export default function Home() {
  return (
    <main>
      <Image
        src="/hero.jpg"
        alt="Hero"
        width={1920}
        height={1080}
        priority
        sizes="100vw"
        quality={85}
        placeholder="blur"
        blurDataURL={heroBlurDataURL}
      />
    </main>
  );
}
```

### INP (Interaction to Next Paint) < 200ms

```tsx
// Use useTransition for non-urgent updates
import { useState, useTransition, useDeferredValue } from 'react';

function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);
  const results = useExpensiveSearch(deferredQuery);

  return (
    <div style={{ opacity: query !== deferredQuery ? 0.7 : 1 }}>
      {results.map(r => <ResultItem key={r.id} item={r} />)}
    </div>
  );
}
```

### CLS (Cumulative Layout Shift) < 0.1

```css
/* Reserve space for dynamic content */
.image-container {
  aspect-ratio: 16 / 9;
  background: var(--color-gray-100);
}

/* Fixed dimensions for ads/embeds */
.ad-slot {
  min-height: 250px;
  contain: layout;
}

/* Skeleton loading states */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-gray-100) 25%,
    var(--color-gray-200) 50%,
    var(--color-gray-100) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

## Code Splitting

### Route-based Splitting (Next.js)

```tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});

const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  loading: () => null
});
```

### Component-level Splitting

```tsx
import { lazy, Suspense } from 'react';

const Comments = lazy(() => import('./Comments'));
const RelatedPosts = lazy(() => import('./RelatedPosts'));

function BlogPost({ post }: { post: Post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <PostContent content={post.content} />

      <Suspense fallback={<CommentsSkeleton />}>
        <Comments postId={post.id} />
      </Suspense>

      <Suspense fallback={<RelatedSkeleton />}>
        <RelatedPosts category={post.category} />
      </Suspense>
    </article>
  );
}
```

### Library Splitting

```typescript
// Import only what you need
// Bad - imports entire library
import _ from 'lodash';

// Good - tree-shakeable
import { debounce } from 'lodash-es';

// Better - minimal bundle
import debounce from 'lodash/debounce';
```

## Bundle Analysis

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

module.exports = withBundleAnalyzer({
  // config
});
```

## Image Optimization

```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  }
};
```

## Performance Monitoring

```tsx
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
```

```typescript
// lib/vitals.ts
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

## Caching Strategies

### Static Generation with Revalidation

```tsx
// app/products/page.tsx
export const revalidate = 3600; // Revalidate every hour

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductList products={products} />;
}
```

## Deliverables Checklist

- [ ] Core Web Vitals measured and baselined
- [ ] LCP optimized (< 2.5s)
- [ ] INP optimized (< 200ms)
- [ ] CLS minimized (< 0.1)
- [ ] Code splitting implemented
- [ ] Bundle size analyzed and optimized
- [ ] Images optimized
- [ ] Fonts optimized (display swap, subsetting)
- [ ] Caching strategy implemented
- [ ] Performance monitoring configured
- [ ] Performance budget enforced
