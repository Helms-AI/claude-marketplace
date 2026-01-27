---
name: ux-micro-delight
description: Small moments of unexpected polish - custom cursors, creative hover states, loading personality, success celebrations, and empty state design
---

# Micro-Delight Skill

When invoked with `/ux-micro-delight`, add small moments of unexpected polish and personality to interfaces. These are the details that users notice subconsciously and that separate good interfaces from memorable ones.

## Philosophy: Sweat the Small Stuff

Micro-delights are:
- **Unexpected** - Users don't anticipate them
- **Appropriate** - They fit the brand and context
- **Effortless** - They don't require user effort
- **Memorable** - They create positive associations
- **Performant** - They never compromise the experience

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to understand delight opportunities:

### Micro-Delight Discovery Questions

```
Question 1: "What's the brand personality?"
Header: "Personality"
Options:
- "Professional & Reliable" - Subtle, refined touches
- "Playful & Fun" - Whimsical, expressive moments
- "Premium & Luxurious" - Elegant, understated details
- "Bold & Innovative" - Unexpected, memorable surprises

Question 2: "Where should delights appear?"
Header: "Touchpoints"
MultiSelect: true
Options:
- "Interactions" - Buttons, hovers, clicks
- "Feedback" - Loading, success, errors
- "Empty States" - No content moments
- "Navigation" - Page transitions, cursors

Question 3: "Delight intensity?"
Header: "Intensity"
Options:
- "Whisper" - Almost invisible, subconscious
- "Subtle" - Noticeable on attention
- "Playful" - Obviously delightful
- "Theatrical" - Bold, memorable moments
```

## Custom Cursors

### Basic Custom Cursor

```css
/* Default custom cursor */
.custom-cursor-area {
  cursor: url('/cursors/custom-pointer.svg') 12 12, auto;
}

/* Interactive element cursor */
.custom-cursor-area a,
.custom-cursor-area button,
.custom-cursor-area [role="button"] {
  cursor: url('/cursors/custom-hand.svg') 12 12, pointer;
}

/* Text selection cursor */
.custom-cursor-area p,
.custom-cursor-area span {
  cursor: url('/cursors/custom-text.svg') 12 12, text;
}
```

### Cursor Follower (JavaScript)

```tsx
'use client';

import { useEffect, useRef } from 'react';

export function CursorFollower() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    if (!cursor || !follower) return;

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let followerX = 0, followerY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      // Cursor follows immediately
      cursorX = mouseX;
      cursorY = mouseY;
      cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;

      // Follower lags behind
      followerX += (mouseX - followerX) * 0.15;
      followerY += (mouseY - followerY) * 0.15;
      follower.style.transform = `translate(${followerX}px, ${followerY}px)`;

      requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Hide on touch devices
  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    return null;
  }

  return (
    <>
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-3 h-3 -translate-x-1/2 -translate-y-1/2
                   bg-primary rounded-full pointer-events-none z-[9999]
                   mix-blend-difference"
      />
      <div
        ref={followerRef}
        className="fixed top-0 left-0 w-8 h-8 -translate-x-1/2 -translate-y-1/2
                   border-2 border-primary rounded-full pointer-events-none z-[9998]
                   opacity-50"
      />
    </>
  );
}
```

### Magnetic Buttons

```tsx
'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

export function MagneticButton({
  children,
  className,
  strength = 0.3
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = (e.clientX - centerX) * strength;
    const distanceY = (e.clientY - centerY) * strength;

    setPosition({ x: distanceX, y: distanceY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 15 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}
```

## Creative Hover States

### Reveal Hover

```css
/* Text reveal on hover */
.hover-reveal {
  position: relative;
  overflow: hidden;
}

.hover-reveal-text {
  display: block;
  transition: transform 0.3s ease;
}

.hover-reveal-hidden {
  position: absolute;
  top: 0;
  left: 0;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  color: var(--color-primary);
}

.hover-reveal:hover .hover-reveal-text {
  transform: translateY(-100%);
}

.hover-reveal:hover .hover-reveal-hidden {
  transform: translateY(0);
}
```

### Border Drawing Animation

```css
.hover-draw-border {
  position: relative;
  padding: 1rem 2rem;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
}

.hover-draw-border::before,
.hover-draw-border::after {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border: 2px solid transparent;
  box-sizing: border-box;
}

.hover-draw-border::before {
  top: 0;
  left: 0;
  border-top-color: var(--color-primary);
  border-right-color: var(--color-primary);
}

.hover-draw-border::after {
  bottom: 0;
  right: 0;
  border-bottom-color: var(--color-primary);
  border-left-color: var(--color-primary);
}

.hover-draw-border:hover::before,
.hover-draw-border:hover::after {
  width: 100%;
  height: 100%;
  transition: width 0.2s ease, height 0.2s ease 0.2s;
}
```

