# Agent System Audit Report

**Date**: February 1, 2026  
**Branch**: `feature/agent-system-audit`  
**Auditor**: OpenClaw Agent

---

## Executive Summary

This report audits the claude-marketplace plugin ecosystem against the latest Anthropic Claude Code best practices (as of January 2026). The marketplace has a solid foundation with 11 plugins, 58 agents, and 77 skills, but significant opportunities exist to leverage new Claude Code features for improved agent collaboration, handoff coordination, and skill execution.

---

## Part 1: Current State Assessment

### Plugin Ecosystem Overview

| Plugin | Agents | Skills | Version |
|--------|--------|--------|---------|
| PM (Broker) | 1 | 3 | 1.0.0 |
| User Experience | 8 | 9 | 4.0.0 |
| Frontend | 14 | 15 | 1.0.0 |
| Architecture | 5 | 7 | 1.0.0 |
| Backend | 5 | 7 | 1.0.0 |
| Testing | 5 | 7 | 1.0.0 |
| DevOps | 5 | 7 | 1.0.0 |
| Data | 5 | 7 | 1.0.0 |
| Security | 5 | 7 | 1.0.0 |
| Documentation | 5 | 7 | 1.0.0 |
| Dashboard | 0 | 1 | 2.25.0 |
| **Total** | **58** | **77** | - |

### Current Architecture Strengths

1. **Changeset Protocol**: File-based handoff system in `.claude/changesets/` with structured JSON tracking decisions, artifacts, and handoff chains.

2. **Capability Registry**: Each plugin has `capabilities.json` defining verbs, artifacts, keywords, and intent patterns for routing.

3. **Persona System**: Rich agent personas with names, backgrounds, communication styles, and interaction patterns.

4. **Orchestrator Pattern**: Each domain has an orchestrator skill that routes to specialized sub-skills.

5. **Taxonomy**: Centralized domain taxonomy in `.claude-plugin/taxonomy.json`.

### Current Format Analysis

#### Agent Files (Current)
```markdown
# Agent Name

You are **Agent Name**, the [Role]...

## Persona
- Name, role, expertise

## Personality Traits
- Trait descriptions

## Key Responsibilities
- What the agent does
```

**Missing**: YAML frontmatter with `tools`, `model`, `permissionMode`, `skills`, `hooks` fields.

#### SKILL.md Files (Current)
```markdown
---
name: skill-name
description: Brief description
---
# Instructions here
```

**Missing**: `context`, `agent`, `allowed-tools`, `disable-model-invocation`, `user-invocable`, `argument-hint`, `hooks` fields.

---

## Part 2: Gaps vs Latest Anthropic Best Practices

### 🔴 Critical Gaps

#### 1. Subagent Format Not Used

**Current State**: Agents are plain markdown with personas but no execution configuration.

**Latest Format** (from Claude Code docs):
```yaml
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
permissionMode: default
skills:
  - api-conventions
  - error-handling-patterns
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh"
---

You are a code reviewer. Analyze code and provide feedback...
```

**Impact**: Cannot leverage:
- Tool restrictions per agent
- Model selection (haiku for exploration, opus for complex tasks)
- Permission mode control
- Skill preloading for context
- Lifecycle hooks for validation

#### 2. Missing Skill Execution Features

**Not Using**:
- `context: fork` - Run skills in isolated subagent context
- `agent: Explore|Plan|custom` - Specify agent type for execution
- `allowed-tools` - Restrict tools during skill execution
- `disable-model-invocation: true` - Manual-only skills (e.g., `/deploy`)
- `user-invocable: false` - Background skills Claude uses but users don't invoke
- `argument-hint` - Autocomplete hints like `[issue-number]`

**Example Missing Pattern**:
```yaml
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob
---
Research $ARGUMENTS thoroughly...
```

#### 3. No Hooks System

**Current State**: No `hooks/hooks.json` files in any plugin.

**Latest Capabilities** (not leveraged):
- `PreToolUse` - Validate before tool execution
- `PostToolUse` - Auto-run linters, formatters, tests after edits
- `SubagentStart` / `SubagentStop` - Coordinate handoffs
- `SessionStart` - Load project context
- Prompt/Agent hooks - LLM-based validation

**High-Value Use Cases**:
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/scripts/quality-gate.sh"
      }]
    }],
    "SubagentStop": [{
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/scripts/handoff-complete.sh"
      }]
    }]
  }
}
```

### 🟡 Moderate Gaps

#### 4. Dynamic Context Injection Not Used

**Not Using**: `!command` syntax for injecting live data into skills.

**Example**:
```markdown
---
name: pr-review
description: Review the current pull request
---

## PR Context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`

