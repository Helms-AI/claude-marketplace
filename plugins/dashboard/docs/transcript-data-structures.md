# Claude Code Transcript Data Structures

Reference documentation for all message types, content blocks, and data structures
found in Claude Code transcript JSONL files and the dashboard rendering pipeline.

## Raw JSONL Entry Types

Claude Code writes session transcripts to `~/.claude/projects/<escaped-path>/<session-id>.jsonl`.
Each line is a JSON object with a `type` field.

### Entry Types

| Type | Description | Processed by Dashboard |
|------|-------------|----------------------|
| `user` | User input messages | Yes |
| `assistant` | Claude responses | Yes |
| `progress` | Hook execution progress | No (filtered) |
| `system` | System status messages | No (filtered) |
| `queue-operation` | Command queue ops | No (filtered) |
| `last-prompt` | Prompt metadata | No (filtered) |
| `agent-name` | Agent identification | No (filtered) |
| `custom-title` | Session title updates | No (filtered) |
| `file-history-snapshot` | File change snapshots | No (filtered) |

## Common Entry Fields

Every entry shares these top-level fields:

```json
{
  "type": "user|assistant|progress|...",
  "uuid": "e6ebe9c4-3ee2-4816-...",
  "timestamp": "2026-03-27T13:36:25.940Z",
  "sessionId": "a9dc130d-b20f-435c-...",
  "parentUuid": "string|null",
  "isSidechain": false,
  "cwd": "/Users/foo/project",
  "entrypoint": "cli|web|sdk-ts",
  "userType": "external",
  "version": "2.1.84",
  "gitBranch": "main",
  "slug": "optional-session-slug"
}
```

## User Message Structure

```json
{
  "type": "user",
  "uuid": "...",
  "timestamp": "ISO8601",
  "sessionId": "...",
  "parentUuid": "string|null",
  "isSidechain": false,
  "message": {
    "role": "user",
    "content": "string" | [ContentBlock, ...]
  },
  "permissionMode": "bypassPermissions|default|...",
  "promptId": "string?",
  "sourceToolAssistantUUID": "string?",
  "toolUseResult": {
    "stdout": "string",
    "stderr": "string",
    "interrupted": false,
    "isImage": false,
    "noOutputExpected": false
  },
  "isMeta": false
}
```

### User Content Variants

**Simple text:**
```json
{ "content": "What was the last thing we were working on?" }
```

**Tool result (after Claude called a tool):**
```json
{
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_01HKW...",
      "content": "fc67902 chore(dashboard): Bump version...",
      "is_error": false
    }
  ]
}
```

**Multiple tool results:**
```json
{
  "content": [
    { "type": "tool_result", "tool_use_id": "toolu_01A...", "content": "output1" },
    { "type": "tool_result", "tool_use_id": "toolu_01B...", "content": "output2" }
  ]
}
```

**Image attachment:**
```json
{
  "content": [
    { "type": "text", "text": "What's in this image?" },
    { "type": "image", "source": { "type": "base64", "media_type": "image/png", "data": "..." } }
  ]
}
```

## Assistant Message Structure

```json
{
  "type": "assistant",
  "uuid": "...",
  "timestamp": "ISO8601",
  "sessionId": "...",
  "parentUuid": "user-uuid",
  "isSidechain": false,
  "requestId": "req_011CZ...",
  "message": {
    "model": "claude-opus-4-6",
    "id": "msg_01X9r...",
    "type": "message",
    "role": "assistant",
    "content": [ContentBlock, ...],
    "stop_reason": "end_turn|tool_use|max_tokens|null",
    "stop_sequence": null,
    "usage": {
      "input_tokens": 3,
      "output_tokens": 25,
      "cache_creation_input_tokens": 33666,
      "cache_read_input_tokens": 0,
      "cache_creation": {
        "ephemeral_5m_input_tokens": 0,
        "ephemeral_1h_input_tokens": 0
      },
      "service_tier": "standard",
      "inference_geo": "us"
    }
  }
}
```

## Content Block Types

### Text Block
```json
{ "type": "text", "text": "Here's my response..." }
```
- Appears in: user messages, assistant messages
- Contains: markdown-formatted text

### Thinking Block
```json
{
  "type": "thinking",
  "thinking": "Let me analyze this...",
  "signature": "EqECClkIDBgCKkD..."
}
```
- Appears in: assistant messages only
- `thinking` field is often empty in archived transcripts (redacted)
- `signature` is a verification/cache signature

### Tool Use Block
```json
{
  "type": "tool_use",
  "id": "toolu_01HKWuJqAWfDZmBgsWgmrQuj",
  "name": "Bash",
  "input": {
    "command": "git log --oneline -15",
    "description": "Show recent commits"
  },
  "caller": { "type": "direct" }
}
```
- Appears in: assistant messages only
- `name`: Tool name (Bash, Read, Edit, Write, Glob, Grep, Agent, etc.)
- `input`: Tool-specific parameters (see Tool Input Schemas below)
- `id`: Globally unique, links to corresponding `tool_result`

### Tool Result Block
```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01HKWuJqAWfDZmBgsWgmrQuj",
  "content": "fc67902 chore(dashboard): Bump version...",
  "is_error": false
}
```
- Appears in: user messages (Claude receives tool outputs as "user" role)
- `tool_use_id`: Links back to the `tool_use` block's `id`
- `content`: String output from the tool
- `is_error`: Whether the tool execution failed

