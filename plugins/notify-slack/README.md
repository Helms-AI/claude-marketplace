# Slack Notification Plugin

Send Slack notifications when Claude performs specific actions.

## Installation

```bash
/plugin install notify-slack@helms-ai-marketplace
```

## Configuration

Set the Slack webhook URL as an environment variable:

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

Generate a webhook at: https://api.slack.com/messaging/webhooks

## Default Triggers

- **git push** - Notifies when code is pushed to a repository

## Customization

After installation, modify your local plugin settings to add more triggers:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": {
          "tool": "Bash",
          "command": "npm publish"
        },
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/notify-slack.sh 'Package published'"
          }
        ]
      }
    ]
  }
}
```

## Author

Platform Team - platform@helms-ai.com
