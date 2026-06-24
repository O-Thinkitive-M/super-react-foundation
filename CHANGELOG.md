# Changelog

All notable changes to **super-react-foundation** are documented here.
This project follows [semantic versioning](https://semver.org/).

## 0.3.0

### Added
- **README stays in sync (ask-first).** After setup and feature changes, the agent maintains a single managed block (`<!-- super-react:start/end -->`) in the project's own `README.md` — stack, chosen state library + API transport, scripts, the `project-setup/` index, and status. It **always asks before writing**, never touches content outside the block, never duplicates the file, and creates the README only if missing. Contract seeded as `project-setup/readme-maintenance.md` and wired into the `setup-project-foundation`, `build-feature`, `update-feature`, and `connect-external-service` specs. The scaffold's starter README now ships the markers.
- **Full topic parity for the seeded `project-setup/` docs.** Ported the missing numbered design specs into the foundation-docs set so every project now seeds **30 docs** (29 + `readme-maintenance.md`). New: `tech-stack.md`, `config-registries.md`, `responsive-system.md`, `data-display.md`, `layout-and-overlays.md`, `accessibility.md`, `i18n.md`, `datetime-timezone.md`, `security.md` (baseline + HIPAA/PHI compliance overlay), `cross-browser.md`, `performance.md`, `quality-gates.md`, `mcp-integration.md`, `theme.md`, `forms.md`, `project-plan.md`, `foundation-checklist.md`, `readme-maintenance.md`. Each is a generic, production-level baseline; the project-variable ones (`theme`, `forms`, `project-plan`) carry an explicit **"Adapt per project (UI/SRS/MOM)"** section while the architecture stays fixed. New: `tech-stack.md`, `config-registries.md`, `responsive-system.md`, `data-display.md`, `layout-and-overlays.md`, `accessibility.md`, `i18n.md`, `datetime-timezone.md`, `security.md` (baseline + HIPAA/PHI compliance overlay), `cross-browser.md`, `performance.md`, `quality-gates.md`, `mcp-integration.md`, `theme.md`, `forms.md`, `project-plan.md`, `foundation-checklist.md`. Each is a generic, production-level baseline; the project-variable ones (`theme`, `forms`, `project-plan`) carry an explicit **"Adapt per project (UI/SRS/MOM)"** section while the architecture stays fixed.
- **Working router seeded by default.** The scaffold now ships a config-driven router (`router.tsx`, `paths.ts`, `guards.tsx`, `RootLayout`/`AppLayout`, `RouteError`) matching `project-setup/routing.md`, plus a **deletable demo page** (`features/_demo/`) and a demo auth stub (`lib/auth.ts`). `/` → `/dashboard` renders out of the box; the demo is replaced by adding a feature.
- **Working i18n registry seeded by default.** A typed text registry (`src/i18n/` with `index.ts`, `react-i18next.d.ts`, and `en/` category files) ships with demo keys. The default screen has **zero hardcoded strings** — every label flows through `t()`. Typos are compile errors.
- **API transport choice at scaffold time.** Default is a hand-rolled typed client (`api/client.ts` + `errors`/`query-keys`/`query-client`). Pass **`--sdk`** to instead wire the **Orval pipeline** (`axios-instance.ts`, `orval.config.ts`, transformer, Node guard) with a **public Petstore demo spec** replaceable via `OPENAPI_SPEC_URL` or by editing the config.
- **`project-setup/how-it-works.md`** — a beginner-friendly, step-by-step walkthrough of the default app (boot path, routing, i18n, API, deep-linking) and how each demo placeholder is replaced. Seeded into every project.

### Changed
- Foundation state records the chosen `apiMode` (`client` | `sdk`); the template hash now incorporates the API-mode choice as well as the state library.
- `withStateLibDeps` → `withScaffoldDeps` (now injects SDK deps/scripts when `--sdk` is chosen).
- `setup-project-foundation` command/spec, `routing.md`, and `api-strategy.md` updated to document the seeded router/i18n/API and the `--sdk` option.

### Fixed
- `build.mjs` and the cli `package.json` `files` field now ship the `sdk-variant` data dir so `--sdk` works from the published CLI.

## 0.2.0

### Added
- **State-management choice at scaffold time.** `scaffold` now wires **Redux Toolkit (default) or Zustand**. Choose via `--state=redux|zustand` or the interactive prompt; no answer defaults to Redux. Only the chosen library's dependency and `state-management.md` doc are written.
- **Full end-to-end folder structure, created by default.** Every project is scaffolded with the complete production `src/` tree — `theme/`, `config/`, `i18n/`, `components/{ui,layout,forms,data,feedback}/`, `features/`, `hooks/`, `api/`, `sdk/`, `store/`, `router/`, `types/`, `utils/`, `lib/{ds,algo}/`. Each folder ships empty with a `README.md` describing what belongs in it.
- **Feature-based layout.** Vertical slices live under `src/features/<feature>/` (with `api/`, `components/`, `pages/`, `hooks/`, `config/`, `index.ts`). A copy-me `features/_template/` skeleton ships by default.
- **Complete, production-level `project-setup/` docs.** All foundation docs (architecture, folder-structure, routing, api-strategy, authentication, error-handling, coding-standards, testing-strategy, deployment, data-structures, state-management) are now fully written and identical across every project — only the state-management doc varies by chosen library.
- Project-root placement guidance in the README and the `analyze-project` / `setup-project-foundation` command specs, so the framework installs beside the React app and never inside `src/`.

### Changed
- The scaffold seeds the complete `project-setup/` docs; commands now *adapt* the project-specific decisions on top instead of authoring the docs from scratch.
- Foundation state records the chosen `stateLib`; the template hash now incorporates the library choice.

### Fixed
- **Stale build artifacts.** `build.mjs` now cleans each copied data dir (`files`, `definitions`, `docs`) before copying, so renamed or removed template files no longer linger in the published tarball (previously a removed `src/pages/` could be scaffolded alongside `src/features/`).

## 0.1.1
- Install native slash commands so `/analyze-project` works.

## 0.1.0
- Initial release: prompt pack + CLI enforcing the analyze → scaffold → build → integrate → review workflow.