### Color Shift Hover

```css
.hover-color-shift {
  position: relative;
  overflow: hidden;
  transition: color 0.3s ease;
}

.hover-color-shift::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--color-primary);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
}

.hover-color-shift:hover {
  color: white;
}

.hover-color-shift:hover::before {
  transform: scaleX(1);
  transform-origin: left;
}
```

### Glitch Hover (Use Sparingly)

```css
.hover-glitch {
  position: relative;
}

.hover-glitch::before,
.hover-glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}

.hover-glitch:hover::before {
  opacity: 0.8;
  color: oklch(0.65 0.2 0);
  animation: glitch-1 0.3s infinite;
}

.hover-glitch:hover::after {
  opacity: 0.8;
  color: oklch(0.65 0.2 200);
  animation: glitch-2 0.3s infinite;
}

@keyframes glitch-1 {
  0%, 100% { clip-path: inset(40% 0 61% 0); transform: translate(-2px, -2px); }
  20% { clip-path: inset(92% 0 1% 0); transform: translate(2px, 2px); }
  40% { clip-path: inset(43% 0 1% 0); transform: translate(-2px, 2px); }
  60% { clip-path: inset(25% 0 58% 0); transform: translate(2px, -2px); }
  80% { clip-path: inset(54% 0 7% 0); transform: translate(-2px, -2px); }
}

@keyframes glitch-2 {
  0%, 100% { clip-path: inset(65% 0 5% 0); transform: translate(2px, 2px); }
  20% { clip-path: inset(10% 0 85% 0); transform: translate(-2px, -2px); }
  40% { clip-path: inset(50% 0 30% 0); transform: translate(2px, -2px); }
  60% { clip-path: inset(70% 0 15% 0); transform: translate(-2px, 2px); }
  80% { clip-path: inset(20% 0 60% 0); transform: translate(2px, 2px); }
}

@media (prefers-reduced-motion: reduce) {
  .hover-glitch:hover::before,
  .hover-glitch:hover::after {
    animation: none;
    opacity: 0;
  }
}
```

## Loading State Personality

### Branded Skeleton

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-secondary) 0%,
    var(--color-surface-tertiary) 50%,
    var(--color-surface-secondary) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Skeleton variants */
.skeleton-text {
  height: 1em;
  width: 100%;
}

.skeleton-heading {
  height: 1.5em;
  width: 60%;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.skeleton-image {
  aspect-ratio: 16/9;
  width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--color-surface-secondary);
  }
}
```

### Character-Rich Loading Messages

```tsx
'use client';

import { useState, useEffect } from 'react';

const loadingMessages = [
  "Brewing your data...",
  "Convincing the servers...",
  "Almost there, promise...",
  "Good things take time...",
  "Worth the wait...",
];

export function LoadingMessage() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p className="text-text-secondary animate-pulse">
      {loadingMessages[messageIndex]}
    </p>
  );
}
```

### Progress Bar with Personality

```css
.progress-bar {
  height: 4px;
  background: var(--color-surface-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-primary),
    oklch(from var(--color-primary) calc(l + 0.1) c h)
  );
  border-radius: 2px;
  transition: width 0.3s ease;
  position: relative;
}

/* Shimmering effect on the progress bar */
.progress-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    oklch(1 0 0 / 0.3),
    transparent
  );
  animation: progress-shimmer 1.5s infinite;
}

@keyframes progress-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

## Success Celebrations

### Confetti Burst

```tsx
'use client';

import { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
  colors?: string[];
}

export function Confetti({
  active,
  colors = ['#6366f1', '#8b5cf6', '#d946ef', '#f472b6', '#fb923c']
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 20,
        vy: Math.random() * -15 - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        p.vy += 0.3; // Gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.vx *= 0.99; // Air resistance

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        // Remove particles that are off screen
        if (p.y > canvas.height) {
          particles.splice(index, 1);
        }
      });

      if (particles.length > 0) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [active, colors]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}
```

### Checkmark Animation

