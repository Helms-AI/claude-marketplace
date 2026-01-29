---
name: user-experience-micro-delight
description: Small moments of unexpected polish - custom cursors, creative hover states, loading personality, success celebrations, and empty state design
---

# Micro-Delight Skill

When invoked with `/user-experience-micro-delight`, add small moments of unexpected polish and personality to interfaces. These are the details that users notice subconsciously and that separate good interfaces from memorable ones.

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Ember Nguyen - Micro-Delight Specialist** is now working on this.
> "The magic is in the details. Let's make every interaction feel intentional."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| `/user-experience-aesthetic-director` | Motion personality, brand tone |
| `/frontend-motion-designer` | Animation timing, easing curves |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| `/frontend-design-system` | Micro-interaction tokens, hover patterns |
| `/frontend-accessibility-auditor` | Animations for reduced-motion review |
| `/frontend-performance-engineer` | Animation complexity for performance check |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Ember → [Next Team Member]:** Micro-delights specified:
- Hover intensity: [whisper/subtle/playful/theatrical]
- Loading personality: [messages/skeleton style]
- All animations respect prefers-reduced-motion"
```

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
Header: "Personality (for Ember)"
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
.custom-cursor-area {
  cursor: url('/cursors/custom-pointer.svg') 12 12, auto;
}

.custom-cursor-area a,
.custom-cursor-area button {
  cursor: url('/cursors/custom-hand.svg') 12 12, pointer;
}
```

### Magnetic Buttons

```tsx
export function MagneticButton({ children, strength = 0.3 }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setPosition({
      x: (e.clientX - centerX) * strength,
      y: (e.clientY - centerY) * strength
    });
  };

  return (
    <motion.button
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPosition({ x: 0, y: 0 })}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 15 }}
    >
      {children}
    </motion.button>
  );
}
```

## Creative Hover States

### Text Reveal Hover

```css
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

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--color-surface-secondary);
  }
}
```

### Character-Rich Loading Messages

```tsx
const loadingMessages = [
  "Brewing your data...",
  "Convincing the servers...",
  "Almost there, promise...",
  "Good things take time...",
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

## Success Celebrations

### Checkmark Animation

```css
.success-checkmark {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  stroke: var(--color-status-success);
  animation: checkmark-fill 0.4s ease-in-out 0.4s forwards,
             checkmark-scale 0.3s ease-in-out 0.9s both;
}

.success-checkmark-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: checkmark-stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.success-checkmark-check {
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: checkmark-stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}
```

## Empty State Design

### Personality-Driven Empty States

```tsx
const emptyStateContent = {
  search: {
    illustration: '🔍',
    defaultTitle: "No results found",
    defaultDescription: "Try adjusting your search."
  },
  data: {
    illustration: '📊',
    defaultTitle: "Nothing here yet",
    defaultDescription: "Create your first item to get started."
  },
  inbox: {
    illustration: '📭',
    defaultTitle: "Your inbox is empty",
    defaultDescription: "Time for a coffee break!"
  }
};

export function EmptyState({ type, title, description, action }) {
  const content = emptyStateContent[type];

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="text-6xl mb-6 animate-bounce-subtle">
        {content.illustration}
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {title || content.defaultTitle}
      </h3>
      <p className="text-text-secondary max-w-sm mb-6">
        {description || content.defaultDescription}
      </p>
      {action && (
        <button onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
```

## Micro-Interaction Tokens

```css
:root {
  /* Timing tokens */
  --micro-instant: 100ms;
  --micro-quick: 150ms;
  --micro-normal: 250ms;
  --micro-slow: 400ms;

  /* Easing for delightful motion */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-snap: cubic-bezier(0.5, 1.25, 0.75, 1.25);

  /* Transform values */
  --lift-sm: translateY(-2px);
  --lift-md: translateY(-4px);
  --scale-sm: scale(1.02);
  --scale-md: scale(1.05);
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
