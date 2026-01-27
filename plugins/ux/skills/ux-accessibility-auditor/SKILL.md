---
name: ux-accessibility-auditor
description: WCAG 2.2 compliance auditing, ARIA patterns, and assistive technology support
---

# Accessibility Auditor Skill

When invoked with `/ux-accessibility-auditor`, audit and improve accessibility compliance, implement ARIA patterns, and ensure assistive technology support.

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to gather requirements:

### Compliance Questions

```
Question 1: "What WCAG compliance level do you need?"
Header: "WCAG Level"
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

Question 3: "Are there known accessibility issues to address?"
Header: "Known Issues"
Options:
- "Yes, I'll describe them" - Share specific issues
- "Need full audit" - Comprehensive review needed
- "Focus on new features" - Audit recent additions only
- "Regression testing" - Verify no new issues
```

### Scope Questions

```
Question 4: "What components need auditing?"
Header: "Scope"
MultiSelect: true
Options:
- "Forms" - Inputs, validation, error handling
- "Navigation" - Menus, skip links, breadcrumbs
- "Interactive widgets" - Modals, tabs, accordions
- "Data tables" - Complex tables with sorting/filtering
- "Media" - Images, video, audio content

Question 5: "Testing approach?"
Header: "Testing"
Options:
- "Automated + manual" - axe-core plus manual testing
- "Automated only" - Quick scan with axe-core
- "Manual audit" - Detailed human review
- "User testing" - Include real AT users
```

## WCAG 2.2 Audit Checklist

### Perceivable (1.x)

```markdown
## 1.1 Text Alternatives
- [ ] All images have meaningful alt text or are marked decorative (alt="")
- [ ] Complex images have extended descriptions
- [ ] Icons used as controls have accessible names
- [ ] Form inputs have visible labels

## 1.2 Time-based Media
- [ ] Videos have captions
- [ ] Audio content has transcripts
- [ ] Live captions for live video

## 1.3 Adaptable
- [ ] Content structure conveyed through proper HTML semantics
- [ ] Reading order is logical in code
- [ ] Instructions don't rely solely on sensory characteristics
- [ ] Content works in portrait and landscape (1.3.4)
- [ ] Input purpose is identifiable for autocomplete (1.3.5)

## 1.4 Distinguishable
- [ ] Color is not the only means of conveying information
- [ ] Text contrast ratio ≥ 4.5:1 (AA), ≥ 7:1 (AAA)
- [ ] UI component contrast ≥ 3:1
- [ ] Text can be resized to 200% without loss
- [ ] No horizontal scrolling at 320px width (1.4.10)
- [ ] Text spacing adjustable without loss (1.4.12)
- [ ] Hover/focus content dismissible and hoverable (1.4.13)
```

### Operable (2.x)

```markdown
## 2.1 Keyboard Accessible
- [ ] All functionality available via keyboard
- [ ] No keyboard traps
- [ ] Keyboard shortcuts can be turned off/remapped (2.1.4)

## 2.2 Enough Time
- [ ] Time limits can be adjusted or extended
- [ ] Moving content can be paused/stopped
- [ ] No auto-refresh without user control

## 2.4 Navigable
- [ ] Skip links present and functional
- [ ] Pages have descriptive titles
- [ ] Focus order is logical
- [ ] Link purpose clear from context
- [ ] Multiple ways to find pages (search, sitemap)
- [ ] Headings and labels are descriptive
- [ ] Focus visible at all times (2.4.7, enhanced in 2.4.11)
- [ ] Focus not obscured by other content (2.4.11 - WCAG 2.2)

## 2.5 Input Modalities
- [ ] Touch targets ≥ 24x24 CSS pixels (2.5.8 - WCAG 2.2)
- [ ] Drag actions have single-pointer alternatives (2.5.7 - WCAG 2.2)
- [ ] Motion-activated features have alternatives
```

### Understandable (3.x)

```markdown
## 3.1 Readable
- [ ] Page language specified in HTML
- [ ] Language changes marked in content

## 3.2 Predictable
- [ ] Focus doesn't cause unexpected context changes
- [ ] Input doesn't cause unexpected context changes
- [ ] Navigation is consistent across pages

## 3.3 Input Assistance
- [ ] Error identification is clear and descriptive
- [ ] Labels and instructions are provided
- [ ] Error suggestions offered when possible
- [ ] Redundant entry minimized (3.3.7 - WCAG 2.2)
- [ ] Accessible authentication (3.3.8 - WCAG 2.2)
```

