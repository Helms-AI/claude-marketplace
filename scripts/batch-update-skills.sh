#!/bin/bash
# Batch update all skills with modern Claude Code frontmatter
set -euo pipefail

cd "$(dirname "$0")/.."

update_skill() {
    local path="$1"
    local arg_hint="$2"
    local user_invocable="$3"
    local dynamic_ctx="${4:-}"
    local allowed_tools="${5:-}"
    
    if [[ ! -f "$path" ]]; then
        echo "SKIP: $path not found"
        return
    fi
    
    # Read current file
    local content=$(cat "$path")
    
    # Extract name and description from frontmatter
    local name=$(echo "$content" | grep -E '^name:' | head -1 | sed 's/^name: *//')
    local desc=$(echo "$content" | grep -E '^description:' | head -1 | sed 's/^description: *//')
    
    # Get body after frontmatter (skip first --- and everything until second ---)
    local body=$(echo "$content" | awk '/^---$/{n++} n==2{print; n=3} n==3{print}' | tail -n +2)
    
    # Build new frontmatter
    local new_front="---
name: $name
description: $desc"
    
    if [[ -n "$arg_hint" && "$arg_hint" != "none" ]]; then
        new_front="$new_front
argument-hint: \"$arg_hint\""
    fi
    
    if [[ "$user_invocable" == "false" ]]; then
        new_front="$new_front
user-invocable: false"
    fi
    
    if [[ -n "$allowed_tools" ]]; then
        new_front="$new_front
allowed-tools:
$(echo "$allowed_tools" | tr ',' '\n' | sed 's/^/  - /')"
    fi
    
    new_front="$new_front
---"
    
    # Add dynamic context if provided
    if [[ -n "$dynamic_ctx" ]]; then
        new_front="$new_front

# Dynamic Context

\`\`\`
$dynamic_ctx
\`\`\`"
    fi
    
    # Write new file
    echo "$new_front" > "$path"
    echo "" >> "$path"
    echo "$body" >> "$path"
    
    echo "OK: $path"
}

echo "=== Updating Frontend Skills ==="
update_skill "plugins/frontend/skills/frontend-component-architect/SKILL.md" "[component-name]" "true" "!ls src/components/ 2>/dev/null | head -10" "Read,Write,Edit,Grep,Glob,Bash"
update_skill "plugins/frontend/skills/frontend-design-system/SKILL.md" "[token-category|theme]" "true" "!cat tailwind.config.* 2>/dev/null | head -20" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/frontend/skills/frontend-accessibility-auditor/SKILL.md" "[component|page]" "true" "" "Read,Grep,Glob,Bash"
update_skill "plugins/frontend/skills/frontend-performance-engineer/SKILL.md" "[page|component]" "true" "!cat package.json | jq '.scripts' 2>/dev/null" "Read,Grep,Glob,Bash"
update_skill "plugins/frontend/skills/frontend-responsive-engineer/SKILL.md" "[breakpoint|component]" "true" "" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/frontend/skills/frontend-motion-designer/SKILL.md" "[animation-type]" "true" "" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/frontend/skills/frontend-progress-ui/SKILL.md" "[loading-pattern]" "true" "" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/frontend/skills/frontend-form-experience/SKILL.md" "[form-type]" "true" "" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/frontend/skills/frontend-navigation-patterns/SKILL.md" "[nav-type]" "true" "" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/frontend/skills/frontend-data-grid/SKILL.md" "[grid-feature]" "true" "" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/frontend/skills/frontend-data-viz/SKILL.md" "[chart-type]" "true" "" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/frontend/skills/frontend-storybook/SKILL.md" "[component-name]" "true" "!ls .storybook/ 2>/dev/null" "Read,Write,Edit,Grep,Glob,Bash"
update_skill "plugins/frontend/skills/frontend-figma-sync/SKILL.md" "[figma-file-url]" "true" "" "Read,Write,Grep,Glob"
update_skill "plugins/frontend/skills/frontend-team-session/SKILL.md" "none" "false" "" "Read,Grep,Glob,Task"

echo ""
echo "=== Updating Architecture Skills ==="
update_skill "plugins/architecture/skills/arch-orchestrator/SKILL.md" "[system|feature]" "true" "!ls docs/architecture/ 2>/dev/null | head -5" "Read,Grep,Glob,Task"
update_skill "plugins/architecture/skills/arch-adr-writer/SKILL.md" "[decision-title]" "true" "!ls docs/decisions/ 2>/dev/null | tail -5" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/architecture/skills/arch-api-designer/SKILL.md" "[api-name]" "true" "!cat openapi.yaml 2>/dev/null | head -20" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/architecture/skills/arch-diagram-creator/SKILL.md" "[diagram-type]" "true" "" "Read,Write,Grep,Glob"
update_skill "plugins/architecture/skills/arch-pattern-advisor/SKILL.md" "[pattern-category]" "true" "" "Read,Grep,Glob"
update_skill "plugins/architecture/skills/arch-system-designer/SKILL.md" "[system-scope]" "true" "" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/architecture/skills/arch-team-session/SKILL.md" "none" "false" "" "Read,Grep,Glob,Task"

echo ""
echo "=== Updating Backend Skills ==="
update_skill "plugins/backend/skills/backend-orchestrator/SKILL.md" "[api|service|feature]" "true" "!git status --short -- '*.py' '*.go' '*.rs' 2>/dev/null | head -10" "Read,Grep,Glob,Task"
update_skill "plugins/backend/skills/backend-api-builder/SKILL.md" "[endpoint-path]" "true" "!cat openapi.yaml 2>/dev/null | head -20" "Read,Write,Edit,Grep,Glob,Bash"
update_skill "plugins/backend/skills/backend-auth-architect/SKILL.md" "[auth-method]" "true" "" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/backend/skills/backend-database-modeler/SKILL.md" "[table|model]" "true" "!cat prisma/schema.prisma 2>/dev/null | head -30" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/backend/skills/backend-integration-specialist/SKILL.md" "[service-name]" "true" "" "Read,Write,Edit,Grep,Glob,Bash"
update_skill "plugins/backend/skills/backend-service-builder/SKILL.md" "[service-name]" "true" "" "Read,Write,Edit,Grep,Glob,Bash"
update_skill "plugins/backend/skills/backend-team-session/SKILL.md" "none" "false" "" "Read,Grep,Glob,Task"

echo ""
echo "=== Updating Testing Skills ==="
update_skill "plugins/testing/skills/testing-orchestrator/SKILL.md" "[test-scope]" "true" "!npm test -- --listTests 2>/dev/null | head -10" "Read,Grep,Glob,Task,Bash"
update_skill "plugins/testing/skills/testing-unit-specialist/SKILL.md" "[file|function]" "true" "" "Read,Write,Edit,Grep,Glob,Bash"
update_skill "plugins/testing/skills/testing-integration-specialist/SKILL.md" "[integration-scope]" "true" "" "Read,Write,Edit,Grep,Glob,Bash"
update_skill "plugins/testing/skills/testing-e2e-engineer/SKILL.md" "[flow|page]" "true" "!ls e2e/ tests/e2e/ 2>/dev/null | head -10" "Read,Write,Edit,Grep,Glob,Bash"
update_skill "plugins/testing/skills/testing-coverage-analyzer/SKILL.md" "[threshold]" "true" "!cat coverage/coverage-summary.json 2>/dev/null | jq '.total'" "Read,Grep,Glob,Bash"
update_skill "plugins/testing/skills/testing-strategy-advisor/SKILL.md" "[test-type]" "true" "" "Read,Grep,Glob"
update_skill "plugins/testing/skills/testing-team-session/SKILL.md" "none" "false" "" "Read,Grep,Glob,Task"

echo ""
echo "=== Updating Security Skills ==="
update_skill "plugins/security/skills/security-orchestrator/SKILL.md" "[audit-scope]" "true" "!npm audit --json 2>/dev/null | jq '.metadata.vulnerabilities'" "Read,Grep,Glob,Task,Bash"
update_skill "plugins/security/skills/security-auditor/SKILL.md" "[component|codebase]" "true" "" "Read,Grep,Glob,Bash"
update_skill "plugins/security/skills/security-threat-modeler/SKILL.md" "[system|feature]" "true" "" "Read,Write,Grep,Glob"
update_skill "plugins/security/skills/security-penetration-advisor/SKILL.md" "[attack-surface]" "true" "" "Read,Grep,Glob"
update_skill "plugins/security/skills/security-compliance-advisor/SKILL.md" "[framework]" "true" "" "Read,Grep,Glob"
update_skill "plugins/security/skills/security-secrets-manager/SKILL.md" "[secret-type]" "true" "" "Read,Grep,Glob"
update_skill "plugins/security/skills/security-team-session/SKILL.md" "none" "false" "" "Read,Grep,Glob,Task"

echo ""
echo "=== Updating DevOps Skills ==="
update_skill "plugins/devops/skills/devops-orchestrator/SKILL.md" "[deploy|pipeline|infra]" "true" "!git log --oneline -5" "Read,Grep,Glob,Task,Bash"
update_skill "plugins/devops/skills/devops-ci-architect/SKILL.md" "[pipeline-stage]" "true" "!cat .github/workflows/*.yml 2>/dev/null | head -30" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/devops/skills/devops-container-specialist/SKILL.md" "[container|service]" "true" "!cat Dockerfile 2>/dev/null | head -20" "Read,Write,Edit,Grep,Glob,Bash"
update_skill "plugins/devops/skills/devops-deployment-engineer/SKILL.md" "[environment]" "true" "" "Read,Write,Edit,Grep,Glob,Bash"
update_skill "plugins/devops/skills/devops-infrastructure-specialist/SKILL.md" "[resource-type]" "true" "!ls terraform/ 2>/dev/null | head -10" "Read,Write,Edit,Grep,Glob,Bash"
update_skill "plugins/devops/skills/devops-monitoring-engineer/SKILL.md" "[metric|alert]" "true" "" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/devops/skills/devops-team-session/SKILL.md" "none" "false" "" "Read,Grep,Glob,Task"

echo ""
echo "=== Updating Data Skills ==="
update_skill "plugins/data/skills/data-orchestrator/SKILL.md" "[pipeline|model|query]" "true" "!ls models/ dbt/ 2>/dev/null | head -10" "Read,Grep,Glob,Task"
update_skill "plugins/data/skills/data-pipeline-architect/SKILL.md" "[pipeline-name]" "true" "" "Read,Write,Edit,Grep,Glob,Bash"
update_skill "plugins/data/skills/data-modeler/SKILL.md" "[model-name]" "true" "!cat dbt_project.yml 2>/dev/null | head -20" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/data/skills/data-warehouse-specialist/SKILL.md" "[schema|table]" "true" "" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/data/skills/data-analytics-engineer/SKILL.md" "[metric|report]" "true" "" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/data/skills/data-governance-advisor/SKILL.md" "[policy-type]" "true" "" "Read,Grep,Glob"
update_skill "plugins/data/skills/data-team-session/SKILL.md" "none" "false" "" "Read,Grep,Glob,Task"

echo ""
echo "=== Updating Documentation Skills ==="
update_skill "plugins/documentation/skills/docs-orchestrator/SKILL.md" "[doc-type]" "true" "!ls docs/ 2>/dev/null | head -10" "Read,Grep,Glob,Task"
update_skill "plugins/documentation/skills/docs-api-writer/SKILL.md" "[api-name]" "true" "!cat openapi.yaml 2>/dev/null | head -30" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/documentation/skills/docs-architecture-documenter/SKILL.md" "[system-name]" "true" "" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/documentation/skills/docs-guide-writer/SKILL.md" "[guide-topic]" "true" "" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/documentation/skills/docs-onboarding-creator/SKILL.md" "[role|team]" "true" "" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/documentation/skills/docs-runbook-writer/SKILL.md" "[process-name]" "true" "" "Read,Write,Edit,Grep,Glob"
update_skill "plugins/documentation/skills/docs-team-session/SKILL.md" "none" "false" "" "Read,Grep,Glob,Task"

echo ""
echo "=== Updating User Experience Skills ==="
update_skill "plugins/user-experience/skills/user-experience-orchestrator/SKILL.md" "[design-scope]" "true" "" "Read,Grep,Glob,Task"
update_skill "plugins/user-experience/skills/user-experience-user-researcher/SKILL.md" "[research-method]" "true" "" "Read,Write,Grep,Glob"
update_skill "plugins/user-experience/skills/user-experience-aesthetic-director/SKILL.md" "[aesthetic-style]" "true" "" "Read,Write,Grep,Glob"
update_skill "plugins/user-experience/skills/user-experience-typography-curator/SKILL.md" "[font-category]" "true" "" "Read,Write,Grep,Glob"
update_skill "plugins/user-experience/skills/user-experience-color-alchemist/SKILL.md" "[palette-type]" "true" "" "Read,Write,Grep,Glob"
update_skill "plugins/user-experience/skills/user-experience-layout-composer/SKILL.md" "[layout-type]" "true" "" "Read,Write,Grep,Glob"
update_skill "plugins/user-experience/skills/user-experience-texture-atmosphere/SKILL.md" "[texture-style]" "true" "" "Read,Write,Grep,Glob"
update_skill "plugins/user-experience/skills/user-experience-micro-delight/SKILL.md" "[interaction-type]" "true" "" "Read,Write,Grep,Glob"
update_skill "plugins/user-experience/skills/user-experience-team-session/SKILL.md" "none" "false" "" "Read,Grep,Glob,Task"

echo ""
echo "=== Updating Dashboard Skills ==="
update_skill "plugins/dashboard/skills/dashboard/SKILL.md" "[component|feature]" "true" "!ls plugins/dashboard/web/js/components/ 2>/dev/null | head -10" "Read,Write,Edit,Grep,Glob,Bash"

echo ""
echo "=== Complete ==="
