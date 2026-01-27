# Pre-Commit Lint Hook

Automatically run linting before Claude performs git commit operations.

## Installation

Add the hook configuration to your Claude settings (`~/.claude/settings.json` or `.claude/settings.json`):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": {
          "tool": "Bash",
          "command_pattern": "git commit"
        },
        "command": "npm run lint --silent 2>/dev/null || yarn lint --silent 2>/dev/null || true",
        "timeout": 30000,
        "onFailure": "warn"
      }
    ]
  }
}
```

## How It Works

1. Triggers before any `git commit` command
2. Runs your project's lint script (npm or yarn)
3. Warns if linting fails but allows commit to proceed
4. Times out after 30 seconds

## Configuration Options

- **onFailure**:
  - `"warn"` - Show warning but continue
  - `"block"` - Prevent the commit if lint fails
  - `"ignore"` - Silently continue

- **timeout**: Milliseconds before the hook times out (default: 30000)

## Customization

Modify the `command` to use your specific linting setup:

```json
{
  "command": "pnpm lint:fix && pnpm format:check"
}
```

## Requirements

- Project must have a `lint` script in package.json
- Node.js/npm or Yarn installed

## Author

Platform Team - platform@helms-ai.com
