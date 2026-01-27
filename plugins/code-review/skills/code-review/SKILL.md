---
name: code-review
description: Comprehensive code review with best practices and security checks
---

# Code Review Skill

When invoked with `/code-review`, perform a comprehensive code review of the specified files or changes.

## Review Process

1. **Read the Code**: First, read all files or changes to be reviewed
2. **Analyze**: Evaluate against the criteria below
3. **Report**: Provide structured feedback

## Review Criteria

### Code Quality
- [ ] Clear, descriptive naming conventions
- [ ] Appropriate function/method sizes
- [ ] DRY (Don't Repeat Yourself) principles followed
- [ ] Single Responsibility Principle applied
- [ ] Code is readable and self-documenting

### Security
- [ ] No hardcoded secrets or credentials
- [ ] Input validation present where needed
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] Authentication/authorization checks in place
- [ ] Sensitive data properly handled

### Performance
- [ ] No obvious N+1 query problems
- [ ] Appropriate data structures used
- [ ] No unnecessary computations in loops
- [ ] Resource cleanup (connections, file handles)

### Error Handling
- [ ] Appropriate error handling present
- [ ] Errors logged with context
- [ ] User-friendly error messages
- [ ] No swallowed exceptions

### Testing
- [ ] Unit tests present for new functionality
- [ ] Edge cases considered
- [ ] Test coverage adequate

## Output Format

Provide feedback in this structure:

```markdown
## Code Review Summary

**Files Reviewed**: [list files]
**Overall Assessment**: [Approved / Needs Changes / Requires Discussion]

### Critical Issues
[List any blocking issues that must be fixed]

### Suggestions
[List recommended improvements]

### Positive Notes
[Highlight good practices observed]
```
