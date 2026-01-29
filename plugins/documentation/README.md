# Documentation Plugin

A comprehensive documentation team with 5 specialized agents and 7 skills for creating API documentation, guides, architecture documentation, runbooks, and onboarding materials.

## Version

1.0.0

## Overview

This plugin provides a virtual documentation team that can help with all aspects of technical documentation. Each agent specializes in a specific type of documentation, and the orchestrator routes requests to the appropriate specialist.

## Agents

| Agent | Name | Role | Specialization |
|-------|------|------|----------------|
| Lead | Patricia Moore | Documentation Lead | Strategy, coordination, quality |
| API | Andrew Kim | API Doc Writer | OpenAPI, Swagger, code examples |
| Guides | Laura Hernandez | Guide Writer | Tutorials, how-tos, quickstarts |
| Arch | Steven Brown | Architecture Documenter | C4 diagrams, ADRs, system docs |
| Runbooks | Michelle Lee | Runbook Writer | Operational docs, playbooks |

## Skills

| Skill | Command | Description |
|-------|---------|-------------|
| Orchestrator | `/docs-orchestrator` | Routes documentation requests to appropriate specialists |
| Team Session | `/docs-team-session` | Multi-agent collaborative documentation discussions |
| API Writer | `/docs-api-writer` | Creates API documentation, OpenAPI specs, examples |
| Guide Writer | `/docs-guide-writer` | Creates tutorials, how-tos, user guides |
| Architecture Documenter | `/docs-architecture-documenter` | Creates C4 diagrams, ADRs, system documentation |
| Runbook Writer | `/docs-runbook-writer` | Creates operational runbooks and incident playbooks |
| Onboarding Creator | `/docs-onboarding-creator` | Creates developer onboarding materials |

## Usage

### Quick Start

Use the orchestrator to route your documentation request:

```
/docs-orchestrator I need to document our new REST API
```

### Direct Specialist Access

For specific documentation types, invoke the specialist directly:

```
/docs-api-writer Create OpenAPI spec for our user endpoints
/docs-guide-writer Write a getting started guide for new users
/docs-architecture-documenter Create a C4 context diagram for our system
/docs-runbook-writer Write an incident response playbook for database failures
/docs-onboarding-creator Create onboarding materials for new backend developers
```

### Team Collaboration

For complex documentation projects, use team sessions:

```
/docs-team-session How should we document our new microservices architecture?
```

## Documentation Types

### API Documentation
- OpenAPI 3.0/3.1 specifications
- Swagger UI documentation
- Code examples in multiple languages
- Authentication guides
- SDK quickstarts

### User Guides
- Getting started guides
- Step-by-step tutorials
- How-to articles
- Troubleshooting guides
- FAQs

### Architecture Documentation
- C4 diagrams (Context, Container, Component)
- Architecture Decision Records (ADRs)
- System overview documents
- Data flow diagrams
- Integration documentation

### Operational Documentation
- Runbooks and procedures
- Incident response playbooks
- Escalation matrices
- Disaster recovery plans
- On-call guides

### Onboarding Materials
- Welcome documents
- Environment setup guides
- Codebase tours
- Team process documentation
- 30-60-90 day plans

## Integration

This plugin works well with:

- **Architecture plugins**: For system context and design documentation
- **Backend plugins**: For API documentation and integration guides
- **DevOps plugins**: For operational and deployment documentation
- **Security plugins**: For security documentation and compliance guides

## File Structure

```
plugins/documentation/
├── .claude-plugin/
│   ├── plugin.json          # Plugin manifest
│   └── capabilities.json    # Detailed capabilities
├── skills/
│   ├── docs-orchestrator/   # Request routing
│   ├── docs-team-session/   # Collaborative sessions
│   ├── docs-api-writer/     # API documentation
│   ├── docs-guide-writer/   # Tutorials and guides
│   ├── docs-architecture-documenter/  # Architecture docs
│   ├── docs-runbook-writer/ # Operational docs
│   └── docs-onboarding-creator/       # Onboarding materials
├── agents/
│   ├── patricia-lead.md     # Documentation Lead
│   ├── andrew-api.md        # API Doc Writer
│   ├── laura-guides.md      # Guide Writer
│   ├── steven-arch.md       # Architecture Documenter
│   └── michelle-runbooks.md # Runbook Writer
└── README.md
```

## Best Practices

1. **Start with the orchestrator** for new documentation requests
2. **Use team sessions** for complex or cross-cutting documentation
3. **Provide context** about your audience and existing documentation
4. **Review outputs** with subject matter experts
5. **Maintain documentation** alongside code changes

## Contributing

To extend this plugin:

1. Add new agent personas in `agents/`
2. Create new skills in `skills/`
3. Update `plugin.json` and `capabilities.json`
4. Update this README with new capabilities
