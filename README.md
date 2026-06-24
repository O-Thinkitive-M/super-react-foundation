# super-react-foundation

> Build production React apps **10x faster with Claude Code** — one command per step, zero drift.

**super-react-foundation** turns Claude Code into a structured React engineering partner. Instead of freeform "please build me an app" chat that drifts and rewrites itself, you get a strict, auditable workflow exposed as slash commands: **analyze requirements → scaffold a production foundation → build features one at a time → integrate services → review & test.** Claude always knows where the project stands and what to do next.

No magic. No lock-in. Just a repeatable process that produces maintainable React apps.

---

## Why it's 10x faster with Claude Code

The slow part of AI-built React apps isn't typing code — it's the **re-deciding, re-explaining, and re-doing**. This framework removes all three:

| Without the framework | With super-react-foundation |
|---|---|
| You re-explain your stack/conventions every session | A **complete `project-setup/` knowledge base (30 docs)** is seeded once and Claude reads it every time |
| Claude invents a new folder/router/state pattern each feature | One **opinionated, working foundation** — router, i18n, API layer, theme — scaffolded deterministically |
| "Build the whole app" → drift, half-finished screens | **One feature at a time**, gated; feature commands stay locked until the foundation is solid |
| You hand-wire auth, forms, tables, dates from scratch each time | **Config-driven primitives + 30 prod-level pattern docs** Claude follows verbatim |
| Output quality depends on your prompt that day | **Deterministic CLI** owns the boilerplate; Claude only fills in the project-specific decisions |
| README/docs rot as the app changes | Claude keeps your project **README in sync** (asking first) — see [readme-maintenance](packages/foundation-docs/docs/readme-maintenance.md) |

The result: Claude spends its tokens on **your** product logic, not on re-deriving the same foundation every project.

---

## Quickstart with Claude Code (≈5 minutes)

```bash
# 1. In your project folder (new empty dir, or an existing React app root):
npx super-react-foundation init        # writes the slash commands into .claude/commands/

# 2. Reload Claude Code so it picks up the new commands (new session / reload window).

# 3. In Claude Code, drive the workflow with slash commands:
/analyze-project                       # point it at your SRS / Figma / existing code
/setup-project-foundation              # scaffolds a working app (prompts Redux/Zustand; add --sdk for an Orval SDK)
/build-feature <name>                  # build features one at a time
/review-feature <name>                 # adversarial review, then /generate-feature-tests
/project-status                        # the dashboard — run any time
```

That's the whole loop. Claude reads `project-setup/` before every step, builds to the feature plan, and keeps the dashboard and README current.

---

## Prerequisites

- **Node.js ≥ 22.18** — check with `node -v`.
- **An AI coding agent that reads `.claude/` project commands** — Claude Code today (the v1 adapter). `init` writes the slash commands into your project; the agent runs them.
- **A package manager** — `npm` (ships with Node) is enough to run `npx`. `pnpm ≥ 10` is recommended for the scaffolded app, but the scaffold writes its own `package.json` so any of npm/pnpm/yarn works.
- **A project directory** — a new empty folder, or an existing React project you want to bring under the workflow.

No global install, API key, or account is required to run the CLI.

---

## Install

**Once published to npm:**
```bash
npx super-react-foundation init
```
> Or install globally with `npm i -g super-react-foundation`, then run `super-react-foundation` anywhere.

**Pre-release (today):** build from this repo and run the packed CLI:
```bash
pnpm install && pnpm --filter super-react-foundation build
# then run the bundled CLI:
node packages/cli/dist/cli.js init
```

That init command:
1. Installs the super-react-foundation CLI locally (no global install needed).
2. Writes 15 slash commands into `.claude/commands/` so your AI agent exposes them as `/analyze-project`, `/build-feature`, etc.
3. Prints the status dashboard so you can see where you stand.

See `RELEASE.md` for the publish steps.

