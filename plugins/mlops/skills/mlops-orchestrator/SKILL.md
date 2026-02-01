---
name: mlops-orchestrator
description: Routes MLOps requests to specialized skills
argument-hint: "[train|deploy|monitor|experiment]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Task
---

# MLOps Orchestrator

Coordinate ML operations across training, deployment, and monitoring.

## Agent Announcement

```
**Dr. Sarah Chen - MLOps Lead** is now coordinating this.
> "Let's build ML systems that work reliably in production."
```

## Routing Logic

| Keywords | Route To |
|----------|----------|
| train, model, pytorch, tensorflow | `/mlops-model-trainer` |
| deploy, serve, inference, endpoint | `/mlops-model-deployer` |
| feature, feature store, preprocessing | `/mlops-feature-engineer` |
| experiment, mlflow, wandb, track | `/mlops-experiment-tracker` |
| monitor, drift, performance, alert | `/mlops-monitoring` |
