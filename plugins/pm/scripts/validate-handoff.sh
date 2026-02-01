#!/bin/bash
# PM Plugin - Handoff Validation
# Validates that handoff context is complete before subagent starts
#
# Exit codes:
#   0 = Valid handoff (or no active changeset)
#   2 = Invalid handoff (missing required context)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)

# Extract session info
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
AGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type // empty')

# Find active changeset
CHANGESET_DIR="${CWD}/.claude/changesets"
if [[ ! -d "$CHANGESET_DIR" ]]; then
    # No changesets directory - no validation needed
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
    # No active changeset - no validation needed
    exit 0
fi

# Read changeset metadata
CHANGESET_JSON="$ACTIVE_CHANGESET/changeset.json"
CHANGESET_ID=$(jq -r '.changeset_id // "unknown"' "$CHANGESET_JSON")
CURRENT_PHASE=$(jq -r '.current_phase // "unknown"' "$CHANGESET_JSON")
DOMAINS_INVOLVED=$(jq -r '.domains_involved // []' "$CHANGESET_JSON")

# Find the latest handoff file
LATEST_HANDOFF=$(ls -t "$ACTIVE_CHANGESET"/handoff_*.json 2>/dev/null | head -1 || echo "")

if [[ -n "$LATEST_HANDOFF" ]]; then
    # Validate handoff has required fields
    MISSING_FIELDS=""
    
    # Check for target domain
    TARGET_DOMAIN=$(jq -r '.target.plugin // empty' "$LATEST_HANDOFF")
    if [[ -z "$TARGET_DOMAIN" ]]; then
        MISSING_FIELDS="${MISSING_FIELDS}target.plugin, "
    fi
    
    # Check for original request
    ORIGINAL_REQUEST=$(jq -r '.context.original_request // empty' "$LATEST_HANDOFF")
    if [[ -z "$ORIGINAL_REQUEST" ]]; then
        MISSING_FIELDS="${MISSING_FIELDS}context.original_request, "
    fi
    
    # Check handoff status
    HANDOFF_STATUS=$(jq -r '.status // "unknown"' "$LATEST_HANDOFF")
    
    if [[ -n "$MISSING_FIELDS" ]]; then
        echo "{\"systemMessage\": \"⚠️ Handoff validation: Missing fields in handoff context: ${MISSING_FIELDS%. }\"}"
        # Don't block, just warn
        exit 0
    fi
    
    # Log successful validation
    echo "{\"additionalContext\": \"Active changeset: ${CHANGESET_ID} | Phase: ${CURRENT_PHASE} | Handoff status: ${HANDOFF_STATUS}\"}"
fi

exit 0
