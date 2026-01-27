---
name: ux-performance-engineer
description: Core Web Vitals optimization, code splitting, and bundle optimization
---

# Performance Engineer Skill

When invoked with `/ux-performance-engineer`, optimize frontend performance focusing on Core Web Vitals, bundle size, and runtime performance.

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to gather requirements:

### Performance Goals Questions

```
Question 1: "What are your performance targets?"
Header: "Targets"
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

Question 3: "Any known performance issues?"
Header: "Issues"
Options:
- "Yes, specific pages" - I'll share which ones
- "Generally slow" - Need comprehensive audit
- "Mobile performance" - Slow on mobile devices
- "Just optimizing" - No known issues, proactive
```

### Technical Context Questions

```
Question 4: "What's your build setup?"
Header: "Build"
Options:
- "Next.js/Turbopack" - Next.js 15+ with Turbopack
- "Vite" - Vite with Rollup
- "Webpack" - Traditional webpack setup
- "Other" - Different bundler

Question 5: "Image optimization approach?"
Header: "Images"
Options:
- "Next/Image" - Built-in Next.js optimization
- "CDN (Cloudinary, etc.)" - External image CDN
- "Manual optimization" - Self-managed
- "Need setup" - Not currently optimized
```

## Core Web Vitals

### LCP (Largest Contentful Paint) < 2.5s

**Target**: Content appears within 2.5 seconds

```tsx
// Optimize LCP hero image
// pages/index.tsx
import Image from 'next/image';

export default function Home() {
  return (
    <main>
      {/* Priority loading for LCP element */}
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

```css
/* Preconnect and preload critical resources */
/* In <head> */
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin />

/* Inline critical CSS */
<style>
  /* Critical above-the-fold styles */
  .hero { ... }
</style>
```

### INP (Interaction to Next Paint) < 200ms

**Target**: Interactions respond within 200ms

```tsx
// Use useTransition for non-urgent updates
'use client';

import { useState, useTransition, useDeferredValue } from 'react';

function SearchResults({ query }: { query: string }) {
  // Defer expensive computation
  const deferredQuery = useDeferredValue(query);
  const results = useExpensiveSearch(deferredQuery);

  return (
    <div style={{ opacity: query !== deferredQuery ? 0.7 : 1 }}>
      {results.map(r => <ResultItem key={r.id} item={r} />)}
    </div>
  );
}

function FilterPanel() {
  const [filters, setFilters] = useState({});
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (key: string, value: string) => {
    // Urgent: update input immediately
    setLocalValue(value);

    // Non-urgent: update results with transition
    startTransition(() => {
      setFilters(prev => ({ ...prev, [key]: value }));
    });
  };

  return (
    <div data-pending={isPending || undefined}>
      {/* Filter UI */}
    </div>
  );
}
```

```typescript
// Break up long tasks
function processLargeDataset(items: Item[]) {
  const CHUNK_SIZE = 100;

  return new Promise<ProcessedItem[]>((resolve) => {
    const results: ProcessedItem[] = [];
    let index = 0;

    function processChunk() {
      const chunk = items.slice(index, index + CHUNK_SIZE);
      results.push(...chunk.map(processItem));
      index += CHUNK_SIZE;

      if (index < items.length) {
        // Yield to main thread
        requestIdleCallback(processChunk);
      } else {
        resolve(results);
      }
    }

    processChunk();
  });
}
```

### CLS (Cumulative Layout Shift) < 0.1

**Target**: Visual stability, minimal unexpected shifts

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

/* Prevent font swap layout shift */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-display: optional; /* or 'swap' with size-adjust */
  size-adjust: 100%;
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

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

```tsx
// Skeleton component
function CardSkeleton() {
  return (
    <div className="card">
      <div className="skeleton aspect-video rounded-lg" />
      <div className="mt-4 space-y-2">
        <div className="skeleton h-6 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
      </div>
    </div>
  );
}

// Use in Suspense boundaries
<Suspense fallback={<CardSkeleton />}>
  <AsyncCard />
</Suspense>
```

## Code Splitting

### Route-based Splitting (Next.js)

```tsx
// Automatic with app router
// app/dashboard/page.tsx - automatically code-split
export default function DashboardPage() {
  return <Dashboard />;
}

// Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false // Client-only component
});

// Conditional loading
const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  loading: () => null
});

export default function Page({ isAdmin }: { isAdmin: boolean }) {
  return (
    <main>
      <Content />
      {isAdmin && <AdminPanel />}
    </main>
  );
}
```

### Component-level Splitting

```tsx
// Lazy load below-the-fold content
import { lazy, Suspense } from 'react';

