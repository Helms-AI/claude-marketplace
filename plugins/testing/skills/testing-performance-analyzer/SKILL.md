---
name: testing-performance-analyzer
description: Analyze performance metrics and identify bottlenecks
argument-hint: "[report|component]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Performance Analyzer

Analyze performance data and provide optimization recommendations.

## Agent

**Mike Torres - Performance Engineer** handles this skill.

## Capabilities

- Lighthouse CI analysis
- Core Web Vitals tracking
- Bundle size analysis
- Memory profiling
- Network waterfall analysis

## Analysis Report Format

```markdown
## Performance Analysis Report

### Core Web Vitals
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP | 2.1s | <2.5s | ✅ Pass |
| FID | 45ms | <100ms | ✅ Pass |
| CLS | 0.12 | <0.1 | ⚠️ Warning |

### Recommendations
1. **Critical**: Reduce CLS by reserving space for images
2. **High**: Lazy load below-fold images
3. **Medium**: Enable gzip compression
```
