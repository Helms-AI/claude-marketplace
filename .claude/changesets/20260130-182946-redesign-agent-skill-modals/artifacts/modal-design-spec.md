# Modal Design Specification
## Agent and Skill Detail Modals

**Changeset:** 20260130-182946-redesign-agent-skill-modals  
**Design Lead:** Dana Reyes (User Experience Lead)  
**Version:** 1.0  
**Date:** 2026-01-30

---

## Design Discussion Summary

### The Question
Redesign the Agent and Skill detail modals to be visually distinct, emphasize key information through clear hierarchy, and provide better visualization of handoff relationships.

### Aesthetic Direction
- **Archetype:** IDE/Developer Tool aesthetic - compact, information-dense, professional
- **Tone:** Technical but approachable, data-forward with clear visual rhythm
- **Anti-Patterns:** Generic form layouts, cramped lists without hierarchy, purely text-based handoff relationships

### Design Recommendation
Create two distinctly styled modals that share a common structural framework but differ in their hero sections and data presentations. The Agent modal emphasizes personality and capabilities, while the Skill modal emphasizes data flow and usage metrics.

---

## 1. Shared Design System

### Color Palette
```css
/* Existing domain colors - use these for accent theming */
--domain-pm: #6366f1;
--domain-user-experience: #f472b6;
--domain-frontend: #22d3ee;
--domain-architecture: #a78bfa;
--domain-backend: #4ade80;
--domain-testing: #facc15;
--domain-devops: #fb923c;
--domain-data: #60a5fa;
--domain-security: #f87171;
--domain-documentation: #a3e635;

/* Modal-specific colors */
--modal-bg: #1a1a1a;
--modal-surface: #242424;
--modal-surface-elevated: #2a2a2a;
--modal-border: #333333;
--modal-text-primary: #e0e0e0;
--modal-text-secondary: #a0a0a0;
--modal-text-muted: #666666;
```

### Typography Scale
| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Modal Title | IBM Plex Sans | 20px | 600 | 1.2 |
| Section Header | IBM Plex Sans | 11px | 600 | 1.4 |
| Body Text | IBM Plex Sans | 13px | 400 | 1.5 |
| Tag Text | IBM Plex Mono | 11px | 500 | 1 |
| Stat Number | IBM Plex Mono | 24px | 500 | 1 |
| Command | IBM Plex Mono | 16px | 500 | 1.2 |

### Spacing System
```
--modal-spacing-xs: 4px;
--modal-spacing-sm: 8px;
--modal-spacing-md: 12px;
--modal-spacing-lg: 16px;
--modal-spacing-xl: 24px;
```

---

## 2. Agent Modal Design

### Visual Hierarchy (Top to Bottom)

```
+----------------------------------------------------------+
|  [X]                                                      |
|  +------------------------------------------------------+ |
|  | DOMAIN ACCENT BAR (4px, full width, domain color)    | |
|  +------------------------------------------------------+ |
|                                                          |
|  +------------------+  +-------------------------------+ |
|  |   AVATAR AREA    |  |  Quinn Martinez               | |
|  |   (Optional:     |  |  Aesthetic Director           | |
|  |    Domain Icon   |  |  +--------+ user experience   | |
|  |    or Initials)  |  |  | domain |                   | |
|  +------------------+  +-------------------------------+ |
|                                                          |
|  +------------------------------------------------------+ |
|  | TOOLS                                   section bar  | |
|  | +------+ +------+ +------+ +------+ +------+         | |
|  | | Read | | Grep | | Glob | | Bash | | Edit |         | |
|  | +------+ +------+ +------+ +------+ +------+         | |
|  +------------------------------------------------------+ |
|                                                          |
|  +------------------------------------------------------+ |
|  | KEY PHRASES                                          | |
|  | "Let me push for something more distinctive..."      | |
|  | "What's our anti-pattern here?"                      | |
|  | "This needs to feel intentional"                     | |
|  +------------------------------------------------------+ |
|                                                          |
|  +------------------------------------------------------+ |
|  | RECENT ACTIVITY                                      | |
|  | +--------------------------------------------------+ | |
|  | | 10:32 AM  Conversation started                   | | |
|  | | 10:34 AM  Tool use: Read                         | | |
|  | | 10:35 AM  Tool use: Grep                         | | |
|  | +--------------------------------------------------+ | |
|  +------------------------------------------------------+ |
|                                                          |
+----------------------------------------------------------+
```

