# Feature Suggestions for Claude Marketplace

**Changeset**: `20260130-220632-analyze-app-suggest-features`
**Audience**: Internal team use
**Focus Areas**: Cross-domain workflows, Observability, Plugin ecosystem

---

## Current State Analysis

### What Exists
| Component | Status | Notes |
|-----------|--------|-------|
| **Dashboard** | v2.8.3 | IDE-style UI, SSE real-time, D3 graph, tool renderers |
| **Plugins** | 11 | pm, user-experience, frontend, architecture, backend, testing, devops, data, security, documentation, dashboard |
| **Agents** | 69 | Across 12 domains |
| **Skills** | 101 | User-invocable commands |
| **Changesets** | Active | File-based workflow tracking |

### Architecture Observations
- **Changeset system** is solid but underutilized for analytics
- **Timeline visualization** exists but is basic (no zoom, no filtering)
- **Domain graph** is static (doesn't show live activity)
- **Tool renderers** are well-designed but missing some tool types
- **No persistent storage** - everything is file-based

---

## Feature Suggestions

### Quick Wins (1-3 hours each)

#### 1. Live Domain Activity Pulse
**File**: `plugins/dashboard/web/js/graph.js`
**Impact**: High | **Effort**: Low

Add real-time activity indicators to the domain graph:
- Pulse animation on domains receiving traffic
- Edge highlighting during active handoffs
- Activity counter badges on nodes

```javascript
// Add to Graph module
pulseNode(domainId) {
    d3.select(`#node-${domainId}`).transition()
        .attr('r', 30).transition().attr('r', 20);
}
```

---

#### 2. Agent Conversation History
**File**: `plugins/dashboard/server/routes/agents.py`
**Impact**: High | **Effort**: Low

Track which agents participated in each changeset:
- Show recent changesets on agent detail view
- Link from agent to conversations they participated in
- Add "Last active" timestamp

---

#### 3. Skill Dependency Graph
**File**: `plugins/dashboard/web/js/skills.js`
**Impact**: Medium | **Effort**: Low

Visualize which skills invoke other skills:
- Parse SKILL.md files for `Task` tool calls
- Show "calls" and "called by" relationships
- Mini-graph in skill detail view

---

#### 4. Handoff Context Preview
**File**: `plugins/dashboard/web/js/conversation.js`
**Impact**: High | **Effort**: Low

Show handoff context inline:
- Expand handoff cards to show `context` JSON
- Highlight `accumulated_decisions` and `artifacts_created`
- Quick copy of context for debugging

---

#### 5. Console Log Streaming
**File**: `plugins/dashboard/web/js/dashboard.js`
**Impact**: Medium | **Effort**: Low

Stream server console output to dashboard:
- Real-time Flask logs in Console panel
- Filter by log level (debug/info/warning/error)
- Already have the Console tab, just needs data

---

### Medium Features (4-8 hours each)

#### 6. Workflow Replay
**Impact**: Very High | **Effort**: Medium

Replay completed changesets step-by-step:
- Slider/scrubber to move through timeline
- Show state at each point (decisions, artifacts, handoffs)
- Useful for debugging and learning from workflows

---

#### 7. Plugin Health Dashboard
**Impact**: High | **Effort**: Medium

Monitor plugin status and performance:
- Parse success/failure of skill invocations
- Show error rates per domain
- Highlight plugins that need attention
- Add to status bar or new panel

---

#### 8. Smart Capability Search
**Impact**: High | **Effort**: Medium

Semantic search across capabilities:
- Natural language: "I need to test my API"
- Match to relevant skills based on capabilities.json
- Show confidence scores and alternatives
- Integrate into command palette (⌘K)

---

#### 9. Handoff Timeline Enhancements
**File**: `plugins/dashboard/web/js/timeline.js`
**Impact**: High | **Effort**: Medium

Current timeline is basic. Add:
- Zoom and pan (like the graph)
- Click to jump to handoff in conversation
- Filter by domain
- Duration bars showing time in each domain
- Critical path highlighting

---

#### 10. Decision Conflict Detector
**Impact**: High | **Effort**: Medium

Automatically detect conflicting decisions:
- Parse `decisions` from changeset.json
- Flag when domains disagree
- Surface in Errors panel
- Link to `/pm-resolve` for resolution

---

### Major Features (1-2 days each)

#### 11. Plugin Marketplace UI
**Impact**: Very High | **Effort**: High

Full marketplace browsing experience:
- Browse available plugins by category
- Show ratings, download counts (simulated)
- One-click install to user scope
- Dependency resolution
- Version comparison

---

#### 12. Changeset Analytics
**Impact**: Very High | **Effort**: High

Analytics across all changesets:
- Average workflow duration
- Most used domains/skills/agents
- Common handoff patterns
- Bottleneck identification
- Export reports as markdown

---

#### 13. Multi-Session View
**Impact**: High | **Effort**: High

See multiple Claude Code sessions:
- Unified view of all active changesets
- Cross-project visibility
- Session switching without browser tabs
- Useful for enterprise teams

---

#### 14. Interactive Workflow Builder
**Impact**: Very High | **Effort**: Very High

Visual builder for cross-domain workflows:
- Drag-and-drop domain nodes
- Define handoff connections
- Generate PM orchestration prompts
- Save as reusable templates

---

#### 15. AI-Powered Workflow Suggestions
**Impact**: High | **Effort**: Very High

Suggest optimal workflows based on request:
- Analyze user request
- Recommend domain sequence
- Estimate complexity/time
- Learn from successful changesets

---

## Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Live Domain Activity Pulse | High | Low | **P0** |
| Handoff Context Preview | High | Low | **P0** |
| Agent Conversation History | High | Low | **P0** |
| Workflow Replay | Very High | Medium | **P1** |
| Smart Capability Search | High | Medium | **P1** |
| Handoff Timeline Enhancements | High | Medium | **P1** |
| Changeset Analytics | Very High | High | **P2** |
| Plugin Marketplace UI | Very High | High | **P2** |
| Interactive Workflow Builder | Very High | Very High | **P3** |

---

## Recommended Starting Point

Based on your focus on **cross-domain workflows** and **observability**, I recommend starting with:

1. **Live Domain Activity Pulse** (Quick Win) - Immediate visual feedback
2. **Handoff Context Preview** (Quick Win) - Debug cross-domain issues
3. **Workflow Replay** (Medium) - Learn from completed workflows

These three features together would significantly improve your ability to understand and debug cross-domain orchestration.

---

## Questions for You

1. Which features resonate most with your current pain points?
2. Are there any features you'd like me to prototype first?
3. Should I create a detailed implementation plan for any of these?