After init, **reload your agent** so it picks up the new commands (in Claude Code: reload the window / start a new session), then run your first command:

```
/analyze-project
```

### Where to run it — the framework attaches to your project root

super-react-foundation installs **into the directory you run it from**. That directory becomes your *project root*. Run it in the **wrong** place and you get a stray, half-set-up project.

There are two supported starting points:

| You already have a React app | You're starting from scratch |
|---|---|
| `cd` **into the app's root** (the folder with its `package.json`) and run init there. | Make one empty folder, `cd` into it, and run init. `scaffold` creates the React app for you. |

```bash
# existing app — run it INSIDE the app folder, not its parent
cd my-react-app
npx super-react-foundation init

# from scratch — one folder, then let scaffold build the app
mkdir my-app && cd my-app
npx super-react-foundation init
```

**The framework is deliberately not tangled into your app code.** Init and scaffold only ever write framework artifacts at the project root, *next to* your app — never inside `src/`:

```
my-app/                     ← project root (where you ran init)
├── .claude/commands/       ← framework: the slash commands
├── project-setup/          ← framework: your architecture docs
├── feature-plans/          ← framework: what to build
├── FOUNDATION_COMPLETE.md  ← framework: the foundation marker
│
├── src/                    ← your React app (untouched by the framework)
├── package.json            ← your app (scaffold adds deps; nothing framework-specific)
└── vite.config.ts          ← your app
```

You can delete every framework artifact and your React app still builds and runs. Nothing in `src/`, `vite.config.ts`, `tsconfig.json`, or your component code imports from or depends on super-react-foundation.

> **Common mistake:** running init in the *parent* of your React app. That scaffolds a second app one level up. If you see a `src/` appear next to your existing app folder, you ran it one directory too high — delete the stray files and re-run from inside the app.

---

## The workflow

super-react-foundation enforces a strict phase order. Each command is a gate — feature commands are locked until the foundation is in place.

```
analyze → setup-foundation → build / update features → integrate → review / test
```

| Phase | What happens |
|-------|-------------|
| **analyze** | Read your requirements (SRS, BRD, Figma notes, existing code). Write `project-setup/` and `feature-plans/`. |
| **foundation** | Scaffold a **working** React app — router, i18n, API layer, theme, demo screen — plus the complete 30-doc `project-setup/` knowledge base. Choose state (Redux/Zustand) and API transport (typed client or `--sdk` Orval). Locked until requirements are analyzed. |
| **feature** | Build or update UI, API layer, and feature plans one feature at a time. Locked until foundation is ready. |
| **integrate** | Wire external services (auth, payments, third-party APIs). |
| **quality** | Review features, review architecture, generate and run tests, fix issues. |
| **status** | See the dashboard any time — no-lock, always available. |

---

## The 30-second dashboard

Run `/project-status` at any time to see where the project stands:

```
================ super-react-foundation ================
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
- **No telemetry.** super-react-foundation does not phone home, track usage, or collect any data. It writes only to your local project.
- **Pinned and audited.** All dependencies are locked in `pnpm-lock.yaml`. Use `pnpm audit` to verify the supply chain at any time.

---

## Agent compatibility

super-react-foundation ships with a **Claude Code** adapter today. The adapter layer is designed to be extensible: new adapters can be dropped in without changing the command specs or the CLI. If you use a different agent, the prompt pack and workflow logic stay identical — only the file format the agent reads changes.

---

## Developing super-react-foundation itself

```bash
pnpm install          # install all workspace dependencies
pnpm typecheck        # type-check the full monorepo
pnpm test             # run all tests
pnpm gen-docs         # regenerate docs/commands/*.md from the spec pack
pnpm build            # build the distributable CLI bundle
```

The command docs in `docs/commands/` are generated — never edit them by hand. Edit the spec in `packages/specs/definitions/<id>.spec.md` and re-run `pnpm gen-docs`.
