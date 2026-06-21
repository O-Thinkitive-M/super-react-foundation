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

## Steps
1. Run `super-react guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md`.
3. Implement UI, API, validation, state, error handling, types, and tests.
