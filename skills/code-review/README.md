# Code Review Skill

A comprehensive code review skill that evaluates code against best practices, security standards, and performance considerations.

## Installation

Copy the skill to your Claude skills directory:

```bash
# User-level installation
mkdir -p ~/.claude/skills
cp skill.md ~/.claude/skills/code-review.md

# Project-level installation
mkdir -p .claude/skills
cp skill.md .claude/skills/code-review.md
```

## Usage

Invoke the skill in Claude Code:

```
/code-review
```

Or specify files:
```
/code-review src/auth/*.ts
```

## What It Reviews

- **Code Quality**: Naming, structure, DRY principles, readability
- **Security**: Credentials, injection vulnerabilities, auth checks
- **Performance**: Query efficiency, data structures, resource management
- **Error Handling**: Exception handling, logging, user messages
- **Testing**: Test coverage and edge cases

## Output

The skill provides structured feedback with:
- Critical issues (blocking)
- Suggestions (recommended)
- Positive notes (good practices observed)

## Customization

Fork and modify `skill.md` to add your team's specific:
- Coding standards
- Security requirements
- Framework-specific checks

## Author

Platform Team - platform@helms-ai.com
