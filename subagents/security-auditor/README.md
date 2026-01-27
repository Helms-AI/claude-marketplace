# Security Auditor Subagent

A specialized agent for security vulnerability assessment and secure coding practices.

## Installation

Add to your Claude settings (`~/.claude/settings.json` or project `.claude/settings.json`):

```json
{
  "subagents": {
    "security-auditor": {
      "path": "/path/to/claude-marketplace/subagents/security-auditor/agent.md",
      "description": "Security-focused agent for vulnerability assessment",
      "tools": ["Read", "Grep", "Glob", "Bash"]
    }
  }
}
```

## Usage

The agent can be invoked via the Task tool when security analysis is needed:

```
Analyze this codebase for security vulnerabilities
```

Or use it directly:
```
Use the security-auditor agent to review our authentication implementation
```

## Capabilities

### What It Checks
- Authentication & authorization flows
- Hardcoded secrets and credentials
- SQL injection vulnerabilities
- XSS risks
- Command injection
- SSRF vulnerabilities
- Dependency CVEs
- Configuration security

### Output
Provides structured security reports with:
- Severity-ranked findings
- Specific file locations
- Remediation steps
- OWASP references

## Customization

Modify `agent.md` to add:
- Company-specific security policies
- Additional vulnerability patterns
- Custom compliance requirements (SOC2, HIPAA, etc.)

## Author

Security Team - security@helms-ai.com
