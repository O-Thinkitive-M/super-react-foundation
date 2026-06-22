# /build-feature-api

- **Phase:** feature
- **Requires foundation:** true
- **Next:** /review-feature

## Purpose
Build only the backend integration layer of a feature: services, API clients, hooks, types, request/response models, and error handling.

## Why it exists
The data layer can be implemented and verified independently of the UI, and then connected.

## Steps
1. Run `super-react guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md`.
3. Generate services, API clients, hooks, types, request models, response models, and error handling. Do not create UI.
4. If the feature already has a temporary UI service layer, replace it with the real implementation behind the same interface.
5. Run `super-react gate types` and resolve failures.

## Example
`/build-feature-api patient-dashboard`

## Best Practices
Keep request/response types close to the API client. Centralize error handling.

## Common Mistakes
Creating UI here. Leaking server types into components.

## Troubleshooting
Type failures after wiring → run `super-react gate types` and fix the reported mismatches.
