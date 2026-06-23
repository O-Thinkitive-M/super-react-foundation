# /analyze-project

- **Phase:** analyze
- **Requires foundation:** false
- **Next:** /setup-project-foundation

## Purpose
Capture the requirements and the few project-level **choices** the rest of the workflow needs, and write one `feature-plans/<feature>.md` per feature. The full `project-setup/` docs are seeded later by `scaffold` and are the **same complete, production-level structure for every project** — analysis only records the decisions that scaffold and setup will adapt on top of that shared base.

## Why it exists
Building before the requirements are understood produces rework. This command extracts the requirements once, in writing, so every later command has a single source of truth. It also locks in the small set of library choices up front so the foundation is deterministic.

## Where it runs
Run from the **project root** — the React app's own folder (where `init` was run), not its parent. The framework records its notes at the root next to the app; it does not touch `src/`.

## Steps
1. Search the repository for any requirement documents (SRS, BRD, MOM, PRDs, Figma notes, existing docs, existing code).
2. If none are found, ask the user: "Do you have any of: SRS, MOM, BRD, product notes, existing screens?" If the answer is no, proceed with sensible enterprise-React defaults and leave `feature-plans/` empty.
3. From the material, extract: functional requirements, non-functional requirements, user roles, features, API requirements, security requirements, and architecture requirements.
4. **Ask the project choices** that change which library the foundation wires (everything else is identical across projects):
   - State management — **Redux Toolkit (default) or Zustand?**
   - API access — a hand-rolled typed client (default) or a **generated SDK** (e.g. from an OpenAPI spec)?
   Record the answers in `project-setup/decisions.md` (create the folder if needed). These feed `scaffold` (e.g. `--state=…`) and the setup adaptation pass.
5. Write one `feature-plans/<feature>.md` per feature. Do **not** hand-author the full `project-setup/` doc set — `scaffold` seeds the complete, generic docs; setup adapts the project-specific bits.
6. Report "Analysis Complete", list what was created (including the recorded choices), and state that feature **building** is locked until the foundation is set up (planning is still allowed).

## Example
`/analyze-project` — reads everything under `docs/`, records the Redux/Zustand and SDK choices in `project-setup/decisions.md`, and writes `feature-plans/`.

## Best Practices
Read every available document before extracting. Keep each extracted requirement traceable to its source. Prefer the user's existing terminology. Always surface the library choices explicitly rather than assuming.

## Common Mistakes
Inventing requirements the documents do not support. Hand-writing the full `project-setup/` docs (scaffold owns those). Starting to build before analysis is complete.

## Troubleshooting
No documents found and the user has none → record default choices (Redux, typed client), write the decisions file, and recommend running setup next.
