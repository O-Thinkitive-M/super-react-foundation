# Changelog

All notable changes to **super-react-foundation** are documented here.
This project follows [semantic versioning](https://semver.org/).

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
