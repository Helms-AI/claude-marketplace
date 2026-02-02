# Agent Marketplace Observability System

## Overview

This observability system provides comprehensive monitoring, alerting, and tracing for the agent marketplace's 58 agents across 10 domains. It's designed to track what's working, identify failures, and enable self-learning through telemetry analysis.

**Key Philosophy**: File-based telemetry with zero external dependencies. All events are logged locally, enabling offline analysis and privacy preservation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Hook Layer                             │
│  PreToolUse │ PostToolUse │ SubagentStart │ SubagentStop   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                  Telemetry Emission                         │
│              emit-event.sh (core emitter)                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                    Event Storage                            │
│  .claude/telemetry/events/*.jsonl (daily rotation)         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│              Processing & Analysis                          │
│  compute-health.sh │ check-alerts.sh │ rotate-logs.sh      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                   Dashboards                                │
│  agent-health.sh │ handoff-trace.sh                        │
└─────────────────────────────────────────────────────────────┘
```

## Event Schema

All telemetry events follow this JSON structure:

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-01T12:34:56.789Z",
  "correlation_id": "20260201-063500-self-learning-agent-system",
  "event_type": "agent.invoked|tool.executed|handoff.started|error.occurred",
  "domain": "frontend|backend|devops|...",
  "agent": "chris-nakamura|alex-kim|...",
  "skill": "/frontend-orchestrator|/backend-api-builder|...",
  "metadata": {
    "tool": "Write|Edit|Bash|Read",
    "file_path": "/path/to/file",
    "command": "bash command if applicable",
    "duration_ms": 1234,
    "exit_code": 0,
    "bytes_written": 5678
  },
  "outcome": "success|failure|blocked|retry",
  "error": {
    "type": "validation_failed|timeout|permission_denied",
    "message": "Human-readable error",
    "recoverable": true
  }
}
```

## Event Types

| Event Type | Emitted When | Purpose |
|------------|-------------|---------|
| `agent.invoked` | SubagentStart hook fires | Track agent invocation patterns |
| `agent.completed` | SubagentStop hook fires | Measure agent success rate |
| `tool.pre_execute` | PreToolUse hook fires | Log tool execution intent |
| `tool.executed` | PostToolUse hook fires | Track tool performance (RED metrics) |
| `handoff.started` | Cross-domain handoff begins | Trace multi-domain workflows |
| `handoff.completed` | Handoff finishes successfully | Measure handoff reliability |
| `error.occurred` | Any failure detected | Identify failure patterns |
| `performance.slow_tool` | Tool exceeds latency threshold | Detect performance anomalies |
| `system.log_rotation` | Log rotation runs | Track system maintenance |

## Correlation Strategy

Every event is tagged with a **correlation_id** to enable request tracing:

- **Changeset-based workflows**: Uses `changeset_id` (e.g., `20260201-063500-self-learning-agent-system`)
- **Ad-hoc requests**: Uses `session_id` from Claude Code

This allows tracing entire request flows across multiple agents and domains using `handoff-trace.sh`.

## Health Signals & SLIs

### 1. Agent Success Rate (PRIMARY SLI)

**Definition**: Percentage of agent invocations that complete without errors

**Target**: > 95% success rate per agent

**Measurement**:
```bash
./scripts/telemetry/compute-health.sh 24h
```

**Alert**: AgentFailureSpike fires if error rate > 10% over 15 minutes

### 2. Tool Execution Performance (RED Method)

**Rate**: Tools executed per second (by type: Write, Edit, Bash, Read)

**Errors**: Failed tool executions / total executions

**Duration**: P50, P95, P99 latencies

**Targets**:
- Write/Edit: P95 < 500ms
- Bash: P95 < 2000ms (context-dependent)
- Read: P95 < 100ms

**Alert**: SlowToolExecution fires if P95 > 2x baseline

### 3. Cross-Domain Handoff Health

**Definition**: Percentage of handoffs that complete successfully

**Target**: > 98% handoff completion

**Measurement**:
```bash
grep handoff.completed .claude/telemetry/events/$(date +%Y-%m-%d).jsonl | wc -l
```

**Alert**: HandoffStuck fires if handoff pending > 5 minutes

### 4. Recovery Patterns

**Definition**: Success rate of retried operations

**Target**: > 80% recovery on first retry

**Use Case**: Identifies transient vs. persistent failures, informs circuit breaker logic

## Alerting System

### Alert Definitions

Alerts are defined in `.claude/telemetry/config/thresholds.json`:

```json
{
  "agent_error_rate_threshold": 0.10,
  "agent_error_window_minutes": 15,
  "handoff_stuck_threshold_minutes": 5,
  "tool_p95_multiplier": 2.0,
  "retry_rate_threshold": 0.20,
  "retry_window_hours": 1
}
```

### Critical Alerts

**AgentFailureSpike**
- Condition: Agent error rate > 10% over 15 minutes
- Severity: Critical
- Action: Review recent tool executions, check hook scripts
- Runbook: Check `.claude/telemetry/events/*.jsonl` for errors

**HandoffStuck**
- Condition: Handoff pending > 5 minutes
- Severity: Critical
- Action: Review handoff context in changeset, check target agent availability
- Runbook: Investigate changeset `.claude/changesets/<id>/handoff_*.json`

**DiskUsageCritical**
- Condition: Telemetry disk usage > 90%
- Severity: Critical
- Action: Run log rotation immediately
- Runbook: `./scripts/telemetry/rotate-logs.sh`

### Warning Alerts

**SlowToolExecution**
- Condition: Tool P95 latency > 2x baseline
- Severity: Warning
- Action: Profile tool execution, check system resources

**HighRetryRate**
- Condition: Retry rate > 20% over 1 hour
- Severity: Warning
- Action: Identify flaky operations, consider circuit breaker

**AgentDegradation**
- Condition: Agent success rate < 95% over 1 hour
- Severity: Warning
- Action: Review recent agent changes, check hook scripts

### Viewing Active Alerts

```bash
cat .claude/telemetry/alerts/active.json
```

Alerts are automatically checked after each event emission (async).

## Self-Healing Triggers

The system includes automatic recovery mechanisms:

### 1. Circuit Breaker Pattern

After **5 consecutive failures**, an agent/skill is temporarily disabled:

```json
{
  "event_type": "system.circuit_breaker_open",
  "agent": "frontend-orchestrator",
  "consecutive_failures": 5,
  "cooldown_minutes": 15
}
```

**Implementation**: Check failure count in `check-alerts.sh`, emit circuit breaker event

### 2. Log Rotation

When telemetry logs exceed **100MB**, rotation triggers automatically:
- Compress logs > 7 days old
- Archive compressed logs
- Delete archives > 30 days old

**Trigger**: `emit-event.sh` checks file size after each write

### 3. Retry with Backoff

Failed operations are auto-retried (max 3 attempts) with exponential backoff:
- 1st retry: 2 seconds
- 2nd retry: 4 seconds
- 3rd retry: 8 seconds

**Tracking**: Recovery rate computed in `compute-health.sh`

### 4. Graceful Degradation

If an advanced agent fails, the system falls back to a simpler alternative:

```
frontend-orchestrator (failure) → frontend-component-architect (fallback)
```

**Implementation**: Define fallback mappings in `.claude-plugin/capabilities.json`

## Storage & Retention

### Directory Structure

```
.claude/
└── telemetry/
    ├── events/
    │   ├── 2026-02-01.jsonl          # Today's events
    │   ├── 2026-01-31.jsonl          # Yesterday's events
    │   └── archive/
    │       ├── 2026-01-24.jsonl.gz   # Compressed (7-30 days)
    │       └── 2026-01-23.jsonl.gz
    ├── metrics/
    │   ├── hourly/
    │   │   └── 2026-02-01-12.json    # Pre-aggregated hourly stats
    │   └── daily/
    │       └── 2026-02-01.json       # Daily rollups
    ├── alerts/
    │   ├── active.json               # Currently firing alerts
    │   └── history.jsonl             # Alert fire/resolve events
    └── config/
        ├── thresholds.json           # Alert thresholds
        └── retention.json            # Log retention policies
```

### Retention Policy

| Data Type | Retention | Storage Format |
|-----------|-----------|----------------|
| Raw events (current) | 7 days | JSONL (uncompressed) |
| Archived events | 30 days | JSONL.gz (gzipped) |
| Hourly metrics | 90 days | JSON |
| Daily metrics | 1 year | JSON |
| Alert history | 1 year | JSONL |

**Disk Usage Estimate**:
- 1000 events/day = ~2MB/day uncompressed
- ~500KB/day compressed
- 30 days = ~15MB total

## Dashboards

### Agent Health Dashboard

Real-time view of agent performance metrics:

```bash
./dashboards/agent-health.sh 24h
```

**Features**:
- Domain-level success rates
- Top performing agents
- Agents needing attention
- Color-coded health status

**Example Output**:
```
╔════════════════════════════════════════════════════════════════════╗
║         Agent Marketplace Health Dashboard (24h)                   ║
╚════════════════════════════════════════════════════════════════════╝

Domain Performance:
───────────────────────────────────────────────────────────────────
frontend             ✓  127 invocations |  97.6% success
backend              ✓   89 invocations |  96.6% success
devops               ⚠   45 invocations |  93.3% success
testing              ✓   34 invocations |  97.1% success

Top Performing Agents:
───────────────────────────────────────────────────────────────────
chris-nakamura                  42 invocations |  100.0% success
alex-kim                        38 invocations |   97.4% success
sam-rivera                      29 invocations |   96.6% success

Agents Needing Attention:
───────────────────────────────────────────────────────────────────
aisha-patel                      3 failures |   91.7% success
```

### Handoff Trace Dashboard

Trace a specific request flow across domains:

```bash
./dashboards/handoff-trace.sh 20260201-063500-self-learning-agent-system
```

**Features**:
- Chronological event timeline
- Domain transition visualization
- Tool execution durations
- Error highlighting
- Summary statistics

**Example Output**:
```
╔════════════════════════════════════════════════════════════════════╗
║              Request Flow Trace                                    ║
║  Correlation ID: 20260201-063500-self-learning-agent-system
╚════════════════════════════════════════════════════════════════════╝

  [12:34:56] Agent Invoked: alex-morgan
             Skill: /pm
  [12:35:01] Agent Completed: alex-morgan (✓ success)

    ↓ HANDOFF to frontend

  [12:35:02] Agent Invoked: chris-nakamura
             Skill: /frontend-orchestrator
  [12:35:03]   Tool: Write (✓ 234 ms)
  [12:35:04]   Tool: Edit (✓ 187 ms)
  [12:35:05]   ✓ Handoff completed from pm

───────────────────────────────────────────────────────────────────
Summary:
  Duration:        2026-02-01T12:34:56Z → 2026-02-01T12:35:05Z
  Total Events:    12
  Agents Invoked:  2
  Tools Executed:  8
  Handoffs:        1
  Errors:          0
───────────────────────────────────────────────────────────────────
```

## Instrumentation Guide

### Adding Telemetry to New Hooks

To instrument a new hook for telemetry:

1. **Capture input context**:
```bash
INPUT=$(cat)
CORRELATION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
```

2. **Create event JSON**:
```bash
EVENT=$(jq -n \
    --arg type "custom.event_type" \
    --arg correlation "$CORRELATION_ID" \
    '{
        event_type: $type,
        correlation_id: $correlation,
        metadata: { /* custom fields */ }
    }')