### Image Block
```json
{
  "type": "image",
  "source": {
    "type": "base64",
    "media_type": "image/png",
    "data": "iVBORw0KGgo..."
  }
}
```
- Appears in: user messages (user-provided images)
- Rare in transcripts

## Tool Input Schemas

### Bash
```json
{ "command": "string", "description": "string", "timeout": 120000 }
```

### Read
```json
{ "file_path": "/absolute/path", "offset": 0, "limit": 2000 }
```

### Edit
```json
{ "file_path": "/absolute/path", "old_string": "...", "new_string": "..." }
```

### Write
```json
{ "file_path": "/absolute/path", "content": "..." }
```

### Glob
```json
{ "pattern": "**/*.js", "path": "/search/dir" }
```

### Grep
```json
{ "pattern": "regex", "path": "/search/dir", "output_mode": "content|files_with_matches" }
```

### Agent
```json
{ "subagent_type": "Explore", "prompt": "...", "description": "..." }
```

### WebFetch
```json
{ "url": "https://...", "prompt": "..." }
```

### TaskCreate
```json
{ "subject": "...", "description": "...", "activeForm": "..." }
```

### TaskUpdate
```json
{ "taskId": "1", "status": "completed|in_progress|pending" }
```

## Progress Message Structure

```json
{
  "type": "progress",
  "uuid": "...",
  "timestamp": "ISO8601",
  "parentToolUseID": "toolu_...",
  "toolUseID": "toolu_...",
  "data": {
    "type": "hook_progress",
    "hookEvent": "SessionStart|PostToolUse|PreToolUse",
    "hookName": "SessionStart:startup",
    "command": "Loading workflow context...",
    "statusMessage": "Loading workflow context..."
  }
}
```

## Dashboard Processing Pipeline

### 1. TranscriptReader._parse_entry()

**Filters:** Only `user` and `assistant` types pass through.

**Produces `TranscriptMessage`:**
```python
TranscriptMessage(
    id="uuid",
    timestamp=datetime,
    role="user|assistant",
    session_id="uuid",
    agent_id=None,          # Set for subagent messages
    content=[...],          # Original content blocks
    text="joined text",     # Text blocks joined with newline
    tool_calls=[            # Extracted tool_use blocks with merged results
        {
            "id": "toolu_...",
            "name": "Bash",
            "input": {"command": "..."},
            "result": "output...",      # Merged from tool_result
            "is_error": false,
            "status": "success|error"
        }
    ]
)
```

### 2. TranscriptReader.to_dict()

**SSE broadcast format:**
```json
{
  "id": "uuid",
  "timestamp": "ISO8601",
  "role": "user|assistant",
  "session_id": "uuid",
  "agent_id": null,
  "text": "joined text from text blocks",
  "tool_calls": [
    { "id": "toolu_...", "name": "Bash", "input": {...}, "result": "...", "is_error": false, "status": "success" }
  ],
  "content": [
    { "type": "text", "text": "..." },
    { "type": "tool_use", "id": "...", "name": "...", "input": {...} }
  ]
}
```

### 3. SSE Event (transcript_message)

```json
{
  "changeset_id": "session-a9dc130d-...",
  "session_id": "a9dc130d-...",
  "source": "main|agent-{id}",
  "message": { /* to_dict() output above */ },
  "timestamp": 1774620124.57866
}
```

### 4. Frontend Store (addSessionMessage)

Currently passes to `addConversationMessage()`:
```javascript
{
  role: "user|assistant",
  content: message.text,        // TEXT ONLY - loses tool_calls
  tool_calls: message.tool_calls,
  timestamp: timestamp,
  source: "main|agent-{id}"
}
```

### 5. message-bubble.js (Current Rendering)

**Renders:** `message.content` as markdown text
**Ignores:** `message.tool_calls`, thinking blocks, tool results, source metadata

## Data Loss Summary

| Data | In JSONL | In Server | In SSE | In Store | Rendered |
|------|----------|-----------|--------|----------|----------|
| Text content | Y | Y | Y | Y | Y |
| Tool use (name, input) | Y | Y | Y | Y | **No** |
| Tool results | Y | Y (merged) | Y | Y | **No** |
| Thinking blocks | Y | **Skipped** | No | No | No |
| Usage/tokens | Y | Not extracted | No | No | No |
| Model info | Y | Not extracted | No | No | No |
| Subagent source | Y | Y | Y | Y | **No** |
| stop_reason | Y | Not extracted | No | No | No |
| Images | Y | Y | Y | No | No |
| User text vs tool_result | Y | Y | Y | **Flattened** | **No** |

## Message Types the Session Tab Should Render

1. **User text** - User's typed input (with "You" label)
2. **Assistant text** - Claude's text response (with "Claude" label)
3. **Tool use** - Tool invocation card showing name + input summary
4. **Tool result** - Tool output (collapsible, linked to tool_use)
5. **Thinking** - Extended thinking indicator (collapsed by default)
6. **Subagent** - Messages from spawned agents (indented, labeled)
7. **System/progress** - Hook progress, system messages (optional)
8. **Empty assistant messages** - Messages with only tool_use blocks should show tool cards, not empty bubbles
