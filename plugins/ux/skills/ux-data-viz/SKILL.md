---
name: ux-data-viz
description: Data visualization with D3.js, Recharts, Tremor, and accessible chart patterns
---

# Data Visualization Skill

When invoked with `/ux-data-viz`, implement data visualizations using modern charting libraries with a focus on accessibility and performance.

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Drew Patel - Data Visualization Specialist** is now working on this.
> "Data should tell a story, not just display numbers."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| color-alchemist | Chart color palette, sequential/diverging scales, categorical colors |
| typography-curator | Data typography, tabular figures, label sizing |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| accessibility-auditor | Chart accessibility audit, data table alternatives, color contrast in charts |
| performance-engineer | Rendering optimization needs, canvas vs SVG recommendations, data point limits |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Drew Patel → Casey Williams:** Data viz implementation ready—please review chart accessibility, verify color contrast in legends, and validate the data table alternative."
```

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to gather requirements:

```
Question 1: "What type of data visualization do you need?"
Header: "Chart Type (for Drew)"
Options:
- "Time Series" - Line charts, area charts, trends over time
- "Comparison" - Bar charts, grouped/stacked bars
- "Distribution" - Histograms, scatter plots, box plots
- "Composition" - Pie charts, donut charts, treemaps
- "Relationship" - Network graphs, sankey diagrams

Question 2: "What's your preferred library?"
Header: "Library"
Options:
- "Recharts" - React-native, declarative, good DX
- "Tremor" - Tailwind-native, dashboard-focused
- "D3" - Maximum control, custom visualizations
- "Auto-select" - Choose based on requirements

Question 3: "What are your accessibility requirements?"
Header: "A11y Level"
Options:
- "Basic" - Color contrast, keyboard navigation
- "Comprehensive" - Full WCAG AA, screen reader support
- "Data table alternative" - Charts + accessible data tables
```

## Library Selection Guide

| Use Case | Recommended | Why |
|----------|-------------|-----|
| **Dashboard charts** | Tremor | Tailwind integration, beautiful defaults |
| **Complex interactions** | Recharts | React-native, good event handling |
| **Custom visualizations** | D3.js | Total control, any visualization type |
| **Simple sparklines** | CSS/SVG | Lightweight, no dependencies |
| **Real-time data** | Recharts + TanStack Query | Easy to update, React integration |

## Recharts Patterns

### Line Chart
```tsx
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DataPoint {
  date: string;
  revenue: number;
  costs: number;
}

export function RevenueChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
          <XAxis
            dataKey="date"
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)' }}
          />
          <YAxis
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)' }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="costs"
            stroke="var(--color-secondary)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Bar Chart
```tsx
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface CategoryData {
  category: string;
  value: number;
}

export function CategoryChart({ data }: { data: CategoryData[] }) {
  const colors = [
    'oklch(0.55 0.2 250)',  // Blue
    'oklch(0.55 0.2 170)',  // Teal
    'oklch(0.55 0.2 145)',  // Green
    'oklch(0.55 0.2 50)',   // Orange
    'oklch(0.55 0.2 25)',   // Red
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" />
        <YAxis dataKey="category" type="category" width={100} />
        <Tooltip />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

## Tremor Patterns

### Area Chart Dashboard
```tsx
'use client';

import { AreaChart, Card, Title, Text } from '@tremor/react';

const chartdata = [
  { date: 'Jan 22', Users: 2890, Sessions: 4338 },
  { date: 'Feb 22', Users: 2756, Sessions: 4103 },
  { date: 'Mar 22', Users: 3322, Sessions: 5023 },
  // ...
];

export function UsersChart() {
  return (
    <Card>
      <Title>User Activity</Title>
      <Text>Monthly active users and sessions</Text>
      <AreaChart
        className="h-72 mt-4"
        data={chartdata}
        index="date"
        categories={['Users', 'Sessions']}
        colors={['blue', 'cyan']}
        valueFormatter={(value) => value.toLocaleString()}
      />
    </Card>
  );
}
```

### KPI Cards
```tsx
import { Card, Metric, Text, Flex, BadgeDelta } from '@tremor/react';

interface KPIData {
  title: string;
  metric: string;
  delta: string;
  deltaType: 'increase' | 'decrease' | 'unchanged';
}

