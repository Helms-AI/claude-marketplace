#!/bin/bash
# Security Plugin - Security Summary
# Provides security scan summary when security subagent completes
#
# Exit codes:
#   0 = Always (informational)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

cd "$CWD" 2>/dev/null || exit 0

SUMMARY=""

# Check for modified files
MODIFIED_FILES=$(git diff --name-only 2>/dev/null || true)
if [[ -z "$MODIFIED_FILES" ]]; then
    exit 0
fi

FILE_COUNT=$(echo "$MODIFIED_FILES" | wc -l | tr -d ' ')
SUMMARY="🔒 Security scan: ${FILE_COUNT} file(s) checked. "

# Check for sensitive file modifications
SENSITIVE_COUNT=$(echo "$MODIFIED_FILES" | grep -ciE '(secret|credential|auth|\.env|password|config)' || echo "0")
if [[ "$SENSITIVE_COUNT" -gt 0 ]]; then
    SUMMARY="${SUMMARY}⚠️ ${SENSITIVE_COUNT} sensitive file(s). "
fi

# Check for dependency changes
DEPS_CHANGED=$(echo "$MODIFIED_FILES" | grep -ciE '(package\.json|requirements|Gemfile|Cargo\.toml|go\.mod)' || echo "0")
if [[ "$DEPS_CHANGED" -gt 0 ]]; then
    SUMMARY="${SUMMARY}📦 Dependencies changed - run audit. "
fi

# Quick secret scan on modified files
SECRETS_FOUND=0
for file in $MODIFIED_FILES; do
    if [[ -f "$file" ]]; then
        if grep -qE '(AKIA|ghp_|glpat-|-----BEGIN.*KEY)' "$file" 2>/dev/null; then
            SECRETS_FOUND=$((SECRETS_FOUND + 1))
        fi
    fi
done

if [[ "$SECRETS_FOUND" -gt 0 ]]; then
    SUMMARY="${SUMMARY}🚨 ${SECRETS_FOUND} file(s) may contain secrets! "
else
    SUMMARY="${SUMMARY}✅ No secrets detected. "
fi

# Check for npm/yarn audit
if [[ -f "package.json" ]]; then
    if command -v npm &>/dev/null; then
        VULN_COUNT=$(npm audit --json 2>/dev/null | jq -r '.metadata.vulnerabilities.total // 0' 2>/dev/null || echo "?")
        if [[ "$VULN_COUNT" != "0" ]] && [[ "$VULN_COUNT" != "?" ]]; then
            SUMMARY="${SUMMARY}npm: ${VULN_COUNT} vulnerabilities. "
        fi
    fi
fi

echo "{\"systemMessage\": \"${SUMMARY}\"}"
exit 0
