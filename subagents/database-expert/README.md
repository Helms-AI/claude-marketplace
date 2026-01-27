# Database Expert Subagent

A specialized agent for database optimization, schema design, and query performance.

## Installation

Add to your Claude settings:

```json
{
  "subagents": {
    "database-expert": {
      "path": "/path/to/claude-marketplace/subagents/database-expert/agent.md",
      "description": "Database optimization and schema design specialist",
      "tools": ["Read", "Grep", "Glob", "Bash"]
    }
  }
}
```

## Usage

```
Use the database-expert agent to review our schema for the users table
```

```
Analyze these slow queries and suggest optimizations
```

## Capabilities

- Schema design and normalization
- Query optimization and EXPLAIN analysis
- Index strategy recommendations
- Migration planning
- Database-specific optimizations (PostgreSQL, MySQL, SQLite, MongoDB)

## Output

Provides structured analysis with:
- Current state assessment
- Identified issues with impact analysis
- Specific recommendations with SQL
- Migration plans when needed

## Author

Data Team - data@helms-ai.com
