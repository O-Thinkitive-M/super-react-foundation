# /update-feature-api

- **Phase:** feature
- **Requires foundation:** true
- **Next:** —

## Purpose
Update only the backend integration layer of an existing feature.

## Why it exists
API contracts change; this keeps the change scoped to the data layer.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md`.
3. Apply the API/services/types change only. Do not change UI.
4. Run `super-react-foundation gate types` and resolve failures.

## Example
`/update-feature-api patient-dashboard`

## Best Practices
Preserve the service interface so the UI keeps working.

## Common Mistakes
Breaking the interface the UI depends on without updating the UI.

## Troubleshooting
Type failures → run `super-react-foundation gate types` and fix mismatches.
