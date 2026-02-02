#!/bin/bash
# SubagentStop Telemetry Hook
# Captures telemetry when a subagent completes its work
#
# Exit codes:
#   0 = Success

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)

# Extract subagent info
SUBAGENT_NAME=$(echo "$INPUT" | jq -r '.subagent_name // "unknown"')
SKILL=$(echo "$INPUT" | jq -r '.skill // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
EXIT_CODE=$(echo "$INPUT" | jq -r '.exit_code // 0')

# Find correlation ID and domain
CORRELATION_ID="$SESSION_ID"
DOMAIN="unknown"
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

# Infer domain from skill name
if [[ "$SKILL" =~ ^/frontend ]]; then
    DOMAIN="frontend"
elif [[ "$SKILL" =~ ^/backend ]]; then
    DOMAIN="backend"
elif [[ "$SKILL" =~ ^/devops ]]; then
    DOMAIN="devops"
elif [[ "$SKILL" =~ ^/testing ]]; then
    DOMAIN="testing"
elif [[ "$SKILL" =~ ^/architecture|^/arch ]]; then
    DOMAIN="architecture"
elif [[ "$SKILL" =~ ^/data ]]; then
    DOMAIN="data"
elif [[ "$SKILL" =~ ^/security ]]; then
    DOMAIN="security"
elif [[ "$SKILL" =~ ^/docs|^/documentation ]]; then
    DOMAIN="documentation"
elif [[ "$SKILL" =~ ^/user-experience ]]; then
    DOMAIN="user-experience"
elif [[ "$SKILL" =~ ^/pm ]]; then
    DOMAIN="pm"
fi

# Determine outcome
OUTCOME="success"
if [[ "$EXIT_CODE" != "0" ]]; then
    OUTCOME="failure"
fi

# Count artifacts created (if in changeset)
ARTIFACTS_CREATED=0
if [[ -d "$CHANGESET_DIR" ]] && [[ -n "$CORRELATION_ID" ]]; then
    ACTIVE_CHANGESET="${CHANGESET_DIR}/${CORRELATION_ID}"
    if [[ -d "$ACTIVE_CHANGESET/artifacts" ]]; then
        ARTIFACTS_CREATED=$(find "$ACTIVE_CHANGESET/artifacts" -type f | wc -l | tr -d ' ')
    fi
fi

# Emit telemetry event
EVENT=$(jq -n \
    --arg type "agent.completed" \
    --arg correlation "$CORRELATION_ID" \
    --arg agent "$SUBAGENT_NAME" \
    --arg skill "$SKILL" \
    --arg domain "$DOMAIN" \
    --arg outcome "$OUTCOME" \
    --arg artifacts "$ARTIFACTS_CREATED" \
    --arg exit "$EXIT_CODE" \
    '{
        event_type: $type,
        correlation_id: $correlation,
        agent: $agent,
        skill: $skill,
        domain: $domain,
        outcome: $outcome,
        metadata: {
            artifacts_created: ($artifacts | tonumber),
            exit_code: ($exit | tonumber)
        },
        stage: "stop"
    }')

echo "$EVENT" | "${CLAUDE_PLUGIN_ROOT}/scripts/telemetry/emit-event.sh"

# If failed, emit error event with details
if [[ "$OUTCOME" == "failure" ]]; then
    ERROR_EVENT=$(jq -n \
        --arg type "error.occurred" \
        --arg correlation "$CORRELATION_ID" \
        --arg agent "$SUBAGENT_NAME" \
        --arg skill "$SKILL" \
        --arg domain "$DOMAIN" \
        --arg exit "$EXIT_CODE" \
        '{
            event_type: $type,
            correlation_id: $correlation,
            agent: $agent,
            skill: $skill,
            domain: $domain,
            error: {
                type: "agent_execution_failed",
                exit_code: ($exit | tonumber),
                recoverable: true
            },
            severity: "error"
        }')

    echo "$ERROR_EVENT" | "${CLAUDE_PLUGIN_ROOT}/scripts/telemetry/emit-event.sh"
fi

# Also emit handoff completion if cross-domain
if [[ "$OUTCOME" == "success" ]] && [[ -d "$CHANGESET_DIR" ]] && [[ -n "$CORRELATION_ID" ]]; then
    HANDOFF_COMPLETE=$(jq -n \
        --arg type "handoff.completed" \
        --arg correlation "$CORRELATION_ID" \
        --arg domain "$DOMAIN" \
        --arg skill "$SKILL" \
        '{
            event_type: $type,
            correlation_id: $correlation,
            source_domain: $domain,
            skill: $skill,
            stage: "handoff_complete"
        }')

    echo "$HANDOFF_COMPLETE" | "${CLAUDE_PLUGIN_ROOT}/scripts/telemetry/emit-event.sh"
fi

exit 0