## Your Task
Review this PR for quality issues...
```

#### 5. Indexed Arguments Not Used

**Current**: Using `$ARGUMENTS` only.

**Available**:
- `$ARGUMENTS[0]`, `$ARGUMENTS[1]`, etc.
- Shorthand: `$0`, `$1`, etc.

**Example**:
```markdown
Migrate the $0 component from $1 to $2.
```

#### 6. No MCP Server Integrations

**Current State**: No `.mcp.json` files in plugins.

**Opportunities**:
- GitHub MCP server for issue/PR context
- Database MCP server for data plugins
- Custom MCP servers for domain-specific tools

#### 7. No LSP Integrations

**Current State**: No `.lsp.json` files.

**Available**: Real-time code intelligence (diagnostics, go-to-definition, references).

### 🟢 Minor Gaps

#### 8. Missing Metadata Fields

**Plugin.json Missing**:
- `homepage` - Documentation URL
- `repository` - Source code URL
- `license` - License identifier
- `keywords` - Discovery tags

#### 9. No Output Styles

**Available**: Customizable output formatting via `outputStyles` configuration.

#### 10. No Status Line Configuration

**Available**: Custom status line showing project context.

---

## Part 3: Agent Collaboration Improvements

### Current Collaboration Flow

```
PM Broker → Domain Orchestrator → Specialized Skills
                ↓
         Changeset Files (JSON)
                ↓
         Next Domain
```

### Recommended Improvements

#### A. Native Subagent Delegation

**Instead of**: Custom changeset JSON files for handoffs.

**Use**: Native `context: fork` with proper subagent configuration.

```yaml
# plugins/frontend/skills/frontend-orchestrator/SKILL.md
---
name: frontend-orchestrator
description: Coordinates frontend implementation
context: fork
agent: general-purpose
skills:
  - api-conventions
  - design-system-patterns
hooks:
  SubagentStop:
    - hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/notify-completion.sh"
---
```

#### B. Preloaded Skills for Context

**Current**: Each agent starts fresh, reads context from files.

**Better**: Use `skills` field to preload domain knowledge:

```yaml
---
name: frontend-lead
description: Frontend Lead - coordinates implementation
skills:
  - design-system-patterns
  - accessibility-standards
  - performance-budgets
---
```

#### C. Hook-Based Handoff Validation

**Add hooks to validate handoffs automatically**:

```json
{
  "hooks": {
    "SubagentStart": [{
      "matcher": "frontend-*",
      "hooks": [{
        "type": "prompt",
        "prompt": "Validate that the handoff context includes: design tokens, accessibility requirements, and performance constraints. If missing, flag the issue. Context: $ARGUMENTS"
      }]
    }]
  }
}
```

#### D. Background Agent Execution

**Current**: All agents run in foreground, blocking.

**Better**: Use background execution for parallel research:

```
"Research the auth, database, and API modules in parallel using separate subagents"
```

Benefits:
- Multiple domains explored simultaneously
- Results synthesized when all complete
- Better resource utilization

#### E. Model-Appropriate Delegation

**Current**: All agents use the same model.

**Better**: Route by complexity:

| Task Type | Recommended Model |
|-----------|-------------------|
| Exploration/Research | `haiku` (fast, cheap) |
| Code review | `sonnet` (balanced) |
| Architecture decisions | `opus` (thorough) |
| Quick lookups | `haiku` |

```yaml
---
name: explore-codebase
description: Fast codebase exploration
model: haiku
tools: Read, Grep, Glob
---
```

---

## Part 4: Specific Recommendations by Plugin

### PM Plugin

| Current | Recommendation | Priority |
|---------|---------------|----------|
| Plain markdown agent | Convert to subagent format with `tools` and `permissionMode` | High |
| Manual changeset creation | Add `SessionStart` hook to auto-create changesets | High |
| No handoff validation | Add `SubagentStop` hook to validate handoffs | Medium |

### Frontend Plugin

| Current | Recommendation | Priority |
|---------|---------------|----------|
| 14 agents as markdown | Convert to subagents with tool restrictions | High |
| No quality gates | Add `PostToolUse` hooks for linting/a11y checks | High |
| No Explore agent usage | Use `context: fork` + `agent: Explore` for research | Medium |
| Manual-only skills mixed | Add `disable-model-invocation: true` to deploy skills | Medium |

### User Experience Plugin

| Current | Recommendation | Priority |
|---------|---------------|----------|
| Research skills run inline | Use `context: fork` for isolated research | Medium |
| No dynamic context | Add `!command` for live design system data | Low |

### Testing Plugin

| Current | Recommendation | Priority |
|---------|---------------|----------|
| Test execution inline | Use background subagents for test runs | High |
| No test hooks | Add `PostToolUse` hooks to auto-run tests | High |

### DevOps Plugin

| Current | Recommendation | Priority |
|---------|---------------|----------|
| Deploy skills user-invocable | Add `disable-model-invocation: true` | Critical |
| No environment validation | Add `PreToolUse` hooks for deploy safety | Critical |

### Security Plugin

| Current | Recommendation | Priority |
|---------|---------------|----------|
| Audit skills run inline | Use `context: fork` for isolated audits | Medium |
| No scan hooks | Add `PostToolUse` hooks for auto-scanning | Medium |

---

## Part 5: Implementation Priority

### Phase 1: Critical Safety (Week 1)

1. **Add `disable-model-invocation: true` to dangerous skills**:
   - `/deploy-*`
   - `/publish-*`
   - `/migrate-*`
   - Any skill with side effects

2. **Add PreToolUse hooks for DevOps**:
   - Validate deployment targets
   - Check environment variables
   - Require confirmation for production

### Phase 2: Subagent Conversion (Week 2-3)

1. **Convert agents to subagent format** with:
   - `tools` restrictions
   - `model` selection
   - `permissionMode` settings

2. **Add `skills` preloading** for domain context

3. **Implement `context: fork`** for research skills

### Phase 3: Collaboration Hooks (Week 4)

1. **Add SubagentStart/SubagentStop hooks** for:
   - Handoff validation
   - Context propagation
   - Completion notifications

2. **Add PostToolUse hooks** for:
   - Auto-linting
   - Auto-testing
   - Quality gates

### Phase 4: Advanced Features (Week 5+)

1. **MCP server integrations**
2. **LSP server configurations**
3. **Output style customizations**
4. **Dynamic context with `!command`**

---

## Part 6: Migration Templates

### Agent to Subagent Template

**Before**:
```markdown
# Chris Nakamura

