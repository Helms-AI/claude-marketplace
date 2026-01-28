---
name: ux-user-researcher
description: User personas, journey maps, and Jobs-to-be-Done framework
---

# User Researcher Skill

When invoked with `/ux-user-researcher`, create user research artifacts including personas, journey maps, and JTBD analysis to inform UI/UX decisions.

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
| orchestrator | Research questions, project context, user segments to explore |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| aesthetic-director | User insights for Quinn's personality synthesis, emotional drivers |
| design-system | Persona-driven tokens, user preference patterns, accessibility needs |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Maya Torres → Quinn (Aesthetic Director):** User research complete—here are the key insights on user preferences, emotional drivers, and personality expectations to inform the aesthetic direction."
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

### Depth Questions

```
Question 4: "How detailed should personas be?"
Header: "Depth"
Options:
- "Lightweight" - Quick, actionable profiles
- "Standard" - Balanced detail level
- "Comprehensive" - Deep research-backed profiles
- "Proto-personas" - Hypothesis-based, to be validated

Question 5: "Journey map scope?"
Header: "Scope"
Options:
- "Single task" - One specific user flow
- "Feature journey" - End-to-end feature usage
- "Full lifecycle" - Awareness to advocacy
- "Cross-channel" - Multi-touchpoint experience
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
[2-3 sentences about their life context, work situation, and relationship to the product domain]

## Goals
1. **Primary Goal**: [What they're trying to achieve]
2. **Secondary Goal**: [Supporting objective]
3. **Underlying Motivation**: [Deeper "why"]

## Pain Points
1. [Frustration or challenge #1]
2. [Frustration or challenge #2]
3. [Frustration or challenge #3]

## Behaviors
- **Frequency of Use**: [Daily / Weekly / Monthly]
- **Typical Session**: [Quick task / Extended session]
- **Key Actions**: [What they typically do]

## Quote
> "[A representative statement that captures their perspective]"

## Scenario
[Brief narrative of them using the product in their typical context]

## Design Implications
- [How this persona affects design decisions]
- [Features or patterns that would serve them]
- [Anti-patterns to avoid for this user]
```

### Persona Creation Process

```typescript
// types/persona.ts
interface Persona {
  id: string;
  name: string;
  avatar: string;
  demographics: {
    ageRange: string;
    occupation: string;
    location: string;
    income?: string;
  };
  psychographics: {
    techSavviness: 'low' | 'medium' | 'high';
    riskTolerance: 'conservative' | 'moderate' | 'adventurous';
    values: string[];
  };
  behaviors: {
    primaryDevice: 'mobile' | 'desktop' | 'both';
    usageFrequency: string;
    preferredChannels: string[];
  };
  goals: {
    primary: string;
    secondary: string[];
    underlying: string;
  };
  painPoints: string[];
  quote: string;
  scenario: string;
  designImplications: string[];
}
```

### Example Personas

```markdown
# Persona: Sarah Chen

## Quick Stats
- **Age Range**: 32-38
- **Occupation**: Marketing Manager at mid-size tech company
- **Tech Savviness**: High
- **Primary Device**: Laptop during work, mobile evenings

## Background
Sarah manages a team of 5 marketers and is responsible for campaign performance across multiple channels. She's data-driven but overwhelmed by the number of tools and dashboards she needs to check daily. She values efficiency and clear insights over complex features.

## Goals
1. **Primary Goal**: Quickly understand campaign performance at a glance
2. **Secondary Goal**: Generate reports for leadership without manual work
3. **Underlying Motivation**: Prove her team's value and get budget approval

## Pain Points
1. Too many dashboards to check across different platforms
2. Exporting data for reports takes hours of manual work
3. Can't easily share insights with non-technical stakeholders

## Behaviors
- **Frequency of Use**: Multiple times daily
- **Typical Session**: 5-10 minute check-ins, occasional deep dives
- **Key Actions**: Check metrics, compare periods, export reports

## Quote
> "I need to see the big picture in 30 seconds, then drill down when something looks off."

## Design Implications
- Dashboard should show key metrics prominently
- One-click report generation is essential
- Mobile view for quick status checks
- Shareable views for stakeholders
```

## Journey Maps

### Journey Map Template

```markdown
# Journey Map: [Journey Name]

## Overview
- **Persona**: [Which persona]
- **Scenario**: [What they're trying to do]
- **Duration**: [Timeframe of journey]

## Stages

### Stage 1: [Awareness/Discovery]
| Aspect | Details |
|--------|---------|
| **Actions** | [What user does] |
| **Touchpoints** | [Where interaction happens] |
| **Thoughts** | [What user is thinking] |
| **Emotions** | [How user feels] 😊😐😟 |
| **Pain Points** | [Frustrations] |
| **Opportunities** | [How to improve] |

### Stage 2: [Consideration/Research]
| Aspect | Details |
|--------|---------|
| **Actions** | [What user does] |
| **Touchpoints** | [Where interaction happens] |
| **Thoughts** | [What user is thinking] |
| **Emotions** | [How user feels] |
| **Pain Points** | [Frustrations] |
| **Opportunities** | [How to improve] |

### Stage 3: [Decision/Action]
...

### Stage 4: [Use/Experience]
...

### Stage 5: [Loyalty/Advocacy]
...

## Moments of Truth
- **Make or Break Moment**: [Critical point where user decides to continue or abandon]
- **Delight Opportunity**: [Where we can exceed expectations]

## Key Insights
1. [Major finding #1]
2. [Major finding #2]
3. [Major finding #3]

## Recommendations
1. [Actionable improvement #1]
2. [Actionable improvement #2]
3. [Actionable improvement #3]
```

