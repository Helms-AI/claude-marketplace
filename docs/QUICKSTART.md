# 🚀 5-Minute Quickstart

Get productive with the Claude Marketplace in under 5 minutes.

---

## Step 1: Discover Skills (30 seconds)

Find the right tool for any task:

```bash
/discover build a login form
```

**Output**: Skill recommendations with match scores and examples.

---

## Step 2: Create Something (2 minutes)

Build a React button component:

```bash
/frontend-component-architect Create a primary button with loading state
```

**What happens**:
1. Alex Kim (Component Architect) takes over
2. Generates TypeScript component
3. Adds proper types and props
4. Includes accessibility attributes

---

## Step 3: Multi-Domain Workflow (2 minutes)

Build a feature that spans multiple teams:

```bash
/pm Build a contact form with validation and email sending
```

**What happens**:
1. PM Broker analyzes the request
2. Routes to: UX → Frontend → Backend → Testing
3. Creates changeset to track progress
4. Coordinates handoffs between teams

Check progress:
```bash
/pm-status
```

---

## Step 4: Explore More (30 seconds)

### View the Dashboard
```bash
/dashboard
```
Opens http://localhost:24282 with:
- All 58 agents across 10 domains
- 77 skills with search/filter
- Live changeset viewer
- Domain relationship graph

### Try More Commands
```bash
# Security audit
/security-orchestrator Audit authentication code

# Create tests
/testing-e2e-engineer Write Playwright tests for login flow

# Deploy
/devops-deployment-engineer Deploy to staging
```

---

## 📚 What's Next?

| Want To... | Command |
|------------|---------|
| Browse all skills | `/discover` |
| Start orchestrated workflow | `/pm [task]` |
| See workflow recipes | `/pm-recipe list` |
| Read full docs | [CLAUDE.md](./CLAUDE.md) |

---

## 🎯 Quick Reference

### Domain Entry Points

| Domain | Command | Lead Agent |
|--------|---------|------------|
| Frontend | `/frontend-orchestrator` | Chris Nakamura |
| Backend | `/backend-orchestrator` | David Park |
| Testing | `/testing-orchestrator` | Amanda Torres |
| Security | `/security-orchestrator` | Nathan Brooks |
| DevOps | `/devops-orchestrator` | Michael Chang |
| Data | `/data-orchestrator` | Jennifer Wu |
| Docs | `/docs-orchestrator` | Patricia Moore |
| UX | `/user-experience-orchestrator` | Dana Reyes |
| Architecture | `/architecture-orchestrator` | Sofia Reyes |

### Key Files

| File | Purpose |
|------|---------|
| `.claude/changesets/` | Active workflow state |
| `plugins/*/` | Domain plugins |
| `CLAUDE.md` | Full documentation |

---

**Total time: ~5 minutes** ✅

You're now ready to use the full power of the Claude Marketplace!
