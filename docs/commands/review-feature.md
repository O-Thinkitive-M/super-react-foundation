# /review-feature

- **Phase:** quality
- **Requires foundation:** true
- **Next:** /generate-feature-tests

## Purpose
Review one feature implementation against its plan and produce a scorecard.

## Why it exists
A feature is "done" only when it meets its acceptance criteria and quality bar.

## Steps
1. Run `super-react guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md` and the implementation.
3. Check: requirements compliance, acceptance criteria, performance, accessibility, security, and error handling.
4. Run `super-react gate all` and include the result. Produce a scorecard.

## Example
`/review-feature appointments`

## Best Practices
Tie every finding to an acceptance criterion or a quality lens. Be specific.

## Common Mistakes
Approving a feature whose acceptance criteria are unmet.

## Troubleshooting
If gates fail, the feature is not ready regardless of how it looks.
