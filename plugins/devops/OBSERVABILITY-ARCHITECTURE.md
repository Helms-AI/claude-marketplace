# Observability System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  Agent Marketplace (58 Agents)                  │
│                                                                 │
│  Frontend (14)  Backend (5)  DevOps (5)  Testing (5)          │
│  Architecture (5)  Data (5)  Security (5)  Docs (5)            │
│  User-Experience (8)  PM (1)                                    │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ Agent invocations, tool executions,
                        │ cross-domain handoffs
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Hook Instrumentation Layer                   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ PreToolUse   │  │ PostToolUse  │  │ SubagentStart│         │
│  │              │  │              │  │              │         │
│  │ Write, Edit, │  │ Write, Edit, │  │ All agents   │         │
│  │ Bash         │  │ Bash         │  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│         ↓                  ↓                  ↓                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ pre-tool-    │  │ post-tool-   │  │ subagent-    │         │
│  │ monitor.sh   │  │ monitor.sh   │  │ start.sh     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│         │  ┌──────────────┐│                  │                 │
│         │  │ SubagentStop ││                  │                 │
│         │  │              ││                  │                 │
│         │  │ All agents   ││                  │                 │
│         │  └──────┬───────┘│                  │                 │
│         │         │        │                  │                 │
│         │         ↓        │                  │                 │
│         │  ┌──────────────┐│                  │                 │
│         │  │ subagent-    ││                  │                 │
│         │  │ stop.sh      ││                  │                 │
│         │  └──────┬───────┘│                  │                 │
│         │         │        │                  │                 │
└─────────┼─────────┼────────┼──────────────────┼─────────────────┘
          │         │        │                  │
          └─────────┴────────┴──────────────────┘
                             │
                             │ Structured JSON events
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Event Emitter (Core)                       │
│                                                                 │
│                     emit-event.sh                               │
│                                                                 │
│  • Enriches events with metadata (event_id, timestamp)         │
│  • Appends to daily JSONL log (atomic writes)                  │
│  • Checks file size (triggers rotation if >100MB)              │
│  • Triggers async alert checks                                 │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Event stream
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Telemetry Storage                           │
│                   (.claude/telemetry/)                          │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ events/        │  │ metrics/       │  │ alerts/        │   │
│  │                │  │                │  │                │   │
│  │ 2026-02-01.    │  │ hourly/        │  │ active.json    │   │
│  │   jsonl        │  │ daily/         │  │ history.jsonl  │   │
│  │                │  │                │  │                │   │
│  │ archive/       │  │ (aggregated)   │  │ (current +     │   │
│  │   *.jsonl.gz   │  │                │  │  historical)   │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│                                                                 │
│  Retention:                                                     │
│  • Raw events: 7 days (uncompressed)                           │
│  • Archived: 30 days (gzipped)                                 │
│  • Metrics: 90 days (hourly), 1 year (daily)                   │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Periodic analysis
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Processing & Analysis Layer                    │
│                                                                 │
│  ┌───────────────────────┐  ┌───────────────────────┐          │
│  │ compute-health.sh     │  │ check-alerts.sh       │          │
│  │                       │  │                       │          │
│  │ • Agent success rate  │  │ • AgentFailureSpike   │          │
│  │ • Tool latencies      │  │ • HandoffStuck        │          │
│  │ • Handoff completion  │  │ • SlowToolExecution   │          │
│  │ • Recovery patterns   │  │ • HighRetryRate       │          │
│  │                       │  │ • DiskUsageCritical   │          │
│  └───────────────────────┘  └───────────────────────┘          │
│                                                                 │
│  ┌───────────────────────┐                                     │
│  │ rotate-logs.sh        │                                     │
│  │                       │                                     │
│  │ • Compress old logs   │                                     │
│  │ • Archive compressed  │                                     │
│  │ • Delete > 30 days    │                                     │
│  └───────────────────────┘                                     │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Visualization
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Dashboard Layer                            │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │ agent-health.sh          │  │ handoff-trace.sh         │    │
│  │                          │  │                          │    │
│  │ • Domain performance     │  │ • Chronological timeline │    │
│  │ • Agent success rates    │  │ • Cross-domain handoffs  │    │
│  │ • Top performers         │  │ • Tool executions        │    │
│  │ • Agents needing help    │  │ • Error highlighting     │    │
│  │ • Recommendations        │  │ • Summary statistics     │    │
│  │                          │  │                          │    │
│  │ Output: CLI dashboard    │  │ Output: Request trace    │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Event Flow

