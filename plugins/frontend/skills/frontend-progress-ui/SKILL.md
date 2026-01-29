---
name: frontend-progress-ui
description: Loading states, progress indicators, skeleton screens, and optimistic UI patterns with personality
---

# Progress UI Skill

When invoked with `/frontend-progress-ui`, design loading states and progress indicators that maintain user engagement and reduce perceived wait times.

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Kai Tanaka - Progress & Loading Specialist** is now working on this.
> "Every moment of waiting is an opportunity to build trust. Let's make the wait worthwhile."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| `/user-experience-aesthetic-director` | Aesthetic brief, animation tone, brand personality |
| `/frontend-orchestrator` | User's original request, component scope |
| `/frontend-motion-designer` | Animation principles, easing curves |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| `/frontend-component-architect` | Loading component patterns, skeleton structures |
| `/frontend-accessibility-auditor` | ARIA live regions, loading announcements |
| `/frontend-performance-engineer` | Loading strategy, perceived performance notes |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Kai Tanaka → Alex Kim:** Here's the loading experience:
- Loading pattern: [skeleton/spinner/shimmer/progress]
- Personality: [message tone and approach]
- A11y approach: [live region strategy]"
```

## The Wait Experience Philosophy

### What Makes Loading Feel Good

| Factor | Poor Experience | Good Experience |
|--------|-----------------|-----------------|
| **Feedback** | No indication of progress | Clear status updates |
| **Predictability** | Unknown duration | Time estimates or stages |
| **Engagement** | Static spinner | Animated, personality-driven |
| **Control** | Trapped in wait | Cancel option, background option |
| **Context** | Generic loading | Content-aware placeholders |

### Loading Patterns Decision Tree

```
Is the wait < 300ms?
├── Yes → No loading indicator needed (feels instant)
└── No → Is the wait < 1 second?
    ├── Yes → Simple spinner or pulse
    └── No → Is the wait < 4 seconds?
        ├── Yes → Skeleton screen or shimmer
        └── No → Is the wait < 10 seconds?
            ├── Yes → Progress bar with percentage
            └── No → Stepped progress with messages
```

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to understand loading needs:

### Progress UI Discovery Questions

```
Question 1: "What type of content is loading?"
Header: "Content Type (for Kai)"
Options:
- "Data/Lists" - Tables, feeds, search results
- "Media" - Images, videos, rich content
- "Forms/Actions" - Submissions, processing
- "Full Pages" - Initial page loads, navigation

Question 2: "What personality should the loading experience have?"
Header: "Loading Personality"
Options:
- "Invisible/Fast" - Minimize perception of waiting
- "Informative" - Show what's happening
- "Entertaining" - Delight during the wait
- "Professional" - Clean, no-nonsense

Question 3: "What's the typical wait duration?"
Header: "Duration"
Options:
- "Instant (<1s)" - Quick operations
- "Brief (1-4s)" - API calls, form submissions
- "Extended (4-10s)" - File uploads, complex processing
- "Long (10s+)" - Batch operations, imports
```

## Loading Patterns

### Pattern 1: Skeleton Screens

Content-aware placeholders that mirror the final layout:

```css
/* Skeleton base */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-skeleton-base) 0%,
    var(--color-skeleton-highlight) 50%,
    var(--color-skeleton-base) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Skeleton tokens */
:root {
  --color-skeleton-base: hsl(var(--color-surface-hsl) / 0.1);
  --color-skeleton-highlight: hsl(var(--color-surface-hsl) / 0.2);
}

/* Content-specific skeletons */
.skeleton-text {
  height: 1em;
  margin-bottom: 0.5em;
}

.skeleton-text:last-child {
  width: 60%; /* Varied line length for realism */
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
}

.skeleton-card {
  aspect-ratio: 16/9;
}
```

```tsx
// React Skeleton Component
interface SkeletonProps {
  variant: 'text' | 'avatar' | 'card' | 'button';
  lines?: number;
  width?: string;
}

