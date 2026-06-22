---
id: analyze-project
title: Analyze Project
phase: analyze
requiresFoundation: false
inputs: [SRS, BRD, MOM, PRD, figma-notes, existing-docs, existing-codebase]
produces: [project-setup/, feature-plans/]
cliOps: []
nextSuggested: setup-project-foundation
---
## Purpose
Turn whatever requirement material exists into two folders the rest of the workflow relies on: `project-setup/` (how the app is built) and `feature-plans/` (what to build).

## Why it exists
Building before the requirements are understood produces rework. This command extracts the requirements once, in writing, so every later command has a single source of truth.

## Steps
1. Search the repository for any requirement documents (SRS, BRD, MOM, PRDs, Figma notes, existing docs, existing code).
2. If none are found, ask the user: "Do you have any of: SRS, MOM, BRD, product notes, existing screens?" If the answer is no, generate `project-setup/` using a default enterprise React architecture and leave `feature-plans/` empty.
3. From the material, extract: functional requirements, non-functional requirements, user roles, features, API requirements, security requirements, and architecture requirements.
4. Write the architecture decisions into `project-setup/` and one `feature-plans/<feature>.md` per feature.
5. Report "Analysis Complete", list what was created, and state that feature development is locked until the foundation is set up.

## Example
`/analyze-project` — reads everything under `docs/` and writes `project-setup/` + `feature-plans/`.

## Best Practices
Read every available document before extracting. Keep each extracted requirement traceable to its source. Prefer the user's existing terminology.

## Common Mistakes
Inventing requirements the documents do not support. Starting to build before analysis is complete.

## Troubleshooting
No documents found and the user has none → generate the default architecture and recommend running setup next.
