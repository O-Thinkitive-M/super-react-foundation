# /update-feature

- **Phase:** feature
- **Requires foundation:** true
- **Next:** /review-feature

## Purpose
Update an existing feature end to end — UI, API, tests, and documentation — keeping everything in sync with its plan.

## Why it exists
Features change. This keeps the implementation and the feature plan from drifting apart.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md` and the current implementation.
3. Apply the change across UI, API, and tests. Update the feature plan to match.
4. Run `super-react-foundation gate all` and resolve failures.

## Example
`/update-feature patient-dashboard`

## Best Practices
Update the feature plan in the same change as the code. Keep tests green. If the change alters scripts, env vars, or `project-setup/` docs, offer to sync the project `README.md`'s managed block per `project-setup/readme-maintenance.md` — **always ask the user first**, update only the marked block, never duplicate the file.

## Common Mistakes
Changing code without updating the plan. Skipping the gate run.

## Troubleshooting
If scope grows, split the change and update the plan accordingly.
