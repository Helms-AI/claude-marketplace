#!/bin/bash
# Log Rotation Script
# Compresses old logs and cleans up archive
#
# Exit codes:
#   0 = Success

set -euo pipefail

TELEMETRY_DIR="${CWD}/.claude/telemetry"
EVENTS_DIR="${TELEMETRY_DIR}/events"
ARCHIVE_DIR="${EVENTS_DIR}/archive"

# Ensure archive directory exists
mkdir -p "${ARCHIVE_DIR}"

# Current date
TODAY=$(date -u +"%Y-%m-%d")
ARCHIVE_CUTOFF=$(date -u -v-7d +"%Y-%m-%d" 2>/dev/null || date -u -d "7 days ago" +"%Y-%m-%d" 2>/dev/null || echo "2000-01-01")
DELETE_CUTOFF=$(date -u -v-30d +"%Y-%m-%d" 2>/dev/null || date -u -d "30 days ago" +"%Y-%m-%d" 2>/dev/null || echo "2000-01-01")

# Compress logs older than 7 days
for log_file in "${EVENTS_DIR}"/*.jsonl; do
    if [[ ! -f "$log_file" ]]; then
        continue
    fi

    FILENAME=$(basename "$log_file")
    LOG_DATE="${FILENAME%.jsonl}"

    # Skip today's log
    if [[ "$LOG_DATE" == "$TODAY" ]]; then
        continue
    fi

    # Compress if older than 7 days and not already compressed
    if [[ "$LOG_DATE" < "$ARCHIVE_CUTOFF" ]] && [[ ! -f "${log_file}.gz" ]]; then
        gzip -9 "$log_file"
        echo "Compressed: $FILENAME"
    fi
done

# Move compressed logs to archive
for gz_file in "${EVENTS_DIR}"/*.jsonl.gz; do
    if [[ ! -f "$gz_file" ]]; then
        continue
    fi

    mv "$gz_file" "${ARCHIVE_DIR}/"
    echo "Archived: $(basename "$gz_file")"
done

# Delete archived logs older than 30 days
for archive_file in "${ARCHIVE_DIR}"/*.jsonl.gz; do
    if [[ ! -f "$archive_file" ]]; then
        continue
    fi

    FILENAME=$(basename "$archive_file")
    LOG_DATE="${FILENAME%.jsonl.gz}"

    if [[ "$LOG_DATE" < "$DELETE_CUTOFF" ]]; then
        rm "$archive_file"
        echo "Deleted: $FILENAME (older than 30 days)"
    fi
done

# Emit telemetry event about log rotation
EVENT=$(jq -n \
    --arg type "system.log_rotation" \
    '{
        event_type: $type,
        metadata: {
            archive_cutoff: "'$ARCHIVE_CUTOFF'",
            delete_cutoff: "'$DELETE_CUTOFF'"
        }
    }')

echo "$EVENT" | "${CLAUDE_PLUGIN_ROOT}/scripts/telemetry/emit-event.sh"

exit 0
