# Pre-Commit Lint Plugin

Automatically run linting before Claude performs git commit operations.

## Installation

```bash
/plugin install pre-commit-lint@helms-ai-marketplace
```

## How It Works

1. Triggers before any `git commit` command
2. Runs your project's lint script (npm or yarn)
3. Warns if linting fails but allows commit to proceed
4. Times out after 30 seconds

## Requirements

- Project must have a `lint` script in package.json
- Node.js/npm or Yarn installed

## Author

Platform Team - platform@helms-ai.com
