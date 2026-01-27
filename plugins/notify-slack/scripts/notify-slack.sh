#!/bin/bash
# Slack Notification Script
# Usage: ./notify-slack.sh "Your message here"

MESSAGE="$1"
CHANNEL="${SLACK_CHANNEL:-#general}"

if [ -z "$SLACK_WEBHOOK_URL" ]; then
    echo "Warning: SLACK_WEBHOOK_URL not set, skipping notification"
    exit 0
fi

if [ -z "$MESSAGE" ]; then
    echo "Error: No message provided"
    exit 1
fi

# Get current user and directory for context
USER=$(whoami)
DIR=$(basename "$(pwd)")
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Build payload with context
PAYLOAD=$(cat <<EOF
{
    "text": ":robot_face: *Claude Code Notification*",
    "blocks": [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": ":robot_face: *Claude Code Notification*\n$MESSAGE"
            }
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": "User: $USER | Project: $DIR | Time: $TIMESTAMP"
                }
            ]
        }
    ]
}
EOF
)

# Send to Slack
curl -s -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-type: application/json' \
    --data "$PAYLOAD" > /dev/null

echo "Notification sent to Slack"