```css
.success-checkmark {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: block;
  stroke-width: 2;
  stroke: var(--color-status-success);
  stroke-miterlimit: 10;
  animation: checkmark-fill 0.4s ease-in-out 0.4s forwards,
             checkmark-scale 0.3s ease-in-out 0.9s both;
}

.success-checkmark-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke: var(--color-status-success);
  fill: none;
  animation: checkmark-stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.success-checkmark-check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: checkmark-stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

@keyframes checkmark-stroke {
  100% { stroke-dashoffset: 0; }
}

@keyframes checkmark-scale {
  0%, 100% { transform: none; }
  50% { transform: scale3d(1.1, 1.1, 1); }
}

@keyframes checkmark-fill {
  100% { box-shadow: inset 0 0 0 30px oklch(0.55 0.15 145 / 0.1); }
}
```

```tsx
export function SuccessCheckmark() {
  return (
    <svg className="success-checkmark" viewBox="0 0 52 52">
      <circle className="success-checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
      <path className="success-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
    </svg>
  );
}
```

## Empty State Design

### Personality-Driven Empty States

```tsx
interface EmptyStateProps {
  type: 'search' | 'data' | 'inbox' | 'error';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const emptyStateContent = {
  search: {
    illustration: '🔍',
    defaultTitle: "No results found",
    defaultDescription: "Try adjusting your search or filters to find what you're looking for."
  },
  data: {
    illustration: '📊',
    defaultTitle: "Nothing here yet",
    defaultDescription: "Create your first item to get started."
  },
  inbox: {
    illustration: '📭',
    defaultTitle: "Your inbox is empty",
    defaultDescription: "Time for a coffee break! New messages will appear here."
  },
  error: {
    illustration: '🌧️',
    defaultTitle: "Something went wrong",
    defaultDescription: "We're working on it. Please try again later."
  }
};

export function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const content = emptyStateContent[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-6 animate-bounce-subtle">
        {content.illustration}
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">
        {title || content.defaultTitle}
      </h3>
      <p className="text-text-secondary max-w-sm mb-6">
        {description || content.defaultDescription}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
```

### Animated Empty State Illustration

```css
.empty-state-illustration {
  position: relative;
  width: 200px;
  height: 200px;
}

.empty-state-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.2;
}

.empty-state-shape-1 {
  width: 80px;
  height: 80px;
  background: var(--color-primary);
  top: 20%;
  left: 10%;
  animation: float-slow 6s ease-in-out infinite;
}

.empty-state-shape-2 {
  width: 40px;
  height: 40px;
  background: var(--color-accent);
  top: 60%;
  right: 20%;
  animation: float-slow 5s ease-in-out infinite reverse;
}

.empty-state-shape-3 {
  width: 60px;
  height: 60px;
  background: var(--color-secondary);
  bottom: 10%;
  left: 30%;
  animation: float-slow 7s ease-in-out infinite;
}

@keyframes float-slow {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

@media (prefers-reduced-motion: reduce) {
  .empty-state-shape {
    animation: none;
  }
}
```

## Micro-Interaction Tokens

```css
:root {
  /* Timing tokens for micro-interactions */
  --micro-instant: 100ms;
  --micro-quick: 150ms;
  --micro-normal: 250ms;
  --micro-slow: 400ms;

  /* Easing for delightful motion */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-snap: cubic-bezier(0.5, 1.25, 0.75, 1.25);

  /* Consistent transform values */
  --lift-sm: translateY(-2px);
  --lift-md: translateY(-4px);
  --lift-lg: translateY(-8px);
  --scale-sm: scale(1.02);
  --scale-md: scale(1.05);
  --scale-lg: scale(1.1);
}
```

## Output: Micro-Delight Specification

```markdown
# Micro-Delight Specification

## Cursor Treatment
- Custom cursor: [yes/no]
- Cursor follower: [yes/no]
- Magnetic elements: [where]

## Hover States
| Element | Effect | Duration |
|---------|--------|----------|
| Buttons | [description] | [Xms] |
| Cards | [description] | [Xms] |
| Links | [description] | [Xms] |

## Loading States
- Skeleton style: [description]
- Messages: [approach]
- Progress bar: [style]

## Success States
- Celebration: [confetti/check/none]
- Animation duration: [Xms]

## Empty States
- Illustration style: [emoji/custom/none]
- Tone: [playful/professional/minimal]

## Accessibility Notes
- All animations respect prefers-reduced-motion
- Focus states are always visible
- No motion triggers vestibular issues
```

## Deliverables Checklist

- [ ] Micro-delight discovery completed
- [ ] Cursor treatment defined (if applicable)
- [ ] Hover states designed
- [ ] Loading states implemented
- [ ] Success celebrations created
- [ ] Empty states designed with personality
- [ ] Reduced motion fallbacks tested
- [ ] Performance impact verified
- [ ] Brand consistency maintained
