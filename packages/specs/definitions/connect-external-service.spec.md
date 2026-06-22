---
id: connect-external-service
title: Connect External Service
phase: integrate
requiresFoundation: true
inputs: [service-name]
produces: [services, env, integration-guide]
cliOps: [guard]
nextSuggested: project-status
---
## Purpose
Integrate an external system (e.g. Keycloak, Stripe, Firebase) into the project.

## Why it exists
Integrations should be added consistently — packages, configuration, services, and documentation together — not ad hoc.

## Steps
1. Run `super-react guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Ask the integration questions specific to the service.
3. Install the required packages, configure environment variables (never commit secrets), and generate the service layer.
4. Update `project-setup/` architecture docs and generate a short implementation guide.

## Example
`/connect-external-service stripe`

## Best Practices
Keep secrets in untracked env files. Add the integration across the project consistently.

## Common Mistakes
Committing API keys. Wiring the SDK directly into components instead of a service.

## Troubleshooting
Missing keys at runtime → check the environment file and that the var is prefixed for the client where needed.
