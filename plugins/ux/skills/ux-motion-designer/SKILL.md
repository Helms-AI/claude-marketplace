---
name: ux-motion-designer
description: Animations, transitions, and micro-interactions using GSAP, Lottie, Rive, Framer Motion, View Transitions API, and scroll-driven CSS
---

# Motion Designer Skill

When invoked with `/ux-motion-designer`, implement animations, transitions, and micro-interactions using modern web animation techniques.

## Team Agent: Jordan Park (she/her)

This skill is backed by **Jordan Park**, the UX Team's Motion Designer. Jordan brings 8+ years of experience bridging design and engineering through motion, with expertise in GSAP, Lottie, Rive, and performance-conscious animation.

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to gather requirements:

### Animation Approach Questions

```
Question 1: "What animation library/approach do you prefer?"
Header: "Animation"
Options:
- "CSS native" - View Transitions API, scroll-driven animations
- "Framer Motion" - React animation library
- "GSAP" - Professional-grade animations with ScrollTrigger
- "Lottie/Rive" - Vector animations from design tools
- "Auto-detect" - Use what fits the project

Question 2: "What types of animations do you need?"
Header: "Types"
MultiSelect: true
Options:
- "Page transitions" - Route change animations
- "Micro-interactions" - Button hovers, form feedback
- "Scroll animations" - Parallax, reveal on scroll
- "Layout animations" - Reordering, expanding/collapsing

Question 3: "Performance budget for animations?"
Header: "Performance"
Options:
- "Strict" - Only transform/opacity, 60fps required
- "Balanced" - Some layout animations acceptable
- "Rich" - Complex animations acceptable with fallbacks
```

### Style Questions

```
Question 4: "Animation style preference?"
Header: "Style"
Options:
- "Subtle" - Minimal, professional feel
- "Playful" - Bouncy, energetic
- "Elegant" - Smooth, refined easing
- "Custom" - Match existing brand motion

Question 5: "Reduced motion handling?"
Header: "A11y"
Options:
- "Respect prefers-reduced-motion" - Disable/simplify animations
- "Alternative animations" - Provide reduced-motion alternatives
- "Critical only" - Only essential motion in reduced mode
```

## Motion Personality Profiles

Motion should express the brand personality established by `/ux-aesthetic-director`. Each personality has distinct timing, easing, and choreography characteristics:

### Confident (Quick & Decisive)
```css
:root {
  /* Short durations - doesn't waste time */
  --motion-duration-micro: 100ms;
  --motion-duration-normal: 200ms;
  --motion-duration-emphasis: 300ms;

  /* Sharp, controlled curves */
  --motion-ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --motion-ease-enter: cubic-bezier(0.0, 0, 0.2, 1);
  --motion-ease-exit: cubic-bezier(0.4, 0, 1, 1);

  /* Minimal overshoot */
  --motion-spring-stiffness: 400;
  --motion-spring-damping: 35;
}
```

### Elegant (Smooth & Flowing)
```css
:root {
  /* Longer, luxurious durations */
  --motion-duration-micro: 150ms;
  --motion-duration-normal: 350ms;
  --motion-duration-emphasis: 500ms;

  /* Gentle, flowing curves */
  --motion-ease-default: cubic-bezier(0.25, 0.1, 0.25, 1);
  --motion-ease-enter: cubic-bezier(0.0, 0, 0.25, 1);
  --motion-ease-exit: cubic-bezier(0.25, 0, 1, 1);

  /* Gentle spring */
  --motion-spring-stiffness: 200;
  --motion-spring-damping: 25;
}
```

### Playful (Bouncy & Energetic)
```css
:root {
  /* Varied durations for rhythm */
  --motion-duration-micro: 150ms;
  --motion-duration-normal: 300ms;
  --motion-duration-emphasis: 450ms;

  /* Bouncy curves with overshoot */
  --motion-ease-default: cubic-bezier(0.34, 1.56, 0.64, 1);
  --motion-ease-enter: cubic-bezier(0.0, 0, 0.2, 1.2);
  --motion-ease-exit: cubic-bezier(0.4, 0, 0.6, 1);

  /* Springy physics */
  --motion-spring-stiffness: 300;
  --motion-spring-damping: 15;
}
```

