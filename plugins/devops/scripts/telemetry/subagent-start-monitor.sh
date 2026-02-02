#!/bin/bash
# SubagentStart Telemetry Hook
# Captures telemetry when a subagent (domain agent) is invoked
#
# Exit codes:
#   0 = Allow

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)

# Extract subagent info
SUBAGENT_NAME=$(echo "$INPUT" | jq -r '.subagent_name // "unknown"')
SKILL=$(echo "$INPUT" | jq -r '.skill // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

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

# Emit telemetry event
EVENT=$(jq -n \
    --arg type "agent.invoked" \
    --arg correlation "$CORRELATION_ID" \
    --arg agent "$SUBAGENT_NAME" \
    --arg skill "$SKILL" \
    --arg domain "$DOMAIN" \
    '{
        event_type: $type,
        correlation_id: $correlation,
        agent: $agent,
        skill: $skill,
        domain: $domain,
        stage: "start"
    }')

echo "$EVENT" | "${CLAUDE_PLUGIN_ROOT}/scripts/telemetry/emit-event.sh"

# Also emit handoff event if this is cross-domain
if [[ -d "$CHANGESET_DIR" ]] && [[ -n "$CORRELATION_ID" ]]; then
    ACTIVE_CHANGESET="${CHANGESET_DIR}/${CORRELATION_ID}"
    if [[ -f "$ACTIVE_CHANGESET/changeset.json" ]]; then
        DOMAINS_INVOLVED=$(jq -r '.domains_involved // [] | join(",")' "$ACTIVE_CHANGESET/changeset.json")

        # Check if this is a new domain
        if [[ ! "$DOMAINS_INVOLVED" =~ $DOMAIN ]]; then
            HANDOFF_EVENT=$(jq -n \
                --arg type "handoff.started" \
                --arg correlation "$CORRELATION_ID" \
                --arg target "$DOMAIN" \
                --arg skill "$SKILL" \
                '{
                    event_type: $type,
                    correlation_id: $correlation,
                    target_domain: $target,
                    target_skill: $skill,
                    stage: "handoff_initiated"
                }')

            echo "$HANDOFF_EVENT" | "${CLAUDE_PLUGIN_ROOT}/scripts/telemetry/emit-event.sh"
        fi
    fi
fi

exit 0
