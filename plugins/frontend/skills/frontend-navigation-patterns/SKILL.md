---
name: frontend-navigation-patterns
description: Tab patterns, breadcrumbs, sidebars, pagination, and keyboard navigation for intuitive wayfinding
---

# Navigation Patterns Skill

When invoked with `/frontend-navigation-patterns`, design navigation systems that help users understand where they are, where they can go, and how to get there.

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Sage Martinez - Navigation Specialist** is now working on this.
> "Good navigation is like a good host - it guides without being intrusive."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| `/user-experience-aesthetic-director` | Visual tone, spacing rhythm |
| `/frontend-orchestrator` | User's original request, site structure |
| `/user-experience-layout-composer` | Sidebar placement, responsive behavior |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| `/frontend-component-architect` | Nav component specifications |
| `/frontend-accessibility-auditor` | Keyboard navigation, ARIA patterns |
| `/frontend-responsive-engineer` | Mobile nav behavior |
| `/frontend-motion-designer` | Nav animation opportunities |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Sage Martinez → Casey Williams:** Here's the navigation structure:
- Primary nav: [type and placement]
- Mobile behavior: [drawer/bottom-bar/hamburger]
- Keyboard pattern: [roving tabindex/arrow keys]"
```

## Navigation Design Philosophy

### The Wayfinding Principles

| Principle | Implementation |
|-----------|----------------|
| **Location Clarity** | Always show where the user is |
| **Path Visibility** | Show available destinations |
| **Hierarchy** | Primary actions prominent, secondary accessible |
| **Consistency** | Same patterns across the app |
| **Efficiency** | Minimize clicks to common destinations |

### Navigation Type Decision Tree

```
What's the primary content structure?
├── Flat (5-7 top-level sections)
│   └── Horizontal tab bar or nav
├── Deep (many nested levels)
│   └── Sidebar with tree navigation
├── Task-focused (wizard/flow)
│   └── Stepped progress nav
└── Content-heavy (articles/docs)
    └── Breadcrumbs + sidebar
```

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to understand navigation needs:

### Navigation Discovery Questions

```
Question 1: "What's the site/app structure?"
Header: "Structure (for Sage)"
Options:
- "Flat" - Few top-level sections, minimal depth
- "Hierarchical" - Nested categories and subcategories
- "Hub & Spoke" - Central dashboard with features
- "Linear" - Step-by-step flows

Question 2: "What's the primary navigation location?"
Header: "Placement"
Options:
- "Top horizontal" - Header nav bar
- "Left sidebar" - Persistent side navigation
- "Bottom bar" - Mobile-style tab bar
- "Contextual" - Changes based on location

Question 3: "How should mobile navigation work?"
Header: "Mobile Nav"
Options:
- "Hamburger menu" - Hidden behind icon
- "Bottom tab bar" - Always visible tabs
- "Drawer" - Slide-out panel
- "Simplified header" - Reduced top nav
```

## Tab Navigation Patterns

### Pattern 1: Horizontal Tabs

For switching between views within a page:

```css
.tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  gap: var(--spacing-1);
}

.tab {
  padding: var(--spacing-3) var(--spacing-4);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.tab:hover {
  color: var(--color-text-primary);
}

.tab[aria-selected="true"] {
  color: var(--color-accent);
}

.tab[aria-selected="true"]::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-accent);
}

