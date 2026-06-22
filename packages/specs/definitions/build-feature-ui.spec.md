---
id: build-feature-ui
title: Build Feature UI
phase: feature
requiresFoundation: true
inputs: [feature-plan]
produces: [feature-ui]
cliOps: [guard]
nextSuggested: build-feature-api
---
## Purpose
Build only the frontend of a feature: screens, components, routing, mock data, and a temporary service layer.

## Why it exists
UI can be built and reviewed before the API exists. A temporary service layer keeps the UI runnable without real calls.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md`.
3. Generate screens, components, routing, mock data, and a temporary service layer. Make no real API calls.
4. When the API is implemented later, the temporary service layer is removed while the architecture is preserved.

## Example
`/build-feature-ui patient-dashboard`

## Best Practices
Keep the temporary services behind the same interface the real API will use, so swapping them is trivial.

## Common Mistakes
Making real network calls. Hard-coding mock data inside components instead of the temporary service layer.

## Troubleshooting
"Project Foundation Not Found" → run /setup-project-foundation first.
