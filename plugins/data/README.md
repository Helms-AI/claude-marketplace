# Data Plugin

A comprehensive data engineering team with 5 specialized agents for data modeling, pipelines, analytics, warehousing, and governance.

## Version

1.0.0

## Overview

The Data plugin provides a conversational data engineering team that can help with:

- Data model design and schema optimization
- ETL/ELT pipeline architecture
- Analytics and BI implementation
- Data warehouse design
- Data governance and compliance

## Agents

| Agent | Name | Role | Expertise |
|-------|------|------|-----------|
| Lead | Jennifer Wu | Data Lead | Strategy, orchestration, stakeholder communication |
| Modeling | Robert Garcia | Data Modeler | ERD, normalization, DBML, dimensional modeling |
| Pipelines | Anna Schmidt | Pipeline Architect | ETL/ELT, Airflow, dbt, streaming |
| Analytics | Chris Lee | Analytics Engineer | BI, dashboards, metrics, reporting |
| Governance | Maria Santos | Governance Advisor | Data quality, compliance, lineage |

## Skills

| Skill | Command | Description |
|-------|---------|-------------|
| Orchestrator | `/data-orchestrator` | Routes data requests to appropriate specialists |
| Team Session | `/data-team-session` | Multi-agent collaborative data discussions |
| Modeler | `/data-modeler` | Data model design, ERD, DBML |
| Pipeline Architect | `/data-pipeline-architect` | ETL/ELT pipelines, Airflow, dbt |
| Analytics Engineer | `/data-analytics-engineer` | BI dashboards, metrics, analytics |
| Warehouse Specialist | `/data-warehouse-specialist` | Data warehouse architecture |
| Governance Advisor | `/data-governance-advisor` | Data governance and compliance |

## Usage

### Quick Start

```
/data-orchestrator
Help me design a customer analytics data pipeline
```

### Team Collaboration

```
/data-team-session
We need to build a data warehouse for our e-commerce platform. Let's discuss the architecture.
```

### Specific Skills

```
/data-modeler
Design a schema for a subscription billing system

/data-pipeline-architect
Create an Airflow DAG for daily order processing

/data-analytics-engineer
Build a cohort retention dashboard

/data-warehouse-specialist
Design a star schema for sales analytics

/data-governance-advisor
Establish data quality rules for customer data
```

## Technologies

The Data plugin supports guidance for:

### Databases
- PostgreSQL, MySQL, SQL Server
- Snowflake, BigQuery, Redshift
- Databricks, Delta Lake

### Pipeline Tools
- Apache Airflow
- dbt (data build tool)
- Apache Kafka, Flink
- Spark, PySpark

### BI & Analytics
- Looker, Tableau, Power BI
- Metabase, Superset
- Custom dashboards

### Governance Tools
- Great Expectations
- Monte Carlo, Atlan
- Data catalogs

## Integration

The Data plugin collaborates well with:

- **Backend Plugin**: API design for data services
- **DevOps Plugin**: CI/CD for data pipelines
- **Architecture Plugin**: System design decisions
- **Documentation Plugin**: Data documentation

## Examples

### Data Model Design

```
/data-modeler

I need a data model for a multi-tenant SaaS application with:
- Users and organizations
- Subscription plans and billing
- Feature usage tracking
```

### Pipeline Architecture

```
/data-pipeline-architect

Design an ETL pipeline that:
- Ingests data from 3 REST APIs
- Transforms and deduplicates records
- Loads into Snowflake daily
- Includes data quality checks
```

### Governance Framework

```
/data-governance-advisor

We're preparing for SOC 2 compliance. What data governance
policies and controls do we need to implement?
```

## File Structure

```
plugins/data/
├── .claude-plugin/
│   ├── plugin.json          # Plugin manifest
│   └── capabilities.json    # Detailed capabilities
├── skills/
│   ├── data-orchestrator/SKILL.md
│   ├── data-team-session/SKILL.md
│   ├── data-modeler/SKILL.md
│   ├── data-pipeline-architect/SKILL.md
│   ├── data-analytics-engineer/SKILL.md
│   ├── data-warehouse-specialist/SKILL.md
│   └── data-governance-advisor/SKILL.md
├── agents/
│   ├── jennifer-lead.md
│   ├── robert-modeling.md
│   ├── anna-pipelines.md
│   ├── chris-analytics.md
│   └── maria-governance.md
└── README.md
```

## Contributing

When extending this plugin:

1. Follow the semantic versioning schema in CLAUDE.md
2. Update capabilities.json when adding new skills
3. Maintain consistent agent personalities
4. Include practical code examples in skills
