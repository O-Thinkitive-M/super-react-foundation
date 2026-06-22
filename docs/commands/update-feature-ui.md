# /update-feature-ui

- **Phase:** feature
- **Requires foundation:** true
- **Next:** —

## Purpose
Update only the frontend of an existing feature.

## Why it exists
Sometimes only the UI changes; this keeps the change scoped.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md`.
3. Apply the UI change only. Leave the API layer untouched.

## Example
`/update-feature-ui patient-dashboard`

## Best Practices
Keep the change behind the existing service interface.

## Common Mistakes
Touching the API layer when only UI was requested.

## Troubleshooting
"Project Foundation Not Found" → run /setup-project-foundation first.