### Robust (4.x)

```markdown
## 4.1 Compatible
- [ ] HTML validates without major errors
- [ ] Name, role, value exposed for all UI components
- [ ] Status messages announced without focus
```

## ARIA Patterns

### Modal Dialog

```tsx
// components/Dialog.tsx
import { useEffect, useRef, useCallback } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Trap focus within dialog
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusable = dialogRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;

    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      dialogRef.current?.focus();
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabIndex={-1}
        className="relative z-10 w-full max-w-md p-6 bg-surface-primary rounded-xl shadow-xl"
      >
        <h2 id="dialog-title" className="text-xl font-semibold">
          {title}
        </h2>
        <div className="mt-4">{children}</div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2"
          aria-label="Close dialog"
        >
          <XIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
```

### Tab Panel

```tsx
// components/Tabs.tsx
import { useState, useRef, useCallback } from 'react';

interface TabsProps {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    const newTab = tabs[newIndex];
    setActiveTab(newTab.id);
    tabRefs.current.get(newTab.id)?.focus();
  }, [activeTab, tabs]);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Content tabs"
        onKeyDown={handleKeyDown}
        className="flex border-b border-border-default"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => el && tabRefs.current.set(tab.id, el)}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 -mb-px border-b-2',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary'
            )}
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
          className="p-4"
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
// components/LiveAnnouncer.tsx
import { createContext, useContext, useState, useCallback } from 'react';

const AnnouncerContext = createContext<{
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}>({ announce: () => {} });

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
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AnnouncerContext.Provider>
  );
}

export const useAnnounce = () => useContext(AnnouncerContext).announce;
```

## Automated Testing Setup

### axe-core with Playwright

```typescript
// tests/a11y.spec.ts
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

  test('form has accessible labels', async ({ page }) => {
    await page.goto('/contact');

    const results = await new AxeBuilder({ page })
      .include('form')
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('modal dialog is accessible', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open dialog' }).click();

    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .analyze();

    expect(results.violations).toEqual([]);

    // Test keyboard trap
    await page.keyboard.press('Tab');
    await expect(page.locator('[role="dialog"] :focus')).toBeVisible();
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
    'jsx-a11y/label-has-associated-control': ['error', {
      labelComponents: ['Label'],
      controlComponents: ['Input', 'Select'],
      depth: 3
    }]
  }
};
```

## Focus Management Utilities

```css
/* styles/focus.css */
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

## Live Browser Verification with Playwright MCP

Use the Playwright MCP tools to verify accessibility in a live browser session.

### Setup Verification Session

```
1. Navigate to the page to audit:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000" })

2. Take accessibility snapshot:
   mcp__plugin_playwright_playwright__browser_snapshot()
```

### Keyboard Navigation Testing

```
# Test Tab navigation through interactive elements
1. Click on body to ensure focus:
   mcp__plugin_playwright_playwright__browser_click({ ref: "body", element: "page body" })

2. Press Tab to navigate:
   mcp__plugin_playwright_playwright__browser_press_key({ key: "Tab" })

3. Take snapshot to verify focus indicator:
   mcp__plugin_playwright_playwright__browser_snapshot()

4. Repeat Tab navigation and verify:
   - Focus order is logical
   - Focus indicator is visible
   - All interactive elements are reachable

5. Test Escape key on modals:
   mcp__plugin_playwright_playwright__browser_press_key({ key: "Escape" })
```

### Focus Trap Verification (Modals)

```
# Open a modal dialog
1. Click modal trigger:
   mcp__plugin_playwright_playwright__browser_click({ ref: "[modal-trigger-ref]", element: "Open modal button" })

2. Tab through modal elements:
   mcp__plugin_playwright_playwright__browser_press_key({ key: "Tab" })
   # Repeat multiple times

3. Verify focus stays within modal (snapshot after each Tab)

4. Test Shift+Tab for reverse navigation

5. Test Escape closes modal and returns focus
```

### ARIA Attributes Verification

```
# Get accessibility snapshot to inspect ARIA roles
mcp__plugin_playwright_playwright__browser_snapshot()

# The snapshot shows:
# - role attributes (button, dialog, tablist, etc.)
# - aria-label and aria-labelledby
# - aria-expanded, aria-selected states
# - aria-live regions