const Comments = lazy(() => import('./Comments'));
const RelatedPosts = lazy(() => import('./RelatedPosts'));

function BlogPost({ post }: { post: Post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <PostContent content={post.content} />

      {/* Lazy loaded sections */}
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

```javascript
// next.config.js - Optimize package imports
module.exports = {
  experimental: {
    optimizePackageImports: ['@icons-pack/react-simple-icons', 'lodash-es']
  }
};
```

```typescript
// Import only what you need
// ❌ Bad - imports entire library
import _ from 'lodash';
_.debounce(fn, 300);

// ✅ Good - tree-shakeable
import { debounce } from 'lodash-es';
debounce(fn, 300);

// ✅ Better - minimal bundle
import debounce from 'lodash/debounce';
debounce(fn, 300);
```

## Bundle Analysis

### Webpack Bundle Analyzer

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

module.exports = withBundleAnalyzer({
  // config
});

// Run: ANALYZE=true npm run build
```

### Bundle Size Budgets

```javascript
// next.config.js
module.exports = {
  experimental: {
    // Warn if page JS exceeds budget
    largePageDataBytes: 128 * 1024 // 128KB
  }
};
```

```json
// package.json - size-limit config
{
  "size-limit": [
    {
      "path": ".next/static/chunks/pages/*.js",
      "limit": "100 KB"
    },
    {
      "path": ".next/static/chunks/main-*.js",
      "limit": "200 KB"
    }
  ]
}
```

## Image Optimization

### Next.js Image Configuration

```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.example.com'
      }
    ]
  }
};
```

### Responsive Images Pattern

```tsx
// components/OptimizedImage.tsx
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  priority = false,
  fill = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      quality={80}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
      className="object-cover"
    />
  );
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

// On-demand revalidation
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const { path, tag } = await request.json();

  if (tag) {
    revalidateTag(tag);
  } else if (path) {
    revalidatePath(path);
  }

  return Response.json({ revalidated: true });
}
```

### Service Worker Caching

```typescript
// sw.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// Stale-while-revalidate for API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache'
  })
);
```

## Performance Monitoring

### Web Vitals Tracking

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

function sendToAnalytics(metric: Metric) {
  const body = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType
  };

  // Send to analytics endpoint
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', JSON.stringify(body));
  } else {
    fetch('/api/vitals', {
      method: 'POST',
      body: JSON.stringify(body),
      keepalive: true
    });
  }
}
```

## Performance Testing

### Playwright Performance Tests

```typescript
// tests/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('homepage loads within budget', async ({ page }) => {
    await page.goto('/');

    // Measure LCP
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      });
    });

    expect(lcp).toBeLessThan(2500);

    // Measure CLS
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          resolve(clsValue);
        }).observe({ type: 'layout-shift', buffered: true });

        // Resolve after page settles
        setTimeout(() => resolve(clsValue), 3000);
      });
    });

    expect(cls).toBeLessThan(0.1);
  });
});
```

## Live Browser Verification with Playwright MCP

Use the Playwright MCP tools to measure and verify performance in a live browser session.

### Core Web Vitals Measurement

```
# Measure LCP (Largest Contentful Paint)
1. Navigate to the page:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000" })

2. Wait for page to settle:
   mcp__plugin_playwright_playwright__browser_wait_for({ time: 3 })

3. Measure LCP:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       return new Promise((resolve) => {
         new PerformanceObserver((list) => {
           const entries = list.getEntries();
           const lastEntry = entries[entries.length - 1];
           resolve({
             lcp: lastEntry.startTime,
             element: lastEntry.element?.tagName,
             url: lastEntry.url,
             rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor'
           });
         }).observe({ type: 'largest-contentful-paint', buffered: true });
         setTimeout(() => resolve({ error: 'timeout' }), 5000);
       });
     }"
   })
```

### CLS (Cumulative Layout Shift) Measurement

```
# Measure layout shifts
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    return new Promise((resolve) => {
      let clsValue = 0;
      let clsEntries = [];

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push({
              value: entry.value,
              sources: entry.sources?.map(s => s.node?.tagName)
            });
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });

      setTimeout(() => {
        observer.disconnect();
        resolve({
          cls: clsValue,
          rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
          entries: clsEntries
        });
      }, 3000);
    });
  }"
})
```

### INP (Interaction to Next Paint) Testing

