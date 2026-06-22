# /review-project-architecture

- **Phase:** quality
- **Requires foundation:** true
- **Next:** —

## Purpose
Assess overall project quality and report problems with recommendations.

## Why it exists
Periodic architecture review catches drift, duplication, and dead code before they compound.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Run `super-react-foundation gate audit`.
3. Check: folder structure, dependency rules, code duplication, naming conventions, architecture violations, dead code, and unused files.
4. Produce a report with concrete, prioritized recommendations.

## Example
`/review-project-architecture`

## Best Practices
Compare against `project-setup/` rules. Be specific (file:line) and prioritize by severity.

## Common Mistakes
Vague findings. Reporting style nits as critical.

## Troubleshooting
If `gate audit` flags dependencies, address them before claiming the project is production-ready.