```

3. **Emit event**:
```bash
echo "$EVENT" | "${CLAUDE_PLUGIN_ROOT}/scripts/telemetry/emit-event.sh"
```

### Custom Metrics

To track custom metrics, emit events with type `metric.*`:

```bash
EVENT=$(jq -n \
    --arg type "metric.custom_counter" \
    --arg value "42" \
    '{
        event_type: $type,
        metric_name: "deployment_success_count",
        metric_value: ($value | tonumber),
        tags: {
            environment: "production",
            region: "us-west-2"
        }
    }')

echo "$EVENT" | "${CLAUDE_PLUGIN_ROOT}/scripts/telemetry/emit-event.sh"
```

## Querying Telemetry Data

### Finding Events by Type

```bash
grep '"event_type":"agent.completed"' .claude/telemetry/events/$(date +%Y-%m-%d).jsonl | jq .
```

### Filtering by Correlation ID

```bash
./dashboards/handoff-trace.sh 20260201-063500-self-learning-agent-system
```

### Computing Custom Metrics

```bash
# Count events by domain
cat .claude/telemetry/events/$(date +%Y-%m-%d).jsonl | \
    jq -r 'select(.event_type == "agent.completed") | .domain' | \
    sort | uniq -c
```

### Exporting for Analysis

```bash
# Export last 7 days to CSV
for i in {0..6}; do
    DATE=$(date -u -v-"${i}"d +%Y-%m-%d 2>/dev/null || date -u -d "$i days ago" +%Y-%m-%d)
    if [[ -f ".claude/telemetry/events/${DATE}.jsonl" ]]; then
        cat ".claude/telemetry/events/${DATE}.jsonl" | \
            jq -r '[.timestamp, .event_type, .domain, .agent, .outcome] | @csv'
    fi
