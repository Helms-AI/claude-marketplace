# API Documentation Skill

Automatically generate OpenAPI 3.0 documentation from your codebase.

## Installation

```bash
# User-level
cp skill.md ~/.claude/skills/api-docs.md

# Project-level
cp skill.md .claude/skills/api-docs.md
```

## Usage

```
/api-docs
```

## Supported Frameworks

- **Node.js**: Express, Fastify, Koa
- **Python**: FastAPI, Django REST, Flask
- **Java**: Spring Boot
- **Go**: Chi, Gin, Echo
- **Ruby**: Rails API

## Output

Generates `docs/openapi.yaml` with:
- All discovered endpoints
- Request/response schemas
- Parameter documentation
- Authentication requirements

## Author

Platform Team - platform@helms-ai.com
