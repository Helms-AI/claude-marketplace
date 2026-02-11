---
name: pm-recipe
description: Execute pre-built workflow recipes for common development patterns
argument-hint: "[recipe-name] [--options]"
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
  - Task
---

# Dynamic Context

```
!ls docs/recipes/*.md 2>/dev/null | wc -l
```

# PM Recipe - Workflow Templates

You are the Recipe Executor. Run pre-built workflow templates that coordinate multiple domain specialists.

## Commands

### List Recipes
```
/pm-recipe list
```
Show all available recipes with descriptions and time estimates.

### Show Recipe Details
```
/pm-recipe show <recipe-name>
```
Display the full recipe documentation.

### Execute Recipe
```
/pm-recipe <recipe-name> [--options]
```
Run the recipe with the specified options.

## Available Recipes

| Recipe | Command | Time |
|--------|---------|------|
| Full-Stack Feature | `/pm-recipe full-stack-feature --name="..."` | 15min |
| API Endpoint | `/pm-recipe api-endpoint --name="..."` | 8min |
| React Component | `/pm-recipe react-component --name="..."` | 5min |
| Auth System | `/pm-recipe auth-system` | 20min |
| Database Migration | `/pm-recipe database-migration --name="..."` | 10min |
| CI/CD Pipeline | `/pm-recipe cicd-pipeline` | 10min |
| Data Pipeline | `/pm-recipe data-pipeline --name="..."` | 12min |
| Security Audit | `/pm-recipe security-audit` | 15min |
| Design Token | `/pm-recipe design-token` | 8min |
| API Documentation | `/pm-recipe api-documentation` | 5min |

## Recipe Execution

When executing a recipe:

1. **Parse Arguments**: Extract recipe name and options
2. **Load Recipe**: Read from `docs/recipes/<recipe>.md`
3. **Create Changeset**: Initialize workflow tracking
4. **Execute Phases**: Run each domain step in order
5. **Track Progress**: Update changeset with artifacts
6. **Report Completion**: Summarize what was created

## Example Execution

**User**: `/pm-recipe full-stack-feature --name="User Profile"`

**Response**:
```markdown
## 🍳 Executing Recipe: Full-Stack Feature

**Feature**: User Profile
**Estimated Time**: ~15 minutes
**Domains**: architecture → backend → user-experience → frontend → testing → documentation

---

### Phase 1/6: Architecture (2min)
Invoking `/arch-orchestrator`...
- ✅ Created ADR: docs/architecture/user-profile-adr.md
- ✅ Defined API contract: openapi/user-profile.yaml

### Phase 2/6: Backend (4min)
Invoking `/backend-orchestrator`...
- ✅ Created model: src/models/UserProfile.ts
- ✅ Created service: src/services/userProfile.ts
- ✅ Created routes: src/routes/userProfile.ts

[... continues for all phases ...]

---

## ✅ Recipe Complete!

**Artifacts Created**: 12 files
**Time Taken**: 14m 32s

Next steps:
- Run tests: `npm test`
- Start dev server: `npm run dev`
- View docs: `docs/api/user-profile.md`
```

## Error Handling

If a phase fails:
- Log the error
- Ask user if they want to retry or skip
- Continue with remaining phases if possible
- Report partial completion
