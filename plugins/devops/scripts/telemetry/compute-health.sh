#!/bin/bash
# Health Signal Computation
# Computes SLIs and health metrics from event logs
#
# Usage:
#   compute-health.sh [time_window]
#   time_window: 1h, 24h, 7d (default: 1h)
#
# Exit codes:
#   0 = Success

set -euo pipefail

TELEMETRY_DIR="${CWD}/.claude/telemetry"
EVENTS_DIR="${TELEMETRY_DIR}/events"
METRICS_DIR="${TELEMETRY_DIR}/metrics"

# Parse time window
TIME_WINDOW="${1:-1h}"

# Determine cutoff timestamp
if [[ "$TIME_WINDOW" == "1h" ]]; then
    CUTOFF=$(date -u -v-1H +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "1 hour ago" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null)
elif [[ "$TIME_WINDOW" == "24h" ]]; then
    CUTOFF=$(date -u -v-24H +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "24 hours ago" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null)
elif [[ "$TIME_WINDOW" == "7d" ]]; then
    CUTOFF=$(date -u -v-7d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "7 days ago" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null)
else
    echo "Invalid time window: $TIME_WINDOW" >&2
    exit 1
fi

# Find relevant log files
TODAY=$(date -u +"%Y-%m-%d")
YESTERDAY=$(date -u -v-1d +"%Y-%m-%d" 2>/dev/null || date -u -d "1 day ago" +"%Y-%m-%d" 2>/dev/null)

LOG_FILES=("${EVENTS_DIR}/${TODAY}.jsonl")
if [[ -f "${EVENTS_DIR}/${YESTERDAY}.jsonl" ]]; then
    LOG_FILES+=("${EVENTS_DIR}/${YESTERDAY}.jsonl")
fi

# Initialize counters
TOTAL_AGENTS=0
SUCCESS_AGENTS=0
FAILED_AGENTS=0

TOTAL_TOOLS=0
SUCCESS_TOOLS=0
FAILED_TOOLS=0

TOTAL_HANDOFFS=0
COMPLETED_HANDOFFS=0

declare -A AGENT_SUCCESS
declare -A AGENT_FAILURE
declare -A TOOL_LATENCIES

# Process events
for log_file in "${LOG_FILES[@]}"; do
    if [[ ! -f "$log_file" ]]; then
        continue
    fi

    while IFS= read -r event; do
        # Parse event
        TIMESTAMP=$(echo "$event" | jq -r '.timestamp // empty')
        EVENT_TYPE=$(echo "$event" | jq -r '.event_type // empty')

        # Skip events before cutoff
        if [[ "$TIMESTAMP" < "$CUTOFF" ]]; then
            continue
        fi

        # Process agent events
        if [[ "$EVENT_TYPE" == "agent.completed" ]]; then
            TOTAL_AGENTS=$((TOTAL_AGENTS + 1))
            AGENT=$(echo "$event" | jq -r '.agent // "unknown"')
            OUTCOME=$(echo "$event" | jq -r '.outcome // "unknown"')

            if [[ "$OUTCOME" == "success" ]]; then
                SUCCESS_AGENTS=$((SUCCESS_AGENTS + 1))
                AGENT_SUCCESS["$AGENT"]=$((${AGENT_SUCCESS["$AGENT"]:-0} + 1))
            else
                FAILED_AGENTS=$((FAILED_AGENTS + 1))
                AGENT_FAILURE["$AGENT"]=$((${AGENT_FAILURE["$AGENT"]:-0} + 1))
            fi
        fi

        # Process tool events
        if [[ "$EVENT_TYPE" == "tool.executed" ]]; then
            TOTAL_TOOLS=$((TOTAL_TOOLS + 1))
            OUTCOME=$(echo "$event" | jq -r '.outcome // "unknown"')
            TOOL=$(echo "$event" | jq -r '.tool // "unknown"')
            DURATION=$(echo "$event" | jq -r '.metadata.duration_ms // 0')

            if [[ "$OUTCOME" == "success" ]]; then
                SUCCESS_TOOLS=$((SUCCESS_TOOLS + 1))
            else
                FAILED_TOOLS=$((FAILED_TOOLS + 1))
            fi

            # Track latencies for percentile calculation
            TOOL_LATENCIES["${TOOL}_${TOTAL_TOOLS}"]=$DURATION
        fi

        # Process handoff events
        if [[ "$EVENT_TYPE" == "handoff.started" ]]; then
            TOTAL_HANDOFFS=$((TOTAL_HANDOFFS + 1))
        elif [[ "$EVENT_TYPE" == "handoff.completed" ]]; then
            COMPLETED_HANDOFFS=$((COMPLETED_HANDOFFS + 1))
        fi
    done < "$log_file"
done

# Calculate SLIs
AGENT_SUCCESS_RATE=0
if [[ $TOTAL_AGENTS -gt 0 ]]; then
    AGENT_SUCCESS_RATE=$(awk "BEGIN {printf \"%.2f\", ($SUCCESS_AGENTS / $TOTAL_AGENTS) * 100}")
fi

TOOL_SUCCESS_RATE=0
if [[ $TOTAL_TOOLS -gt 0 ]]; then
    TOOL_SUCCESS_RATE=$(awk "BEGIN {printf \"%.2f\", ($SUCCESS_TOOLS / $TOTAL_TOOLS) * 100}")
fi

HANDOFF_COMPLETION_RATE=0
if [[ $TOTAL_HANDOFFS -gt 0 ]]; then
    HANDOFF_COMPLETION_RATE=$(awk "BEGIN {printf \"%.2f\", ($COMPLETED_HANDOFFS / $TOTAL_HANDOFFS) * 100}")
fi

# Output health summary
cat <<EOF
Agent Marketplace Health Report (${TIME_WINDOW})
================================================

Agent Success Rate (SLI):
  Total:   $TOTAL_AGENTS invocations
  Success: $SUCCESS_AGENTS ($AGENT_SUCCESS_RATE%)
  Failed:  $FAILED_AGENTS
  Target:  > 95%
  Status:  $(if (( $(echo "$AGENT_SUCCESS_RATE >= 95" | bc -l) )); then echo "HEALTHY"; else echo "DEGRADED"; fi)

Tool Execution:
  Total:   $TOTAL_TOOLS executions
  Success: $SUCCESS_TOOLS ($TOOL_SUCCESS_RATE%)
  Failed:  $FAILED_TOOLS

Cross-Domain Handoffs:
  Total:      $TOTAL_HANDOFFS initiated
  Completed:  $COMPLETED_HANDOFFS ($HANDOFF_COMPLETION_RATE%)
  Target:     > 98%
  Status:     $(if (( $(echo "$HANDOFF_COMPLETION_RATE >= 98" | bc -l) )); then echo "HEALTHY"; else echo "DEGRADED"; fi)

Top Failing Agents:
EOF

# Sort agents by failure count
for agent in "${!AGENT_FAILURE[@]}"; do
    echo "  ${agent}: ${AGENT_FAILURE[$agent]} failures"
done | sort -t: -k2 -rn | head -5

echo ""
echo "Recommendations:"
if (( $(echo "$AGENT_SUCCESS_RATE < 95" | bc -l) )); then
    echo "  - Review failing agents and recent changes"
    echo "  - Check hook scripts for validation issues"
fi

if (( $(echo "$HANDOFF_COMPLETION_RATE < 98" | bc -l) )); then
    echo "  - Investigate stuck handoffs in changeset logs"
    echo "  - Verify cross-domain hook communication"
fi

exit 0