function Skeleton({ variant, lines = 1, width }: SkeletonProps) {
  if (variant === 'text' && lines > 1) {
    return (
      <div className="skeleton-text-group" aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton skeleton-text"
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton skeleton-${variant}`}
      style={{ width }}
      aria-hidden="true"
    />
  );
}
```

### Pattern 2: Progress Indicators

For operations with known duration or stages:

```css
/* Linear progress bar */
.progress-bar {
  height: 4px;
  background: var(--color-surface-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-accent);
  border-radius: var(--radius-full);
  transition: width 0.3s ease-out;
}

/* Indeterminate progress */
.progress-bar-indeterminate .progress-bar-fill {
  width: 30%;
  animation: progress-indeterminate 1.5s ease-in-out infinite;
}

@keyframes progress-indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

/* Circular progress */
.progress-circle {
  --size: 48px;
  --stroke-width: 4px;
  width: var(--size);
  height: var(--size);
}

.progress-circle-track {
  fill: none;
  stroke: var(--color-surface-tertiary);
  stroke-width: var(--stroke-width);
}

.progress-circle-fill {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: var(--stroke-width);
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: center;
  transition: stroke-dashoffset 0.3s ease-out;
}
```

```tsx
// Progress Component with accessibility
interface ProgressProps {
  value?: number; // 0-100, undefined for indeterminate
  label: string;
  showPercentage?: boolean;
}

function Progress({ value, label, showPercentage = false }: ProgressProps) {
  const isIndeterminate = value === undefined;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={isIndeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`progress-bar ${isIndeterminate ? 'progress-bar-indeterminate' : ''}`}>
        <div
          className="progress-bar-fill"
          style={{ width: isIndeterminate ? undefined : `${value}%` }}
        />
      </div>
      {showPercentage && !isIndeterminate && (
        <span className="progress-percentage">{value}%</span>
      )}
    </div>
  );
}
```

### Pattern 3: Stepped Progress

For multi-stage operations:

```css
.stepper {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.stepper-step {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.stepper-indicator {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
}

.stepper-step[data-status="completed"] .stepper-indicator {
  background: var(--color-success);
  color: white;
}

.stepper-step[data-status="current"] .stepper-indicator {
  background: var(--color-accent);
  color: white;
  animation: pulse-subtle 2s ease-in-out infinite;
}

.stepper-step[data-status="pending"] .stepper-indicator {
  background: var(--color-surface-tertiary);
  color: var(--color-text-secondary);
}

.stepper-connector {
  flex: 1;
  height: 2px;
  background: var(--color-border);
}

.stepper-step[data-status="completed"] + .stepper-connector {
  background: var(--color-success);
}

@keyframes pulse-subtle {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

### Pattern 4: Loading Messages with Personality

```tsx
// Loading messages tied to aesthetic brief
const loadingMessages = {
  professional: [
    "Processing your request...",
    "Preparing your data...",
    "Almost ready...",
  ],
  friendly: [
    "Hang tight! We're working on it...",
    "Just a moment while we get things ready...",
    "Almost there! Thanks for your patience...",
  ],
  playful: [
    "Brewing up something good...",
    "Teaching the hamsters to run faster...",
    "Convincing the pixels to cooperate...",
  ],
  minimal: [
    "Loading...",
    "Please wait...",
    "",
  ],
};

interface LoadingMessageProps {
  personality: keyof typeof loadingMessages;
  duration: number; // Expected duration in ms
}

function LoadingMessage({ personality, duration }: LoadingMessageProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = loadingMessages[personality];

  useEffect(() => {
    const interval = duration / messages.length;
    const timer = setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, messages.length - 1));
    }, interval);

    return () => clearInterval(timer);
  }, [duration, messages.length]);

  return (
    <p className="loading-message" aria-live="polite">
      {messages[messageIndex]}
    </p>
  );
}
```

## Optimistic UI Patterns

### Instant Feedback Strategy

```tsx
// Optimistic update pattern
async function handleLike(postId: string) {
  // 1. Optimistically update UI immediately
  setLiked(true);
  setLikeCount((c) => c + 1);

  try {
    // 2. Send request to server
    await api.likePost(postId);
  } catch (error) {
    // 3. Rollback on failure
    setLiked(false);
    setLikeCount((c) => c - 1);
    toast.error("Couldn't save your like. Please try again.");
  }
}
```

### Pending State Indicators

```css
/* Subtle pending state */
.item-pending {
  opacity: 0.7;
  pointer-events: none;
}

.item-pending::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 4px,
    var(--color-surface-tertiary) 4px,
    var(--color-surface-tertiary) 8px
  );
  opacity: 0.3;
  animation: pending-stripe 0.5s linear infinite;
}

@keyframes pending-stripe {
  0% { background-position: 0 0; }
  100% { background-position: 11.3px 0; }
}
```

## Accessibility Requirements

### ARIA Live Regions

```tsx
// Accessible loading announcements
function LoadingState({ isLoading, loadingText, children }) {
  return (
    <>
      {/* Screen reader announcement */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isLoading ? loadingText : 'Content loaded'}
      </div>

      {/* Visual content */}
      <div aria-busy={isLoading}>
        {isLoading ? <Skeleton /> : children}
      </div>
    </>
  );
}
```

### Focus Management

```tsx
// Focus management after loading
function AsyncContent({ loadPromise }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(null);

  useEffect(() => {
    loadPromise.then((data) => {
      setContent(data);
      // Move focus to loaded content for screen readers
      contentRef.current?.focus();
    });
  }, [loadPromise]);

  if (!content) {
    return <Skeleton />;
  }

  return (
    <div ref={contentRef} tabIndex={-1}>
      {content}
    </div>
  );
}
```

## Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--color-skeleton-base);
  }

  .progress-bar-indeterminate .progress-bar-fill {
    animation: none;
    width: 100%;
    opacity: 0.5;
  }

  .stepper-step[data-status="current"] .stepper-indicator {
    animation: none;
    box-shadow: 0 0 0 3px var(--color-accent-light);
  }
}
```

## Output: Progress UI Specification

```markdown
# Progress UI Specification

## Loading Strategy
- Pattern: [skeleton/spinner/progress/stepped]
- Trigger: [immediate/delayed/threshold]
- Duration awareness: [known/estimated/unknown]

## Personality
- Message tone: [professional/friendly/playful/minimal]
- Animation style: [subtle/energetic/none]

## Components
1. **Skeleton Screen**
   - Layout mirroring: [yes/no]
   - Animation: [shimmer/pulse/none]

2. **Progress Indicator**
   - Type: [linear/circular/stepped]
   - Shows percentage: [yes/no]

3. **Loading Messages**
   - Rotation: [yes/no]
   - Interval: [Xms]

## Accessibility
- ARIA live region: [polite/assertive]
- Focus management: [yes/no]
- Reduced motion: [handled]

## Performance Notes
- Skeleton render cost: [low/medium]
- Animation budget: [Xms per frame]
```

## Deliverables Checklist

- [ ] Loading pattern selected based on context
- [ ] Skeleton screens match content structure
- [ ] Progress indicators appropriate for duration
- [ ] Loading messages match aesthetic brief
- [ ] Optimistic UI patterns where applicable
- [ ] ARIA live regions implemented
- [ ] Reduced motion alternatives provided
- [ ] Focus management after loading
