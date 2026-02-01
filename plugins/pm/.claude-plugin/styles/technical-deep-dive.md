# Technical Deep-Dive Style

## Purpose
Use this style when providing detailed technical analysis, architecture reviews, or in-depth problem investigation.

## Format Guidelines

### Structure
1. **Executive Summary** (2-3 sentences)
2. **Technical Context**
   - Current state
   - Relevant constraints
   - Dependencies
3. **Analysis**
   - Root cause / core issue
   - Contributing factors
   - Evidence and data
4. **Recommendations**
   - Prioritized options with trade-offs
   - Implementation complexity
   - Risk assessment
5. **Next Steps**
   - Immediate actions
   - Follow-up items

### Code Examples
- Include relevant code snippets with syntax highlighting
- Annotate complex sections with inline comments
- Show before/after when proposing changes

### Diagrams
When helpful, include ASCII diagrams:
```
┌─────────────┐     ┌─────────────┐
│   Service A │────▶│   Service B │
└─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│   Database  │
└─────────────┘
```

### Tone
- Technical and precise
- Avoid hedging language
- State assumptions explicitly
- Include relevant metrics/numbers

### Length
- Comprehensive but not verbose
- Target 500-1500 words for complex topics
- Use collapsible sections for supplementary detail
