# super-react

> Guided React engineering — one command per step, zero drift.

**super-react** is a prompt pack and CLI toolkit that turns an AI coding agent into a structured React development partner. Instead of freeform chat, every action follows a strict, auditable workflow: analyze requirements → scaffold a production foundation → build features one at a time → integrate external services → review and test. The agent always knows where the project stands and what to do next.

No magic. No lock-in. Just a repeatable process that produces maintainable React apps.

---

## Install

**Once published to npm:**
```bash
npx super-react init
```

**Pre-release (today):** build from this repo and run the packed CLI:
```bash
pnpm install && pnpm --filter super-react build
# then run the bundled CLI:
node packages/cli/dist/cli.js init
```

That init command:
1. Installs the super-react CLI locally (no global install needed).
2. Writes the agent prompt pack into your project so your AI agent knows all 15 commands.
3. Prints the status dashboard so you can see where you stand.

See `RELEASE.md` for the publish steps.

After init, run your first command inside your AI agent (e.g. Claude Code):

```
/analyze-project
```

---

## The workflow

super-react enforces a strict phase order. Each command is a gate — feature commands are locked until the foundation is in place.

```
analyze → setup-foundation → build / update features → integrate → review / test
```

| Phase | What happens |
|-------|-------------|
| **analyze** | Read your requirements (SRS, BRD, Figma notes, existing code). Write `project-setup/` and `feature-plans/`. |
| **foundation** | Scaffold the full React app (`super-react scaffold`). Locked until requirements are analyzed. |
| **feature** | Build or update UI, API layer, and feature plans one feature at a time. Locked until foundation is ready. |
| **integrate** | Wire external services (auth, payments, third-party APIs). |
| **quality** | Review features, review architecture, generate and run tests, fix issues. |
| **status** | See the dashboard any time — no-lock, always available. |

---

## The 30-second dashboard

Run `/project-status` at any time to see where the project stands:

```
================ super-react ================
  guided React engineering
--------------------------------------------
PROJECT HEALTH
  Requirements analyzed: yes
  Foundation: ready
  Agent: claude-code

FEATURES
  auth          — done
  dashboard-ui  — building
  notifications — planned

-> Recommended next step:  /build-feature dashboard-ui
============================================
```

The dashboard is the single source of truth. The agent shows it verbatim — it never summarizes or edits it.

---

## All 15 commands

| Command | Phase | Description |
|---------|-------|-------------|
| [/analyze-project](docs/commands/analyze-project.md) | analyze | Turn requirements into `project-setup/` and `feature-plans/` |
| [/setup-project-foundation](docs/commands/setup-project-foundation.md) | foundation | Scaffold the complete production React app |
| [/create-feature-plan](docs/commands/create-feature-plan.md) | feature | Write a detailed plan for one feature |
| [/build-feature](docs/commands/build-feature.md) | feature | Build a full feature (UI + API + wiring) |
| [/build-feature-ui](docs/commands/build-feature-ui.md) | feature | Build only the UI layer for a feature |
| [/build-feature-api](docs/commands/build-feature-api.md) | feature | Build only the API layer for a feature |
| [/update-feature](docs/commands/update-feature.md) | feature | Update an existing feature end-to-end |
| [/update-feature-ui](docs/commands/update-feature-ui.md) | feature | Update only the UI layer of a feature |
| [/update-feature-api](docs/commands/update-feature-api.md) | feature | Update only the API layer of a feature |
| [/connect-external-service](docs/commands/connect-external-service.md) | integrate | Wire in an external service (auth, payments, etc.) |
| [/review-feature](docs/commands/review-feature.md) | quality | Adversarial review of a single feature |
| [/review-project-architecture](docs/commands/review-project-architecture.md) | quality | Architecture review against the full project setup |
| [/generate-feature-tests](docs/commands/generate-feature-tests.md) | quality | Generate and run tests for a feature |
| [/fix-project-issues](docs/commands/fix-project-issues.md) | quality | Diagnose and fix failing tests or lint errors |
| [/project-status](docs/commands/project-status.md) | status | Show the dashboard (always available) |

---

## Security stance

- **Self-contained bundle.** The CLI and prompt pack ship as a single pinned artifact. No runtime plugin loading, no remote fetches at agent runtime.
- **Zero runtime dependencies** beyond Node.js itself. The dependency tree is minimal and fully audited at release time.
- **No telemetry.** super-react does not phone home, track usage, or collect any data. It writes only to your local project.
- **Pinned and audited.** All dependencies are locked in `pnpm-lock.yaml`. Use `pnpm audit` to verify the supply chain at any time.

---

## Agent compatibility

super-react ships with a **Claude Code** adapter today. The adapter layer is designed to be extensible: new adapters can be dropped in without changing the command specs or the CLI. If you use a different agent, the prompt pack and workflow logic stay identical — only the file format the agent reads changes.

---

## Developing super-react itself

```bash
pnpm install          # install all workspace dependencies
pnpm typecheck        # type-check the full monorepo
pnpm test             # run all tests
pnpm gen-docs         # regenerate docs/commands/*.md from the spec pack
pnpm build            # build the distributable CLI bundle
```

The command docs in `docs/commands/` are generated — never edit them by hand. Edit the spec in `packages/specs/definitions/<id>.spec.md` and re-run `pnpm gen-docs`.
