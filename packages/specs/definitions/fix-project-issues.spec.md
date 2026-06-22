---
id: fix-project-issues
title: Fix Project Issues
phase: quality
requiresFoundation: true
inputs: []
produces: [fix-report]
cliOps: [fix, gate]
nextSuggested: null
---
## Purpose
Automatically fix common issues: lint, formatting, imports, TypeScript errors, and architecture violations.

## Why it exists
Mechanical issues should be fixed in one pass, not one at a time by hand.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Run `super-react-foundation fix` to apply lint and formatting fixes.
3. Resolve remaining TypeScript errors and architecture violations by hand.
4. Run `super-react-foundation gate all` and report what was fixed and what remains.

## Example
`/fix-project-issues`

## Best Practices
Re-run the gates after fixing to confirm. Report anything that needs human judgment.

## Common Mistakes
Claiming a clean project without re-running the gates.

## Troubleshooting
If `super-react-foundation fix` cannot resolve an error, fix it manually and re-run the gates.
