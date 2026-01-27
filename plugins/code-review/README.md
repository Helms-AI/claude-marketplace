# Code Review Plugin

A comprehensive code review skill that evaluates code against best practices, security standards, and performance considerations.

## Installation

```bash
/plugin install code-review@helms-ai-marketplace
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

## Author

Platform Team - platform@helms-ai.com
