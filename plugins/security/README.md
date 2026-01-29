# Security Plugin

A comprehensive security team plugin providing defensive security expertise across auditing, threat modeling, compliance, secrets management, and penetration testing guidance.

## Overview

This plugin provides a team of 5 specialized security agents and 7 skills to help secure your applications and infrastructure. All guidance is focused on **defensive security** - protecting systems and data, not attacking them.

## Installation

```bash
claude plugin install security
```

## Agents

| Agent | Name | Role | Expertise |
|-------|------|------|-----------|
| Lead | Nathan Brooks | Security Lead | Strategy, orchestration, risk assessment |
| Audit | Diana Chen | Security Auditor | Code review, SAST/DAST, vulnerability assessment |
| Threat | Victor Okonkwo | Threat Modeler | STRIDE, attack trees, risk prioritization |
| Compliance | Sarah Johnson | Compliance Advisor | SOC2, GDPR, HIPAA, PCI-DSS, ISO 27001 |
| Secrets | Mark Thompson | Secrets Manager | Vault, KMS, credential rotation |

## Skills

| Command | Description |
|---------|-------------|
| `/security-orchestrator` | Routes security requests to appropriate specialists |
| `/security-team-session` | Multi-agent collaborative security discussions |
| `/security-auditor` | Security-focused code review and vulnerability assessment |
| `/security-threat-modeler` | Systematic threat modeling using STRIDE |
| `/security-compliance-advisor` | Compliance assessment and regulatory guidance |
| `/security-secrets-manager` | Secrets management strategy and implementation |
| `/security-penetration-advisor` | Defensive penetration testing guidance |

## Usage Examples

### Security Code Review
```
/security-auditor

Review this authentication module for security vulnerabilities:
[paste code]
```

### Threat Modeling
```
/security-threat-modeler

Create a threat model for our new payment processing feature that handles credit card data and integrates with Stripe.
```

### Compliance Assessment
```
/security-compliance-advisor

We're a SaaS company with EU customers. What compliance frameworks should we consider and where should we start?
```

### Secrets Management
```
/security-secrets-manager

We currently have API keys in environment variables and some hardcoded in config files. How should we improve our secrets management?
```

### Team Discussion
```
/security-team-session

We're about to launch a new feature that allows users to upload files. What security considerations should we address?
```

## Focus Areas

### What This Plugin Helps With

- **Security code review** - Finding vulnerabilities in application code
- **Threat modeling** - Systematic analysis of security threats
- **Compliance guidance** - Understanding and meeting regulatory requirements
- **Secrets management** - Properly handling credentials and keys
- **Security architecture** - Designing secure systems
- **Penetration test preparation** - Understanding and scoping security assessments
- **Remediation guidance** - Fixing identified vulnerabilities

### What This Plugin Does NOT Do

- Provide exploitation techniques or attack code
- Assist with unauthorized access or hacking
- Help bypass security controls maliciously
- Support any offensive security activities

## Technologies & Frameworks

### Security Standards
- OWASP Top 10
- STRIDE threat modeling
- NIST Cybersecurity Framework

### Compliance Frameworks
- SOC 2 (Type I & II)
- GDPR
- HIPAA
- PCI-DSS
- ISO 27001
- CCPA/CPRA

### Secrets Management Tools
- HashiCorp Vault
- AWS Secrets Manager
- Azure Key Vault
- GCP Secret Manager

### Security Testing
- SAST (Static Application Security Testing)
- DAST (Dynamic Application Security Testing)
- Dependency scanning
- Secrets detection

## Collaboration

This plugin works well with:

- **Backend plugins** - Secure API design and implementation
- **DevOps plugins** - Security in CI/CD pipelines
- **Architecture plugins** - Security architecture review
- **Documentation plugins** - Security documentation and policies

## Version History

### 1.0.0
- Initial release
- 5 security agents
- 7 security skills
- Defensive security focus

## License

MIT
