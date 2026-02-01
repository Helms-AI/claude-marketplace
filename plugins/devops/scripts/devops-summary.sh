#!/bin/bash
# DevOps Plugin - Summary on Subagent Stop
# Summarizes infrastructure changes
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

# Count by type
TF_COUNT=$(echo "$MODIFIED" | grep -c '\.tf$' || echo "0")
K8S_COUNT=$(echo "$MODIFIED" | grep -ciE 'k8s.*\.ya?ml$|manifests.*\.ya?ml$' || echo "0")
DOCKER_COUNT=$(echo "$MODIFIED" | grep -ci 'Dockerfile' || echo "0")
CI_COUNT=$(echo "$MODIFIED" | grep -c '\.github/workflows/' || echo "0")

if [[ "$TF_COUNT" -gt 0 ]]; then
    SUMMARY="${SUMMARY}Terraform: ${TF_COUNT} file(s). "
fi
if [[ "$K8S_COUNT" -gt 0 ]]; then
    SUMMARY="${SUMMARY}K8s: ${K8S_COUNT} manifest(s). "
fi
if [[ "$DOCKER_COUNT" -gt 0 ]]; then
    SUMMARY="${SUMMARY}Docker: ${DOCKER_COUNT} file(s). "
fi
if [[ "$CI_COUNT" -gt 0 ]]; then
    SUMMARY="${SUMMARY}CI/CD: ${CI_COUNT} workflow(s). "
fi

if [[ -n "$SUMMARY" ]]; then
    echo "{\"systemMessage\": \"🚀 DevOps changes: ${SUMMARY}Review and test before deploying.\"}"
fi

exit 0