### Technical (Precise & Mechanical)
```css
:root {
  /* Consistent, systematic durations */
  --motion-duration-micro: 100ms;
  --motion-duration-normal: 200ms;
  --motion-duration-emphasis: 300ms;

  /* Linear and stepped curves */
  --motion-ease-default: linear;
  --motion-ease-enter: steps(8);
  --motion-ease-exit: linear;

  /* No spring physics - mechanical precision */
  --motion-spring-stiffness: 1000;
  --motion-spring-damping: 100;
}
```

## Page Load Orchestration

Stagger elements on page load for a polished, intentional feel:

```tsx
// Page load timeline with GSAP
'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function PageLoadAnimation({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: {
          ease: 'power3.out',
          duration: 0.6
        }
      });

      // Orchestrate the page load
      tl.from('[data-animate="header"]', {
        y: -20,
        opacity: 0,
        duration: 0.4
      })
      .from('[data-animate="hero-title"]', {
        y: 40,
        opacity: 0
      }, '-=0.2')
      .from('[data-animate="hero-subtitle"]', {
        y: 30,
        opacity: 0,
        duration: 0.5
      }, '-=0.4')
      .from('[data-animate="hero-cta"]', {
        y: 20,
        opacity: 0,
        duration: 0.4
      }, '-=0.3')
      .from('[data-animate="content"]', {
        y: 30,
        opacity: 0,
        stagger: 0.1
      }, '-=0.2');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return <div ref={containerRef}>{children}</div>;
}

// Usage:
<PageLoadAnimation>
  <header data-animate="header">...</header>
  <h1 data-animate="hero-title">...</h1>
  <p data-animate="hero-subtitle">...</p>
  <button data-animate="hero-cta">...</button>
  <section data-animate="content">...</section>
  <section data-animate="content">...</section>
</PageLoadAnimation>
```

## CSS View Transitions API

### Basic Page Transitions (Next.js 15+)

```tsx
// app/template.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="page-transition">
      {children}
    </div>
  );
}
```

```css
/* styles/transitions.css */
@view-transition {
  navigation: auto;
}

::view-transition-old(root) {
  animation: fade-out 200ms ease-out;
}

::view-transition-new(root) {
  animation: fade-in 200ms ease-in;
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Shared element transitions */
.card {
  view-transition-name: card;
}

::view-transition-group(card) {
  animation-duration: 300ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Programmatic View Transitions

```typescript
// lib/transitions.ts
export async function transitionTo(callback: () => void | Promise<void>) {
  if (!document.startViewTransition) {
    await callback();
    return;
  }

  const transition = document.startViewTransition(async () => {
    await callback();
  });

  await transition.finished;
}

// Usage in component
async function handleNavigate(href: string) {
  await transitionTo(() => {
    router.push(href);
  });
}
```

## Scroll-Driven Animations (CSS)

### Scroll Progress Indicator

```css
/* Scroll-linked progress bar */
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: var(--color-primary);
  transform-origin: left;
  animation: scroll-progress linear;
  animation-timeline: scroll();
}

@keyframes scroll-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
```

### Reveal on Scroll

```css
/* Elements reveal as they enter viewport */
.reveal-on-scroll {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}

@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Parallax effect */
.parallax-bg {
  animation: parallax linear;
  animation-timeline: scroll();
}

@keyframes parallax {
  from { transform: translateY(-20%); }
  to { transform: translateY(20%); }
}
```

## GSAP (GreenSock Animation Platform)

### Basic GSAP Setup
```tsx
// Install: npm install gsap
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugins
gsap.registerPlugin(ScrollTrigger);
```

### GSAP Timeline Animation
```tsx
'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

