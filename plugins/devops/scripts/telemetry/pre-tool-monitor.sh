#!/bin/bash
# PreToolUse Telemetry Hook
# Captures telemetry before tool execution (Write, Edit, Bash)
#
# Exit codes:
#   0 = Allow operation (continue)
#   2 = Block operation (fail fast)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)

# Extract tool info
TOOL=$(echo "$INPUT" | jq -r '.tool // "unknown"')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

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

# Extract tool-specific parameters
FILE_PATH=""
COMMAND=""
if [[ "$TOOL" == "Write" ]] || [[ "$TOOL" == "Edit" ]]; then
    FILE_PATH=$(echo "$INPUT" | jq -r '.params.file_path // empty')
elif [[ "$TOOL" == "Bash" ]]; then
    COMMAND=$(echo "$INPUT" | jq -r '.params.command // empty')
fi

# Emit telemetry event
EVENT=$(jq -n \
    --arg type "tool.pre_execute" \
    --arg correlation "$CORRELATION_ID" \
    --arg tool "$TOOL" \
    --arg file "$FILE_PATH" \
    --arg cmd "$COMMAND" \
    '{
        event_type: $type,
        correlation_id: $correlation,
        tool: $tool,
        metadata: {
            file_path: $file,
            command: $cmd
        },
        stage: "pre_execution"
    }')

echo "$EVENT" | "${CLAUDE_PLUGIN_ROOT}/scripts/telemetry/emit-event.sh"

# Allow operation to proceed
exit 0
