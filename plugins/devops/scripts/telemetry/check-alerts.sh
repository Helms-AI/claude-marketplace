#!/bin/bash
# Alert Checker
# Evaluates alert conditions and fires/resolves alerts
#
# Exit codes:
#   0 = Success

set -euo pipefail

TELEMETRY_DIR="${CWD}/.claude/telemetry"
EVENTS_DIR="${TELEMETRY_DIR}/events"
ALERTS_DIR="${TELEMETRY_DIR}/alerts"
CONFIG_DIR="${TELEMETRY_DIR}/config"

# Ensure directories exist
mkdir -p "${ALERTS_DIR}" "${CONFIG_DIR}"

# Load or create thresholds config
THRESHOLDS_FILE="${CONFIG_DIR}/thresholds.json"
if [[ ! -f "$THRESHOLDS_FILE" ]]; then
    cat > "$THRESHOLDS_FILE" <<'EOF'
{
  "agent_error_rate_threshold": 0.10,
  "agent_error_window_minutes": 15,
  "handoff_stuck_threshold_minutes": 5,
  "tool_p95_multiplier": 2.0,
  "retry_rate_threshold": 0.20,
  "retry_window_hours": 1
}
EOF
fi

# Load thresholds
AGENT_ERROR_THRESHOLD=$(jq -r '.agent_error_rate_threshold' "$THRESHOLDS_FILE")
HANDOFF_STUCK_THRESHOLD=$(jq -r '.handoff_stuck_threshold_minutes' "$THRESHOLDS_FILE")

# Active alerts tracking
ACTIVE_ALERTS_FILE="${ALERTS_DIR}/active.json"
if [[ ! -f "$ACTIVE_ALERTS_FILE" ]]; then
    echo '{"alerts":[]}' > "$ACTIVE_ALERTS_FILE"
fi

# Find recent events (last 15 minutes)
CUTOFF=$(date -u -v-15M +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "15 minutes ago" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null)
TODAY=$(date -u +"%Y-%m-%d")
LOG_FILE="${EVENTS_DIR}/${TODAY}.jsonl"

if [[ ! -f "$LOG_FILE" ]]; then
    exit 0
fi

# Count recent agent failures
TOTAL_AGENTS=0
FAILED_AGENTS=0

while IFS= read -r event; do
    TIMESTAMP=$(echo "$event" | jq -r '.timestamp // empty')
    EVENT_TYPE=$(echo "$event" | jq -r '.event_type // empty')

    if [[ "$TIMESTAMP" < "$CUTOFF" ]]; then
        continue
    fi

    if [[ "$EVENT_TYPE" == "agent.completed" ]]; then
        TOTAL_AGENTS=$((TOTAL_AGENTS + 1))
        OUTCOME=$(echo "$event" | jq -r '.outcome // "unknown"')

        if [[ "$OUTCOME" == "failure" ]]; then
            FAILED_AGENTS=$((FAILED_AGENTS + 1))
        fi
    fi
done < "$LOG_FILE"

# Check AgentFailureSpike alert
AGENT_ERROR_RATE=0
if [[ $TOTAL_AGENTS -gt 0 ]]; then
    AGENT_ERROR_RATE=$(awk "BEGIN {printf \"%.4f\", $FAILED_AGENTS / $TOTAL_AGENTS}")
fi

ALERT_FIRED=false
if (( $(echo "$AGENT_ERROR_RATE > $AGENT_ERROR_THRESHOLD" | bc -l) )); then
    # Fire alert
    ALERT_ID="agent-failure-spike-$(date +%s)"
    ALERT=$(jq -n \
        --arg id "$ALERT_ID" \
        --arg name "AgentFailureSpike" \
        --arg severity "critical" \
        --arg message "Agent error rate ($AGENT_ERROR_RATE) exceeds threshold ($AGENT_ERROR_THRESHOLD)" \
        --arg fired_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        '{
            alert_id: $id,
            name: $name,
            severity: $severity,
            message: $message,
            fired_at: $fired_at,
            status: "firing",
            metadata: {
                error_rate: "'$AGENT_ERROR_RATE'",
                threshold: "'$AGENT_ERROR_THRESHOLD'",
                total_agents: '$TOTAL_AGENTS',
                failed_agents: '$FAILED_AGENTS'
            }
        }')

    # Check if already active
    EXISTING=$(jq --arg name "AgentFailureSpike" '.alerts[] | select(.name == $name and .status == "firing")' "$ACTIVE_ALERTS_FILE")

    if [[ -z "$EXISTING" ]]; then
        # Add to active alerts
        jq --argjson alert "$ALERT" '.alerts += [$alert]' "$ACTIVE_ALERTS_FILE" > "${ACTIVE_ALERTS_FILE}.tmp"
        mv "${ACTIVE_ALERTS_FILE}.tmp" "$ACTIVE_ALERTS_FILE"

        # Log alert event
        echo "$ALERT" | "${CLAUDE_PLUGIN_ROOT}/scripts/telemetry/emit-event.sh"

        echo "ALERT FIRED: AgentFailureSpike - Error rate: $AGENT_ERROR_RATE (threshold: $AGENT_ERROR_THRESHOLD)"
        ALERT_FIRED=true
    fi
