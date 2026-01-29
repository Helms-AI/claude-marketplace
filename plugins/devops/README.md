# DevOps Plugin

A comprehensive DevOps team with 5 specialized agents for CI/CD, deployment, infrastructure, monitoring, and containerization.

## Version

1.0.0

## Overview

This plugin provides a virtual DevOps team that can help with all aspects of DevOps engineering. Each agent has distinct expertise and personality, creating realistic and helpful interactions.

## Agents

| Agent | Name | Role | Expertise |
|-------|------|------|-----------|
| Lead | Michael Chang | DevOps Lead | Orchestration, platform strategy, team coordination |
| CI | Emma Watson | CI/CD Architect | GitHub Actions, Jenkins, pipeline design, build optimization |
| Deploy | Alex Rivera | Deployment Engineer | Blue-green, canary, rolling deployments, release strategies |
| Infra | Tom Anderson | Infrastructure Specialist | Terraform, Kubernetes, cloud architecture, IaC |
| Monitoring | Aisha Patel | Monitoring Engineer | Observability, alerting, dashboards, SLOs |

## Skills

| Skill | Command | Description |
|-------|---------|-------------|
| Orchestrator | `/devops-orchestrator` | Routes DevOps requests to the appropriate specialist |
| Team Session | `/devops-team-session` | Multi-agent discussions for complex problems |
| CI Architect | `/devops-ci-architect` | CI/CD pipeline design and implementation |
| Deployment Engineer | `/devops-deployment-engineer` | Deployment strategies and release management |
| Infrastructure Specialist | `/devops-infrastructure-specialist` | Infrastructure as Code and cloud architecture |
| Monitoring Engineer | `/devops-monitoring-engineer` | Observability, monitoring, and alerting setup |
| Container Specialist | `/devops-container-specialist` | Docker and Kubernetes containerization |

## Usage

### Quick Start

Use the orchestrator to get routed to the right specialist:
```
/devops-orchestrator I need help setting up CI/CD for my Node.js app
```

### Direct Access

Go directly to a specialist:
```
/devops-ci-architect Create a GitHub Actions workflow for a Python project
/devops-deployment-engineer Plan a canary deployment for our API
/devops-infrastructure-specialist Write Terraform for an EKS cluster
/devops-monitoring-engineer Set up Prometheus alerting for our services
/devops-container-specialist Create a Dockerfile for a Go application
```

### Team Discussions

For complex topics that benefit from multiple perspectives:
```
/devops-team-session We need to migrate from EC2 to Kubernetes
```

## Technologies Covered

### CI/CD
- GitHub Actions
- Jenkins
- GitLab CI
- CircleCI
- Azure DevOps

### Infrastructure
- Terraform
- Kubernetes
- AWS / GCP / Azure
- Helm

### Monitoring
- Prometheus / Grafana
- Datadog
- ELK Stack
- OpenTelemetry

### Containers
- Docker
- Kubernetes
- Docker Compose
- Container Security

## Collaboration

This plugin works well with:
- **Backend plugins** - For application-specific DevOps
- **Testing plugins** - For test automation in pipelines
- **Security plugins** - For security scanning and compliance
- **Data plugins** - For data pipeline infrastructure

## Examples

### Setting Up a Complete CI/CD Pipeline
```
User: /devops-ci-architect I have a monorepo with a React frontend and Python backend.
      I need a GitHub Actions pipeline that builds both, runs tests, and deploys to AWS.
```

### Planning a Zero-Downtime Migration
```
User: /devops-team-session We're migrating from a monolith to microservices.
      How do we handle the deployment and monitoring for this transition?
```

### Optimizing Cloud Costs
```
User: /devops-infrastructure-specialist Our AWS bill has grown 3x in 6 months.
      Help me identify optimization opportunities in our Terraform.
```