```
# Test button click responsiveness
1. Get page snapshot to find interactive elements:
   mcp__plugin_playwright_playwright__browser_snapshot()

2. Set up INP measurement:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       window.__inpEntries = [];
       new PerformanceObserver((list) => {
         for (const entry of list.getEntries()) {
           window.__inpEntries.push({
             name: entry.name,
             duration: entry.duration,
             target: entry.target?.tagName
           });
         }
       }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
     }"
   })

3. Click a button and measure response:
   mcp__plugin_playwright_playwright__browser_click({ ref: "[button-ref]", element: "Submit button" })

4. Get INP results:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const entries = window.__inpEntries || [];
       const maxDuration = Math.max(...entries.map(e => e.duration), 0);
       return {
         inp: maxDuration,
         rating: maxDuration < 200 ? 'good' : maxDuration < 500 ? 'needs-improvement' : 'poor',
         entries: entries
       };
     }"
   })
```

### Network Performance Analysis

```
# Get all network requests and analyze
mcp__plugin_playwright_playwright__browser_network_requests({ includeStatic: true })

# Analyze resource loading
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const resources = performance.getEntriesByType('resource');
    return resources.map(r => ({
      name: r.name.split('/').pop(),
      type: r.initiatorType,
      duration: Math.round(r.duration),
      transferSize: r.transferSize,
      cached: r.transferSize === 0 && r.decodedBodySize > 0
    })).sort((a, b) => b.duration - a.duration).slice(0, 10);
  }"
})
```

### Image Loading Verification

```
# Check if images have proper loading attributes
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const images = document.querySelectorAll('img');
    return Array.from(images).map(img => ({
      src: img.src.split('/').pop(),
      loading: img.loading,
      decoding: img.decoding,
      width: img.width,
      height: img.height,
      hasWidthHeight: img.hasAttribute('width') && img.hasAttribute('height'),
      inViewport: img.getBoundingClientRect().top < window.innerHeight
    }));
  }"
})
```

### Bundle Size Analysis

```
# Check JavaScript bundle sizes
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const scripts = performance.getEntriesByType('resource')
      .filter(r => r.initiatorType === 'script');

    return {
      totalScripts: scripts.length,
      totalSize: scripts.reduce((sum, s) => sum + s.transferSize, 0),
      scripts: scripts.map(s => ({
        name: s.name.split('/').pop()?.split('?')[0],
        size: s.transferSize,
        duration: Math.round(s.duration)
      })).sort((a, b) => b.size - a.size)
    };
  }"
})
```

### First Contentful Paint (FCP) Measurement

```
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(p => p.name === 'first-contentful-paint');
    const fp = paint.find(p => p.name === 'first-paint');
    return {
      fcp: fcp?.startTime,
      fp: fp?.startTime,
      fcpRating: fcp?.startTime < 1800 ? 'good' : fcp?.startTime < 3000 ? 'needs-improvement' : 'poor'
    };
  }"
})
```

### Time to Interactive Simulation

```
# Measure long tasks that block interactivity
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    return new Promise((resolve) => {
      const longTasks = [];
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTasks.push({
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      });

      observer.observe({ type: 'longtask', buffered: true });

      setTimeout(() => {
        observer.disconnect();
        resolve({
          longTaskCount: longTasks.length,
          totalBlockingTime: longTasks.reduce((sum, t) => sum + Math.max(0, t.duration - 50), 0),
          tasks: longTasks
        });
      }, 5000);
    });
  }"
})
```

### Visual Performance Comparison

```
# Take screenshots at different load stages
1. Navigate with screenshot on load:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000" })
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "perf-initial.png" })

2. Wait and screenshot after hydration:
   mcp__plugin_playwright_playwright__browser_wait_for({ time: 2 })
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "perf-hydrated.png" })

3. Scroll and screenshot for lazy-loaded content:
   mcp__plugin_playwright_playwright__browser_press_key({ key: "End" })
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "perf-scrolled.png" })
```

### Complete Performance Audit Workflow

```
# Full performance audit using Playwright MCP:

1. **Baseline Measurement**
   - Navigate to target URL
   - Measure FCP, LCP, CLS
   - Capture network waterfall
   - Take visual screenshot

2. **Resource Analysis**
   - List all loaded resources
   - Identify large bundles
   - Check for unused CSS/JS
   - Verify image optimization

3. **Interactivity Testing**
   - Set up INP observer
   - Click primary CTAs
   - Type in search fields
   - Measure response times

4. **Mobile Simulation**
   - Resize to mobile viewport
   - Re-run Core Web Vitals
   - Check touch targets
   - Test scroll performance

5. **Report Generation**
   - Compile all metrics
   - Compare against targets
   - Identify bottlenecks
   - Provide optimization recommendations
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
- [ ] **Playwright MCP verification completed**
