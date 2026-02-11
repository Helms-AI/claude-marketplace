#!/bin/bash
# Handoff Trace Dashboard
# Traces a request flow across domains using correlation ID
#
# Usage:
#   handoff-trace.sh <correlation_id>

set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Usage: handoff-trace.sh <correlation_id>" >&2
    exit 1
fi

CORRELATION_ID="$1"
TELEMETRY_DIR="${CWD}/.claude/telemetry"
EVENTS_DIR="${TELEMETRY_DIR}/events"

# Find all events for this correlation ID
EVENTS=()
for log_file in "${EVENTS_DIR}"/*.jsonl; do
    if [[ ! -f "$log_file" ]]; then
        continue
    fi

    while IFS= read -r event; do
        CORR=$(echo "$event" | jq -r '.correlation_id // empty')
        if [[ "$CORR" == "$CORRELATION_ID" ]]; then
            EVENTS+=("$event")
        fi
    done < "$log_file"
done

if [[ ${#EVENTS[@]} -eq 0 ]]; then
    echo "No events found for correlation ID: $CORRELATION_ID" >&2
    exit 1
fi

# Display trace
cat <<EOF
╔════════════════════════════════════════════════════════════════════╗
║              Request Flow Trace                                    ║
║  Correlation ID: $CORRELATION_ID
╚════════════════════════════════════════════════════════════════════╝

EOF

# Sort events by timestamp
SORTED_EVENTS=$(printf '%s\n' "${EVENTS[@]}" | jq -s 'sort_by(.timestamp)')

# Track request flow
CURRENT_DOMAIN=""
INDENT=0

echo "$SORTED_EVENTS" | jq -c '.[]' | while read -r event; do
    TIMESTAMP=$(echo "$event" | jq -r '.timestamp')
    EVENT_TYPE=$(echo "$event" | jq -r '.event_type')
    DOMAIN=$(echo "$event" | jq -r '.domain // "system"')
    AGENT=$(echo "$event" | jq -r '.agent // empty')
    SKILL=$(echo "$event" | jq -r '.skill // empty')
    TOOL=$(echo "$event" | jq -r '.tool // empty')
    OUTCOME=$(echo "$event" | jq -r '.outcome // empty')

    TIME=$(echo "$TIMESTAMP" | cut -d'T' -f2 | cut -d'.' -f1)

    # Detect domain transitions
    if [[ "$DOMAIN" != "$CURRENT_DOMAIN" ]] && [[ -n "$DOMAIN" ]] && [[ "$DOMAIN" != "system" ]]; then
        if [[ -n "$CURRENT_DOMAIN" ]]; then
            echo ""
            echo "    ↓ HANDOFF to $DOMAIN"
            echo ""
        fi
        CURRENT_DOMAIN="$DOMAIN"
        INDENT=2
    fi

    # Format event
    INDENT_STR=$(printf '%*s' $INDENT '')

    case "$EVENT_TYPE" in
        agent.invoked)
            echo "$INDENT_STR[$TIME] Agent Invoked: $AGENT"
            echo "$INDENT_STR           Skill: $SKILL"
            ;;
        agent.completed)
            RESULT_ICON="✓"
            if [[ "$OUTCOME" == "failure" ]]; then
                RESULT_ICON="✗"
            fi
            echo "$INDENT_STR[$TIME] Agent Completed: $AGENT ($RESULT_ICON $OUTCOME)"
            ;;
        tool.executed)
            TOOL_ICON="✓"
            if [[ "$OUTCOME" == "failure" ]]; then
                TOOL_ICON="✗"
            fi
            DURATION=$(echo "$event" | jq -r '.metadata.duration_ms // 0')
            echo "$INDENT_STR[$TIME]   Tool: $TOOL ($TOOL_ICON $DURATION ms)"
            ;;
        handoff.started)
            TARGET=$(echo "$event" | jq -r '.target_domain // empty')
            echo "$INDENT_STR[$TIME]   → Handoff initiated to $TARGET"
            ;;
        handoff.completed)
            SOURCE=$(echo "$event" | jq -r '.source_domain // empty')
            echo "$INDENT_STR[$TIME]   ✓ Handoff completed from $SOURCE"
            ;;
        error.occurred)
            ERROR_TYPE=$(echo "$event" | jq -r '.error.type // "unknown"')
            echo "$INDENT_STR[$TIME]   ✗ ERROR: $ERROR_TYPE"
            ;;
        performance.slow_tool)
            DURATION=$(echo "$event" | jq -r '.metadata.duration_ms // 0')
            THRESHOLD=$(echo "$event" | jq -r '.metadata.threshold_ms // 0')
            echo "$INDENT_STR[$TIME]   ⚠ SLOW TOOL: $TOOL ($DURATION ms > $THRESHOLD ms)"
            ;;
    esac
done

# Summary statistics
TOTAL_EVENTS=$(echo "$SORTED_EVENTS" | jq 'length')
TOTAL_AGENTS=$(echo "$SORTED_EVENTS" | jq '[.[] | select(.event_type == "agent.completed")] | length')
TOTAL_TOOLS=$(echo "$SORTED_EVENTS" | jq '[.[] | select(.event_type == "tool.executed")] | length')
TOTAL_HANDOFFS=$(echo "$SORTED_EVENTS" | jq '[.[] | select(.event_type == "handoff.completed")] | length')
TOTAL_ERRORS=$(echo "$SORTED_EVENTS" | jq '[.[] | select(.event_type == "error.occurred")] | length')

START_TIME=$(echo "$SORTED_EVENTS" | jq -r '.[0].timestamp')
END_TIME=$(echo "$SORTED_EVENTS" | jq -r '.[-1].timestamp')

cat <<EOF

───────────────────────────────────────────────────────────────────
Summary:
  Duration:        $START_TIME → $END_TIME
  Total Events:    $TOTAL_EVENTS
  Agents Invoked:  $TOTAL_AGENTS
  Tools Executed:  $TOTAL_TOOLS
  Handoffs:        $TOTAL_HANDOFFS
  Errors:          $TOTAL_ERRORS
───────────────────────────────────────────────────────────────────
EOF

exit 0
