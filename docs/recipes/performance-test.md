# Recipe: Performance Test Suite

Create and run a comprehensive performance testing suite.

## Overview

| Property | Value |
|----------|-------|
| **Time** | ~12 minutes |
| **Difficulty** | ⭐⭐ Intermediate |
| **Domains** | testing → devops |

## Command

```bash
/pm-recipe performance-test --target="https://api.example.com"
```

## What It Does

1. **Testing** (8min)
   - Generate k6 load test scripts
   - Create Artillery scenarios
   - Set up Lighthouse CI
   - Define performance budgets

2. **DevOps** (4min)
   - CI pipeline integration
   - Performance regression checks
   - Alert configuration

## Expected Artifacts

```
tests/
├── performance/
│   ├── k6/
│   │   ├── load-test.js
│   │   ├── stress-test.js
│   │   └── soak-test.js
│   ├── artillery/
│   │   └── scenarios.yml
│   └── lighthouse/
│       └── lighthouserc.js
└── budgets/
    └── performance-budget.json

.github/workflows/
└── performance.yml
```

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--target` | Yes | Base URL to test |
| `--duration` | No | Test duration (default: "2m") |
| `--users` | No | Max concurrent users (default: 100) |

## Example

```bash
# Basic performance test
/pm-recipe performance-test --target="https://api.myapp.com"

# High load test
/pm-recipe performance-test --target="https://api.myapp.com" --users=500 --duration="5m"
```

## Related Skills

- `/testing-load-engineer` - Generate load test scripts
- `/testing-performance-analyzer` - Analyze results
- `/devops-ci-architect` - CI integration