```
1. Agent Invocation
   │
   ├─→ SubagentStart hook fires
   │   └─→ subagent-start-monitor.sh
   │       └─→ Emits: agent.invoked
   │           └─→ If cross-domain: handoff.started
   │
2. Tool Execution
   │
   ├─→ PreToolUse hook fires
   │   └─→ pre-tool-monitor.sh
   │       └─→ Emits: tool.pre_execute
   │
   ├─→ Tool executes (Write, Edit, Bash, etc.)
   │
   ├─→ PostToolUse hook fires
   │   └─→ post-tool-monitor.sh
   │       └─→ Emits: tool.executed
   │           └─→ If slow (>5s): performance.slow_tool
   │
3. Agent Completion
   │
   └─→ SubagentStop hook fires
       └─→ subagent-stop-monitor.sh
           └─→ Emits: agent.completed
               └─→ If failed: error.occurred
               └─→ If handoff: handoff.completed
```

## Data Flow

```
┌──────────────┐
│ Event Source │
│ (Hook)       │
└──────┬───────┘
       │
       │ JSON event
       ↓
┌──────────────────┐
│ emit-event.sh    │
│ • Add event_id   │
│ • Add timestamp  │
│ • Add hostname   │
└──────┬───────────┘
       │
       │ Enriched JSON
       ↓
┌──────────────────────────┐
│ Daily JSONL Log          │
│ .claude/telemetry/events/│
│ 2026-02-01.jsonl         │
│                          │
│ {"event_id": "...",      │
│  "timestamp": "...",     │
│  "event_type": "...",    │
│  ...}                    │
└──────┬───────────────────┘
       │
       │ Async triggers
       ↓
┌──────────────────┐    ┌──────────────────┐
│ check-alerts.sh  │    │ rotate-logs.sh   │
│ (if conditions   │    │ (if > 100MB)     │
│  met)            │    │                  │
└──────┬───────────┘    └──────────────────┘
       │
       │ Alert events
       ↓
┌──────────────────┐
│ active.json      │
│ history.jsonl    │
└──────────────────┘
```

## Self-Healing Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Error Detection                          │
│                                                                 │
│  check-alerts.sh continuously monitors:                         │
│  • Agent failure rate                                           │
│  • Handoff completion                                           │
│  • Tool performance                                             │
│  • Disk usage                                                   │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Threshold exceeded
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Self-Healing Triggers                        │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ Circuit Breaker      │  │ Log Rotation         │            │
│  │                      │  │                      │            │
│  │ 5 consecutive fails  │  │ Disk > 100MB         │            │
│  │ → Disable for 15min  │  │ → Compress old logs  │            │
│  │ → Route to fallback  │  │ → Delete > 30 days   │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ Retry with Backoff   │  │ Graceful Degradation │            │
│  │                      │  │                      │            │
│  │ Failed operation     │  │ Advanced agent fails │            │
│  │ → Retry 2s, 4s, 8s   │  │ → Fall back to basic │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Emit recovery event
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Telemetry Feedback                         │
│                                                                 │
│  Recovery events logged for future analysis:                   │
│  • system.circuit_breaker_open                                 │
│  • system.log_rotation                                         │
│  • system.retry_success                                        │
│  • system.fallback_invoked                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Self-Learning Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    Raw Telemetry Events                         │
│                                                                 │
│  agent.invoked, agent.completed, tool.executed,                │
│  handoff.started, handoff.completed, error.occurred            │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Batch processing (daily)
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Pattern Analysis                           │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Success Patterns │  │ Failure Patterns │  │ Performance  │ │
│  │                  │  │                  │  │ Bottlenecks  │ │
│  │ • Which agents   │  │ • Common errors  │  │ • Slow tools │ │
│  │   succeed most?  │  │ • Failure modes  │  │ • Slow paths │ │
│  │ • Optimal paths  │  │ • Error context  │  │ • Latencies  │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Feature extraction
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Model Training                             │
│                                                                 │
│  Features:                                                      │
│  • Agent name, skill, domain                                   │
│  • Tool sequence, latencies                                    │
│  • Handoff patterns                                            │
│  • Error types, recovery attempts                              │
│                                                                 │
│  Labels:                                                        │
│  • Success / Failure                                           │
│  • Performance (fast/slow)                                     │
│  • Recovery (successful/failed)                                │
│                                                                 │
│  Models:                                                        │
│  • Success predictor (which agents will succeed?)              │
│  • Anomaly detector (unusual patterns?)                        │
│  • Performance optimizer (faster paths?)                       │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Inference
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Automated Decisions                           │
│                                                                 │
│  • Route requests to high-success agents                       │
│  • Preemptively avoid known failure patterns                   │
│  • Optimize tool execution order                               │
│  • Predict and prevent degradation                             │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Feedback loop
                         ↓
                   [Back to Raw Events]
