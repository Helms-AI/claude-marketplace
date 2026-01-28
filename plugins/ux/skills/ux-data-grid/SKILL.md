---
name: ux-data-grid
description: Table layouts, sorting/filtering, virtualization, and responsive data display with proper semantics
---

# Data Grid Skill

When invoked with `/ux-data-grid`, design data-dense interfaces that are scannable, sortable, and accessible across all device sizes.

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Reese Kim - Data Grid Specialist** is now working on this.
> "Data should tell a story at a glance. Let's make your tables speak clearly."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| `/ux-aesthetic-director` | Visual tone, density preference |
| `/ux-orchestrator` | User's original request, data structure |
| `/ux-layout-composer` | Available space, responsive requirements |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| `/ux-component-architect` | Table/grid components, cell types |
| `/ux-accessibility-auditor` | Table semantics, sortable headers |
| `/ux-performance-engineer` | Virtualization needs, row count |
| `/ux-responsive-engineer` | Mobile table strategy |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Reese → [Next Team Member]:** Here's the data grid specification:
- Layout: [table/card-grid/hybrid]
- Row count: [X rows, virtualization: yes/no]
- Mobile: [scroll/stack/priority-columns]"
```

## Data Display Philosophy

### The Scannable Data Principle

| Poor Experience | Good Experience |
|-----------------|-----------------|
| All columns equal width | Width matches content |
| No visual hierarchy | Key data emphasized |
| Tiny text, dense rows | Comfortable reading |
| No row differentiation | Alternating or hover states |
| Hidden important actions | Actions visible or easily discovered |

### Table vs Cards Decision Tree

```
How many columns of data?
├── 2-4 columns
│   └── Cards or simple list
├── 5-8 columns
│   └── Table (responsive strategy needed)
└── 8+ columns
    └── Table with column hiding/scrolling

Is the data comparative?
├── Yes (comparing rows) → Table
└── No (browsing items) → Cards may work

What actions are needed?
├── Bulk actions → Table with selection
├── Individual actions → Cards or table
└── View only → Either, based on density
```

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to understand data grid needs:

### Data Grid Discovery Questions

```
Question 1: "What type of data is being displayed?"
Header: "Data Type (for Reese)"
Options:
- "Tabular records" - Rows and columns, structured data
- "Content items" - Articles, products, media
- "Status/Metrics" - Dashboards, monitoring
- "Hierarchical" - Nested parent-child relationships

Question 2: "How should users interact with the data?"
Header: "Interaction"
Options:
- "View only" - Read and scan
- "Select & act" - Bulk operations
- "Edit inline" - Modify data in place
- "Drill down" - Navigate to details

Question 3: "How much data is expected?"
Header: "Scale"
Options:
- "Small (<100 rows)" - Load all at once
- "Medium (100-1000)" - Consider pagination
- "Large (1000+)" - Virtualization required
- "Real-time" - Streaming updates
```

## Table Patterns

### Pattern 1: Standard Data Table

```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.data-table th,
.data-table td {
  padding: var(--spacing-3) var(--spacing-4);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.data-table th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  background: var(--color-surface-secondary);
  position: sticky;
  top: 0;
  z-index: 1;
}

.data-table tbody tr:hover {
  background: var(--color-surface-hover);
}

/* Alternating rows (optional) */
.data-table-striped tbody tr:nth-child(even) {
  background: var(--color-surface-secondary);
}

/* Column width hints */
.data-table .col-id { width: 80px; }
.data-table .col-name { min-width: 200px; }
.data-table .col-status { width: 120px; }
.data-table .col-date { width: 140px; }
.data-table .col-actions { width: 100px; text-align: right; }
```

### Pattern 2: Sortable Table

```tsx
interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

