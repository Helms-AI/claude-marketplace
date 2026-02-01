#!/bin/bash
# Testing Plugin - Find Related Tests
# Identifies test files related to modified source files
#
# Exit codes:
#   0 = Always (informational only)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)

# Extract file info
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# Get filename without path and extension
FILENAME=$(basename "$FILE_PATH")
BASENAME="${FILENAME%.*}"
EXTENSION="${FILENAME##*.}"

# Skip if this IS a test file
if echo "$FILENAME" | grep -qE '\.(test|spec)\.(ts|tsx|js|jsx)$'; then
    exit 0
fi

# Only check for source files
case "$EXTENSION" in
    ts|tsx|js|jsx|vue|svelte)
        ;;
    *)
        exit 0
        ;;
esac

cd "$CWD" 2>/dev/null || exit 0

# Find related test files
RELATED_TESTS=""

# Pattern 1: component.test.ts / component.spec.ts
for pattern in "${BASENAME}.test.ts" "${BASENAME}.test.tsx" "${BASENAME}.test.js" "${BASENAME}.test.jsx" \
               "${BASENAME}.spec.ts" "${BASENAME}.spec.tsx" "${BASENAME}.spec.js" "${BASENAME}.spec.jsx"; do
    FOUND=$(find . -name "$pattern" -type f 2>/dev/null | head -3 || true)
    if [[ -n "$FOUND" ]]; then
        RELATED_TESTS="${RELATED_TESTS}${FOUND}\n"
    fi
done

# Pattern 2: __tests__/component.ts
DIR_PATH=$(dirname "$FILE_PATH")
if [[ -d "${DIR_PATH}/__tests__" ]]; then
    FOUND=$(find "${DIR_PATH}/__tests__" -name "${BASENAME}*" -type f 2>/dev/null | head -3 || true)
    if [[ -n "$FOUND" ]]; then
        RELATED_TESTS="${RELATED_TESTS}${FOUND}\n"
    fi
fi

# Output recommendation if tests found
if [[ -n "$RELATED_TESTS" ]]; then
    TEST_COUNT=$(echo -e "$RELATED_TESTS" | grep -v '^$' | wc -l | tr -d ' ')
    FIRST_TEST=$(echo -e "$RELATED_TESTS" | head -1)
    
    # Detect test runner
    TEST_CMD=""
    if [[ -f "node_modules/.bin/vitest" ]]; then
        TEST_CMD="npx vitest run ${FIRST_TEST}"
    elif [[ -f "node_modules/.bin/jest" ]]; then
        TEST_CMD="npx jest ${FIRST_TEST}"
    elif [[ -f "node_modules/.bin/playwright" ]]; then
        TEST_CMD="npx playwright test ${FIRST_TEST}"
    fi
    
    if [[ -n "$TEST_CMD" ]]; then
        echo "{\"systemMessage\": \"🧪 Found ${TEST_COUNT} related test(s) for ${FILENAME}. Run: ${TEST_CMD}\"}"
    else
        echo "{\"systemMessage\": \"🧪 Found ${TEST_COUNT} related test(s) for ${FILENAME}. No test runner detected.\"}"
    fi
fi

exit 0
