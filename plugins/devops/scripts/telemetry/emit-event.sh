#!/bin/bash
# Telemetry Event Emitter
# Core script for emitting structured telemetry events
#
# Usage:
#   echo '{"event_type": "...", ...}' | emit-event.sh
#
# Exit codes:
#   0 = Event emitted successfully

set -euo pipefail

# Configuration
TELEMETRY_DIR="${CWD}/.claude/telemetry"
EVENTS_DIR="${TELEMETRY_DIR}/events"
METRICS_DIR="${TELEMETRY_DIR}/metrics"
ALERTS_DIR="${TELEMETRY_DIR}/alerts"

# Ensure telemetry directories exist
mkdir -p "${EVENTS_DIR}" "${METRICS_DIR}/hourly" "${METRICS_DIR}/daily" "${ALERTS_DIR}"

# Read event JSON from stdin
EVENT=$(cat)

# Validate JSON
if ! echo "$EVENT" | jq empty 2>/dev/null; then
    echo "ERROR: Invalid JSON" >&2
    exit 1
fi

# Add core fields if missing
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
EVENT_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')

ENRICHED_EVENT=$(echo "$EVENT" | jq --arg ts "$TIMESTAMP" --arg id "$EVENT_ID" '
    .timestamp = ($ts // .timestamp) |
    .event_id = ($id // .event_id) |
    .hostname = (env.HOSTNAME // "unknown") |
    .pid = (env.PPID // "unknown")
')

# Determine log file (daily rotation)
LOG_DATE=$(date -u +"%Y-%m-%d")
LOG_FILE="${EVENTS_DIR}/${LOG_DATE}.jsonl"

# Append event to daily log (JSONL format)
echo "$ENRICHED_EVENT" >> "$LOG_FILE"

# Check if log rotation needed (>100MB triggers rotation)
if [[ -f "$LOG_FILE" ]]; then
    FILE_SIZE=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
    if [[ $FILE_SIZE -gt 104857600 ]]; then
        # Trigger async log rotation
        nohup "${CLAUDE_PLUGIN_ROOT}/scripts/telemetry/rotate-logs.sh" > /dev/null 2>&1 &
    fi
fi

# Extract event type for conditional processing
EVENT_TYPE=$(echo "$ENRICHED_EVENT" | jq -r '.event_type // "unknown"')

# Update hourly metrics for specific event types
if [[ "$EVENT_TYPE" =~ ^(agent\.|tool\.|handoff\.) ]]; then
    HOUR=$(date -u +"%Y-%m-%d-%H")
    HOURLY_FILE="${METRICS_DIR}/hourly/${HOUR}.json"

    # Initialize hourly file if missing
    if [[ ! -f "$HOURLY_FILE" ]]; then
        echo '{"hour":"'$HOUR'","events":0,"agents":{},"tools":{},"handoffs":{}}' > "$HOURLY_FILE"
    fi

    # Increment event counter (simple approach - could use flock for concurrency)
    jq '.events += 1' "$HOURLY_FILE" > "${HOURLY_FILE}.tmp" && mv "${HOURLY_FILE}.tmp" "$HOURLY_FILE"
fi

# Check alerts asynchronously (don't block event emission)
nohup "${CLAUDE_PLUGIN_ROOT}/scripts/telemetry/check-alerts.sh" > /dev/null 2>&1 &

exit 0
