---
name: frontend-motion-designer
description: Animations, transitions, and micro-interactions using GSAP, Lottie, Rive, Framer Motion, View Transitions API, and scroll-driven CSS
---

# Motion Designer Skill

When invoked with `/frontend-motion-designer`, implement animations, transitions, and micro-interactions using modern web animation techniques.

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Jordan Park - Motion Designer** is now working on this.
> "Motion tells the story between states."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| `/user-experience-aesthetic-director` | Motion personality profile (confident, elegant, playful, technical) |
| `/user-experience-micro-delight` | Timing specs, interaction triggers, delight moments |
| `/frontend-orchestrator` | Component scope, animation requirements |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| `/frontend-performance-engineer` | Animation complexity, frame budgets, GPU usage analysis |
| `/frontend-accessibility-auditor` | Motion inventory for reduced-motion review, vestibular safety check |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Jordan Park → Casey Williams:** Here's the complete motion inventory—please review for reduced-motion compliance and vestibular safety."
```

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to gather requirements:

### Animation Approach Questions

```
Question 1: "What animation library/approach do you prefer?"
Header: "Animation (for Jordan)"
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

## Motion Personality Profiles

Motion should express the brand personality established by `/user-experience-aesthetic-director`:

### Confident (Quick & Decisive)
```css
:root {
  --motion-duration-micro: 100ms;
  --motion-duration-normal: 200ms;
  --motion-duration-emphasis: 300ms;
  --motion-ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --motion-ease-enter: cubic-bezier(0.0, 0, 0.2, 1);
  --motion-ease-exit: cubic-bezier(0.4, 0, 1, 1);
}
```

### Elegant (Smooth & Flowing)
```css
:root {
  --motion-duration-micro: 150ms;
  --motion-duration-normal: 350ms;
  --motion-duration-emphasis: 500ms;
  --motion-ease-default: cubic-bezier(0.25, 0.1, 0.25, 1);
  --motion-ease-enter: cubic-bezier(0.0, 0, 0.25, 1);
  --motion-ease-exit: cubic-bezier(0.25, 0, 1, 1);
}
```

### Playful (Bouncy & Energetic)
```css
:root {
  --motion-duration-micro: 150ms;
  --motion-duration-normal: 300ms;
  --motion-duration-emphasis: 450ms;
  --motion-ease-default: cubic-bezier(0.34, 1.56, 0.64, 1);
  --motion-ease-enter: cubic-bezier(0.0, 0, 0.2, 1.2);
  --motion-ease-exit: cubic-bezier(0.4, 0, 0.6, 1);
}
```

## CSS View Transitions API

### Basic Page Transitions (Next.js 15+)

```css
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
```

## Scroll-Driven Animations (CSS)

```css
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
```

## GSAP Patterns

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
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

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

## Framer Motion Patterns

### Layout Animations

```tsx
'use client';

import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

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

## Lottie Animations

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

## Rive Animations

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

## Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

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
| Simple reveals | CSS animations | No JS required |

## Deliverables Checklist

- [ ] Animation system configured (CSS/Framer Motion/GSAP)
- [ ] Motion personality profile selected
- [ ] Page load orchestration implemented
- [ ] Page transitions implemented
- [ ] Micro-interactions for interactive elements
- [ ] Scroll-driven animations where appropriate
- [ ] Reduced motion support implemented
- [ ] Animation tokens defined (durations, easings)
- [ ] Motion tokens aligned with aesthetic brief
- [ ] Performance optimized (GPU-accelerated properties)
- [ ] Loading states animated
