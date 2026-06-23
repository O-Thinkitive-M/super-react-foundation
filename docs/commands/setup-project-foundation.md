# /setup-project-foundation

- **Phase:** foundation
- **Requires foundation:** false
- **Next:** /project-status

## Purpose
Create the complete, production-ready React foundation. This is mandatory — feature commands stay locked until it succeeds.

## Why it exists
A consistent, opinionated foundation is what makes every later feature fast and safe to build. Doing it once, deterministically, prevents drift. **Every project gets the same end-to-end folder structure and the same complete `project-setup/` docs** — the only thing that varies is the chosen library (e.g. state management), so projects stay comparable and the agent never re-invents the base.

## Where it installs
Run scaffold from the **project root** — the same directory where `init` was run, i.e. the React app's own root (the folder with its `package.json`). The framework writes only at the root, *next to* the app (`project-setup/`, `FOUNDATION_COMPLETE.md`, `.claude/`); it never writes into `src/` and the app never imports it. Do not run it in the parent of an existing app — that scaffolds a stray second app one level up.

## Steps
1. Choose the client-state library: **Redux Toolkit (default) or Zustand**. Either pass `--state=redux|zustand`, or run `scaffold` interactively and answer the prompt. No answer ⇒ Redux.
2. Run `super-react-foundation scaffold`. This copies the pinned React foundation, injects the chosen state library's dependencies, seeds the **complete** `project-setup/` docs (identical across projects except the state-management doc, which matches the chosen library), installs dependencies, writes `FOUNDATION_COMPLETE.md`, and unlocks feature development.
3. The seeded `project-setup/` docs are already production-complete and generic. Only *adapt the project-specific decisions* captured by analyze-project (route names, auth provider, env vars, domain entities) on top of them — do not rewrite the docs from scratch and do not change the shared structure.
4. Run `super-react-foundation gate all` and resolve anything that fails.
5. Report "Project Foundation Complete", note which state library was wired, and that feature development is unlocked.

## Example
`/setup-project-foundation` — scaffolds the app (prompting Redux/Zustand) and seeds the complete `project-setup/` docs, then adapts the project-specific bits.

## Best Practices
Let `scaffold` own the deterministic base *and* the docs. Only hand-edit the project-specific decisions; keep the shared structure and the bullet/table format intact.

## Common Mistakes
Re-implementing boilerplate or rewriting the seeded docs by hand instead of adapting them. Running scaffold in the wrong directory (parent of the app). Skipping the gate run.

## Troubleshooting
"already set up" → the foundation exists; use `super-react-foundation scaffold --force` only if you intend to re-scaffold. Wrong state library wired → re-run with `scaffold --force --state=<redux|zustand>`.
