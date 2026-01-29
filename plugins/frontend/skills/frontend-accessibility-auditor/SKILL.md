---
name: frontend-accessibility-auditor
description: WCAG 2.2 compliance auditing, ARIA patterns, and assistive technology support
---

# Accessibility Auditor Skill

When invoked with `/frontend-accessibility-auditor`, audit and improve accessibility compliance, implement ARIA patterns, and ensure assistive technology support.

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Casey Williams - Accessibility Lead** is now working on this.
> "Accessibility isn't a feature—it's a fundamental requirement."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| `/user-experience-color-alchemist` | Color palette for contrast verification |
| `/frontend-component-architect` | Components for ARIA review and keyboard navigation audit |
| `/frontend-motion-designer` | Animation inventory for reduced-motion and vestibular review |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| `/frontend-design-system` | Accessibility tokens, required contrast ratios, focus styles |
| `/frontend-orchestrator` | WCAG compliance report, remediation priorities, risk assessment |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Casey Williams → Chris Nakamura:** Accessibility audit complete—here's the compliance report with prioritized fixes and WCAG level status."
```

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to gather requirements:

### Compliance Questions

```
Question 1: "What WCAG compliance level do you need?"
Header: "WCAG Level (for Casey)"
Options:
- "Level A" - Minimum compliance, essential barriers removed
- "Level AA" - Standard compliance (most common requirement)
- "Level AAA" - Highest compliance, all criteria met
- "Custom" - Specific criteria to focus on

Question 2: "Which assistive technologies should we prioritize?"
Header: "AT Support"
MultiSelect: true
Options:
- "Screen readers" - NVDA, JAWS, VoiceOver
- "Keyboard navigation" - Full keyboard operability
- "Voice control" - Dragon, Voice Control
- "Magnification" - ZoomText, browser zoom

Question 3: "What components need auditing?"
Header: "Scope"
MultiSelect: true
Options:
- "Forms" - Inputs, validation, error handling
- "Navigation" - Menus, skip links, breadcrumbs
- "Interactive widgets" - Modals, tabs, accordions
- "Data tables" - Complex tables with sorting/filtering
- "Media" - Images, video, audio content
```

## WCAG 2.2 Audit Checklist

### Perceivable (1.x)

```markdown
## 1.1 Text Alternatives
- [ ] All images have meaningful alt text or are marked decorative (alt="")
- [ ] Complex images have extended descriptions
- [ ] Icons used as controls have accessible names

## 1.3 Adaptable
- [ ] Content structure conveyed through proper HTML semantics
- [ ] Reading order is logical in code
- [ ] Content works in portrait and landscape (1.3.4)

## 1.4 Distinguishable
- [ ] Color is not the only means of conveying information
- [ ] Text contrast ratio ≥ 4.5:1 (AA), ≥ 7:1 (AAA)
- [ ] UI component contrast ≥ 3:1
- [ ] Text can be resized to 200% without loss
- [ ] No horizontal scrolling at 320px width (1.4.10)
```

### Operable (2.x)

```markdown
## 2.1 Keyboard Accessible
- [ ] All functionality available via keyboard
- [ ] No keyboard traps
- [ ] Keyboard shortcuts can be turned off/remapped (2.1.4)

## 2.4 Navigable
- [ ] Skip links present and functional
- [ ] Pages have descriptive titles
- [ ] Focus order is logical
- [ ] Focus visible at all times (2.4.7, enhanced in 2.4.11)
- [ ] Focus not obscured by other content (2.4.11 - WCAG 2.2)

## 2.5 Input Modalities
- [ ] Touch targets ≥ 24x24 CSS pixels (2.5.8 - WCAG 2.2)
- [ ] Drag actions have single-pointer alternatives (2.5.7 - WCAG 2.2)
```

### Understandable (3.x)

```markdown
## 3.3 Input Assistance
- [ ] Error identification is clear and descriptive
- [ ] Labels and instructions are provided
- [ ] Error suggestions offered when possible
- [ ] Redundant entry minimized (3.3.7 - WCAG 2.2)
- [ ] Accessible authentication (3.3.8 - WCAG 2.2)
```

## ARIA Patterns

### Modal Dialog

```tsx
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div role="presentation">
      <div className="backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabIndex={-1}
      >
        <h2 id="dialog-title">{title}</h2>
        <div>{children}</div>
        <button onClick={onClose} aria-label="Close dialog">×</button>
      </div>
    </div>
  );
}
```

### Tab Panel

```tsx
function Tabs({ tabs, activeTab, onTabChange }) {
  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    let newIndex = index;
    switch (e.key) {
      case 'ArrowRight': newIndex = (index + 1) % tabs.length; break;
      case 'ArrowLeft': newIndex = (index - 1 + tabs.length) % tabs.length; break;
      case 'Home': newIndex = 0; break;
      case 'End': newIndex = tabs.length - 1; break;
      default: return;
    }
    e.preventDefault();
    onTabChange(tabs[newIndex].id);
  };

  return (
    <div>
      <div role="tablist" aria-label="Content sections">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
```

### Live Region for Announcements

```tsx
export function LiveAnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setAssertiveMessage('');
      setTimeout(() => setAssertiveMessage(message), 50);
    } else {
      setPoliteMessage('');
      setTimeout(() => setPoliteMessage(message), 50);
    }
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {politeMessage}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {assertiveMessage}
      </div>
    </AnnouncerContext.Provider>
  );
}
```

## Focus Management Utilities

```css
/* Visible focus for keyboard users */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Remove default focus for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}

/* Skip link */
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  padding: 1rem;
  background: var(--color-primary);
  color: white;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Automated Testing Setup

### axe-core with Playwright

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage has no violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
```

### ESLint A11y Plugin

```javascript
// .eslintrc.js
module.exports = {
  extends: ['plugin:jsx-a11y/recommended'],
  rules: {
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
  }
};
```

## Deliverables Checklist

- [ ] WCAG compliance level documented
- [ ] Automated tests configured (axe-core)
- [ ] Manual testing completed
- [ ] ARIA patterns implemented correctly
- [ ] Keyboard navigation verified
- [ ] Screen reader testing completed
- [ ] Focus management implemented
- [ ] Color contrast verified
- [ ] Skip links added
- [ ] Error handling accessible
- [ ] Accessibility statement written
