#!/bin/bash
# User Experience Plugin - Summary
# Summarizes UX-related changes
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

# Count changes by type
STYLE_COUNT=$(echo "$MODIFIED" | grep -ciE '\.(css|scss|less)$' || echo "0")
TOKEN_COUNT=$(echo "$MODIFIED" | grep -ciE 'tokens?|theme|design-system' || echo "0")
COMPONENT_COUNT=$(echo "$MODIFIED" | grep -ciE '\.(tsx|jsx|vue|svelte)$' || echo "0")

if [[ "$STYLE_COUNT" -gt 0 ]]; then
    SUMMARY="${SUMMARY}🎨 ${STYLE_COUNT} style file(s). "
fi
if [[ "$TOKEN_COUNT" -gt 0 ]]; then
    SUMMARY="${SUMMARY}🎯 ${TOKEN_COUNT} token file(s). "
fi
if [[ "$COMPONENT_COUNT" -gt 0 ]]; then
    SUMMARY="${SUMMARY}🧩 ${COMPONENT_COUNT} component(s). "
fi

if [[ -n "$SUMMARY" ]]; then
    echo "{\"systemMessage\": \"✨ UX changes: ${SUMMARY}Review visual consistency.\"}"
fi

exit 0
