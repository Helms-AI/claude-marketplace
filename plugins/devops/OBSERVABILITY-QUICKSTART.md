# Observability Quick Start Guide

Get up and running with agent marketplace observability in 5 minutes.

## Installation

The observability hooks are automatically active when the DevOps plugin is loaded. No additional installation required.

## Verify Telemetry is Working

After running a few agent invocations, check for telemetry events:

```bash
# Check if events are being logged
ls -lh .claude/telemetry/events/

# View today's events
cat .claude/telemetry/events/$(date +%Y-%m-%d).jsonl | jq .
```

You should see events like:
```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-01T12:34:56.789Z",
  "event_type": "agent.invoked",
  "agent": "chris-nakamura",
  "skill": "/frontend-orchestrator"
}
```

## View Agent Health Dashboard

Check overall system health:

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops
./dashboards/agent-health.sh 24h
```

This shows:
- Domain-level success rates
- Top performing agents
- Agents needing attention

## Trace a Specific Request

Find your correlation ID (changeset ID or session ID):

```bash
ls .claude/changesets/
```

Then trace the request flow:

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops
./dashboards/handoff-trace.sh 20260201-063500-self-learning-agent-system
```

This shows:
- Chronological event timeline
- Cross-domain handoffs
- Tool executions
- Errors

## Compute Health Metrics

Generate a detailed health report:

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops
./scripts/telemetry/compute-health.sh 24h
```

Available time windows: `1h`, `24h`, `7d`

## Check Active Alerts

View currently firing alerts:

```bash
cat .claude/telemetry/alerts/active.json | jq .
```

Example output:
```json
{
  "alerts": [
    {
      "alert_id": "agent-failure-spike-1738425600",
      "name": "AgentFailureSpike",
      "severity": "critical",
      "message": "Agent error rate (0.1234) exceeds threshold (0.10)",
      "fired_at": "2026-02-01T12:00:00Z",
      "status": "firing"
    }
  ]
}
```

## Common Queries

### Find All Errors Today

```bash
grep '"event_type":"error.occurred"' .claude/telemetry/events/$(date +%Y-%m-%d).jsonl | jq .
```

### Count Events by Type

```bash
cat .claude/telemetry/events/$(date +%Y-%m-%d).jsonl | \
    jq -r '.event_type' | \
    sort | uniq -c
```

### Find Slowest Tool Executions

```bash
cat .claude/telemetry/events/$(date +%Y-%m-%d).jsonl | \
    jq -r 'select(.event_type == "tool.executed") | [.tool, .metadata.duration_ms] | @tsv' | \
    sort -k2 -rn | head -10
```

### Agent Success Rate by Domain

```bash
cat .claude/telemetry/events/$(date +%Y-%m-%d).jsonl | \
    jq -r 'select(.event_type == "agent.completed") | [.domain, .outcome] | @tsv' | \
    awk '{domain[$1]++; if($2=="success") success[$1]++} END {for(d in domain) printf "%-20s %3d total | %3d success | %.1f%%\n", d, domain[d], success[d], (success[d]/domain[d])*100}' | \
    sort -k5 -rn
```

## Configuration

### Adjust Alert Thresholds

Copy the example config:

```bash
cp config/thresholds.example.json .claude/telemetry/config/thresholds.json
```

Edit thresholds:

```json
{
  "agent_error_rate_threshold": 0.10,      // Fire alert at 10% error rate
  "handoff_stuck_threshold_minutes": 5,    // Fire alert after 5 minutes
  "tool_p95_multiplier": 2.0               // Fire alert if 2x slower than baseline
}
```

### Adjust Retention Policy

Copy the example config:

```bash
cp config/retention.example.json .claude/telemetry/config/retention.json
```

Edit retention periods:

```json
{
  "raw_events": {
    "current_days": 7,        // Keep uncompressed for 7 days
    "archive_days": 30        // Keep compressed for 30 days
  }
}
```

## Manual Operations

### Run Log Rotation

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops
./scripts/telemetry/rotate-logs.sh
```

This:
- Compresses logs older than 7 days
- Archives compressed logs
- Deletes archives older than 30 days

### Check Alerts Manually

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops
./scripts/telemetry/check-alerts.sh
```

Normally runs automatically after each event.

### Export Telemetry Data

Export to CSV for external analysis:

```bash
# Last 7 days
for i in {0..6}; do
    DATE=$(date -u -v-"${i}"d +%Y-%m-%d 2>/dev/null || date -u -d "$i days ago" +%Y-%m-%d)
    if [[ -f ".claude/telemetry/events/${DATE}.jsonl" ]]; then
        cat ".claude/telemetry/events/${DATE}.jsonl" | \
            jq -r '[.timestamp, .event_type, .domain, .agent, .outcome] | @csv'
    fi
done > telemetry_export.csv
```

## Integration with Self-Learning

Use telemetry data to train agent behavior:

### Identify Success Patterns

```bash
# Find agents with >98% success rate
cat .claude/telemetry/events/*.jsonl | \
    jq -r 'select(.event_type == "agent.completed" and .outcome == "success") | .agent' | \
    sort | uniq -c | sort -rn | head -10
```

### Identify Failure Patterns

```bash
# Find common errors
cat .claude/telemetry/events/*.jsonl | \
    jq -r 'select(.event_type == "error.occurred") | [.error.type, .agent, .skill] | @tsv' | \
    sort | uniq -c | sort -rn
```

### Analyze Handoff Patterns

```bash
# Most common handoff paths
cat .claude/telemetry/events/*.jsonl | \
    jq -r 'select(.event_type == "handoff.completed") | [.source_domain, "→", .target_domain] | @tsv' | \
    sort | uniq -c | sort -rn
```

## Troubleshooting

### No events being logged

1. Check hook configuration:
```bash
jq '.hooks' hooks/hooks.json
```

2. Verify scripts are executable:
```bash
ls -l scripts/telemetry/*.sh
```

3. Check Claude Code logs for hook errors

### Dashboards not working

1. Make sure you're in the devops plugin directory:
```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops
```

2. Verify telemetry events exist:
```bash
ls -lh .claude/telemetry/events/
```

3. Check script has execute permission:
```bash
chmod +x dashboards/agent-health.sh
```

### High disk usage

Run log rotation immediately:
```bash
./scripts/telemetry/rotate-logs.sh
```

Check disk usage:
```bash
du -sh .claude/telemetry/
```

## Next Steps

1. **Review Full Documentation**: See `OBSERVABILITY.md` for comprehensive guide
2. **Set Up Alerts**: Configure `thresholds.json` for your team's needs
3. **Create Custom Dashboards**: Build domain-specific views using the event data
4. **Integrate with Dashboard UI**: Visualize metrics in `/dashboard` plugin
5. **Train Self-Learning Models**: Use telemetry to improve agent behavior

## Key Metrics to Watch

| Metric | Target | Command |
|--------|--------|---------|
| Agent Success Rate | > 95% | `./scripts/telemetry/compute-health.sh 24h` |
| Handoff Completion | > 98% | `grep handoff.completed .claude/telemetry/events/*.jsonl \| wc -l` |
| Tool P95 Latency | < 500ms (Write/Edit) | `grep tool.executed .claude/telemetry/events/*.jsonl \| jq '.metadata.duration_ms'` |
| Active Alerts | 0 | `cat .claude/telemetry/alerts/active.json` |

---

**Questions?** See full docs in `OBSERVABILITY.md` or reach out to Aisha Patel (Monitoring Engineer)