export function HeroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-title', { y: 50, opacity: 0, duration: 0.8 })
        .from('.hero-subtitle', { y: 30, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('.hero-cta', { y: 20, opacity: 0, duration: 0.5 }, '-=0.3')
        .from('.hero-image', { scale: 0.9, opacity: 0, duration: 1 }, '-=0.5');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef}>
      <h1 className="hero-title">Welcome</h1>
      <p className="hero-subtitle">Subtitle text</p>
      <button className="hero-cta">Get Started</button>
      <img className="hero-image" src="/hero.jpg" alt="" />
    </div>
  );
}
```

### GSAP ScrollTrigger
```tsx
'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function ScrollReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return <div ref={ref}>{children}</div>;
}
```

### GSAP Stagger Animation
```tsx
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.from('.card', {
      scrollTrigger: {
        trigger: '.cards-container',
        start: 'top 70%',
      },
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: {
        each: 0.1,
        from: 'start',
      },
    });
  });

  return () => ctx.revert();
}, []);
```

### GSAP with Reduced Motion
```tsx
useEffect(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    // Skip animations for reduced motion preference
    gsap.set('.animated-element', { opacity: 1, y: 0 });
    return;
  }

  // Full animations
  gsap.from('.animated-element', { y: 50, opacity: 0, duration: 0.8 });
}, []);
```

## Lottie Animations

### Lottie Setup
```bash
npm install lottie-react
# or for web
npm install lottie-web
```

### Basic Lottie Component
```tsx
'use client';

import Lottie from 'lottie-react';
import animationData from './animations/success.json';

export function SuccessAnimation() {
  return (
    <Lottie
      animationData={animationData}
      loop={false}
      autoplay={true}
      style={{ width: 150, height: 150 }}
    />
  );
}
```

### Controlled Lottie Animation
```tsx
'use client';

import { useRef, useState } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import animationData from './animations/toggle.json';

export function ToggleAnimation({ isActive }: { isActive: boolean }) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (isActive) {
      lottieRef.current?.playSegments([0, 30], true);
    } else {
      lottieRef.current?.playSegments([30, 60], true);
    }
  }, [isActive]);

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop={false}
      autoplay={false}
    />
  );
}
```

### Lottie with Interactivity
```tsx
'use client';

import { useState } from 'react';
import Lottie from 'lottie-react';
import hoverAnimation from './animations/hover-effect.json';

export function HoverLottie() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Lottie
        animationData={hoverAnimation}
        loop={isHovered}
        autoplay={isHovered}
        style={{ width: 100, height: 100 }}
      />
    </div>
  );
}
```

## Rive Animations

### Rive Setup
```bash
npm install @rive-app/react-canvas
# or for web
npm install @rive-app/canvas
```

### Basic Rive Component
```tsx
'use client';

import { useRive } from '@rive-app/react-canvas';

export function RiveAnimation() {
  const { RiveComponent } = useRive({
    src: '/animations/interactive-icon.riv',
    stateMachines: 'State Machine 1',
    autoplay: true,
  });

  return <RiveComponent style={{ width: 200, height: 200 }} />;
}
```

### Rive with State Machine Input
```tsx
'use client';

import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

export function InteractiveRive({ isActive }: { isActive: boolean }) {
  const { rive, RiveComponent } = useRive({
    src: '/animations/button.riv',
    stateMachines: 'ButtonStateMachine',
    autoplay: true,
  });

  const activeInput = useStateMachineInput(rive, 'ButtonStateMachine', 'isActive');

  useEffect(() => {
    if (activeInput) {
      activeInput.value = isActive;
    }
  }, [isActive, activeInput]);

  return <RiveComponent style={{ width: 150, height: 50 }} />;
}
```

### Rive with Hover/Click Events
```tsx
'use client';

import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

export function RiveButton({ onClick }: { onClick: () => void }) {
  const { rive, RiveComponent } = useRive({
    src: '/animations/cta-button.riv',
    stateMachines: 'HoverClick',
    autoplay: true,
  });

  const hoverInput = useStateMachineInput(rive, 'HoverClick', 'isHovering');
  const clickTrigger = useStateMachineInput(rive, 'HoverClick', 'onClick');

  const handleClick = () => {
    clickTrigger?.fire();
    onClick();
  };

  return (
    <div
      onMouseEnter={() => hoverInput && (hoverInput.value = true)}
      onMouseLeave={() => hoverInput && (hoverInput.value = false)}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <RiveComponent style={{ width: 200, height: 60 }} />
    </div>
  );
}
```

### Rive Text Runs (Dynamic Text)
```tsx
'use client';

