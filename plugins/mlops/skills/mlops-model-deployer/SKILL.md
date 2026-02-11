---
name: mlops-model-deployer
description: Deploy models to production
argument-hint: "[model-name|endpoint]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# Model Deployer

Deploy ML models to production serving infrastructure.

## Capabilities

- Model packaging (BentoML, MLflow)
- Serving infrastructure (TorchServe, Triton)
- Kubernetes deployments
- A/B testing and canary releases
