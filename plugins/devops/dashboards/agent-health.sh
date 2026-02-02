#!/bin/bash
# Agent Health Dashboard
# CLI dashboard showing agent performance metrics
#
# Usage:
#   agent-health.sh [time_window]
#   time_window: 1h, 24h, 7d (default: 24h)

set -euo pipefail

TELEMETRY_DIR="${CWD}/.claude/telemetry"
EVENTS_DIR="${TELEMETRY_DIR}/events"

TIME_WINDOW="${1:-24h}"

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
LOG_FILES=("${EVENTS_DIR}/${TODAY}.jsonl")

for i in {1..7}; do
    DATE=$(date -u -v-"${i}"d +"%Y-%m-%d" 2>/dev/null || date -u -d "$i days ago" +"%Y-%m-%d" 2>/dev/null)
    if [[ -f "${EVENTS_DIR}/${DATE}.jsonl" ]]; then
        LOG_FILES+=("${EVENTS_DIR}/${DATE}.jsonl")
    fi
done

# Initialize per-agent metrics
declare -A AGENT_TOTAL
declare -A AGENT_SUCCESS
declare -A AGENT_FAILURE
declare -A DOMAIN_TOTAL
declare -A DOMAIN_SUCCESS

# Process events
for log_file in "${LOG_FILES[@]}"; do
    if [[ ! -f "$log_file" ]]; then
        continue
    fi

    while IFS= read -r event; do
        TIMESTAMP=$(echo "$event" | jq -r '.timestamp // empty')
        EVENT_TYPE=$(echo "$event" | jq -r '.event_type // empty')

        if [[ "$TIMESTAMP" < "$CUTOFF" ]]; then
            continue
        fi

        if [[ "$EVENT_TYPE" == "agent.completed" ]]; then
            AGENT=$(echo "$event" | jq -r '.agent // "unknown"')
            DOMAIN=$(echo "$event" | jq -r '.domain // "unknown"')
            OUTCOME=$(echo "$event" | jq -r '.outcome // "unknown"')

            AGENT_TOTAL["$AGENT"]=$((${AGENT_TOTAL["$AGENT"]:-0} + 1))
            DOMAIN_TOTAL["$DOMAIN"]=$((${DOMAIN_TOTAL["$DOMAIN"]:-0} + 1))

            if [[ "$OUTCOME" == "success" ]]; then
                AGENT_SUCCESS["$AGENT"]=$((${AGENT_SUCCESS["$AGENT"]:-0} + 1))
                DOMAIN_SUCCESS["$DOMAIN"]=$((${DOMAIN_SUCCESS["$DOMAIN"]:-0} + 1))
            else
                AGENT_FAILURE["$AGENT"]=$((${AGENT_FAILURE["$AGENT"]:-0} + 1))
            fi
        fi
    done < "$log_file"
done

# Display dashboard
clear
cat <<EOF
╔════════════════════════════════════════════════════════════════════╗
║         Agent Marketplace Health Dashboard (${TIME_WINDOW})                 ║
╚════════════════════════════════════════════════════════════════════╝

Domain Performance:
───────────────────────────────────────────────────────────────────
EOF

# Sort domains by total invocations
for domain in "${!DOMAIN_TOTAL[@]}"; do
    TOTAL=${DOMAIN_TOTAL[$domain]}
    SUCCESS=${DOMAIN_SUCCESS[$domain]:-0}
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($SUCCESS / $TOTAL) * 100}")

    # Color code based on success rate
    STATUS="✓"
    if (( $(echo "$SUCCESS_RATE < 95" | bc -l) )); then
        STATUS="⚠"
    fi
    if (( $(echo "$SUCCESS_RATE < 90" | bc -l) )); then
        STATUS="✗"
    fi

    printf "%-20s %s  %3d invocations | %5.1f%% success\n" "$domain" "$STATUS" "$TOTAL" "$SUCCESS_RATE"
done | sort -k3 -rn

cat <<EOF

Top Performing Agents:
───────────────────────────────────────────────────────────────────
EOF

# Top 10 agents by success rate (min 5 invocations)
for agent in "${!AGENT_TOTAL[@]}"; do
    TOTAL=${AGENT_TOTAL[$agent]}
    if [[ $TOTAL -lt 5 ]]; then
        continue
    fi

    SUCCESS=${AGENT_SUCCESS[$agent]:-0}
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($SUCCESS / $TOTAL) * 100}")

    echo "$agent|$TOTAL|$SUCCESS_RATE"
done | sort -t'|' -k3 -rn | head -10 | while IFS='|' read -r agent total rate; do
    printf "%-30s %3d invocations | %5.1f%% success\n" "$agent" "$total" "$rate"
done

cat <<EOF

Agents Needing Attention:
───────────────────────────────────────────────────────────────────
EOF

# Bottom 5 agents by success rate (min 3 invocations)
NEEDS_ATTENTION=false
for agent in "${!AGENT_TOTAL[@]}"; do
    TOTAL=${AGENT_TOTAL[$agent]}
    if [[ $TOTAL -lt 3 ]]; then
        continue
    fi

    SUCCESS=${AGENT_SUCCESS[$agent]:-0}
    FAILURES=${AGENT_FAILURE[$agent]:-0}
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($SUCCESS / $TOTAL) * 100}")

    if (( $(echo "$SUCCESS_RATE < 95" | bc -l) )); then
        printf "%-30s %2d failures | %5.1f%% success\n" "$agent" "$FAILURES" "$SUCCESS_RATE"
        NEEDS_ATTENTION=true
    fi
done | sort -t'|' -k2 -rn

if [[ "$NEEDS_ATTENTION" == "false" ]]; then
    echo "  All agents performing within SLI targets (>95% success)"
fi

cat <<EOF

───────────────────────────────────────────────────────────────────
Commands:
  - View full health report:  compute-health.sh ${TIME_WINDOW}
  - Trace specific request:   handoff-trace.sh <correlation_id>
  - Check active alerts:      cat .claude/telemetry/alerts/active.json
EOF

exit 0