import { useRive } from '@rive-app/react-canvas';
import { useEffect } from 'react';

export function RiveWithText({ label }: { label: string }) {
  const { rive, RiveComponent } = useRive({
    src: '/animations/badge.riv',
    autoplay: true,
  });

  useEffect(() => {
    if (rive) {
      const textRun = rive.getTextRunValue('labelText');
      if (textRun !== undefined) {
        rive.setTextRunValue('labelText', label);
      }
    }
  }, [rive, label]);

  return <RiveComponent style={{ width: 120, height: 40 }} />;
}
```

## Animation Library Selection Guide

| Use Case | Recommended Library | Rationale |
|----------|---------------------|-----------|
| UI micro-interactions | Framer Motion | Declarative, React-native API |
| Complex timelines | GSAP | Superior sequencing, fine control |
| Scroll-driven | GSAP ScrollTrigger | Robust, performant |
| Page transitions | View Transitions API | Native, lightweight |
| Character/mascot | Lottie | Designer-friendly, vector |
| Interactive illustrations | Rive | State machines, real-time |
| Data viz animations | D3 transitions | Data-bound animations |
| Simple reveals | CSS animations | No JS required |

## Framer Motion 11 Patterns

### Layout Animations

```tsx
// components/AnimatedList.tsx
'use client';

import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

interface Item {
  id: string;
  title: string;
}

