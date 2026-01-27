---
name: api-docs
description: Generate OpenAPI documentation from code
---

# API Documentation Generator

When invoked with `/api-docs`, analyze the codebase to generate OpenAPI 3.0 documentation.

## Process

1. **Scan for Endpoints**: Find all API routes/endpoints in the codebase
2. **Extract Details**: Parse request/response schemas, parameters, headers
3. **Generate Documentation**: Create OpenAPI 3.0 YAML specification

## Detection Patterns

Look for API definitions in:
- Express.js routes (`app.get`, `app.post`, `router.*`)
- FastAPI decorators (`@app.get`, `@router.post`)
- Spring annotations (`@GetMapping`, `@PostMapping`)
- Django REST Framework viewsets
- Go Chi/Gin handlers
- Any framework-specific routing patterns

## Output Format

Generate an OpenAPI 3.0 specification:

```yaml
openapi: 3.0.0
info:
  title: [Project Name] API
  version: 1.0.0
  description: Auto-generated API documentation

servers:
  - url: http://localhost:3000
    description: Development server

paths:
  /endpoint:
    get:
      summary: Endpoint description
      parameters: []
      responses:
        '200':
          description: Success response
          content:
            application/json:
              schema:
                type: object

components:
  schemas: {}
  securitySchemes: {}
```

## Instructions

1. Search for all API endpoint definitions
2. For each endpoint, document:
   - HTTP method and path
   - Request parameters (query, path, body)
   - Request/response content types
   - Response schemas
   - Authentication requirements
3. Group endpoints by resource/tag
4. Write the complete OpenAPI spec to `docs/openapi.yaml`
