#!/bin/bash
# Frontend Plugin - Quality Summary on Subagent Stop
# Provides a summary of code quality metrics when a frontend subagent completes
#
# Exit codes:
#   0 = Always (summary is informational)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

cd "$CWD" 2>/dev/null || exit 0

SUMMARY=""

# Check if there are staged/modified files
MODIFIED_FILES=$(git diff --name-only 2>/dev/null | grep -E '\.(ts|tsx|js|jsx|vue|svelte|css|scss)$' | head -10 || true)

if [[ -z "$MODIFIED_FILES" ]]; then
    exit 0
fi

FILE_COUNT=$(echo "$MODIFIED_FILES" | wc -l | tr -d ' ')
SUMMARY="📊 Frontend changes: ${FILE_COUNT} file(s) modified. "

# Quick ESLint check on modified files
if [[ -f "node_modules/.bin/eslint" ]]; then
    LINT_ERRORS=$(echo "$MODIFIED_FILES" | xargs npx eslint --format compact 2>/dev/null | grep -c "error" || echo "0")
    LINT_WARNINGS=$(echo "$MODIFIED_FILES" | xargs npx eslint --format compact 2>/dev/null | grep -c "warning" || echo "0")
    
    if [[ "$LINT_ERRORS" -gt 0 ]] || [[ "$LINT_WARNINGS" -gt 0 ]]; then
        SUMMARY="${SUMMARY}Lint: ${LINT_ERRORS} error(s), ${LINT_WARNINGS} warning(s). "
    else
        SUMMARY="${SUMMARY}Lint: ✅ "
    fi
fi

# Quick TypeScript check
if [[ -f "node_modules/.bin/tsc" ]] && [[ -f "tsconfig.json" ]]; then
    TS_ERRORS=$(npx tsc --noEmit --skipLibCheck 2>&1 | grep -c "error" || echo "0")
    if [[ "$TS_ERRORS" -gt 0 ]]; then
        SUMMARY="${SUMMARY}TypeScript: ${TS_ERRORS} error(s). "
    else
        SUMMARY="${SUMMARY}TypeScript: ✅ "
    fi
fi

# Check test status
if [[ -f "node_modules/.bin/vitest" ]] || [[ -f "node_modules/.bin/jest" ]]; then
    SUMMARY="${SUMMARY}Run tests to verify. "
fi

echo "{\"systemMessage\": \"${SUMMARY}\"}"
exit 0