export function AnimatedList({ items }: { items: Item[] }) {
  return (
    <LayoutGroup>
      <motion.ul layout className="space-y-2">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                opacity: { duration: 0.2 },
                layout: { type: 'spring', stiffness: 300, damping: 30 }
              }}
              className="p-4 bg-surface-primary rounded-lg"
            >
              {item.title}
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </LayoutGroup>
  );
}
```

### Shared Layout Animation

```tsx
// components/ExpandableCard.tsx
'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export function ExpandableCard({ id, title, content }: {
  id: string;
  title: string;
  content: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layoutId={`card-${id}`}
      onClick={() => setIsExpanded(!isExpanded)}
      className="cursor-pointer"
      style={{ borderRadius: 16 }}
    >
      <motion.h3 layoutId={`title-${id}`} className="text-lg font-semibold">
        {title}
      </motion.h3>

      <AnimatePresence>
        {isExpanded && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-text-secondary"
          >
            {content}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

### Gesture Animations

```tsx
// components/DraggableCard.tsx
'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';

export function DraggableCard({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate, opacity }}
      whileTap={{ scale: 1.05 }}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100) {
          // Handle swipe action
        }
      }}
      className="p-6 bg-surface-primary rounded-xl shadow-lg cursor-grab active:cursor-grabbing"
    >
      {children}
    </motion.div>
  );
}
```

## Micro-Interactions

### Button with Loading State

```tsx
// components/ui/Button.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';

export function Button({
  children,
  loading,
  ...props
}: {
  children: React.ReactNode;
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={loading}
      className="relative px-4 py-2 bg-primary text-white rounded-lg overflow-hidden"
      {...props}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center"
          >
            <Spinner className="w-5 h-5" />
          </motion.span>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
```

### Form Field Feedback

```css
/* styles/forms.css */
.form-field {
  position: relative;
}

.form-input {
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px oklch(from var(--color-primary) l c h / 0.2);
}

.form-input:invalid:not(:placeholder-shown) {
  border-color: var(--color-error);
  animation: shake 300ms ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* Success checkmark animation */
.success-check {
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  animation: draw-check 300ms ease forwards;
}

@keyframes draw-check {
  to { stroke-dashoffset: 0; }
}
```

## Reduced Motion Support

```css
/* styles/motion.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Allow essential motion */
  .motion-essential {
    animation-duration: revert !important;
    transition-duration: revert !important;
  }
}
```

```tsx
// hooks/useReducedMotion.ts
import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

// Usage
const prefersReduced = useReducedMotion();
const variants = prefersReduced
  ? { initial: {}, animate: {} }
  : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
```

## Live Browser Verification with Playwright MCP

Use the Playwright MCP tools to verify animations and transitions in a live browser session.

### Animation Playback Verification

```
# Verify animations are working
1. Navigate to the page:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000" })

2. Take initial snapshot:
   mcp__plugin_playwright_playwright__browser_snapshot()

3. Trigger an animation (e.g., hover on button):
   mcp__plugin_playwright_playwright__browser_hover({ ref: "[button-ref]", element: "Animated button" })

4. Take screenshot during animation:
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "animation-hover.png" })

5. Verify animation properties:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const button = document.querySelector('button');
       const styles = getComputedStyle(button);
       return {
         transform: styles.transform,
         transition: styles.transition,
         animation: styles.animation,
         willChange: styles.willChange
       };
     }"
   })
```

### GIF Recording for Animation Documentation

```
# Record animations as GIF for documentation
1. Start recording:
   mcp__plugin_playwright_playwright__gif_creator({ action: "start_recording", tabId: [tab-id] })

2. Take initial screenshot:
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png" })

3. Trigger animations:
   mcp__plugin_playwright_playwright__browser_hover({ ref: "[element-ref]", element: "Hover target" })
   mcp__plugin_playwright_playwright__browser_wait_for({ time: 0.5 })

4. Click to trigger another animation:
   mcp__plugin_playwright_playwright__browser_click({ ref: "[button-ref]", element: "Expand button" })
   mcp__plugin_playwright_playwright__browser_wait_for({ time: 1 })

5. Take final screenshot:
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png" })

6. Stop and export:
   mcp__plugin_playwright_playwright__gif_creator({ action: "stop_recording", tabId: [tab-id] })
   mcp__plugin_playwright_playwright__gif_creator({
     action: "export",
     tabId: [tab-id],
     filename: "button-animation.gif",
     download: true,
     options: { showClickIndicators: true, showProgressBar: true }
   })
```

### Page Transition Testing

```
# Test View Transitions API
1. Navigate to first page:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000" })
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "page1.png" })

2. Check View Transitions support:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => ({
       viewTransitionsSupported: 'startViewTransition' in document,
       cssViewTransitions: CSS.supports('view-transition-name', 'test')
     })"
   })

3. Click navigation link:
   mcp__plugin_playwright_playwright__browser_click({ ref: "[nav-link-ref]", element: "About page link" })

4. Wait for transition and screenshot:
   mcp__plugin_playwright_playwright__browser_wait_for({ time: 0.5 })
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "page2.png" })
```

### Scroll-Driven Animation Verification

```
# Test scroll-triggered animations
1. Navigate and get initial state:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000" })

2. Check animation timeline support:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => ({
       scrollTimelineSupported: CSS.supports('animation-timeline', 'scroll()'),
       viewTimelineSupported: CSS.supports('animation-timeline', 'view()')
     })"
   })

3. Get element state before scrolling:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const el = document.querySelector('.reveal-on-scroll');
       return {
         opacity: getComputedStyle(el).opacity,
         transform: getComputedStyle(el).transform
       };
     }"
   })

4. Scroll down:
   mcp__plugin_playwright_playwright__browser_press_key({ key: "PageDown" })
   mcp__plugin_playwright_playwright__browser_wait_for({ time: 0.5 })

5. Get element state after scrolling:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const el = document.querySelector('.reveal-on-scroll');
       return {
         opacity: getComputedStyle(el).opacity,
         transform: getComputedStyle(el).transform
       };
     }"
   })
```

### Reduced Motion Testing

```
# Test prefers-reduced-motion behavior
1. Check current motion preference:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => window.matchMedia('(prefers-reduced-motion: reduce)').matches"
   })

2. Simulate reduced motion preference:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       // Add class to simulate reduced motion
       document.documentElement.classList.add('reduce-motion');
       return true;
     }"
   })

3. Verify animations are disabled/simplified:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const animated = document.querySelectorAll('[class*=\"animate\"], [style*=\"animation\"]');
       return Array.from(animated).map(el => ({
         tag: el.tagName,
         class: el.className,
         animationDuration: getComputedStyle(el).animationDuration,
         transitionDuration: getComputedStyle(el).transitionDuration
       }));
     }"
   })
```

### Micro-Interaction Testing

```
# Test button hover and click states
1. Navigate and find button:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000" })
   mcp__plugin_playwright_playwright__browser_snapshot()

2. Get initial button state:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const btn = document.querySelector('button');
       return {
         transform: getComputedStyle(btn).transform,
         scale: getComputedStyle(btn).scale
       };
     }"
   })

3. Hover on button:
   mcp__plugin_playwright_playwright__browser_hover({ ref: "[button-ref]", element: "Primary button" })

4. Get hover state:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const btn = document.querySelector('button');
       return {
         transform: getComputedStyle(btn).transform,
         scale: getComputedStyle(btn).scale
       };
     }"
   })

5. Click and verify active state:
   mcp__plugin_playwright_playwright__browser_click({ ref: "[button-ref]", element: "Primary button" })
```

### Loading State Animation Testing

```
# Test loading spinner and skeleton animations
1. Trigger loading state:
   mcp__plugin_playwright_playwright__browser_click({ ref: "[load-button-ref]", element: "Load data button" })

2. Verify loading animation is playing:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const spinner = document.querySelector('.spinner, .loading, [class*=\"animate-spin\"]');
       if (!spinner) return { found: false };
       const styles = getComputedStyle(spinner);
       return {
         found: true,
         animation: styles.animation,
         animationPlayState: styles.animationPlayState
       };
     }"
   })

3. Wait for loading to complete:
   mcp__plugin_playwright_playwright__browser_wait_for({ textGone: "Loading" })

4. Verify content appeared:
   mcp__plugin_playwright_playwright__browser_snapshot()
```

### Animation Performance Verification

```
# Check for GPU-accelerated properties
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const animated = document.querySelectorAll('[class*=\"animate\"], [style*=\"animation\"], [style*=\"transition\"]');
    const nonGpuAnimations = [];

    animated.forEach(el => {
      const styles = getComputedStyle(el);
      const transition = styles.transition;
      const animation = styles.animation;

      // Check for properties that cause layout/paint
      const problematic = ['width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'padding'];
      const hasProblematic = problematic.some(prop =>
        transition.includes(prop) || animation.includes(prop)
      );

      if (hasProblematic) {
        nonGpuAnimations.push({
          element: el.tagName,
          class: el.className,
          transition,
          animation
        });
      }
    });

    return {
      totalAnimated: animated.length,
      nonGpuCount: nonGpuAnimations.length,
      nonGpuAnimations
    };
  }"
})
```

### Complete Animation Audit Workflow

```
# Full animation audit using Playwright MCP:

1. **Initial Assessment**
   - Navigate to target URL
   - Check browser support for modern animation APIs
   - Identify all animated elements

2. **Micro-Interaction Testing**
   - Test hover states on buttons/links
   - Test focus states
   - Test click/tap feedback
   - Record as GIF

3. **Page Transition Testing**
   - Test navigation transitions
   - Verify shared element animations
   - Check for smooth route changes

4. **Scroll Animation Testing**
   - Test reveal-on-scroll elements
   - Verify parallax effects
   - Check scroll progress indicators

5. **Accessibility Testing**
   - Test with reduced motion preference
   - Verify essential motion preserved
   - Check for vestibular triggers

6. **Performance Testing**
   - Verify GPU acceleration
   - Check for layout thrashing
   - Measure animation FPS

7. **Documentation**
   - Export GIFs of key animations
   - Document timing tokens
   - Note any issues found
```

## Deliverables Checklist

- [ ] Animation system configured (CSS/Framer Motion/GSAP)
- [ ] **Motion personality profile selected (Confident/Elegant/Playful/Technical)**
- [ ] **Page load orchestration implemented**
- [ ] Page transitions implemented
- [ ] Micro-interactions for interactive elements
- [ ] Scroll-driven animations where appropriate
- [ ] Reduced motion support implemented
- [ ] Animation tokens defined (durations, easings)
- [ ] **Motion tokens aligned with aesthetic brief**
- [ ] Performance optimized (GPU-accelerated properties)
- [ ] Loading states animated
- [ ] **Playwright MCP animation verification completed**
- [ ] **GIF recordings exported for documentation**