### Section Breakdown

#### A. Domain Accent Header
- **Purpose:** Immediate domain identification through color
- **Structure:** 4px tall bar spanning full modal width (inside border-radius)
- **Styling:** Background uses domain color variable
- **CSS Class:** `.modal-domain-accent`

#### B. Identity Section
- **Purpose:** Establish agent personality at a glance
- **Layout:** Two-column (optional avatar + text info)
- **Left Column (64px):**
  - Domain icon (SVG) or initials in circle
  - Background: domain color at 20% opacity
  - Icon/text color: domain color at 100%
- **Right Column:**
  - Agent name (20px, weight 600)
  - Role (13px, secondary color)
  - Domain badge (inline pill)
- **CSS Classes:** `.modal-identity`, `.modal-avatar`, `.modal-name`, `.modal-role`

#### C. Tools Section
- **Purpose:** Prominent display of available capabilities
- **Layout:** Horizontal flex wrap with gap
- **Tag Design:**
  - Background: `#2a2a2a`
  - Border: 1px solid `#404040`
  - Padding: 4px 10px
  - Border-radius: 4px
  - Font: IBM Plex Mono, 11px
  - Hover: Background lightens to `#333333`
- **CSS Class:** `.modal-tools-grid`

#### D. Key Phrases Section
- **Purpose:** Show agent personality through characteristic expressions
- **Layout:** Vertical stack of quote blocks
- **Quote Design:**
  - Left border: 2px solid domain color (20% opacity)
  - Padding-left: 12px
  - Font: IBM Plex Sans, 13px, italic
  - Color: secondary text
  - Margin-bottom: 8px between quotes
- **CSS Class:** `.modal-phrases`, `.modal-phrase-item`

#### E. Activity Section
- **Purpose:** Recent context for agent usage
- **Layout:** Scrollable list (max-height: 150px)
- **Event Row Design:**
  - Two columns: timestamp (mono, muted) | event description
  - Alternating row backgrounds for scannability
  - Compact: 6px vertical padding per row
- **CSS Class:** `.modal-activity-list`, `.modal-activity-row`

---

## 3. Skill Modal Design

### Visual Hierarchy (Top to Bottom)

```
+----------------------------------------------------------+
|  [X]                                                      |
|  +------------------------------------------------------+ |
|  | DOMAIN ACCENT BAR (4px, full width, domain color)    | |
|  +------------------------------------------------------+ |
|                                                          |
|  /frontend-orchestrator                                  |
|  Frontend Team Orchestrator                              |
|  +--------+                                              |
|  | domain |  frontend                                    |
|  +--------+                                              |
|                                                          |
|  +------------------------------------------------------+ |
|  | POWERED BY                                           | |
|  | +--------------------------------------------------+ | |
|  | | [icon] Chris Nakamura (Frontend Lead)            | | |
|  | +--------------------------------------------------+ | |
|  +------------------------------------------------------+ |
|                                                          |
|  +------------------------------------------------------+ |
|  | HANDOFF FLOW                                         | |
|  |                                                      | |
|  |  +---------------+        +-------------------+      | |
|  |  |    /pm        | -----> | /frontend-orch    |      | |
|  |  +---------------+        +-------------------+      | |
|  |  +---------------+               |                   | |
|  |  | /user-exp-orch| -----> /      |                   | |
|  |  +---------------+               v                   | |
|  |                          +-------------------+       | |
|  |                          | /frontend-motion  |       | |
|  |                          +-------------------+       | |
|  |                          +-------------------+       | |
|  |                          | /frontend-a11y    |       | |
|  |                          +-------------------+       | |
|  +------------------------------------------------------+ |
|                                                          |
|  +------------------------+  +------------------------+  |
|  |  INVOCATIONS          |  |  LAST INVOKED          |  |
|  |        127            |  |    2 hours ago         |  |
|  +------------------------+  +------------------------+  |
|                                                          |
|  +------------------------------------------------------+ |
|  | RECENT INVOCATIONS                                   | |
|  | +--------------------------------------------------+ | |
|  | | 10:32 AM  Tool: Read                             | | |
|  | | 10:34 AM  Tool: Grep                             | | |
|  | +--------------------------------------------------+ | |
|  +------------------------------------------------------+ |
|                                                          |
+----------------------------------------------------------+
```

