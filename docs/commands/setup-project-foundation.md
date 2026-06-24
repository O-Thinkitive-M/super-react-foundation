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

## What the scaffold seeds (working, not stubs)
The app **boots and renders** immediately — every default folder is filled with a working, documented baseline, not an empty placeholder:
- **Routing** — a config-driven router (`router.tsx`, `paths.ts`, `guards.tsx`, `RootLayout`/`AppLayout`, `RouteError`) matching `project-setup/routing.md`. `/` redirects to `/dashboard`, which lazy-loads a **deletable demo page** (`src/features/_demo/`). Auth is a demo stub in `src/lib/auth.ts`.
- **i18n** — a typed text registry (`src/i18n/`) with demo keys; **no hardcoded strings** in any default screen. Global `t()` usable anywhere, per `project-setup/i18n.md`.
- **API** — chosen at setup time: **default** is a hand-rolled typed client (`src/api/client.ts` + `errors`/`query-keys`/`query-client`); **`--sdk`** instead seeds the Orval pipeline (`axios-instance.ts`, `orval.config.ts`, transformer, node guard) with a **public Petstore demo spec** that is replaced via `OPENAPI_SPEC_URL` or by editing the config (record the real URL in `api-strategy.md`).

Every demo is clearly marked and safe to delete; `project-setup/how-it-works.md` walks through the default app step by step and how each demo is replaced when a feature is added.

## Steps
1. Choose the client-state library: **Redux Toolkit (default) or Zustand**. Either pass `--state=redux|zustand`, or run `scaffold` interactively and answer the prompt. No answer ⇒ Redux.
2. Choose the API transport: **typed HTTP client (default)** or **generated SDK** via `--sdk`. (analyze-project records this decision; pass `--sdk` when the project opted into an OpenAPI SDK.)
3. Run `super-react-foundation scaffold` (add `--sdk` if chosen). This copies the pinned React foundation **with a working router, i18n registry, and API layer**, injects the chosen libraries' dependencies, seeds the **complete** `project-setup/` docs (identical across projects except the state-management doc), installs dependencies, writes `FOUNDATION_COMPLETE.md`, and unlocks feature development.
4. The seeded `project-setup/` docs are already production-complete and generic. Only *adapt the project-specific decisions* captured by analyze-project (route names, auth provider, env vars, domain entities, the real OpenAPI spec URL) on top of them — do not rewrite the docs from scratch and do not change the shared structure.
5. Run `super-react-foundation gate all` and resolve anything that fails.
6. **Sync the project `README.md`** per `project-setup/readme-maintenance.md`: regenerate the managed `<!-- super-react:start -->…<!-- super-react:end -->` block (stack, chosen state library + API transport, scripts, `project-setup/` index, status). **Always ask the user first** — "Update README.md for these changes? (y/n)" — and never touch content outside the block. Create the README only if missing (still asking first). Do not duplicate it into a new file.
7. Report "Project Foundation Complete", note which state library **and API transport** were wired, and that feature development is unlocked.

## Example
`/setup-project-foundation` — scaffolds the app (prompting Redux/Zustand, default typed client) with a working router/i18n/API demo, seeds the complete `project-setup/` docs, then adapts the project-specific bits.
`/setup-project-foundation --sdk` — same, but wires the Orval-generated SDK pipeline (Petstore demo spec) instead of the hand-rolled client.

## Best Practices
Let `scaffold` own the deterministic base *and* the docs. Only hand-edit the project-specific decisions; keep the shared structure and the bullet/table format intact.

## Common Mistakes
Re-implementing boilerplate or rewriting the seeded docs by hand instead of adapting them. Running scaffold in the wrong directory (parent of the app). Skipping the gate run.

## Troubleshooting
"already set up" → the foundation exists; use `super-react-foundation scaffold --force` only if you intend to re-scaffold. Wrong state library wired → re-run with `scaffold --force --state=<redux|zustand>`.