### Journey Map Visualization (React)

```tsx
// components/JourneyMap.tsx
interface Stage {
  name: string;
  actions: string[];
  touchpoints: string[];
  thoughts: string;
  emotion: 'positive' | 'neutral' | 'negative';
  painPoints: string[];
  opportunities: string[];
}

interface JourneyMapProps {
  title: string;
  persona: string;
  stages: Stage[];
}

export function JourneyMap({ title, persona, stages }: JourneyMapProps) {
  const emotionIcons = {
    positive: '😊',
    neutral: '😐',
    negative: '😟'
  };

  return (
    <div className="journey-map">
      <header className="mb-8">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-text-secondary">Persona: {persona}</p>
      </header>

      <div className="grid gap-4" style={{
        gridTemplateColumns: `repeat(${stages.length}, 1fr)`
      }}>
        {stages.map((stage, index) => (
          <div key={stage.name} className="stage-card">
            <div className="stage-header">
              <span className="stage-number">{index + 1}</span>
              <h3 className="stage-name">{stage.name}</h3>
            </div>

            <div className="emotion text-3xl text-center my-4">
              {emotionIcons[stage.emotion]}
            </div>

            <div className="space-y-4">
              <Section title="Actions" items={stage.actions} />
              <Section title="Touchpoints" items={stage.touchpoints} />
              <Quote text={stage.thoughts} />
              <Section title="Pain Points" items={stage.painPoints} variant="negative" />
              <Section title="Opportunities" items={stage.opportunities} variant="positive" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Jobs-to-be-Done (JTBD)

### JTBD Statement Format

```markdown
## Job Statement Structure

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

### 1. Define
- What triggers the need?
- How do they define success?

### 2. Locate
- Where do they look for solutions?
- What information do they need?

### 3. Prepare
- What setup is required?
- What resources are needed?

### 4. Confirm
- How do they validate the approach?
- What gives them confidence?

### 5. Execute
- What's the core action?
- What variations exist?

### 6. Monitor
- How do they track progress?
- What feedback do they need?

### 7. Modify
- When do they need to adjust?
- What triggers changes?

### 8. Conclude
- How do they know they're done?
- What happens next?

## Competing Solutions
| Solution | Strengths | Weaknesses |
|----------|-----------|------------|
| [Competitor 1] | | |
| [Current behavior] | | |
| [Workaround] | | |

## Opportunity Score
| Outcome | Importance (1-10) | Satisfaction (1-10) | Opportunity |
|---------|-------------------|---------------------|-------------|
| [Outcome 1] | | | = Imp + (Imp - Sat) |
| [Outcome 2] | | | |

## Design Recommendations
Based on this JTBD analysis:
1. [Recommendation tied to unmet need]
2. [Recommendation tied to high opportunity score]
3. [Recommendation tied to emotional/social jobs]
```

## Empathy Maps

### Empathy Map Template

```markdown
# Empathy Map: [Persona Name]

## Context
[Specific situation or task being mapped]

## SAYS
> "[Direct quotes or statements they make]"
> "[Another quote]"

## THINKS
- [Thoughts they might not vocalize]
- [Concerns, aspirations, doubts]
- [What occupies their mind]

## DOES
- [Observable actions and behaviors]
- [How they interact with products/services]
- [Workarounds they use]

## FEELS
- [Emotional state during this experience]
- [Frustrations, joys, fears]
- [What motivates them emotionally]

## Pains
- [Frustrations, obstacles, risks]
- [What they want to avoid]
- [Unmet needs]

## Gains
- [Wants and needs]
- [Measures of success]
- [What would delight them]
```

## Research Synthesis

### Affinity Mapping Process

```markdown
## Affinity Mapping

### 1. Gather Data Points
- Interview quotes
- Survey responses
- Analytics insights
- Support tickets

### 2. Create Atomic Notes
Each note contains ONE insight:
- "[Quote/observation]" - [Source]

### 3. Cluster Themes
Group related notes into themes:
- Theme A: [Name]
  - Note 1
  - Note 2
- Theme B: [Name]
  - Note 3
  - Note 4

### 4. Name Clusters
Create descriptive theme names that capture the insight

### 5. Identify Patterns
- What themes are largest?
- What themes have highest emotional weight?
- What themes represent unmet needs?

### 6. Generate Insights
Transform themes into actionable insights:
- "[Theme]" → "Users need [specific capability] because [reason]"
```

## Deliverables Checklist

- [ ] Research objectives defined
- [ ] User personas created (2-4 primary personas)
- [ ] Journey maps for key scenarios
- [ ] JTBD statements for main jobs
- [ ] Empathy maps for deep understanding
- [ ] Key insights documented
- [ ] Design implications listed
- [ ] Recommendations prioritized
- [ ] Artifacts shared with team
- [ ] Validation plan for proto-personas
