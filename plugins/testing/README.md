# Testing Plugin

A comprehensive testing team with 5 specialized agents for test strategy, unit tests, integration tests, E2E tests, and coverage analysis.

## Overview

The Testing Plugin provides a collaborative team of testing specialists who bring different perspectives and expertise to help you build a robust testing strategy and implementation.

## Agents

| Agent | Name | Role | Expertise |
|-------|------|------|-----------|
| Lead | Amanda Torres | QA Lead | Orchestration, quality strategy, team coordination |
| Strategy | Kevin O'Brien | Test Strategist | Test planning, coverage goals, risk assessment |
| Unit | Nina Johansson | Unit Test Specialist | Jest, Vitest, mocking, TDD |
| Integration | Carlos Mendez | Integration Specialist | API testing, contracts, database testing |
| E2E | Rachel Kim | E2E Engineer | Playwright, Cypress, browser automation |

## Skills

| Skill | Command | Description |
|-------|---------|-------------|
| Orchestrator | `/testing-orchestrator` | Routes testing requests to appropriate specialists |
| Team Session | `/testing-team-session` | Multi-agent testing discussions |
| Strategy Advisor | `/testing-strategy-advisor` | Test strategy planning and architecture |
| Unit Specialist | `/testing-unit-specialist` | Unit test implementation |
| Integration Specialist | `/testing-integration-specialist` | Integration test implementation |
| E2E Engineer | `/testing-e2e-engineer` | End-to-end test implementation |
| Coverage Analyzer | `/testing-coverage-analyzer` | Coverage analysis and gap identification |

## Usage

### Quick Start

```
# Get help with any testing question
/testing-orchestrator How should I test this authentication flow?

# Deep dive into unit testing
/testing-unit-specialist Write tests for this React component

# Plan your test strategy
/testing-strategy-advisor Design a test pyramid for our microservices
```

### Team Sessions

Use `/testing-team-session` when you need multiple perspectives:

```
/testing-team-session How should we balance unit vs integration vs E2E tests for our API?
```

This brings all specialists into a collaborative discussion, each contributing their expertise.

## Technologies Supported

### Unit Testing
- Jest
- Vitest
- Testing Library (React, Vue, Angular)
- Mocha/Chai

### Integration Testing
- Supertest
- Pact (contract testing)
- Test Containers
- MSW (Mock Service Worker)

### E2E Testing
- Playwright
- Cypress
- Selenium (legacy support)

### Coverage Tools
- Istanbul/nyc
- c8
- Native coverage (Jest, Vitest)

## Best Practices

The team follows these core principles:

1. **Test Pyramid** - More unit tests, fewer E2E tests
2. **Risk-Based Testing** - Focus coverage on critical paths
3. **Fast Feedback** - Optimize for quick test execution
4. **Maintainability** - Tests should be easy to understand and update
5. **Isolation** - Tests should not depend on each other

## Integration with Other Plugins

The Testing Plugin works well with:

- **Backend Plugin** - For API and service testing strategies
- **UX Plugin** - For component and visual testing
- **DevOps Plugin** - For CI/CD pipeline integration
- **Security Plugin** - For security testing considerations

## Version History

- **1.0.0** - Initial release with 5 agents and 7 skills
