#!/bin/bash
# Architecture Plugin - Summary
# Summarizes architecture changes
#
# Exit codes:
#   0 = Always

set -euo pipefail

INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

cd "$CWD" 2>/dev/null || exit 0

MODIFIED=$(git diff --name-only 2>/dev/null || true)
if [[ -z "$MODIFIED" ]]; then
    exit 0
fi

SUMMARY=""

# Count changes
ADR_COUNT=$(echo "$MODIFIED" | grep -ciE 'adr|decisions' || echo "0")
DIAGRAM_COUNT=$(echo "$MODIFIED" | grep -ciE '\.(mmd|puml|drawio)$' || echo "0")
API_COUNT=$(echo "$MODIFIED" | grep -ciE '(openapi|swagger|\.graphql)' || echo "0")

if [[ "$ADR_COUNT" -gt 0 ]]; then
    SUMMARY="${SUMMARY}📋 ${ADR_COUNT} ADR(s). "
fi
if [[ "$DIAGRAM_COUNT" -gt 0 ]]; then
    SUMMARY="${SUMMARY}📊 ${DIAGRAM_COUNT} diagram(s). "
fi
if [[ "$API_COUNT" -gt 0 ]]; then
    SUMMARY="${SUMMARY}📡 ${API_COUNT} API spec(s). "
fi

if [[ -n "$SUMMARY" ]]; then
    echo "{\"systemMessage\": \"🏗️ Architecture changes: ${SUMMARY}\"}"
fi

exit 0
