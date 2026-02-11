#!/bin/bash
# PostToolUse Telemetry Hook
# Captures telemetry after tool execution (Write, Edit, Bash)
#
# Exit codes:
#   0 = Success

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)

# Extract tool info
TOOL=$(echo "$INPUT" | jq -r '.tool // "unknown"')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
EXIT_CODE=$(echo "$INPUT" | jq -r '.exit_code // 0')
DURATION_MS=$(echo "$INPUT" | jq -r '.duration_ms // 0')

# Find correlation ID (changeset or session)
CORRELATION_ID="$SESSION_ID"
CHANGESET_DIR="${CWD}/.claude/changesets"

if [[ -d "$CHANGESET_DIR" ]]; then
    for changeset in "$CHANGESET_DIR"/*; do
        if [[ -d "$changeset" ]] && [[ -f "$changeset/changeset.json" ]]; then
            STATUS=$(jq -r '.status // "unknown"' "$changeset/changeset.json" 2>/dev/null || echo "unknown")
            if [[ "$STATUS" == "active" ]]; then
                CORRELATION_ID=$(basename "$changeset")
                break
            fi
        fi
    done
fi

# Determine outcome
OUTCOME="success"
if [[ "$EXIT_CODE" != "0" ]]; then
    OUTCOME="failure"
fi

# Extract tool-specific parameters
FILE_PATH=""
COMMAND=""
OUTPUT=""
BYTES_WRITTEN=0

if [[ "$TOOL" == "Write" ]] || [[ "$TOOL" == "Edit" ]]; then
    FILE_PATH=$(echo "$INPUT" | jq -r '.params.file_path // empty')

    # Try to get file size if it exists
    if [[ -f "$FILE_PATH" ]]; then
        BYTES_WRITTEN=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH" 2>/dev/null || echo 0)
    fi
elif [[ "$TOOL" == "Bash" ]]; then
    COMMAND=$(echo "$INPUT" | jq -r '.params.command // empty')
    OUTPUT=$(echo "$INPUT" | jq -r '.output // empty' | head -c 500)  # Truncate output
fi

# Emit telemetry event
EVENT=$(jq -n \
    --arg type "tool.executed" \
    --arg correlation "$CORRELATION_ID" \
    --arg tool "$TOOL" \
    --arg outcome "$OUTCOME" \
    --arg file "$FILE_PATH" \
    --arg cmd "$COMMAND" \
    --arg output "$OUTPUT" \
    --arg duration "$DURATION_MS" \
    --arg bytes "$BYTES_WRITTEN" \
    --arg exit "$EXIT_CODE" \
    '{
        event_type: $type,
        correlation_id: $correlation,
        tool: $tool,
        outcome: $outcome,
        metadata: {
            file_path: $file,
            command: $cmd,
            output: $output,
            duration_ms: ($duration | tonumber),
            bytes_written: ($bytes | tonumber),
            exit_code: ($exit | tonumber)
        },
        stage: "post_execution"
    }')

echo "$EVENT" | "${CLAUDE_PLUGIN_ROOT}/scripts/telemetry/emit-event.sh"

# Check for performance anomalies
if [[ "$DURATION_MS" -gt 5000 ]]; then
    # Tool took > 5 seconds, log warning
    WARNING=$(jq -n \
        --arg type "performance.slow_tool" \
        --arg correlation "$CORRELATION_ID" \
        --arg tool "$TOOL" \
        --arg duration "$DURATION_MS" \
        '{
            event_type: $type,
            correlation_id: $correlation,
            tool: $tool,
            metadata: {
                duration_ms: ($duration | tonumber),
                threshold_ms: 5000
            },
            severity: "warning"
        }')

    echo "$WARNING" | "${CLAUDE_PLUGIN_ROOT}/scripts/telemetry/emit-event.sh"
fi

exit 0