.tab:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
  border-radius: var(--radius-sm);
}
```

```tsx
// Accessible tab implementation
function Tabs({ tabs, activeTab, onTabChange }) {
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    const tabCount = tabs.length;
    let newIndex = index;

    switch (e.key) {
      case 'ArrowRight':
        newIndex = (index + 1) % tabCount;
        break;
      case 'ArrowLeft':
        newIndex = (index - 1 + tabCount) % tabCount;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabCount - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    onTabChange(tabs[newIndex].id);
    // Focus the new tab
    const tabElements = tabListRef.current?.querySelectorAll('[role="tab"]');
    (tabElements?.[newIndex] as HTMLElement)?.focus();
  };

  return (
    <div>
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Content sections"
        className="tabs"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="tab"
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
          className="tab-panel"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
```

### Pattern 2: Pill Tabs

Softer visual treatment:

```css
.tabs-pill {
  display: flex;
  gap: var(--spacing-2);
  padding: var(--spacing-1);
  background: var(--color-surface-secondary);
  border-radius: var(--radius-lg);
  width: fit-content;
}

.tab-pill {
  padding: var(--spacing-2) var(--spacing-4);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-pill[aria-selected="true"] {
  background: var(--color-surface-primary);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-sm);
}
```

### Pattern 3: Vertical Tabs

For settings or complex nested content:

```css
.tabs-vertical {
  display: flex;
  gap: var(--spacing-6);
}

.tabs-vertical [role="tablist"] {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  min-width: 200px;
  border-right: 1px solid var(--color-border);
  padding-right: var(--spacing-4);
}

.tabs-vertical .tab {
  text-align: left;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
}

.tabs-vertical .tab[aria-selected="true"] {
  background: var(--color-surface-secondary);
}

.tabs-vertical .tab[aria-selected="true"]::after {
  display: none;
}
```

## Breadcrumb Patterns

### Standard Breadcrumbs

```css
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.breadcrumb-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.breadcrumb-separator {
  color: var(--color-text-tertiary);
}

.breadcrumb-current {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}
```

```tsx
function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.href} className="breadcrumb-item">
              {!isLast ? (
                <>
                  <a href={item.href} className="breadcrumb-link">
                    {item.label}
                  </a>
                  <span className="breadcrumb-separator" aria-hidden="true">
                    /
                  </span>
                </>
              ) : (
                <span className="breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

## Sidebar Navigation

### Collapsible Sidebar

```css
.sidebar {
  width: 256px;
  height: 100vh;
  background: var(--color-surface-secondary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.sidebar-collapsed {
  width: 64px;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-4);
}

.nav-section {
  margin-bottom: var(--spacing-6);
}

.nav-section-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--spacing-2) var(--spacing-3);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.2s;
}

.nav-item:hover {
  background: var(--color-surface-tertiary);
  color: var(--color-text-primary);
}

.nav-item[aria-current="page"] {
  background: var(--color-accent-light);
  color: var(--color-accent);
  font-weight: var(--font-weight-medium);
}

.nav-item-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar-collapsed .nav-item-label {
  display: none;
}
```

### Tree Navigation

For deeply nested structures:

```tsx
interface TreeItem {
  id: string;
  label: string;
  href?: string;
  children?: TreeItem[];
}

function TreeNav({ items }: { items: TreeItem[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderItem = (item: TreeItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expanded.has(item.id);

    return (
      <li key={item.id} role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
        <div
          className="tree-item"
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(item.id)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              className="tree-toggle"
            >
              <ChevronIcon direction={isExpanded ? 'down' : 'right'} />
            </button>
          )}

          {item.href ? (
            <a href={item.href} className="tree-link">{item.label}</a>
          ) : (
            <span className="tree-label">{item.label}</span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <ul role="group">
            {item.children!.map((child) => renderItem(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav aria-label="Documentation">
      <ul role="tree">
        {items.map((item) => renderItem(item))}
      </ul>
    </nav>
  );
}
```

## Mobile Navigation

### Bottom Tab Bar

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  background: var(--color-surface-primary);
  border-top: 1px solid var(--color-border);
  padding: var(--spacing-2) 0;
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--font-size-xs);
  min-width: 64px;
}

.bottom-nav-item[aria-current="page"] {
  color: var(--color-accent);
}

.bottom-nav-icon {
  width: 24px;
  height: 24px;
}
```

### Mobile Drawer

```tsx
function MobileDrawer({ isOpen, onClose, children }) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Trap focus when open
  useEffect(() => {
    if (isOpen) {
      const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`drawer ${isOpen ? 'open' : ''}`}
      >
        <button
          onClick={onClose}
          className="drawer-close"
          aria-label="Close menu"
        >
          ×
        </button>
        {children}
      </div>
    </>
  );
}
```

```css
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
}