### Section Breakdown

#### A. Domain Accent Header
- Same as Agent Modal

#### B. Command Identity Section
- **Purpose:** Clear command display for copy-paste usage
- **Layout:** Single column
- **Command Display:**
  - Font: IBM Plex Mono, 16px, weight 500
  - Color: domain color
  - Prefix "/" slightly muted
- **Name:** 13px, secondary color
- **Domain badge:** inline pill below
- **CSS Classes:** `.modal-command`, `.modal-skill-name`

#### C. Backing Agent Section
- **Purpose:** Link skill to its powering agent
- **Layout:** Clickable card
- **Design:**
  - Background: `#242424`
  - Border: 1px solid `#333333`
  - Border-left: 3px solid domain color
  - Padding: 12px
  - Agent name + role in row
  - Hover: background `#2a2a2a`
- **Interaction:** Click navigates to agent modal
- **CSS Class:** `.modal-agent-link`

#### D. Handoff Flow Visualization (KEY DIFFERENTIATOR)
- **Purpose:** Visual representation of data flow between skills
- **Layout:** Horizontal flow diagram

**Design Specifications:**

```
INPUTS (left)          CENTER (this skill)        OUTPUTS (right)
+---------------+      +-------------------+      +---------------+
|   skill-id    | ---> |    CURRENT        | ---> |   skill-id    |
+---------------+      +-------------------+      +---------------+
+---------------+            |                    +---------------+
|   skill-id    | -------->  |                    |   skill-id    |
+---------------+                                 +---------------+
```

**Node Design:**
- Background: `#2a2a2a`
- Border: 1px solid `#404040`
- Border-radius: 4px
- Padding: 8px 12px
- Font: IBM Plex Mono, 11px
- Current skill: border 2px solid domain color, slightly larger

**Arrow/Connector Design:**
- Color: `#404040`
- Thickness: 2px
- Style: Solid with small triangle arrowhead
- For multiple inputs: use curved bezier paths

**Empty State:**
- If no inputs: Show "No upstream skills" in muted text
- If no outputs: Show "Terminal skill" in muted text

**CSS Classes:** `.modal-handoff-flow`, `.handoff-node`, `.handoff-node-current`, `.handoff-connector`

#### E. Stats Section
- **Purpose:** Quick metrics at a glance
- **Layout:** Two-column grid
- **Stat Card Design:**
  - Background: `#242424`
  - Border-radius: 6px
  - Padding: 16px
  - Label: 11px, uppercase, muted, letter-spacing 0.5px
  - Value: 24px, mono font, primary color
- **CSS Class:** `.modal-stats-grid`, `.modal-stat-card`

#### F. Recent Invocations Section
- Same design as Agent Activity Section
- **CSS Class:** `.modal-invocations-list`

---

## 4. Interaction Specifications

### Modal Open Animation
```css
/* Fade in backdrop */
.modal {
    opacity: 0;
    transition: opacity 150ms ease-out;
}
.modal.open {
    opacity: 1;
}

/* Scale in content */
.modal-content {
    transform: scale(0.95) translateY(-10px);
    opacity: 0;
    transition: transform 200ms ease-out, opacity 150ms ease-out;
}
.modal.open .modal-content {
    transform: scale(1) translateY(0);
    opacity: 1;
}
```