## Persona
- **Role:** Frontend Lead
...
```

**After**:
```yaml
---
name: frontend-lead
description: Frontend Lead - orchestrates implementation team, ensures quality
tools: Read, Grep, Glob, Bash, Task
model: sonnet
skills:
  - design-system-patterns
  - accessibility-standards
---

# Chris Nakamura

## Persona
- **Role:** Frontend Lead
...
```

### Skill Enhancement Template

**Before**:
```yaml
---
name: frontend-orchestrator
description: Routes frontend requests
---
```

**After**:
```yaml
---
name: frontend-orchestrator
description: Routes frontend implementation requests to specialized skills
context: fork
agent: general-purpose
allowed-tools: Read, Grep, Glob, Bash, Task
argument-hint: [component-type] [requirements]
hooks:
  PostToolUse:
    - matcher: "Task"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/validate-handoff.sh"
---
```

### Hooks Configuration Template

**File**: `plugins/frontend/hooks/hooks.json`
```json
{
  "description": "Frontend plugin quality gates and coordination",
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/lint-check.sh",
            "timeout": 30
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/update-changeset.sh"
          }
        ]
      }
    ]
  }
}
```

---

## Appendix A: New Features Inventory

### Skill Frontmatter Fields (Latest)

| Field | Type | Purpose |
|-------|------|---------|
| `name` | string | Skill identifier |
| `description` | string | When to use (for Claude's routing) |
| `argument-hint` | string | Autocomplete hint |
| `disable-model-invocation` | boolean | Manual-only skill |
| `user-invocable` | boolean | Hide from / menu |
| `allowed-tools` | string | Tool restrictions |
| `model` | string | Model override |
| `context` | `fork` | Run in subagent |
| `agent` | string | Subagent type |
| `hooks` | object | Lifecycle hooks |

### Subagent Frontmatter Fields (Latest)

| Field | Type | Purpose |
|-------|------|---------|
| `name` | string | Unique identifier |
| `description` | string | When to delegate |
| `tools` | string | Allowed tools |
| `disallowedTools` | string | Denied tools |
| `model` | string | `sonnet`, `opus`, `haiku`, `inherit` |
| `permissionMode` | string | Permission handling |
| `skills` | array | Preloaded skills |
| `hooks` | object | Lifecycle hooks |

### Hook Events Available

| Event | Matcher | Can Block? |
|-------|---------|------------|
| SessionStart | startup, resume, clear, compact | No |
| UserPromptSubmit | (none) | Yes |
| PreToolUse | tool name | Yes |
| PostToolUse | tool name | No |
| PostToolUseFailure | tool name | No |
| PermissionRequest | tool name | Yes |
| Notification | notification type | No |
| SubagentStart | agent type | No |
| SubagentStop | (none) | Yes |
| Stop | (none) | Yes |
| PreCompact | manual, auto | No |
| SessionEnd | clear, logout, etc. | No |

---

## Appendix B: Reference Links

- Claude Code Skills: https://code.claude.com/docs/en/skills
- Claude Code Subagents: https://code.claude.com/docs/en/sub-agents
- Claude Code Hooks: https://code.claude.com/docs/en/hooks
- Claude Code Plugins: https://code.claude.com/docs/en/plugins
- Plugins Reference: https://code.claude.com/docs/en/plugins-reference
- Settings Reference: https://code.claude.com/docs/en/settings

---

## Conclusion

The claude-marketplace has a strong foundation but is using an older pattern for agent collaboration. By adopting the latest Claude Code features—particularly native subagents, hook-based coordination, and execution context control—the system can achieve:

1. **Better safety** through tool restrictions and model-invocation control
2. **Faster execution** through parallel subagent research
3. **Lower costs** through model-appropriate routing
4. **Stronger collaboration** through native handoff mechanisms
5. **Automatic quality gates** through lifecycle hooks

The phased implementation plan prioritizes critical safety concerns first, then systematically modernizes the agent and skill formats.
