---
name: pm-resolve
description: List and resolve pending conflicts between domains
---

# PM Resolve - Conflict Resolution

Surface and resolve conflicts between domains in cross-domain workflows.

## When to Use

Invoke `/pm-resolve` to:
- View pending conflicts between domains
- Get detailed analysis of trade-offs
- Record user decisions on conflicts
- Propagate decisions to affected domains

## Conflict Types

### 1. Technical Conflicts
- **Performance vs. Features**: Rich animations vs. Core Web Vitals
- **Security vs. Usability**: Strict auth vs. frictionless UX
- **Consistency vs. Flexibility**: Strict types vs. dynamic data

### 2. Resource Conflicts
- **Scope vs. Timeline**: Full feature set vs. MVP
- **Quality vs. Speed**: Comprehensive tests vs. fast delivery

### 3. Design Conflicts
- **Aesthetics vs. Accessibility**: Visual effects vs. a11y compliance
- **Convention vs. Innovation**: Standard patterns vs. custom solutions

## Conflict Report Format

```markdown
## Pending Conflicts

### Conflict #1: Animation Performance

**Domains**: Frontend (Motion) vs. Frontend (Performance)
**Status**: Pending Resolution

**Context**:
The motion designer proposed scroll-triggered parallax animations for the dashboard hero section. The performance engineer flagged this as a potential CLS issue.

**Option A**: Full Parallax Animation
- **Proposed by**: Jordan Park (Motion)
- **Pros**: Engaging, distinctive, modern feel
- **Cons**: Potential CLS issues, 50ms+ blocking time
- **Impact**: May fail Core Web Vitals

**Option B**: Reduced Motion with CSS Transitions
- **Proposed by**: Taylor Brooks (Performance)
- **Pros**: Meets Core Web Vitals, respects prefers-reduced-motion
- **Cons**: Less visually distinctive
- **Impact**: Safe performance, accessible

**Option C**: Lazy-Loaded Animation (Compromise)
- **Pros**: Animation loads after LCP, best of both
- **Cons**: Animation delayed on first view
- **Impact**: Balanced approach

**Recommendation**: Option C offers the best trade-off, but this depends on how critical the first-impression animation is to the brand.

---

Which option do you prefer?
```

## Resolution Workflow

1. **Present Conflict**: Show context, options, trade-offs
2. **Gather Input**: Use AskUserQuestion if needed

```
Question: "How should we resolve this conflict?"
Header: "Resolution"
Options:
- "Option A" - [Brief description]
- "Option B" - [Brief description]
- "Option C" - [Brief description]
- "Need more info" - Get additional analysis
```

3. **Record Decision**: Store in session state

```json
{
  "conflict_id": "conflict-001",
  "resolved_at": "<ISO timestamp>",
  "decision": "option_c",
  "rationale": "User prioritized balance between aesthetics and performance",
  "affected_domains": ["frontend.motion", "frontend.performance"],
  "constraints_added": ["Animation must not affect LCP"]
}
```

4. **Propagate**: Update handoff context with decision

## No Conflicts

If no conflicts are pending:

```markdown
## No Pending Conflicts

All domain teams are aligned. No conflicts require resolution.

**Recent Resolutions**:
| # | Conflict | Resolution | Date |
|---|----------|------------|------|
| 1 | Animation vs. Performance | Lazy-loaded animation | 2h ago |

**Potential Tensions to Watch**:
- Backend auth complexity vs. UX friction
- Data pipeline latency vs. real-time requirements
```

## Proactive Conflict Detection

When reviewing handoffs, watch for these patterns that often cause conflicts:

| Pattern | Likely Conflict |
|---------|-----------------|
| "Real-time" + "Dashboard" | Backend latency vs. UX expectations |
| "Beautiful" + "Accessible" | Aesthetics vs. WCAG compliance |
| "Secure" + "Frictionless" | Security vs. UX simplicity |
| "Comprehensive" + "MVP" | Scope vs. timeline |
| "Microservices" + "Simple" | Architecture complexity vs. team size |

## Recording Decisions

All conflict resolutions are recorded in:
`.claude/handoffs/<session-id>/session.json` under the `decisions` array

Each decision includes:
- Conflict description
- Options considered
- User's choice
- Rationale provided
- Constraints added to future handoffs