done > telemetry_export.csv
```

## Integration with Self-Learning System

This observability system enables self-learning through:

### 1. Success Pattern Detection

Identify what works:
```bash
# Find agents with >98% success rate
cat .claude/telemetry/events/*.jsonl | \
    jq -r 'select(.event_type == "agent.completed" and .outcome == "success") | .agent' | \
    sort | uniq -c | sort -rn
```

### 2. Failure Pattern Analysis

Identify what fails:
```bash
# Find common failure patterns
cat .claude/telemetry/events/*.jsonl | \
    jq -r 'select(.event_type == "error.occurred") | [.error.type, .agent, .skill] | @tsv'
```

### 3. Performance Profiling

Optimize slow operations:
```bash
# Find slowest tools
cat .claude/telemetry/events/*.jsonl | \
    jq -r 'select(.event_type == "tool.executed") | [.tool, .metadata.duration_ms] | @tsv' | \
    sort -k2 -rn | head -20
```

### 4. Handoff Optimization

Identify efficient collaboration paths:
```bash
# Analyze handoff patterns
cat .claude/telemetry/events/*.jsonl | \
    jq -r 'select(.event_type == "handoff.completed") | [.source_domain, .target_domain] | @tsv' | \
    sort | uniq -c
```

## Troubleshooting

### No telemetry events being emitted

1. Check hook installation:
```bash
jq '.hooks' /Users/kon1790/GitHub/claude-marketplace/plugins/devops/hooks/hooks.json
```

2. Verify script permissions:
```bash
ls -l /Users/kon1790/GitHub/claude-marketplace/plugins/devops/scripts/telemetry/*.sh
```

3. Check for errors in hook execution:
```bash
# Claude Code logs will show hook failures
```

### Alerts not firing

1. Verify alert checker is running:
```bash
ps aux | grep check-alerts.sh
```

2. Check thresholds configuration:
```bash
cat .claude/telemetry/config/thresholds.json
```

3. Manually run alert checker:
```bash
./scripts/telemetry/check-alerts.sh
```

### High disk usage

Run log rotation manually:
```bash
./scripts/telemetry/rotate-logs.sh
```

Adjust retention policy:
```bash
# Edit config/retention.json to reduce retention periods
```

## Best Practices

1. **Minimize noise**: Only emit events that provide actionable insights
2. **Use correlation IDs**: Always tag events with correlation_id for request tracing
3. **Sample high-volume events**: For very frequent events (>1000/min), implement sampling
4. **Rotate logs proactively**: Don't wait for disk alerts - schedule rotation daily
5. **Review dashboards regularly**: Check `agent-health.sh` weekly to spot trends
6. **Tune alert thresholds**: Adjust based on actual system behavior to reduce false positives
7. **Document custom events**: Add new event types to this guide for team alignment

## Future Enhancements

- **Machine Learning**: Train models on success/failure patterns for predictive alerting
- **Anomaly Detection**: Use statistical methods to detect unusual patterns
- **Dashboard Web UI**: Integrate visualizations into `/dashboard` plugin
- **Distributed Tracing**: Add parent/child span relationships for nested operations
- **Exporters**: Add integrations for Prometheus, Datadog, etc. (optional)
- **Real-time Streaming**: WebSocket-based live dashboards

---

**Monitoring Engineer**: Aisha Patel
**Version**: 1.0.0
**Last Updated**: 2026-02-01