```

## Configuration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Configuration Hierarchy                        │
│                                                                 │
│  ┌─────────────────────────────────────────┐                   │
│  │ thresholds.json                         │                   │
│  │                                         │                   │
│  │ • agent_error_rate_threshold: 0.10      │                   │
│  │ • handoff_stuck_threshold_minutes: 5    │                   │
│  │ • tool_p95_multiplier: 2.0              │                   │
│  │ • circuit_breaker_failures: 5           │                   │
│  │ • circuit_breaker_cooldown: 15          │                   │
│  │                                         │                   │
│  │ Baselines:                              │                   │
│  │ • Write: P50=200ms, P95=500ms           │                   │
│  │ • Edit:  P50=150ms, P95=400ms           │                   │
│  │ • Bash:  P50=500ms, P95=2000ms          │                   │
│  │ • Read:  P50=50ms,  P95=100ms           │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                 │
│  ┌─────────────────────────────────────────┐                   │
│  │ retention.json                          │                   │
│  │                                         │                   │
│  │ • raw_events: 7 days (uncompressed)     │                   │
│  │ • archived_events: 30 days (gzipped)    │                   │
│  │ • hourly_metrics: 90 days               │                   │
│  │ • daily_metrics: 365 days               │                   │
│  │ • alert_history: 365 days               │                   │
│  │                                         │                   │
│  │ Disk limits:                            │                   │
│  │ • max_total_size_mb: 500                │                   │
│  │ • warning_threshold_mb: 400             │                   │
│  │ • critical_threshold_mb: 450            │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Scalability Architecture

```
Current Design (Phase 1):
┌─────────────────────────────────────────────────────────────────┐
│  Daily event volume: ~1,000 events                             │
│  Storage: ~2 MB/day uncompressed, ~0.5 MB/day compressed       │
│  Query time: < 1s (scanning 10K events)                        │
│  Overhead: < 10ms per event                                    │
└─────────────────────────────────────────────────────────────────┘

Future Scaling (Phase 2):
┌─────────────────────────────────────────────────────────────────┐
│  If event volume grows > 10K/day:                              │
│                                                                 │
│  1. Pre-aggregation:                                           │
│     • Hourly rollups (reduce query scan)                       │
│     • Daily summaries (fast dashboards)                        │
│                                                                 │
│  2. Sampling:                                                  │
│     • Sample high-frequency events (e.g., 1 in 10)             │
│     • Always log errors and anomalies                          │
│                                                                 │
│  3. Partitioning:                                              │
│     • Separate logs by domain                                  │
│     • Parallel query processing                                │
│                                                                 │
│  4. Indexing:                                                  │
│     • Add SQLite index layer                                   │
│     • Fast lookups by correlation_id, agent, event_type        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0.0
**Last Updated**: 2026-02-01
**Designed by**: Aisha Patel, Monitoring Engineer
