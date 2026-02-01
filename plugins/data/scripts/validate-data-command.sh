#!/bin/bash
# Data Plugin - Command Validation
# Validates data pipeline commands
#
# Exit codes:
#   0 = Safe
#   2 = Blocked

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [[ -z "$COMMAND" ]]; then
    exit 0
fi

# Block destructive operations on production data
if echo "$COMMAND" | grep -qiE '\b(dbt|airflow|dagster)\b.*\b(prod|production)\b.*\b(run|trigger)\b'; then
    echo '{"systemMessage": "⚠️ Production pipeline command. Verify DAG/model before running."}'
fi

# Block DROP/TRUNCATE on data warehouse tables
if echo "$COMMAND" | grep -qiE '\b(bq|snowsql)\b.*\b(DROP|TRUNCATE)\b'; then
    echo "BLOCKED: Cannot drop/truncate data warehouse tables directly." >&2
    exit 2
fi

# Warn about dbt run without selector
if echo "$COMMAND" | grep -qE '\bdbt\s+run\b' && ! echo "$COMMAND" | grep -qE '(-s|--select|--selector)'; then
    echo '{"systemMessage": "⚠️ dbt run without selector will run all models. Consider using --select."}'
fi

exit 0
