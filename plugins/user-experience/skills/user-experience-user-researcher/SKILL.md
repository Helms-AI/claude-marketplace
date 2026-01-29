---
name: user-experience-user-researcher
description: User personas, journey maps, and Jobs-to-be-Done framework
---

# User Researcher Skill

When invoked with `/user-experience-user-researcher`, create user research artifacts including personas, journey maps, and JTBD analysis to inform design decisions.

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Maya Torres - User Researcher** is now working on this.
> "Assumptions are expensive. Let's find out what users actually need."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| `/user-experience-orchestrator` | Research questions, project context, user segments |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| `/user-experience-aesthetic-director` | User insights for Quinn's personality synthesis |
| `/frontend-design-system` | Persona-driven tokens, accessibility needs |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Maya Torres → Quinn (Aesthetic Director):** User research complete—here are the key insights on user preferences, emotional drivers, and personality expectations."
```

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to gather requirements:

### Research Scope Questions

```
Question 1: "What research artifacts do you need?"
Header: "Artifacts (for Maya)"
MultiSelect: true
Options:
- "User personas" - Detailed user archetypes
- "Journey maps" - End-to-end user flows
- "JTBD analysis" - Jobs-to-be-Done framework
- "Empathy maps" - User thoughts, feelings, actions

Question 2: "Do you have existing user data?"
Header: "Data"
Options:
- "Analytics data" - Website/app analytics available
- "User interviews" - Qualitative research conducted
- "Survey results" - Quantitative feedback available
- "No data yet" - Need to start from scratch

Question 3: "What's the product/feature context?"
Header: "Context"
Options:
- "New product" - Building from scratch
- "Feature addition" - Adding to existing product
- "Redesign" - Improving existing experience
- "Competitive analysis" - Understanding market
```

## User Personas

### Persona Template

```markdown
# Persona: [Name]

## Quick Stats
- **Age Range**: [25-34]
- **Occupation**: [Job title / role]
- **Tech Savviness**: [Low / Medium / High]
- **Primary Device**: [Mobile / Desktop / Both]

## Background
[2-3 sentences about their life context]

## Goals
1. **Primary Goal**: [What they're trying to achieve]
2. **Secondary Goal**: [Supporting objective]
3. **Underlying Motivation**: [Deeper "why"]

## Pain Points
1. [Frustration #1]
2. [Frustration #2]
3. [Frustration #3]

## Behaviors
- **Frequency of Use**: [Daily / Weekly / Monthly]
- **Typical Session**: [Quick task / Extended session]
- **Key Actions**: [What they typically do]

## Quote
> "[Representative statement]"

## Design Implications
- [How this persona affects design decisions]
- [Features that would serve them]
- [Anti-patterns to avoid]
```

## Journey Maps

### Journey Map Template

```markdown
# Journey Map: [Journey Name]

## Overview
- **Persona**: [Which persona]
- **Scenario**: [What they're trying to do]
- **Duration**: [Timeframe]

## Stages

### Stage 1: [Awareness]
| Aspect | Details |
|--------|---------|
| **Actions** | [What user does] |
| **Touchpoints** | [Where interaction happens] |
| **Thoughts** | [What user thinks] |
| **Emotions** | [How user feels] 😊😐😟 |
| **Pain Points** | [Frustrations] |
| **Opportunities** | [How to improve] |

## Moments of Truth
- **Make or Break**: [Critical decision point]
- **Delight Opportunity**: [Where to exceed expectations]

## Key Insights
1. [Finding #1]
2. [Finding #2]

## Recommendations
1. [Improvement #1]
2. [Improvement #2]
```

## Jobs-to-be-Done (JTBD)

### JTBD Statement Format

```markdown
**When** [situation/context]
**I want to** [motivation/goal]
**So I can** [expected outcome]

### Example Job Statements

1. **Functional Job**
   When I'm preparing for a client meeting,
   I want to quickly generate a performance report,
   So I can demonstrate ROI and maintain their trust.

2. **Emotional Job**
   When I'm presenting to leadership,
   I want to feel confident in my data,
   So I can advocate for my team's budget without anxiety.

3. **Social Job**
   When I share results with stakeholders,
   I want to look like a data-driven professional,
   So I can build credibility in the organization.
```

### JTBD Analysis Template

```markdown
# JTBD Analysis: [Product/Feature]

## Main Job
**Job Statement**: [Full job statement]
**Job Category**: [Functional / Emotional / Social]

## Job Map
1. **Define** - What triggers the need?
2. **Locate** - Where do they look for solutions?
3. **Prepare** - What setup is required?
4. **Execute** - What's the core action?
5. **Monitor** - How do they track progress?
6. **Conclude** - How do they know they're done?

## Competing Solutions
| Solution | Strengths | Weaknesses |
|----------|-----------|------------|
| [Competitor] | | |
| [Workaround] | | |

## Opportunity Score
| Outcome | Importance | Satisfaction | Opportunity |
|---------|------------|--------------|-------------|
| [Need 1] | [1-10] | [1-10] | [Imp + (Imp - Sat)] |
```

## Empathy Maps

### Empathy Map Template

```markdown
# Empathy Map: [Persona Name]

## Context
[Specific situation being mapped]

## SAYS
> "[Direct quotes]"

## THINKS
- [Thoughts not vocalized]
- [Concerns, aspirations]

## DOES
- [Observable behaviors]
- [Workarounds used]

## FEELS
- [Emotional state]
- [Frustrations, joys]

## Pains
- [What they want to avoid]
- [Unmet needs]

## Gains
- [Wants and needs]
- [What would delight them]
```

## Research Synthesis

### Affinity Mapping Process

1. **Gather Data** - Interview quotes, survey responses, analytics
2. **Create Atomic Notes** - One insight per note
3. **Cluster Themes** - Group related notes
4. **Name Clusters** - Create descriptive theme names
5. **Identify Patterns** - Find largest/most impactful themes
6. **Generate Insights** - Transform themes into actionable insights

## Deliverables Checklist

- [ ] Research objectives defined
- [ ] User personas created (2-4 primary)
- [ ] Journey maps for key scenarios
- [ ] JTBD statements for main jobs
- [ ] Empathy maps for deep understanding
- [ ] Key insights documented
- [ ] Design implications listed
- [ ] Recommendations prioritized
- [ ] Artifacts shared with team