export function KPICard({ data }: { data: KPIData }) {
  return (
    <Card>
      <Flex justifyContent="between" alignItems="center">
        <Text>{data.title}</Text>
        <BadgeDelta deltaType={data.deltaType}>{data.delta}</BadgeDelta>
      </Flex>
      <Metric className="mt-2">{data.metric}</Metric>
    </Card>
  );
}
```

## D3.js Patterns

### Basic D3 Setup with React
```tsx
'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  x: number;
  y: number;
}

export function D3ScatterPlot({ data }: { data: DataPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    const width = 600;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    // Clear previous
    svg.selectAll('*').remove();

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.x) || 0])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.y) || 0])
      .range([height - margin.bottom, margin.top]);

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    // Points
    svg.selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 5)
      .attr('fill', 'var(--color-primary)')
      .attr('opacity', 0.7);

  }, [data]);

  return (
    <svg
      ref={svgRef}
      width={600}
      height={400}
      role="img"
      aria-label="Scatter plot showing data distribution"
    >
      <title>Data Distribution</title>
      <desc>Scatter plot with {data.length} data points</desc>
    </svg>
  );
}
```

### D3 with Animation
```tsx
useEffect(() => {
  // ... scales setup ...

  // Animated entrance
  svg.selectAll('circle')
    .data(data)
    .join('circle')
    .attr('cx', d => xScale(d.x))
    .attr('cy', height - margin.bottom)  // Start at bottom
    .attr('r', 0)  // Start invisible
    .attr('fill', 'var(--color-primary)')
    .transition()
    .duration(800)
    .delay((_, i) => i * 20)  // Stagger
    .attr('cy', d => yScale(d.y))
    .attr('r', 5);
}, [data]);
```

## Accessibility Patterns

### Accessible Chart with Data Table
```tsx
interface ChartData {
  label: string;
  value: number;
}

export function AccessibleChart({ data, title }: {
  data: ChartData[];
  title: string;
}) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div>
      {/* Chart */}
      <figure role="figure" aria-labelledby="chart-title">
        <figcaption id="chart-title" className="sr-only">{title}</figcaption>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            {/* ... chart config ... */}
          </BarChart>
        </ResponsiveContainer>
      </figure>

      {/* Toggle for accessible alternative */}
      <button
        onClick={() => setShowTable(!showTable)}
        aria-expanded={showTable}
        className="text-sm underline mt-2"
      >
        {showTable ? 'Hide' : 'Show'} data table
      </button>

      {/* Accessible data table */}
      {showTable && (
        <table className="mt-4 w-full border-collapse">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={i}>
                <td>{item.label}</td>
                <td>{item.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

### Color Accessibility
```tsx
// Use patterns in addition to color
const CHART_PATTERNS = [
  { color: 'oklch(0.55 0.2 250)', pattern: 'solid' },
  { color: 'oklch(0.55 0.2 25)', pattern: 'diagonal-stripe' },
  { color: 'oklch(0.55 0.2 145)', pattern: 'dots' },
];

// Ensure 3:1 contrast between adjacent colors
// Use labels and legends, not just color
```

## Performance Optimization

### Lazy Load Charts
```tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(
  () => import('@/components/HeavyChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
);
```

### Virtualized Large Datasets
```tsx
// For 10,000+ data points, consider:
// 1. Data aggregation on the server
// 2. Canvas-based rendering (D3 + Canvas)
// 3. WebGL (deck.gl for massive datasets)
// 4. Progressive loading with intersection observer
```

## Team Consultation

- **Sam (Systems):** Chart color tokens from design system
- **Casey (A11y):** Accessible alternatives, color contrast
- **Jordan M (Motion):** Chart animation and transitions
- **Taylor (Performance):** Bundle impact, lazy loading

## Deliverables Checklist

- [ ] Chart type matches data story
- [ ] Responsive container sizing
- [ ] Design tokens for colors/typography
- [ ] Accessible alternative (data table or description)
- [ ] Keyboard navigable tooltips
- [ ] Performance optimized (lazy loaded if needed)
- [ ] Animation respects reduced motion
- [ ] Proper ARIA labels and roles