### Tool Tag Hover
```css
.modal-tool-tag:hover {
    background: #333333;
    border-color: #505050;
    transform: translateY(-1px);
}
```

### Agent Link Hover (in Skill Modal)
```css
.modal-agent-link:hover {
    background: #2a2a2a;
    cursor: pointer;
}
.modal-agent-link:hover .agent-name {
    color: var(--domain-color);
}
```

### Handoff Node Hover
```css
.handoff-node:hover {
    background: #333333;
    border-color: var(--domain-color);
    cursor: pointer;
}
```

### Stat Card Hover
```css
.modal-stat-card:hover {
    background: #2a2a2a;
}
```

---

## 5. CSS Class Reference

### Structural Classes
| Class | Purpose |
|-------|---------|
| `.modal-agent` | Agent modal container modifier |
| `.modal-skill` | Skill modal container modifier |
| `.modal-domain-accent` | Top color bar |
| `.modal-header` | Identity/command section wrapper |
| `.modal-section` | Generic section container |
| `.modal-section-title` | Section header (uppercase, muted) |

### Agent-Specific Classes
| Class | Purpose |
|-------|---------|
| `.modal-identity` | Avatar + name layout |
| `.modal-avatar` | Domain-colored circle |
| `.modal-name` | Agent name styling |
| `.modal-role` | Role subtitle |
| `.modal-tools-grid` | Tools flex container |
| `.modal-tool-tag` | Individual tool pill |
| `.modal-phrases` | Phrases container |
| `.modal-phrase-item` | Individual quote block |
| `.modal-activity-list` | Activity scroll container |
| `.modal-activity-row` | Activity event row |

### Skill-Specific Classes
| Class | Purpose |
|-------|---------|
| `.modal-command` | Skill ID display |
| `.modal-skill-name` | Human-readable name |
| `.modal-agent-link` | Backing agent card |
| `.modal-handoff-flow` | Flow diagram container |
| `.handoff-node` | Flow diagram node |
| `.handoff-node-current` | Current skill node (highlighted) |
| `.handoff-connector` | SVG connector line |
| `.handoff-arrow` | Arrowhead element |
| `.modal-stats-grid` | Two-column stats layout |
| `.modal-stat-card` | Individual stat block |
| `.modal-stat-label` | Stat label text |
| `.modal-stat-value` | Stat number display |
| `.modal-invocations-list` | Invocations scroll container |

### Shared Utility Classes
| Class | Purpose |
|-------|---------|
| `.modal-domain-badge` | Inline domain pill |
| `.modal-empty-state` | "No data" placeholder |
| `.modal-scrollable` | Scrollable section (max-height) |

---

## 6. Responsive Considerations

### Width Constraints
- Max width: 600px (existing)
- Min width: 360px
- Below 400px viewport: modal goes full-screen

### Height Constraints
- Max height: 80vh (existing)
- Activity/invocations list: max-height 150px
- Handoff flow: max-height 200px (scrollable if overflow)

### Mobile Adaptations (below 480px)
- Stats grid: single column
- Handoff flow: vertical layout instead of horizontal
- Tool tags: smaller padding, allow wrapping

---

## 7. Accessibility Notes

### Focus Management
- Focus trap within open modal
- Close button receives initial focus
- Tab order: close button -> interactive elements -> activity list

### ARIA Labels
```html
<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <h2 id="modal-title">Quinn Martinez</h2>
    ...
</div>
```

### Color Contrast
- All text meets WCAG AA (4.5:1 minimum)
- Domain colors used only for accents, not essential information
- Tool tags and nodes have visible borders, not just color

### Keyboard Navigation
- ESC closes modal
- Enter on tool tag: no action (informational)
- Enter on agent link: opens agent modal
- Enter on handoff node: opens that skill's modal

---

## 8. Implementation Handoff Notes

