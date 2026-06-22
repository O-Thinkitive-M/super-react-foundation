---
id: generate-feature-tests
title: Generate Feature Tests
phase: quality
requiresFoundation: true
inputs: [feature-plan]
produces: [tests]
cliOps: [gate]
nextSuggested: null
---
## Purpose
Generate test coverage for a feature: unit, integration, component, and API tests.

## Why it exists
Consistent test coverage per the project's testing strategy keeps features safe to change.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md` and `project-setup/testing-strategy.md`.
3. Generate unit, integration, component, and API tests following that strategy.
4. Run `super-react-foundation gate test` and ensure they pass.

## Example
`/generate-feature-tests billing`

## Best Practices
Test behavior, not implementation detail. Cover the acceptance criteria.

## Common Mistakes
Tests that assert mocks instead of behavior.

## Troubleshooting
Failing tests → fix the code or the test, then re-run `super-react-foundation gate test`.
