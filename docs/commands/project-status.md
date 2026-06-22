# /project-status

- **Phase:** status
- **Requires foundation:** false
- **Next:** —

## Purpose
Show the current state of the project so the developer always knows what to do next.

## Why it exists
A developer should always be able to see where the project stands and what to do next, without reading code.

## Steps
1. Run `super-react-foundation status`.
2. Show the dashboard it prints, unchanged.

## Example
`/project-status`

## Best Practices
Show the dashboard exactly as the CLI prints it; let it be the single source of truth for progress.

## Common Mistakes
Editing or summarizing the dashboard instead of showing it verbatim.

## Troubleshooting
"not initialized" → run super-react-foundation init (or /analyze-project) first.
