# Observability System Validation Guide

This guide helps you validate that the observability system is working correctly.

## Pre-Flight Checklist

### 1. File Integrity

Verify all files are in place:

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops

# Check telemetry scripts (7 files)
ls -l scripts/telemetry/*.sh | wc -l
# Expected: 7

# Check dashboards (2 files)
ls -l dashboards/*.sh | wc -l
# Expected: 2

# Check configs (2 files)
ls -l config/*.example.json | wc -l
# Expected: 2

# Check documentation (3 files)
ls -l OBSERVABILITY*.md MONITORING-DESIGN-SUMMARY.md | wc -l
# Expected: 4
```

### 2. Script Permissions

Verify all scripts are executable:

```bash
ls -l scripts/telemetry/*.sh dashboards/*.sh | grep -v "^-rwx"
# Expected: No output (all should be executable)
```

### 3. Hook Registration

Verify hooks are registered:

```bash
jq '.hooks' hooks/hooks.json | grep telemetry
# Expected: Multiple lines mentioning telemetry scripts
```

## Functional Testing

### Test 1: Event Emission

Test the core event emitter:

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops

# Create telemetry directory
mkdir -p ../../.claude/telemetry/events

# Emit a test event
echo '{
  "event_type": "test.manual",
  "message": "Validation test event"
}' | CWD=/Users/kon1790/GitHub/claude-marketplace ./scripts/telemetry/emit-event.sh

# Verify event was logged
cat ../../.claude/telemetry/events/$(date +%Y-%m-%d).jsonl | tail -1 | jq .
```

**Expected Output**: JSON event with `event_id`, `timestamp`, and your test fields.

**Success Criteria**:
- Event file exists
- Event contains `event_id` (UUID)
- Event contains `timestamp` (ISO 8601)
- Event contains original fields

### Test 2: PreToolUse Hook

Test tool monitoring before execution:

```bash
# Create a mock input
echo '{
  "tool": "Write",
  "session_id": "test-session-123",
  "cwd": "/Users/kon1790/GitHub/claude-marketplace",
  "params": {
    "file_path": "/tmp/test-file.txt"
  }
}' | CWD=/Users/kon1790/GitHub/claude-marketplace ./scripts/telemetry/pre-tool-monitor.sh

# Check for event
grep '"event_type":"tool.pre_execute"' ../../.claude/telemetry/events/$(date +%Y-%m-%d).jsonl | tail -1 | jq .
```

**Expected Output**: Event with `tool.pre_execute` type, tool name, file path.

**Success Criteria**:
- Event emitted
- Correct event type
- Tool and file path captured
- Exit code 0

### Test 3: PostToolUse Hook

Test tool monitoring after execution:

```bash
# Create a mock input
echo '{
  "tool": "Write",
  "session_id": "test-session-123",
  "cwd": "/Users/kon1790/GitHub/claude-marketplace",
  "exit_code": 0,
  "duration_ms": 234,
  "params": {
    "file_path": "/tmp/test-file.txt"
  }
}' | CWD=/Users/kon1790/GitHub/claude-marketplace ./scripts/telemetry/post-tool-monitor.sh

# Check for event
grep '"event_type":"tool.executed"' ../../.claude/telemetry/events/$(date +%Y-%m-%d).jsonl | tail -1 | jq .
```

**Expected Output**: Event with `tool.executed` type, duration, outcome.

**Success Criteria**:
- Event emitted
- Correct outcome (success)
- Duration captured
- Metadata populated

### Test 4: SubagentStart Hook

Test agent invocation tracking:

```bash
# Create a mock input
echo '{
  "subagent_name": "chris-nakamura",
  "skill": "/frontend-orchestrator",
  "session_id": "test-session-123",
  "cwd": "/Users/kon1790/GitHub/claude-marketplace"
}' | CWD=/Users/kon1790/GitHub/claude-marketplace ./scripts/telemetry/subagent-start-monitor.sh

# Check for event
grep '"event_type":"agent.invoked"' ../../.claude/telemetry/events/$(date +%Y-%m-%d).jsonl | tail -1 | jq .
```

**Expected Output**: Event with `agent.invoked` type, agent name, domain.

**Success Criteria**:
- Event emitted
- Agent name captured
- Domain inferred correctly (frontend)
- Skill captured

### Test 5: SubagentStop Hook

Test agent completion tracking:

```bash
# Create a mock input
echo '{
  "subagent_name": "chris-nakamura",
  "skill": "/frontend-orchestrator",
  "session_id": "test-session-123",
  "cwd": "/Users/kon1790/GitHub/claude-marketplace",
  "exit_code": 0
}' | CWD=/Users/kon1790/GitHub/claude-marketplace ./scripts/telemetry/subagent-stop-monitor.sh

# Check for event
grep '"event_type":"agent.completed"' ../../.claude/telemetry/events/$(date +%Y-%m-%d).jsonl | tail -1 | jq .
```

**Expected Output**: Event with `agent.completed` type, outcome.

**Success Criteria**:
- Event emitted
- Outcome is success
- Agent and skill captured
- Exit code recorded

### Test 6: Health Computation

Test health metrics calculation:

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops

# After generating some test events, compute health
CWD=/Users/kon1790/GitHub/claude-marketplace ./scripts/telemetry/compute-health.sh 1h
```

**Expected Output**: Health report with agent success rate, tool stats, handoff metrics.

**Success Criteria**:
- Report renders without errors
- Shows agent success rate
- Shows tool execution stats
- Recommendations section present

### Test 7: Alert Checking

Test alert evaluation:

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops

# Run alert checker
CWD=/Users/kon1790/GitHub/claude-marketplace ./scripts/telemetry/check-alerts.sh

# Check active alerts
cat ../../.claude/telemetry/alerts/active.json | jq .
```

**Expected Output**: Alerts JSON (may be empty if no thresholds exceeded).

**Success Criteria**:
- Script runs without errors
- active.json file created
- thresholds.json file created (if missing)

### Test 8: Log Rotation

Test log compression and archival:

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops

# Run log rotation
CWD=/Users/kon1790/GitHub/claude-marketplace ./scripts/telemetry/rotate-logs.sh

# Check for archive directory
ls -la ../../.claude/telemetry/events/archive/
```

**Expected Output**: Messages about compression/archival (or nothing if logs are recent).

**Success Criteria**:
- Script runs without errors
- Archive directory created
- No files deleted (all within retention window)

### Test 9: Agent Health Dashboard

Test CLI dashboard rendering:

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops

# Generate some test events first, then run dashboard
CWD=/Users/kon1790/GitHub/claude-marketplace ./dashboards/agent-health.sh 24h
```

**Expected Output**: Formatted dashboard with domain/agent performance.

**Success Criteria**:
- Dashboard renders
- Shows domain performance section
- Shows top performing agents
- Shows agents needing attention
- No errors or crashes

### Test 10: Handoff Trace

Test request tracing:

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops

# Use a test correlation ID
CWD=/Users/kon1790/GitHub/claude-marketplace ./dashboards/handoff-trace.sh test-session-123
```

**Expected Output**: Trace timeline with events (or "No events found" if no matching correlation).

**Success Criteria**:
- Dashboard renders
- Shows chronological timeline
- Displays summary statistics
- No errors or crashes

## Integration Testing

### End-to-End Flow

Simulate a complete agent workflow:

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops

# 1. Agent invocation
echo '{
  "subagent_name": "alex-morgan",
  "skill": "/pm",
  "session_id": "e2e-test-001",
  "cwd": "/Users/kon1790/GitHub/claude-marketplace"
}' | CWD=/Users/kon1790/GitHub/claude-marketplace ./scripts/telemetry/subagent-start-monitor.sh

# 2. Tool execution
echo '{
  "tool": "Write",
  "session_id": "e2e-test-001",
  "cwd": "/Users/kon1790/GitHub/claude-marketplace",
  "params": {"file_path": "/tmp/test.txt"}
}' | CWD=/Users/kon1790/GitHub/claude-marketplace ./scripts/telemetry/pre-tool-monitor.sh

echo '{
  "tool": "Write",
  "session_id": "e2e-test-001",
  "cwd": "/Users/kon1790/GitHub/claude-marketplace",
  "exit_code": 0,
  "duration_ms": 150,
  "params": {"file_path": "/tmp/test.txt"}
}' | CWD=/Users/kon1790/GitHub/claude-marketplace ./scripts/telemetry/post-tool-monitor.sh

# 3. Agent completion
echo '{
  "subagent_name": "alex-morgan",
  "skill": "/pm",
  "session_id": "e2e-test-001",
  "cwd": "/Users/kon1790/GitHub/claude-marketplace",
  "exit_code": 0
}' | CWD=/Users/kon1790/GitHub/claude-marketplace ./scripts/telemetry/subagent-stop-monitor.sh

# 4. Trace the flow
CWD=/Users/kon1790/GitHub/claude-marketplace ./dashboards/handoff-trace.sh e2e-test-001
```

**Expected Output**: Complete trace showing agent invocation, tool execution, and completion.

**Success Criteria**:
- All 4 event types present
- Correct correlation_id on all events
- Timeline shows proper sequence
- Summary statistics accurate

## Performance Testing

### Event Emission Latency

Measure event emission performance:

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops

# Time 100 event emissions
time for i in {1..100}; do
  echo '{"event_type":"test.perf","index":'$i'}' | \
    CWD=/Users/kon1790/GitHub/claude-marketplace ./scripts/telemetry/emit-event.sh
done
```

**Expected**: < 1 second for 100 events (< 10ms per event)

**Success Criteria**:
- Completes in < 1s
- No errors
- All events logged

### Dashboard Render Time

Measure dashboard rendering performance:

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops

# Time health dashboard
time CWD=/Users/kon1790/GitHub/claude-marketplace ./dashboards/agent-health.sh 24h
```

**Expected**: < 2 seconds

**Success Criteria**:
- Completes in < 2s
- No errors
- Output renders correctly

## Error Handling

### Test 1: Invalid JSON Input

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops

echo 'invalid json' | CWD=/Users/kon1790/GitHub/claude-marketplace ./scripts/telemetry/emit-event.sh
# Expected: Error message about invalid JSON
```

### Test 2: Missing Required Fields

```bash
echo '{"event_type":"test"}' | CWD=/Users/kon1790/GitHub/claude-marketplace ./scripts/telemetry/emit-event.sh
# Expected: Event still emitted (fields added automatically)
```

### Test 3: Non-existent Correlation ID

```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops

CWD=/Users/kon1790/GitHub/claude-marketplace ./dashboards/handoff-trace.sh nonexistent-id-123
# Expected: "No events found for correlation ID"
```

## Cleanup

After validation, clean up test data:

```bash
# Remove test events
rm /Users/kon1790/GitHub/claude-marketplace/.claude/telemetry/events/$(date +%Y-%m-%d).jsonl

# Or keep for analysis
# Events are automatically rotated after 7 days
```

## Validation Checklist

- [ ] All 14 files created and in correct locations
- [ ] All 9 scripts are executable
- [ ] Hooks registered in hooks.json
- [ ] Event emission works (Test 1)
- [ ] PreToolUse monitoring works (Test 2)
- [ ] PostToolUse monitoring works (Test 3)
- [ ] SubagentStart monitoring works (Test 4)
- [ ] SubagentStop monitoring works (Test 5)
- [ ] Health computation works (Test 6)
- [ ] Alert checking works (Test 7)
- [ ] Log rotation works (Test 8)
- [ ] Agent health dashboard works (Test 9)
- [ ] Handoff trace works (Test 10)
- [ ] End-to-end flow works (Integration Test)
- [ ] Performance is acceptable (< 10ms per event, < 2s dashboard)
- [ ] Error handling works (invalid inputs handled gracefully)

## Troubleshooting

### Issue: "jq: command not found"

**Solution**: Install jq
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

### Issue: "Permission denied" errors

**Solution**: Make scripts executable
```bash
cd /Users/kon1790/GitHub/claude-marketplace/plugins/devops
chmod +x scripts/telemetry/*.sh dashboards/*.sh
```

### Issue: Events not being logged

**Solution**: Check directory exists and permissions
```bash
mkdir -p /Users/kon1790/GitHub/claude-marketplace/.claude/telemetry/events
ls -la /Users/kon1790/GitHub/claude-marketplace/.claude/telemetry/
```

### Issue: Dashboard shows "No events found"

**Solution**: Generate some test events first using the tests above

## Sign-Off

Once all validation tests pass:

- [ ] System is production-ready
- [ ] Documentation reviewed
- [ ] Hooks integrated
- [ ] Performance validated
- [ ] Ready for self-learning integration

---

**Validator**: _____________
**Date**: _____________
**Status**: [ ] PASS [ ] FAIL

**Notes**:
