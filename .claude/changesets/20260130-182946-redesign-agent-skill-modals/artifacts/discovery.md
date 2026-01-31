# Modal Redesign Discovery

## Current Implementation

### Agent Modal Content
- **Title**: Agent name (e.g., "Quinn Martinez")
- **Domain badge**: Colored by domain
- **Sections**:
  - Role (short description)
  - Description (longer text, optional)
  - Tools (tags like Read, Grep, Glob)
  - Key Phrases (quoted strings, max 5)
  - Recent Activity (list of events with timestamps)

### Skill Modal Content
- **Title**: Skill ID with slash prefix (e.g., "/frontend-orchestrator")
- **Domain badge**: Colored by domain
- **Sections**:
  - Name (human-readable)
  - Description (optional)
  - Backing Agent (who powers this skill)
  - Receives Handoffs From (input skills)
  - Hands Off To (output skills)
  - Invocation Count (number)
  - Recent Invocations (list of events)

## Data Available (from models.py)

### AgentInfo
| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| name | string | Full name (e.g., "Quinn Martinez") |
| role | string | Short role description |
| domain | string | Domain name |
| description | string | Longer description |
| tools | string[] | Available tools |
| key_phrases | string[] | Characteristic phrases (max 5) |
| file_path | string | Source file location |
| last_active | datetime | Last activity timestamp |

### SkillInfo
| Field | Type | Description |
|-------|------|-------------|
| id | string | Skill identifier |
| name | string | Human-readable name |
| domain | string | Domain name |
| description | string | What the skill does |
| backing_agent | string | Agent that powers this skill |
| handoff_inputs | string[] | Skills that hand off to this one |
| handoff_outputs | string[] | Skills this hands off to |
| file_path | string | Source file location |
| invocation_count | int | Times invoked |
| last_invoked | datetime | Last invocation timestamp |

## Current CSS (Modal Styles)

```css
.modal-content {
    max-width: 600px;
    max-height: 80vh;
}

.modal-body {
    padding: var(--spacing-lg);
}

.modal-section {
    margin-bottom: spacing (implicit)
}
```

## Design Constraints

1. **IDE-style aesthetic**: Dashboard uses dark theme, compact spacing
2. **Domain colors**: Each domain has a distinct color scheme
3. **Responsive**: Must work in various viewport sizes
4. **Quick scanning**: Users want to quickly understand agent/skill capabilities
5. **Activity context**: Recent activity is valuable for understanding usage

## Pain Points to Address

1. Both modals use same generic structure - no visual distinction
2. Activity list is just a simple list with timestamps
3. Handoff relationships shown as tags, not visualized
4. No visual hierarchy for most important information
5. Modal feels like a form, not an information display

## Design Opportunities

1. **Agent Modal**: Emphasize personality/persona, make tools prominent
2. **Skill Modal**: Show handoff flow visually, emphasize usage stats
3. **Both**: Better domain branding, clearer visual hierarchy
4. **Activity**: More informative timeline or graph
