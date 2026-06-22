---
id: create-feature-plan
title: Create Feature Plan
phase: feature
requiresFoundation: false
inputs: [feature-description]
produces: [feature-plans/<name>.md]
cliOps: []
nextSuggested: build-feature
---
## Purpose
Write a single feature specification file that a build command can implement directly.

## Why it exists
A short, structured plan per feature keeps implementation honest and reviewable. Planning is allowed before the foundation exists; only *building* is locked.

## Steps
1. Take the feature description from the user.
2. Create `feature-plans/<name>.md` containing: Business Goal, User Stories, Acceptance Criteria, UI Requirements, API Requirements, Validation Rules, State Management, Error Handling, Testing Requirements, Technical Notes.
3. Ask the user whether to start implementation now, offering: UI only, API only, Full feature, or Later.

## Example
`/create-feature-plan "patient notes module"` → writes `feature-plans/patient-notes.md`.

## Best Practices
Make acceptance criteria concrete and testable. Keep one feature per file. Reuse names and terms from `project-setup/`.

## Common Mistakes
Vague acceptance criteria. Bundling several features into one plan.

## Troubleshooting
If the feature is large, split it into multiple feature-plan files and sequence them.
