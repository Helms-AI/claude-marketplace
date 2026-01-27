# Security Auditor Plugin

A specialized agent for security vulnerability assessment and secure coding practices.

## Installation

```bash
/plugin install security-auditor@helms-ai-marketplace
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

## Author

Security Team - security@helms-ai.com
