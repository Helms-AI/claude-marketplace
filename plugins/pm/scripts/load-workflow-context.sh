#!/bin/bash
# PM Plugin - Load Workflow Context on Session Start
# Provides context about active workflows when starting/resuming a session
#
# Exit codes:
#   0 = Always (context loading is non-blocking)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)

# Extract session info
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
SOURCE=$(echo "$INPUT" | jq -r '.source // "startup"')

# Find changesets directory
CHANGESET_DIR="${CWD}/.claude/changesets"
if [[ ! -d "$CHANGESET_DIR" ]]; then
    exit 0
fi

# Count changesets by status
ACTIVE_COUNT=0
COMPLETED_COUNT=0
ACTIVE_IDS=""

for changeset in "$CHANGESET_DIR"/*; do
    if [[ -d "$changeset" ]] && [[ -f "$changeset/changeset.json" ]]; then
        STATUS=$(jq -r '.status // "unknown"' "$changeset/changeset.json" 2>/dev/null || echo "unknown")
        CHANGESET_ID=$(jq -r '.changeset_id // "unknown"' "$changeset/changeset.json" 2>/dev/null || echo "unknown")
        
        case "$STATUS" in
            active)
                ACTIVE_COUNT=$((ACTIVE_COUNT + 1))
                ACTIVE_IDS="${ACTIVE_IDS}${CHANGESET_ID}, "
                ;;
            completed)
                COMPLETED_COUNT=$((COMPLETED_COUNT + 1))
                ;;
        esac
    fi
done

# Build context message
if [[ $ACTIVE_COUNT -gt 0 ]]; then
    CONTEXT="📋 Workflow Status: ${ACTIVE_COUNT} active changeset(s): ${ACTIVE_IDS%, } | ${COMPLETED_COUNT} completed"
    
    # Get details of most recent active changeset
    LATEST_ACTIVE=$(ls -td "$CHANGESET_DIR"/*/ 2>/dev/null | head -1)
    if [[ -n "$LATEST_ACTIVE" ]] && [[ -f "$LATEST_ACTIVE/changeset.json" ]]; then
        PHASE=$(jq -r '.current_phase // "unknown"' "$LATEST_ACTIVE/changeset.json")
        DOMAINS=$(jq -r '.domains_involved | join(", ")' "$LATEST_ACTIVE/changeset.json" 2>/dev/null || echo "none")
        HANDOFFS=$(jq -r '.handoff_count // 0' "$LATEST_ACTIVE/changeset.json")
        COMPLETED=$(jq -r '.completed_handoffs // 0' "$LATEST_ACTIVE/changeset.json")
        
        CONTEXT="${CONTEXT}\nCurrent phase: ${PHASE} | Domains: ${DOMAINS} | Handoffs: ${COMPLETED}/${HANDOFFS}"
    fi
    
    echo "{\"additionalContext\": \"${CONTEXT}\"}"
elif [[ $COMPLETED_COUNT -gt 0 ]]; then
    echo "{\"additionalContext\": \"📋 No active workflows. ${COMPLETED_COUNT} completed changeset(s) available.\"}"
fi

exit 0
