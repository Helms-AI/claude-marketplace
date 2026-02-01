#!/bin/bash
# Testing Plugin - Check Test Output
# Analyzes test command output for failures
#
# Exit codes:
#   0 = Always (informational only)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)

# Get the bash command that was run
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
RESULT=$(echo "$INPUT" | jq -r '.tool_result // empty')

if [[ -z "$COMMAND" ]]; then
    exit 0
fi

# Only check test-related commands
if ! echo "$COMMAND" | grep -qiE '(vitest|jest|playwright|cypress|mocha|ava|tap|test)'; then
    exit 0
fi

# Check for test failures in output
FAILURES=0
PASSED=0
SKIPPED=0

# Parse different test runner outputs
if echo "$RESULT" | grep -qE 'Tests?:\s*\d+\s*(failed|passed)'; then
    # Jest/Vitest format
    FAILURES=$(echo "$RESULT" | grep -oE '\d+\s+failed' | grep -oE '\d+' | head -1 || echo "0")
    PASSED=$(echo "$RESULT" | grep -oE '\d+\s+passed' | grep -oE '\d+' | head -1 || echo "0")
    SKIPPED=$(echo "$RESULT" | grep -oE '\d+\s+skipped' | grep -oE '\d+' | head -1 || echo "0")
elif echo "$RESULT" | grep -qE 'FAIL|PASS'; then
    # Generic format
    FAILURES=$(echo "$RESULT" | grep -c 'FAIL' || echo "0")
    PASSED=$(echo "$RESULT" | grep -c 'PASS' || echo "0")
fi

# Generate summary
if [[ "$FAILURES" -gt 0 ]]; then
    echo "{\"systemMessage\": \"❌ Tests failed: ${FAILURES} failed, ${PASSED} passed, ${SKIPPED} skipped. Review failures before proceeding.\"}"
elif [[ "$PASSED" -gt 0 ]]; then
    echo "{\"systemMessage\": \"✅ Tests passed: ${PASSED} passed, ${SKIPPED} skipped.\"}"
fi

exit 0
