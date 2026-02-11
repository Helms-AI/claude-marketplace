#!/bin/bash
# Dashboard Passthrough Mode - Command Queue Checker
#
# This hook runs before each tool use to check for pending dashboard commands.
# If a command is found, it's injected as a system message for processing.
#
# Queue format (JSONL):
# {"id":"cmd_abc123","prompt":"Create a button","status":"pending",...}

QUEUE_FILE="${CLAUDE_WORKSPACE:-.}/.claude/dashboard/input-queue.jsonl"
STATE_FILE="${CLAUDE_WORKSPACE:-.}/.claude/dashboard/state.json"

# Update heartbeat to indicate parent session is active
update_heartbeat() {
    local now
    now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Ensure directory exists
    mkdir -p "$(dirname "$STATE_FILE")"

    # Read existing state or create empty
    local state="{}"
    if [[ -f "$STATE_FILE" ]]; then
        state=$(cat "$STATE_FILE" 2>/dev/null || echo "{}")
    fi

    # Update heartbeat (using jq if available, otherwise basic approach)
    if command -v jq &> /dev/null; then
        echo "$state" | jq --arg ts "$now" '.last_heartbeat = $ts' > "$STATE_FILE.tmp" 2>/dev/null
        mv "$STATE_FILE.tmp" "$STATE_FILE" 2>/dev/null
    else
        echo "{\"last_heartbeat\":\"$now\"}" > "$STATE_FILE"
    fi
}

# Always update heartbeat
update_heartbeat

# Check if queue file exists
if [[ ! -f "$QUEUE_FILE" ]]; then
    exit 0
fi

# Read the oldest pending command
# Using grep to find pending commands, then head to get the first one
# Note: Handle both "status":"pending" and "status": "pending" formats
PENDING=$(grep '"status"[[:space:]]*:[[:space:]]*"pending"' "$QUEUE_FILE" 2>/dev/null | head -1)

if [[ -z "$PENDING" ]]; then
    exit 0
fi

# Extract command details using basic parsing or jq
if command -v jq &> /dev/null; then
    CMD_ID=$(echo "$PENDING" | jq -r '.id // empty')
    PROMPT=$(echo "$PENDING" | jq -r '.prompt // empty')
    CONTEXT_ID=$(echo "$PENDING" | jq -r '.metadata.context_id // empty')
else
    # Basic parsing fallback
    CMD_ID=$(echo "$PENDING" | sed 's/.*"id":"\([^"]*\)".*/\1/')
    PROMPT=$(echo "$PENDING" | sed 's/.*"prompt":"\([^"]*\)".*/\1/')
    CONTEXT_ID=""
fi

if [[ -z "$CMD_ID" ]] || [[ -z "$PROMPT" ]]; then
    exit 0
fi

# Mark command as processing by updating the status in the file
# This is a simple approach - the Python service handles more robust updates
if command -v jq &> /dev/null; then
    # Create temp file with updated status
    TEMP_FILE="${QUEUE_FILE}.tmp"
    while IFS= read -r line; do
        if echo "$line" | grep -q "\"id\"[[:space:]]*:[[:space:]]*\"$CMD_ID\""; then
            echo "$line" | jq -c '.status = "processing"'
        else
            echo "$line"
        fi
    done < "$QUEUE_FILE" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$QUEUE_FILE" 2>/dev/null
fi

# Output the system message injection
# This tells Claude about the dashboard command
cat << EOF
{"systemMessage": "[Dashboard Command] The user has submitted the following request from the dashboard:\n\n$PROMPT\n\nPlease process this request. When complete, the response will be routed back to the dashboard."}
EOF

exit 0