function SortableTable({ data, columns }: TableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null; // Clear sort
    });
  };

  return (
    <table className="data-table" role="grid">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              scope="col"
              aria-sort={
                sortConfig?.key === col.key
                  ? sortConfig.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined
              }
            >
              {col.sortable ? (
                <button
                  onClick={() => handleSort(col.key)}
                  className="sort-button"
                >
                  {col.label}
                  <SortIcon
                    active={sortConfig?.key === col.key}
                    direction={sortConfig?.direction}
                  />
                </button>
              ) : (
                col.label
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.map((row) => (
          <tr key={row.id}>
            {columns.map((col) => (
              <td key={col.key}>{row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

```css
.sort-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  background: none;
  border: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  padding: 0;
}

.sort-button:hover {
  color: var(--color-text-primary);
}

.sort-icon {
  width: 16px;
  height: 16px;
  opacity: 0.3;
}

.sort-icon-active {
  opacity: 1;
  color: var(--color-accent);
}
```

### Pattern 3: Selectable Table

```tsx
function SelectableTable({ data, columns, onSelectionChange }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = selected.size === data.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.map((row) => row.id)));
    }
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    onSelectionChange?.(Array.from(selected));
  }, [selected, onSelectionChange]);

  return (
    <table className="data-table" role="grid" aria-multiselectable="true">
      <thead>
        <tr>
          <th scope="col" className="col-checkbox">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={toggleAll}
              aria-label={allSelected ? 'Deselect all' : 'Select all'}
            />
          </th>
          {columns.map((col) => (
            <th key={col.key} scope="col">{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr
            key={row.id}
            aria-selected={selected.has(row.id)}
            className={selected.has(row.id) ? 'row-selected' : ''}
          >
            <td className="col-checkbox">
              <input
                type="checkbox"
                checked={selected.has(row.id)}
                onChange={() => toggleRow(row.id)}
                aria-label={`Select ${row.name || row.id}`}
              />
            </td>
            {columns.map((col) => (
              <td key={col.key}>{row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

```css
.col-checkbox {
  width: 48px;
  text-align: center;
}

.row-selected {
  background: var(--color-accent-light) !important;
}

/* Bulk actions bar */
.bulk-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-accent);
  color: white;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-4);
}

.bulk-actions-count {
  font-weight: var(--font-weight-medium);
}
```

## Filtering and Search

### Filter Bar

```tsx
function TableFilters({ filters, onFilterChange }) {
  return (
    <div className="table-filters" role="search">
      <div className="filter-group">
        <label htmlFor="search" className="sr-only">Search</label>
        <input
          id="search"
          type="search"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="filter-search"
        />
      </div>

      <div className="filter-group">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
          className="filter-select"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="dateRange">Date range</label>
        <select
          id="dateRange"
          value={filters.dateRange}
          onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value })}
          className="filter-select"
        >
          <option value="">All time</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>
      </div>

      {Object.values(filters).some(Boolean) && (
        <button
          onClick={() => onFilterChange({})}
          className="filter-clear"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
```

```css
.table-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  background: var(--color-surface-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-4);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.filter-group label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.filter-search {
  min-width: 200px;
}

.filter-clear {
  align-self: flex-end;
  color: var(--color-accent);
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
}
```

## Virtualization for Large Datasets

```tsx
// Using react-window for virtualization
import { FixedSizeList } from 'react-window';

function VirtualizedTable({ data, columns, rowHeight = 48 }) {
  const Row = ({ index, style }) => {
    const row = data[index];

    return (
      <div style={style} className="virtual-row" role="row">
        {columns.map((col) => (
          <div
            key={col.key}
            className="virtual-cell"
            role="gridcell"
            style={{ width: col.width }}
          >
            {row[col.key]}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="virtual-table" role="grid">
      {/* Fixed header */}
      <div className="virtual-header" role="row">
        {columns.map((col) => (
          <div
            key={col.key}
            className="virtual-header-cell"
            role="columnheader"
            style={{ width: col.width }}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Virtualized body */}
      <FixedSizeList
        height={400}
        itemCount={data.length}
        itemSize={rowHeight}
        width="100%"
      >
        {Row}
      </FixedSizeList>
    </div>
  );
}
```

## Responsive Strategies

### Strategy 1: Horizontal Scroll

```css
.table-responsive-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Fade hint for more content */
.table-responsive-scroll::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 40px;
  background: linear-gradient(to right, transparent, var(--color-surface-primary));
  pointer-events: none;
}
```

### Strategy 2: Priority Columns

```css
/* Hide lower priority columns on small screens */
@media (max-width: 768px) {
  .col-priority-3 { display: none; }
}

@media (max-width: 640px) {
  .col-priority-2,
  .col-priority-3 { display: none; }
}

@media (max-width: 480px) {
  .col-priority-1,
  .col-priority-2,
  .col-priority-3 { display: none; }
}
```

### Strategy 3: Stacked Cards

```css
@media (max-width: 640px) {
  .data-table-stackable thead {
    display: none;
  }

  .data-table-stackable tbody tr {
    display: block;
    padding: var(--spacing-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-3);
  }

  .data-table-stackable td {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-2) 0;
    border-bottom: 1px solid var(--color-border-light);
  }

  .data-table-stackable td:last-child {
    border-bottom: none;
  }

  .data-table-stackable td::before {
    content: attr(data-label);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
  }
}
```

```tsx
// Add data-label for stacked view
{columns.map((col) => (
  <td key={col.key} data-label={col.label}>
    {row[col.key]}
  </td>
))}
```

## Empty and Loading States

```tsx
function TableEmpty({ message, action }) {
  return (
    <div className="table-empty">
      <div className="table-empty-icon">📋</div>
      <p>{message || 'No data to display'}</p>
      {action && (
        <button onClick={action.onClick} className="btn btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
}

function TableLoading({ columns }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 5 }).map((_, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={col.key}>
                <div className="skeleton skeleton-text" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Accessibility Requirements

### Proper Table Semantics

```tsx
// Essential table accessibility
<table
  role="grid"
  aria-label="User accounts"
  aria-describedby="table-description"
>
  <caption id="table-description" className="sr-only">
    Table of user accounts with name, email, status, and actions
  </caption>

  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Email</th>
      <th scope="col" aria-sort="ascending">Status</th>
      <th scope="col">Actions</th>
    </tr>
  </thead>

  <tbody>
    {data.map((row) => (
      <tr key={row.id}>
        <th scope="row">{row.name}</th>
        <td>{row.email}</td>
        <td>{row.status}</td>
        <td>
          <button aria-label={`Edit ${row.name}`}>Edit</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Keyboard Navigation

```tsx
function KeyboardNavigableTable({ data, columns }) {
  const [focusedCell, setFocusedCell] = useState({ row: 0, col: 0 });
  const tableRef = useRef<HTMLTableElement>(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    const { row, col } = focusedCell;
    let newRow = row;
    let newCol = col;

    switch (e.key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(data.length - 1, row + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(columns.length - 1, col + 1);
        break;
      case 'Home':
        newCol = 0;
        if (e.ctrlKey) newRow = 0;
        break;
      case 'End':
        newCol = columns.length - 1;
        if (e.ctrlKey) newRow = data.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    setFocusedCell({ row: newRow, col: newCol });

    // Focus the cell
    const cell = tableRef.current?.querySelector(
      `[data-row="${newRow}"][data-col="${newCol}"]`
    ) as HTMLElement;
    cell?.focus();
  };

  return (
    <table ref={tableRef} onKeyDown={handleKeyDown} role="grid">
      {/* ... */}
    </table>
  );
}
```

## Output: Data Grid Specification

```markdown
# Data Grid Specification

## Data Overview
- Type: [tabular/content/metrics/hierarchical]
- Columns: [X]
- Expected rows: [range]
- Interaction: [view/select/edit/drill-down]

## Layout
- Display: [table/cards/hybrid]
- Virtualization: [yes/no]
- Sticky header: [yes/no]

## Features
- Sorting: [columns list]
- Filtering: [filter types]
- Selection: [none/single/multi]
- Actions: [per-row actions]

## Responsive Strategy
- Desktop: [full table]
- Tablet: [priority columns/scroll]
- Mobile: [stacked cards/scroll]

## Accessibility
- Caption: [description]
- Scope headers: [✓]
- Sortable announcements: [✓]
- Keyboard navigation: [✓]

## Performance
- Row count threshold for virtualization: [X]
- Initial load: [X rows]
- Pagination/infinite: [type]
```

## Deliverables Checklist

- [ ] Table vs card layout decision made
- [ ] Column widths and priorities defined
- [ ] Sorting implementation if needed
- [ ] Filtering UI designed
- [ ] Selection pattern if needed
- [ ] Responsive strategy chosen
- [ ] Empty and loading states
- [ ] Proper table semantics
- [ ] Keyboard navigation
- [ ] Virtualization for large datasets
