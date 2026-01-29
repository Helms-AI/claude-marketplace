---
name: pm-status
description: View current workflow status, handoff chain, and accumulated decisions
---

# PM Status - Workflow Status Viewer

View the current status of cross-domain workflows managed by the PM broker.

## When to Use

Invoke `/pm-status` to:
- See current workflow progress
- Review handoff chain status
- Check accumulated decisions
- View artifacts created
- Identify blockers or pending items

## Status Report Format

```markdown
## Workflow Status Report

**Session**: `<session-id>`
**Started**: <timestamp>
**Status**: <active|paused|completed|blocked>
**Current Phase**: <phase name>

---

### Progress Overview

```
Phase 1: Design      [====================] Complete
Phase 2: Foundation  [============        ] In Progress
Phase 3: Implementation [                  ] Pending
Phase 4: Quality     [                    ] Pending
Phase 5: Deployment  [                    ] Pending
Phase 6: Documentation [                  ] Pending
```

---

### Handoff Chain

| # | Domain | Skill | Status | Duration |
|---|--------|-------|--------|----------|
| 1 | Architecture | /arch-system-designer | Complete | 2m |
| 2 | User Experience | /user-experience-aesthetic-director | Complete | 3m |
| 3 | Backend | /backend-database-modeler | In Progress | - |
| 4 | Frontend | /frontend-component-architect | Pending | - |
| ... | ... | ... | ... | ... |

---

### Decisions Made

| # | Decision | Domain | Rationale |
|---|----------|--------|-----------|
| 1 | PostgreSQL for database | Backend | ACID compliance needed |
| 2 | React 19 for frontend | Frontend | Team expertise |
| ... | ... | ... | ... |

---

### Artifacts Created

| Artifact | Domain | Location | Status |
|----------|--------|----------|--------|
| System diagram | Architecture | docs/architecture.md | Complete |
| Aesthetic brief | UX | docs/aesthetic-brief.md | Complete |
| Database schema | Backend | prisma/schema.prisma | In Progress |
| ... | ... | ... | ... |

---

### Pending Conflicts

| Conflict | Domains | Status |
|----------|---------|--------|
| None currently | - | - |

Use `/pm-resolve` to view and resolve conflicts.

---

### Next Actions

1. [Next handoff or action pending]
2. [User decisions needed]
3. [Blockers to address]
```

## Reading Session State

Read session state from `.claude/handoffs/<session-id>/session.json`
Read individual handoffs from `.claude/handoffs/<session-id>/handoff_*.json`

## No Active Session

If no active session exists:

```markdown
## No Active Workflow

There is no active cross-domain workflow session.

**To start a new workflow**:
- Use `/pm` with a multi-domain request
- Example: `/pm build a user dashboard with analytics`

**Recent completed sessions**:
- [List if any exist in .claude/handoffs/]
```

## Compact Mode

For quick status checks, provide a compact view:

```
Workflow: <session-id> | Phase: Foundation (2/6) | Status: Active
Handoffs: 3 complete, 1 in progress, 5 pending
Decisions: 4 made | Conflicts: 0 pending
```