### Frontend Skills Needed
- CSS Grid/Flexbox for layouts
- SVG for handoff flow connectors
- JavaScript for:
  - Modal state management
  - Handoff flow diagram rendering
  - Agent link click handling
  - Activity list scrolling

### Suggested Implementation Order
1. Update modal container structure (accent bar, sections)
2. Implement Agent modal redesign
3. Implement Skill modal basic layout
4. Build handoff flow visualization component
5. Add micro-interactions and hover states
6. Test accessibility

### Data Dependencies
- Agent data: already available from `/api/agents`
- Skill data: already available from `/api/skills`
- Activity/invocations: existing API endpoints

---

## Appendix A: Visual Mockup References

### Agent Modal - Visual ASCII
```
+----------------------------------------------------------+
| [-------- domain color bar (user-experience pink) ------] |
+----------------------------------------------------------+
|                                                     [X]   |
|   +-------+                                               |
|   |  QM   |   Quinn Martinez                              |
|   +-------+   Aesthetic Director                          |
|               [user experience]                           |
|                                                           |
|   TOOLS ------------------------------------------------- |
|   [Read] [Grep] [Glob] [Bash] [Edit] [Write]             |
|                                                           |
|   KEY PHRASES ------------------------------------------- |
|   | "Let me push for something more distinctive..."       |
|   | "What's our anti-pattern here?"                       |
|   | "Design is about intentional constraints"             |
|                                                           |
|   RECENT ACTIVITY --------------------------------------- |
|   | 10:32 AM | Conversation started                      ||
|   | 10:34 AM | Tool use: Read                            ||
|   | 10:35 AM | Tool use: Grep                            ||
|   |          |                                           ||
+----------------------------------------------------------+
```

### Skill Modal - Visual ASCII
```
+----------------------------------------------------------+
| [-------- domain color bar (frontend cyan) -------------] |
+----------------------------------------------------------+
|                                                     [X]   |
|   /frontend-orchestrator                                  |
|   Frontend Team Orchestrator                              |
|   [frontend]                                              |
|                                                           |
|   POWERED BY -------------------------------------------- |
|   [*] Chris Nakamura - Frontend Lead           [->]       |
|                                                           |
|   HANDOFF FLOW ------------------------------------------ |
|                                                           |
|   +--------+     +------------------+     +-----------+   |
|   | /pm    |---->| /frontend-orch   |---->| /motion   |   |
|   +--------+     | (current)        |     +-----------+   |
|   +--------+     +------------------+     +-----------+   |
|   | /ux-   |---->                        | /a11y     |   |
|   | orch   |                              +-----------+   |
|   +--------+                                              |
|                                                           |
|   +-------------+  +-------------+                        |
|   | INVOCATIONS |  | LAST USED   |                        |
|   |     127     |  | 2 hours ago |                        |
|   +-------------+  +-------------+                        |
|                                                           |
|   RECENT INVOCATIONS ------------------------------------ |
|   | 10:32 AM | Tool: Read - /src/components/Button.tsx  ||
|   | 10:30 AM | Tool: Write - created new component      ||
+----------------------------------------------------------+
```

---

## Appendix B: Domain Color Usage Guide

| Domain | Color | Hex | Usage |
|--------|-------|-----|-------|
| PM | Indigo | #6366f1 | Cross-domain orchestration |
| User Experience | Pink | #f472b6 | Design, aesthetics |
| Frontend | Cyan | #22d3ee | UI implementation |
| Architecture | Purple | #a78bfa | System design |
| Backend | Green | #4ade80 | APIs, services |
| Testing | Yellow | #facc15 | QA, test automation |
| DevOps | Orange | #fb923c | CI/CD, infrastructure |
| Data | Blue | #60a5fa | Data pipelines |
| Security | Red | #f87171 | Security, compliance |
| Documentation | Lime | #a3e635 | Technical writing |
| External | Gray | #666666 | Unknown/external |

---

*Design specification complete. Ready for frontend implementation.*