else
    # Resolve alert if active
    EXISTING=$(jq --arg name "AgentFailureSpike" '.alerts[] | select(.name == $name and .status == "firing")' "$ACTIVE_ALERTS_FILE")

    if [[ -n "$EXISTING" ]]; then
        # Resolve alert
        jq --arg name "AgentFailureSpike" --arg resolved_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
            '(.alerts[] | select(.name == $name and .status == "firing")) |= (.status = "resolved" | .resolved_at = $resolved_at)' \
            "$ACTIVE_ALERTS_FILE" > "${ACTIVE_ALERTS_FILE}.tmp"
        mv "${ACTIVE_ALERTS_FILE}.tmp" "$ACTIVE_ALERTS_FILE"

        echo "ALERT RESOLVED: AgentFailureSpike"
    fi
fi

# Check HandoffStuck alert
HANDOFF_CUTOFF=$(date -u -v-"${HANDOFF_STUCK_THRESHOLD}"M +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "${HANDOFF_STUCK_THRESHOLD} minutes ago" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null)
STUCK_HANDOFFS=0

# Find handoffs that started before cutoff but haven't completed
declare -A HANDOFF_TRACKER

while IFS= read -r event; do
    TIMESTAMP=$(echo "$event" | jq -r '.timestamp // empty')
    EVENT_TYPE=$(echo "$event" | jq -r '.event_type // empty')
    CORRELATION=$(echo "$event" | jq -r '.correlation_id // empty')

    if [[ "$EVENT_TYPE" == "handoff.started" ]]; then
        HANDOFF_TRACKER["$CORRELATION"]="$TIMESTAMP"
    elif [[ "$EVENT_TYPE" == "handoff.completed" ]]; then
        unset HANDOFF_TRACKER["$CORRELATION"]
    fi
done < "$LOG_FILE"

# Count stuck handoffs
for correlation in "${!HANDOFF_TRACKER[@]}"; do
    START_TIME="${HANDOFF_TRACKER[$correlation]}"
    if [[ "$START_TIME" < "$HANDOFF_CUTOFF" ]]; then
        STUCK_HANDOFFS=$((STUCK_HANDOFFS + 1))
    fi
done

if [[ $STUCK_HANDOFFS -gt 0 ]]; then
    # Fire alert
    ALERT_ID="handoff-stuck-$(date +%s)"
    ALERT=$(jq -n \
        --arg id "$ALERT_ID" \
        --arg name "HandoffStuck" \
        --arg severity "critical" \
        --arg message "$STUCK_HANDOFFS handoff(s) stuck for > $HANDOFF_STUCK_THRESHOLD minutes" \
        --arg fired_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        '{
            alert_id: $id,
            name: $name,
            severity: $severity,
            message: $message,
            fired_at: $fired_at,
            status: "firing",
            metadata: {
                stuck_count: '$STUCK_HANDOFFS',
                threshold_minutes: '$HANDOFF_STUCK_THRESHOLD'
            }
        }')

    EXISTING=$(jq --arg name "HandoffStuck" '.alerts[] | select(.name == $name and .status == "firing")' "$ACTIVE_ALERTS_FILE")

    if [[ -z "$EXISTING" ]]; then
        jq --argjson alert "$ALERT" '.alerts += [$alert]' "$ACTIVE_ALERTS_FILE" > "${ACTIVE_ALERTS_FILE}.tmp"
        mv "${ACTIVE_ALERTS_FILE}.tmp" "$ACTIVE_ALERTS_FILE"

        echo "$ALERT" | "${CLAUDE_PLUGIN_ROOT}/scripts/telemetry/emit-event.sh"

        echo "ALERT FIRED: HandoffStuck - $STUCK_HANDOFFS stuck handoffs"
        ALERT_FIRED=true
    fi
fi

# Output active alerts summary
if [[ "$ALERT_FIRED" == "true" ]]; then
    echo ""
    echo "Active Alerts:"
    jq -r '.alerts[] | select(.status == "firing") | "  [\(.severity | ascii_upcase)] \(.name): \(.message)"' "$ACTIVE_ALERTS_FILE"
fi

exit 0
