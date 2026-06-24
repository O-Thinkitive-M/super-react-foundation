---
id: build-feature
title: Build Feature
phase: feature
requiresFoundation: true
inputs: [feature-plan]
produces: [feature-code]
cliOps: [guard, gate]
nextSuggested: review-feature
---
## Purpose
Implement a complete feature (UI + API + tests) from its feature plan.

## Why it exists
One command takes an approved feature plan all the way to working, tested code, so building a feature is consistent and repeatable.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md`.
3. Implement UI, API, validation, state, error handling, types, and tests.

## Example
`/build-feature patient-dashboard`

## Best Practices
Build only to the acceptance criteria in the feature plan. Reuse the project's existing primitives and the patterns in `project-setup/`. If the feature adds a script, env var, or new `project-setup/` doc, offer to sync the project `README.md`'s managed block per `project-setup/readme-maintenance.md` — **always ask the user first**, update only the marked block, never duplicate the file.

## Common Mistakes
Building beyond the plan's scope. Skipping tests, validation, or error/loading states.

## Troubleshooting
"Project Foundation Not Found" → run /setup-project-foundation first.
