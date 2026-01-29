# Backend Plugin

A conversational backend team with 5 specialized agents for API development, database design, authentication, services, and integrations.

## Version

1.0.0

## Agents

| Agent | Name | Role | Expertise |
|-------|------|------|-----------|
| Lead | David Park | Backend Lead | Technical leadership, architecture decisions, team orchestration |
| API | Sarah Mitchell | API Engineer | REST, GraphQL, API versioning, OpenAPI documentation |
| Database | Raj Patel | Database Architect | PostgreSQL, MongoDB, Redis, migrations, query optimization |
| Auth | Lisa Wong | Auth Specialist | OAuth 2.0, JWT, RBAC, session management, security |
| Services | Omar Hassan | Services Engineer | Microservices, message queues, event-driven architecture |

## Skills

| Skill | Command | Description |
|-------|---------|-------------|
| Orchestrator | `/backend-orchestrator` | Routes backend requests to appropriate specialists |
| Team Session | `/backend-team-session` | Multi-agent discussions for complex decisions |
| API Builder | `/backend-api-builder` | API endpoint design and implementation |
| Database Modeler | `/backend-database-modeler` | Schema design, migrations, optimization |
| Auth Architect | `/backend-auth-architect` | Authentication and authorization |
| Service Builder | `/backend-service-builder` | Microservices and distributed systems |
| Integration Specialist | `/backend-integration-specialist` | Third-party API integrations |

## Usage

### Quick Start

Use `/backend-orchestrator` for general backend questions. David Park will route your request to the appropriate specialist.

### Direct Access

Call specialists directly when you know what you need:

```
/backend-api-builder     - Designing REST or GraphQL APIs
/backend-database-modeler - Schema design and migrations
/backend-auth-architect   - Authentication implementation
/backend-service-builder  - Microservices architecture
/backend-integration-specialist - Third-party integrations
```

### Team Discussions

Use `/backend-team-session` for complex decisions that benefit from multiple perspectives:

- Architecture reviews
- Technology selection
- Design trade-offs
- Migration planning

## Technologies

### APIs
- Express.js, Fastify, NestJS
- GraphQL (Apollo, Yoga)
- tRPC
- OpenAPI/Swagger

### Databases
- PostgreSQL
- MongoDB
- Redis
- Prisma, TypeORM, Drizzle

### Authentication
- JWT, Sessions
- OAuth 2.0, OIDC
- Auth.js, Clerk, Auth0
- Passport.js

### Services
- Docker, Kubernetes
- RabbitMQ, Kafka
- Redis Streams
- gRPC

### Integrations
- Stripe, PayPal
- SendGrid, Postmark
- AWS S3, Cloudflare R2
- OpenAI, Anthropic

## Cross-Plugin Collaboration

This plugin collaborates with:

- **Architecture**: System design and technical strategy
- **UX**: API design for frontend consumption
- **Testing**: Test strategies and coverage
- **DevOps**: Deployment and infrastructure
- **Data**: Data pipelines and analytics
- **Security**: Security audits and compliance

## Examples

### Design a REST API

```
/backend-api-builder

I need to create a REST API for a blog platform with users, posts, and comments.
```

### Design a Database Schema

```
/backend-database-modeler

Design a schema for an e-commerce platform with products, orders, and customers.
```

### Implement Authentication

```
/backend-auth-architect

I need to add JWT authentication to my Express API with refresh tokens.
```

### Architecture Discussion

```
/backend-team-session

Should we use microservices or a modular monolith for our new platform?
```
