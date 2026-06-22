---
id: setup-project-foundation
title: Setup Project Foundation
phase: foundation
requiresFoundation: false
inputs: [project-setup/]
produces: [src/, FOUNDATION_COMPLETE.md, project-setup/]
cliOps: [scaffold, gate]
nextSuggested: project-status
---
## Purpose
Create the complete, production-ready React foundation. This is mandatory — feature commands stay locked until it succeeds.

## Why it exists
A consistent, opinionated foundation is what makes every later feature fast and safe to build. Doing it once, deterministically, prevents drift.

## Steps
1. Run `super-react-foundation scaffold`. This copies the pinned React foundation, installs dependencies, writes `FOUNDATION_COMPLETE.md`, and unlocks feature development.
2. For each foundation outline, generate the matching `project-setup/<name>.md`, adapting it to the requirements captured by analyze-project (architecture, folder-structure, routing, authentication, state-management, api-strategy, error-handling, testing-strategy, coding-standards, deployment, data-structures).
3. Run `super-react-foundation gate all` and resolve anything that fails.
4. Report "Project Foundation Complete" and that feature development is unlocked.

## Example
`/setup-project-foundation` — scaffolds the app and writes the adapted `project-setup/` docs.

## Best Practices
Let `scaffold` own the deterministic base; only hand-write the project-specific decisions. Keep generated docs as bullets and tables.

## Common Mistakes
Re-implementing boilerplate by hand instead of using `scaffold`. Skipping the gate run.

## Troubleshooting
"already set up" → the foundation exists; use `super-react-foundation scaffold --force` only if you intend to re-scaffold.
