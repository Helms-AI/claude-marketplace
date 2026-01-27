# Slack Notification Hook

Send Slack notifications when Claude performs specific actions.

## Installation

1. **Set up Slack Webhook**:
   - Go to your Slack workspace settings
   - Create an incoming webhook URL
   - Set the environment variable:
     ```bash
     export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
     ```

2. **Install the script**:
   ```bash
   cp notify-slack.sh /usr/local/bin/
   chmod +x /usr/local/bin/notify-slack.sh
   ```

3. **Add to Claude settings** (`~/.claude/settings.json`):
   ```json
   {
     "hooks": {
       "PostToolUse": [
         {
           "matcher": {
             "tool": "Bash",
             "command_pattern": "git push"
           },
           "command": "notify-slack.sh 'Code pushed to repository'",
           "timeout": 10000,
           "onFailure": "ignore"
         }
       ]
     }
   }
   ```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SLACK_WEBHOOK_URL` | Yes | Slack incoming webhook URL |
| `SLACK_CHANNEL` | No | Override default channel (default: #general) |

### Hook Events

You can trigger notifications on various events:

```json
{
  "event": "PostToolUse",
  "matcher": {
    "tool": "Bash",
    "command_pattern": "npm publish"
  },
  "command": "notify-slack.sh 'Package published to npm'"
}
```

### Common Triggers
- `git push` - Code pushed
- `npm publish` - Package published
- `docker push` - Image pushed
- `terraform apply` - Infrastructure changed

## Customization

Edit `notify-slack.sh` to customize the message format or add additional context.

## Author

Platform Team - platform@helms-ai.com