# Verify specific elements via JavaScript:
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const dialog = document.querySelector('[role=\"dialog\"]');
    return {
      role: dialog?.getAttribute('role'),
      ariaModal: dialog?.getAttribute('aria-modal'),
      ariaLabelledby: dialog?.getAttribute('aria-labelledby'),
      hasTitle: !!document.getElementById(dialog?.getAttribute('aria-labelledby'))
    };
  }"
})
```

### Color Contrast Verification

```
# Evaluate contrast ratios programmatically
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const getContrastRatio = (fg, bg) => {
      const getLuminance = (r, g, b) => {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };
      const l1 = getLuminance(...fg);
      const l2 = getLuminance(...bg);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    const elements = document.querySelectorAll('p, span, h1, h2, h3, a, button');
    const issues = [];
    elements.forEach(el => {
      const style = getComputedStyle(el);
      const color = style.color;
      const bg = style.backgroundColor;
      // Parse and calculate contrast...
    });
    return issues;
  }"
})
```

### Screen Reader Simulation

```
# Get accessible name and description for elements
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const buttons = document.querySelectorAll('button');
    return Array.from(buttons).map(btn => ({
      text: btn.textContent,
      ariaLabel: btn.getAttribute('aria-label'),
      ariaDescribedby: btn.getAttribute('aria-describedby'),
      role: btn.getAttribute('role') || 'button',
      disabled: btn.disabled
    }));
  }"
})
```

### Form Accessibility Testing

```
# Test form field associations
1. Navigate to form:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000/contact" })

2. Get form snapshot:
   mcp__plugin_playwright_playwright__browser_snapshot()

3. Verify label associations:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       const inputs = document.querySelectorAll('input, select, textarea');
       return Array.from(inputs).map(input => ({
         id: input.id,
         name: input.name,
         hasLabel: !!document.querySelector(`label[for=\"${input.id}\"]`),
         ariaLabel: input.getAttribute('aria-label'),
         ariaDescribedby: input.getAttribute('aria-describedby'),
         required: input.required,
         ariaRequired: input.getAttribute('aria-required')
       }));
     }"
   })

4. Test error state accessibility:
   - Submit form with invalid data
   - Verify error messages are announced (aria-live)
   - Verify focus moves to first error field
```

### Skip Link Testing

```
# Verify skip link functionality
1. Reload page and immediately Tab:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000" })
   mcp__plugin_playwright_playwright__browser_press_key({ key: "Tab" })

2. Snapshot should show skip link focused:
   mcp__plugin_playwright_playwright__browser_snapshot()

3. Press Enter to activate skip link:
   mcp__plugin_playwright_playwright__browser_press_key({ key: "Enter" })

4. Verify focus moved to main content:
   mcp__plugin_playwright_playwright__browser_snapshot()
```

### Viewport Testing for Reflow (WCAG 1.4.10)

```
# Test at 320px width for no horizontal scroll
1. Resize browser:
   mcp__plugin_playwright_playwright__browser_resize({ width: 320, height: 800 })

2. Take snapshot and screenshot:
   mcp__plugin_playwright_playwright__browser_snapshot()
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", fullPage: true })

3. Verify no horizontal overflow:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => document.documentElement.scrollWidth > document.documentElement.clientWidth"
   })
```

### Touch Target Size Verification (WCAG 2.5.8)

```
# Verify touch targets are at least 24x24 CSS pixels
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const interactive = document.querySelectorAll('button, a, input, select, [role=\"button\"]');
    const issues = [];
    interactive.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 24 || rect.height < 24) {
        issues.push({
          element: el.tagName,
          text: el.textContent?.slice(0, 30),
          width: rect.width,
          height: rect.height
        });
      }
    });
    return issues;
  }"
})
```

### Complete Accessibility Audit Workflow

```
# Full audit workflow using Playwright MCP:

1. **Initial Setup**
   - Navigate to target URL
   - Take full-page screenshot for visual reference
   - Get accessibility snapshot

2. **Structural Audit**
   - Verify heading hierarchy (h1 → h2 → h3)
   - Check landmark regions (main, nav, aside)
   - Validate HTML semantics

3. **Interactive Audit**
   - Test all keyboard interactions
   - Verify focus management
   - Test modal dialogs
   - Test dropdown menus

4. **Visual Audit**
   - Test at multiple viewport sizes
   - Check color contrast
   - Verify focus indicators visible

5. **Form Audit**
   - Test label associations
   - Test error handling
   - Test required field indicators

6. **Report Generation**
   - Compile all findings
   - Prioritize by WCAG level
   - Provide remediation code
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
- [ ] **Playwright MCP verification completed**
