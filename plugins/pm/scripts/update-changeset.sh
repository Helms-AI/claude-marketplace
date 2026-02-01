#!/bin/bash
# PM Plugin - Changeset Update on Subagent Completion
# Updates changeset state when a subagent completes its work
#
# Exit codes:
#   0 = Successfully updated (or no active changeset)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)

# Extract session info
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

# Find active changeset
CHANGESET_DIR="${CWD}/.claude/changesets"
if [[ ! -d "$CHANGESET_DIR" ]]; then
    exit 0
fi

# Find most recent active changeset
ACTIVE_CHANGESET=""
for changeset in "$CHANGESET_DIR"/*; do
    if [[ -d "$changeset" ]] && [[ -f "$changeset/changeset.json" ]]; then
        STATUS=$(jq -r '.status // "unknown"' "$changeset/changeset.json" 2>/dev/null || echo "unknown")
        if [[ "$STATUS" == "active" ]]; then
            ACTIVE_CHANGESET="$changeset"
            break
        fi
    fi
done

if [[ -z "$ACTIVE_CHANGESET" ]]; then
    exit 0
fi

CHANGESET_JSON="$ACTIVE_CHANGESET/changeset.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Find the latest pending handoff and mark as complete
LATEST_HANDOFF=$(ls -t "$ACTIVE_CHANGESET"/handoff_*.json 2>/dev/null | head -1 || echo "")

if [[ -n "$LATEST_HANDOFF" ]]; then
    HANDOFF_STATUS=$(jq -r '.status // "unknown"' "$LATEST_HANDOFF")
    
    if [[ "$HANDOFF_STATUS" == "pending" ]] || [[ "$HANDOFF_STATUS" == "in_progress" ]]; then
        # Update handoff status to complete
        jq --arg ts "$TIMESTAMP" '.status = "complete" | .timestamps.completed_at = $ts' "$LATEST_HANDOFF" > "${LATEST_HANDOFF}.tmp"
        mv "${LATEST_HANDOFF}.tmp" "$LATEST_HANDOFF"
        
        # Increment completed handoff count in changeset
        HANDOFF_COUNT=$(jq -r '.handoff_count // 0' "$CHANGESET_JSON")
        COMPLETED_COUNT=$(jq -r '.completed_handoffs // 0' "$CHANGESET_JSON")
        NEW_COMPLETED=$((COMPLETED_COUNT + 1))
        
        jq --arg completed "$NEW_COMPLETED" --arg ts "$TIMESTAMP" \
            '.completed_handoffs = ($completed | tonumber) | .last_updated = $ts' \
            "$CHANGESET_JSON" > "${CHANGESET_JSON}.tmp"
        mv "${CHANGESET_JSON}.tmp" "$CHANGESET_JSON"
        
        # Get handoff info for output
        TARGET=$(jq -r '.target.plugin // "unknown"' "$LATEST_HANDOFF")
        SKILL=$(jq -r '.target.skill // "unknown"' "$LATEST_HANDOFF")
        
        echo "{\"systemMessage\": \"✅ Handoff complete: ${TARGET} (${SKILL}) | Progress: ${NEW_COMPLETED}/${HANDOFF_COUNT}\"}"
    fi
fi

exit 0
