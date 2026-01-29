# Architecture Plugin

A comprehensive architecture team with 5 specialized agents for system design, patterns, ADRs, diagrams, and API design.

## Version

1.0.0

## Overview

This plugin provides a virtual architecture team that helps with:
- System design and scalability planning
- Design pattern recommendations
- Architecture Decision Records (ADRs)
- Diagram creation (Mermaid, PlantUML, C4)
- API design (REST, GraphQL, gRPC)

## Agents

| Agent | Name | Role | Expertise |
|-------|------|------|-----------|
| Lead | Sofia Reyes | Architecture Lead | Orchestration, technical strategy, governance |
| Systems | Marcus Chen | Systems Architect | Distributed systems, scalability, infrastructure |
| Patterns | Elena Kowalski | Patterns Specialist | Design patterns, SOLID, DDD, refactoring |
| Decisions | James Okonjo | Decision Recorder | ADRs, technical documentation, rationale capture |
| API | Priya Sharma | API Designer | REST, GraphQL, gRPC, OpenAPI specifications |

## Skills

| Command | Skill | Description |
|---------|-------|-------------|
| `/arch-orchestrator` | Orchestrator | Routes architecture requests to appropriate specialists |
| `/arch-team-session` | Team Session | Multi-agent architecture discussions with full team |
| `/arch-system-designer` | System Designer | High-level system design with components and scalability |
| `/arch-pattern-advisor` | Pattern Advisor | Design pattern recommendations and best practices |
| `/arch-adr-writer` | ADR Writer | Architecture Decision Record creation and management |
| `/arch-diagram-creator` | Diagram Creator | Mermaid, PlantUML, and C4 model diagrams |
| `/arch-api-designer` | API Designer | REST, GraphQL, gRPC API design with OpenAPI specs |

## Usage Examples

### Get Architecture Guidance
```
/arch-orchestrator
I need help designing a new e-commerce platform
```

### Team Discussion
```
/arch-team-session
Let's discuss whether to use microservices or a monolith for our startup
```

### System Design
```
/arch-system-designer
Design a real-time notification system that handles 1M concurrent users
```

### Pattern Advice
```
/arch-pattern-advisor
Is the Repository pattern appropriate for my data access layer?
```

### Create ADR
```
/arch-adr-writer
Document our decision to use PostgreSQL over MongoDB for the orders service
```

### Generate Diagrams
```
/arch-diagram-creator
Create a sequence diagram for the user authentication flow
```

### API Design
```
/arch-api-designer
Design a REST API for a blog platform with posts, comments, and users
```

## Collaboration

The Architecture plugin is designed to collaborate with other plugins:

- **Backend**: Implementation of designed systems
- **DevOps**: Infrastructure and deployment architecture
- **Data**: Database design and data modeling
- **Security**: Security architecture and threat modeling
- **Documentation**: Technical writing and knowledge management

## File Structure

```
plugins/architecture/
├── .claude-plugin/
│   ├── plugin.json          # Plugin manifest
│   └── capabilities.json    # Skill capabilities for routing
├── skills/
│   ├── arch-orchestrator/   # Request routing
│   ├── arch-team-session/   # Multi-agent discussions
│   ├── arch-system-designer/# System design
│   ├── arch-pattern-advisor/# Pattern recommendations
│   ├── arch-adr-writer/     # ADR creation
│   ├── arch-diagram-creator/# Diagram generation
│   └── arch-api-designer/   # API design
├── agents/
│   ├── sofia-lead.md        # Architecture Lead persona
│   ├── marcus-systems.md    # Systems Architect persona
│   ├── elena-patterns.md    # Patterns Specialist persona
│   ├── james-decisions.md   # Decision Recorder persona
│   └── priya-api.md         # API Designer persona
└── README.md
```

## Author

Claude Marketplace

## License

MIT
