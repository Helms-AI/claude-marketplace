#!/bin/bash
# Testing Plugin - Coverage Summary
# Generates test coverage summary when testing subagent completes
#
# Exit codes:
#   0 = Always (informational only)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

cd "$CWD" 2>/dev/null || exit 0

SUMMARY=""

# Check for coverage reports
COVERAGE_FILE=""
if [[ -f "coverage/coverage-summary.json" ]]; then
    COVERAGE_FILE="coverage/coverage-summary.json"
elif [[ -f "coverage/lcov.info" ]]; then
    COVERAGE_FILE="coverage/lcov.info"
fi

if [[ -n "$COVERAGE_FILE" ]] && [[ "$COVERAGE_FILE" == *".json" ]]; then
    # Parse JSON coverage
    LINES=$(jq -r '.total.lines.pct // 0' "$COVERAGE_FILE" 2>/dev/null || echo "0")
    STATEMENTS=$(jq -r '.total.statements.pct // 0' "$COVERAGE_FILE" 2>/dev/null || echo "0")
    FUNCTIONS=$(jq -r '.total.functions.pct // 0' "$COVERAGE_FILE" 2>/dev/null || echo "0")
    BRANCHES=$(jq -r '.total.branches.pct // 0' "$COVERAGE_FILE" 2>/dev/null || echo "0")
    
    SUMMARY="📊 Coverage: Lines ${LINES}% | Statements ${STATEMENTS}% | Functions ${FUNCTIONS}% | Branches ${BRANCHES}%"
    
    # Add coverage quality indicator
    if (( $(echo "$LINES >= 80" | bc -l) )); then
        SUMMARY="${SUMMARY} ✅"
    elif (( $(echo "$LINES >= 60" | bc -l) )); then
        SUMMARY="${SUMMARY} ⚠️"
    else
        SUMMARY="${SUMMARY} ❌"
    fi
fi

# Check for test files modified in this session
MODIFIED_TESTS=$(git diff --name-only 2>/dev/null | grep -E '\.(test|spec)\.(ts|tsx|js|jsx)$' | wc -l | tr -d ' ' || echo "0")
if [[ "$MODIFIED_TESTS" -gt 0 ]]; then
    SUMMARY="${SUMMARY} | ${MODIFIED_TESTS} test file(s) modified"
fi

# Check for uncovered files
UNCOVERED=$(git diff --name-only 2>/dev/null | grep -E '\.(ts|tsx|js|jsx)$' | grep -v -E '\.(test|spec)\.' | head -5 || true)
if [[ -n "$UNCOVERED" ]]; then
    UNCOVERED_COUNT=$(echo "$UNCOVERED" | wc -l | tr -d ' ')
    SUMMARY="${SUMMARY} | ${UNCOVERED_COUNT} source file(s) may need tests"
fi

if [[ -n "$SUMMARY" ]]; then
    echo "{\"systemMessage\": \"${SUMMARY}\"}"
fi

exit 0
