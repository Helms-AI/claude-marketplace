# Code Review Style

## Purpose
Use this style when reviewing pull requests, providing code feedback, or auditing implementations.

## Format Guidelines

### Structure
1. **Summary** (1-2 sentences on overall quality)
2. **Critical Issues** 🔴 (must fix)
3. **Suggestions** 🟡 (should consider)
4. **Nitpicks** 🟢 (optional/style)
5. **Praise** ⭐ (good patterns found)

### Severity Icons
- 🔴 **Critical**: Bugs, security issues, breaking changes
- 🟡 **Suggestion**: Performance, maintainability, best practices
- 🟢 **Nitpick**: Style, naming, minor improvements
- ⭐ **Praise**: Well-done patterns worth highlighting

### Comment Format
```markdown
🔴 **Security: SQL Injection Risk**
`src/api/users.ts:45`

The query uses string interpolation which is vulnerable to SQL injection.

**Current:**
```typescript
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

**Suggested:**
```typescript
const query = 'SELECT * FROM users WHERE id = $1';
const result = await db.query(query, [userId]);
```
```

### Checklist
Include relevant items:
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log/debug statements
- [ ] Error handling present
- [ ] Types properly defined
- [ ] No hardcoded secrets

### Tone
- Constructive, not critical
- Explain the "why" not just the "what"
- Offer alternatives, not just problems
- Acknowledge good work

### Approval Criteria
- **Approve**: No critical issues, suggestions are optional
- **Request Changes**: Has critical issues that must be fixed
- **Comment**: Need clarification or discussion
