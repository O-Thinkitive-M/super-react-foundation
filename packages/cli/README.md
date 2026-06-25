# super-react-foundation

> Build production React apps **10x faster with Claude Code** — one command per step, zero drift.

**super-react-foundation** turns Claude Code (and other AI coding agents) into a structured React engineering partner. Instead of freeform "please build me an app" chat that drifts and rewrites itself, you get a strict, auditable workflow exposed as slash commands: **analyze requirements → scaffold a production foundation → build features one at a time → integrate services → review & test.** The agent always knows where the project stands and what to do next.

No magic. No lock-in. Just a repeatable process that produces maintainable React apps.

---

## Quickstart (≈5 minutes)

```bash
# 1. In your project folder (a new empty dir, or an existing React app root):
npx super-react-foundation init        # writes the slash commands into .claude/commands/

# 2. Reload Claude Code so it picks up the new commands (new session / reload window).

# 3. In Claude Code, drive the workflow with slash commands:
/analyze-project                       # point it at your SRS / Figma / existing code
/setup-project-foundation              # scaffolds a working app (prompts Redux/Zustand; add --sdk for an Orval SDK)
/build-feature <name>                  # build features one at a time
/review-feature <name>                 # adversarial review, then /generate-feature-tests
/project-status                        # the dashboard — run any time
```

That's the whole loop. The agent reads `project-setup/` before every step, builds to the feature plan, and keeps the dashboard and README current.

> **Just run `npx super-react-foundation init`** — you do **not** need to `npm i` the package into your project first. `npx` fetches and runs the CLI for you. The framework installs into the directory you run it from; that directory becomes your project root.

> Prefer a global install? `npm i -g super-react-foundation`, then run `super-react-foundation init` anywhere.

---

## Why it's 10x faster

The slow part of AI-built React apps isn't typing code — it's the **re-deciding, re-explaining, and re-doing**. This framework removes all three:

| Without the framework | With super-react-foundation |
|---|---|
| You re-explain your stack/conventions every session | A **complete `project-setup/` knowledge base (30 docs)** is seeded once and the agent reads it every time |
| The agent invents a new folder/router/state pattern each feature | One **opinionated, working foundation** — router, i18n, API layer, theme — scaffolded deterministically |
| "Build the whole app" → drift, half-finished screens | **One feature at a time**, gated; feature commands stay locked until the foundation is solid |
| You hand-wire auth, forms, tables, dates from scratch each time | **Config-driven primitives + 30 prod-level pattern docs** the agent follows verbatim |
| Output quality depends on your prompt that day | **Deterministic CLI** owns the boilerplate; the agent only fills in the project-specific decisions |

The result: the agent spends its tokens on **your** product logic, not on re-deriving the same foundation every project.

---

## Prerequisites

- **Node.js ≥ 22.18** — check with `node -v`.
- **An AI coding agent that reads `.claude/` project commands** — Claude Code today (the v1 adapter). `init` writes the slash commands into your project; the agent runs them.
- **A package manager** — `npm` (ships with Node) is enough to run `npx`. `pnpm ≥ 10` is recommended for the scaffolded app, but the scaffold writes its own `package.json` so npm/pnpm/yarn all work.
- **A project directory** — a new empty folder, or an existing React project you want to bring under the workflow.

No global install, API key, or account is required to run the CLI.

---

## Where to run it — the framework attaches to your project root

super-react-foundation installs **into the directory you run it from**. That directory becomes your *project root*. Run it in the **wrong** place and you get a stray, half-set-up project.

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

**The framework is deliberately not tangled into your app code.** Init and scaffold only ever write framework artifacts at the project root, *next to* your app — never inside `src/`. You can delete every framework artifact and your React app still builds and runs.

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
| `/analyze-project` | analyze | Turn requirements into `project-setup/` and `feature-plans/` |
| `/setup-project-foundation` | foundation | Scaffold the complete production React app |
| `/create-feature-plan` | feature | Write a detailed plan for one feature |
| `/build-feature` | feature | Build a full feature (UI + API + wiring) |
| `/build-feature-ui` | feature | Build only the UI layer for a feature |
| `/build-feature-api` | feature | Build only the API layer for a feature |
| `/update-feature` | feature | Update an existing feature end-to-end |
| `/update-feature-ui` | feature | Update only the UI layer of a feature |
| `/update-feature-api` | feature | Update only the API layer of a feature |
| `/connect-external-service` | integrate | Wire in an external service (auth, payments, etc.) |
| `/review-feature` | quality | Adversarial review of a single feature |
| `/review-project-architecture` | quality | Architecture review against the full project setup |
| `/generate-feature-tests` | quality | Generate and run tests for a feature |
| `/fix-project-issues` | quality | Diagnose and fix failing tests or lint errors |
| `/project-status` | status | Show the dashboard (always available) |

Full per-command docs: see the [`docs/commands/`](https://github.com/O-Thinkitive-M/super-react-foundation/tree/master/docs/commands) directory on GitHub.

---

## Security stance

- **Self-contained bundle.** The CLI and prompt pack ship as a single pinned artifact. No runtime plugin loading, no remote fetches at agent runtime.
- **Zero runtime dependencies** beyond Node.js itself. The dependency tree is minimal and fully audited at release time.
- **No telemetry.** super-react-foundation does not phone home, track usage, or collect any data. It writes only to your local project.
- **Pinned and audited.** All dependencies are locked, and the package is published with **npm provenance** — verifiably linked to the source repo and commit.

---

## Agent compatibility

super-react-foundation ships with a **Claude Code** adapter today. The adapter layer is extensible: new adapters can be dropped in without changing the command specs or the CLI. If you use a different agent, the prompt pack and workflow logic stay identical — only the file format the agent reads changes.

---

## Links

- **Repository & full docs:** https://github.com/O-Thinkitive-M/super-react-foundation
- **Issues:** https://github.com/O-Thinkitive-M/super-react-foundation/issues
- **License:** MIT