.drawer-backdrop.open {
  opacity: 1;
  visibility: visible;
}

.drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  max-width: 80vw;
  background: var(--color-surface-primary);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 100;
  overflow-y: auto;
}

.drawer.open {
  transform: translateX(0);
}

@media (prefers-reduced-motion: reduce) {
  .drawer-backdrop,
  .drawer {
    transition: none;
  }
}
```

## Pagination Patterns

### Standard Pagination

```tsx
function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: PaginationProps) {
  const getVisiblePages = () => {
    const delta = 2;
    const range: (number | 'ellipsis')[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      } else if (range[range.length - 1] !== 'ellipsis') {
        range.push('ellipsis');
      }
    }

    return range;
  };

  return (
    <nav aria-label="Pagination" className="pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="pagination-prev"
      >
        ← Previous
      </button>

      <ol className="pagination-pages">
        {getVisiblePages().map((page, index) => (
          <li key={index}>
            {page === 'ellipsis' ? (
              <span className="pagination-ellipsis">…</span>
            ) : (
              <button
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                className={`pagination-page ${page === currentPage ? 'active' : ''}`}
              >
                {page}
              </button>
            )}
          </li>
        ))}
      </ol>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="pagination-next"
      >
        Next →
      </button>
    </nav>
  );
}
```

### Load More / Infinite Scroll

```tsx
function InfiniteList({ loadMore, hasMore, items }) {
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loadMore, hasMore]);

  return (
    <div>
      <ul aria-live="polite">
        {items.map((item) => (
          <li key={item.id}>{item.content}</li>
        ))}
      </ul>

      {hasMore && (
        <div ref={loadMoreRef} className="load-more-trigger">
          <Spinner aria-label="Loading more items" />
        </div>
      )}

      {!hasMore && (
        <p className="end-of-list">You've reached the end</p>
      )}
    </div>
  );
}
```

## Skip Links

Essential for keyboard users:

```css
.skip-link {
  position: absolute;
  top: -100px;
  left: var(--spacing-4);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-accent);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-md);
  z-index: 1000;
  transition: top 0.2s;
}

.skip-link:focus {
  top: var(--spacing-4);
}
```

```html
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <a href="#main-nav" class="skip-link">Skip to navigation</a>

  <nav id="main-nav">...</nav>

  <main id="main-content" tabindex="-1">...</main>
</body>
```

## Output: Navigation Specification

```markdown
# Navigation Specification

## Navigation Structure
- Primary: [horizontal/sidebar/bottom-bar]
- Secondary: [tabs/breadcrumbs/tree]
- Mobile: [drawer/hamburger/bottom-bar]

## Components
1. **Primary Navigation**
   - Type: [description]
   - Items: [list]
   - Current page indicator: [style]

2. **Secondary Navigation**
   - Type: [tabs/breadcrumbs]
   - Context: [where used]

3. **Mobile Navigation**
   - Pattern: [description]
   - Breakpoint: [Xpx]

## Keyboard Navigation
- Tab pattern: [roving tabindex/arrow keys]
- Skip links: [implemented]
- Focus management: [strategy]

## ARIA Implementation
- Roles: [navigation, tablist, tree, etc.]
- States: [aria-current, aria-expanded, etc.]
- Labels: [aria-label values]
```

## Deliverables Checklist

- [ ] Navigation type selected for content structure
- [ ] Mobile navigation pattern defined
- [ ] Tab components with keyboard support
- [ ] Breadcrumbs for deep hierarchies
- [ ] Skip links implemented
- [ ] ARIA roles and states correct
- [ ] Focus management handled
- [ ] Reduced motion alternatives
