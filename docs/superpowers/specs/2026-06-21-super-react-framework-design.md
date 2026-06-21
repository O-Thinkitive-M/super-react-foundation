# super-react — Design Spec

> **Status:** Approved design (brainstorming complete) — ready for implementation planning.
> **Date:** 2026-06-21
> **Working name:** `super-react` (npm availability to be verified before publishing)

---

## 1. Objective

An **open-source, React-specialized AI engineering framework** — a "Superpowers-style" command pack that turns requirement documents into a **production-ready React application** through a guided, strictly-ordered software development lifecycle.

It behaves like a **Technical Architect + Engineering Lead + Project Setup Assistant**, not a code generator. It must be **easy to install**, have **high supply-chain security**, and work with **any AI coding agent** (Claude Code first; Cursor / Codex / Windsurf / Antigravity / future tools via drop-in adapters).

Primary goal: *"Help developers convert requirement documents into a production-ready React application using a guided, step-by-step workflow."*

---

## 2. Goals & Non-Goals

**Goals**
- Single guided workflow: analyze → foundation → build/update features → integrate → review/test → production-ready.
- **Foundation lock**: feature work is blocked (in code) until the project foundation is set up.
- Production-grade, opinionated React foundation matching the depth of the `Project Setup/` reference docs.
- Agent-agnostic by construction: command content authored once, compiled per agent.
- High supply-chain integrity: trustworthy CLI + auditable prompt pack.
- Excellent developer experience: fast, guided, always shows the recommended next step.

**Non-Goals (v1)**
- Backend/server generation (frontend React only; API *integration* layer is in scope).
- Adapters beyond Claude Code (architecture supports them; built in later phases).
- A "lite" foundation profile (default is the comprehensive profile; lite is future).
- E2E test generation (out of frontend scope, mirrors the reference convention).

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Form factor | **Node/npm CLI installer + prompt pack** | One `npx` install; deterministic helpers; renders dashboard |
| Architecture | **Approach C — Hybrid** (canonical spec + compiler **and** thin deterministic CLI core) | Makes security & the foundation lock *real* while keeping universal agent reach |
| Agent reach contract | **Shell-out to the CLI** (`super-react <op>`) | Lowest common denominator every present/future agent supports |
| Spec source of truth | **Markdown + YAML frontmatter** (body *is* the prompt) | Human-readable, auditable, single-sourced for in-agent skill + docs site |
| v1 agent target | **Claude Code** | Dogfoodable now; adapters extend later with no command-content changes |
| v1 command scope | **All 15 slash commands + `init`** | Full product surface from v1 |
| Scaffold strategy | **Hybrid** — pinned templates (architecture) + AI-adapted content (per project) | Production-grade rigor guaranteed; content fits each project |
| Foundation default | **Comprehensive profile** mirroring `Project Setup/` depth | Every generated foundation is production-grade out of the box |
| Security scope | **Supply-chain / framework integrity** | No postinstall, pinned/audited deps, no telemetry, auditable markdown, signed releases |
| Distribution | Dev as **monorepo**, publish as **one self-contained package** | Single `npx` install, minimal supply-chain surface |

---

## 4. Architecture

Two layers:

- **Layer 1 — Prompt pack ("the brain").** Each command is authored once as a canonical, agent-neutral spec. A **compiler** emits each agent's native format. v1 ships the Claude Code adapter; new agents = new adapter, zero changes to command content.
- **Layer 2 — Deterministic CLI core ("the spine").** A Node/TypeScript binary owning reproducible, security-critical work: scaffolding, dependency pinning + `npm audit`, the foundation-lock state, quality-gate runners, and the dashboard. Compiled prompts instruct the agent to **shell out** to this CLI for those operations.

```
requirement docs ──/analyze-project──▶ project-setup/ + feature-plans/
                                          │
                       /setup-project-foundation  (scaffold + gate, code-enforced lock)
                                          │  foundation.complete = true
                                          ▼
        ┌──────────── features unlocked ────────────┐
        build/update feature ─ connect-external ─ review/test ─▶ production-ready
                                          ▲
                              /project-status (any time)
```

### 4.1 Repository layout (monorepo, single published package)

```
super-react/
  packages/
    cli/             # the npx binary — wires core + compiler
    compiler/        # canonical spec -> agent formats
    specs/           # the 15 canonical command specs (single source of truth)
    adapters/
      claude-code/   # v1 adapter (emits .claude/ skills + slash commands)
      # cursor / codex / windsurf / antigravity -> future
    core/            # lock-state, gate runners, scaffold engine, dashboard renderer
    templates/       # pinned React-19/MUI-7/Vite-8 foundation templates
    foundation-docs/ # generators for project-setup/*.md (mirrors Project Setup/ depth)
  docs/              # beginner-friendly docs site
  examples/          # sample generated apps (also integration fixtures)
```

---

## 5. Canonical Command Spec, Compiler & Adapters

### 5.1 Spec format

One file per command in `packages/specs/`, e.g. `analyze-project.spec.md`:

```yaml
---
id: analyze-project
title: Analyze Project
phase: analyze              # analyze | foundation | feature | integrate | quality | status
requiresFoundation: false  # drives the foundation lock
inputs: [SRS, BRD, MOM, PRD, figma-notes, existing-docs, existing-codebase]
produces: [project-setup/, feature-plans/]
cliOps: []                 # deterministic CLI ops this command may invoke
nextSuggested: setup-project-foundation
---
## Goal
...model-neutral instruction body — the prompt itself...
## Steps
1. Run `super-react guard --phase analyze`
2. Discover & read all available documentation
...
```

The body is **model-neutral prose**; deterministic work is referenced as `super-react <op>` shell calls so the same body runs on any agent. Every body follows the beginner-friendly doc template (§9).

### 5.2 Compiler & adapter interface

`@super-react/compiler` walks every spec, applies one **adapter**, and writes target files. The adapter is the only agent-specific code:

```ts
interface AgentAdapter {
  id: string;                                      // "claude-code"
  outDir(projectRoot: string): string;             // ".claude/"
  emitCommand(spec: CommandSpec): EmittedFile[];   // skill + slash command
  emitManifest(specs: CommandSpec[]): EmittedFile[]; // plugin index / manifest
}
```

**Claude Code adapter (v1)** emits, per command: `.claude/skills/<id>/SKILL.md` (skill frontmatter + compiled body) + a slash-command entry, plus a plugin manifest indexing all commands. Frontmatter (`requiresFoundation`, `phase`, `nextSuggested`) compiles into guard calls and "next step" links.

**Performance:** compilation is a local, synchronous file transform (milliseconds, no network), run at `init` and on `super-react sync` when specs change. **Zero per-command runtime cost** — the agent reads pre-compiled files.

**Adding a future agent** = implement `AgentAdapter` once (Cursor → `.cursor/rules/*.mdc`, Codex → `AGENTS.md`, etc.). Command content is untouched; all commands light up automatically.

---

## 6. Deterministic CLI Core

### 6.1 Workflow state — `.super-react/state.json`

Single source of truth for workflow state:

```json
{
  "version": 1,
  "agent": "claude-code",
  "phase": "foundation",
  "foundation": { "complete": false, "completedAt": null, "templateHash": null },
  "features": {
    "patient-dashboard": { "plan": true, "ui": false, "api": false, "tests": false, "reviewed": false }
  },
  "integrations": {}
}
```

### 6.2 Foundation lock — enforced in code

Every feature command's compiled prose begins with `super-react guard --requires-foundation`. If `foundation.complete !== true`, the guard **exits non-zero** and prints the "Project Foundation Not Found → run /setup-project-foundation" message. The agent must honor the non-zero exit. The rule is also embedded in the prompt as defense-in-depth, but the **code check is authoritative**. General phase gating uses `guard --phase <p>`.

### 6.3 Scaffold engine (hybrid)

`super-react scaffold`:
- **Deterministic (pinned templates):** toolchain, folder structure, base configs, security defaults, pinned deps copied from `packages/templates/` (React 19 / MUI v7 / Vite 8 / Router v7 / TanStack Query v5 / Zustand v5 / RHF + zod / Orval-ready). Copied, not token-generated → reproducible, fast, no version hallucination.
- **AI-adapted (per project):** `project-setup/*.md` foundation docs, config registries (nav, routes, status maps, env), per-domain tailoring — generated by the agent from analyzed requirements.
- On success: writes `FOUNDATION_COMPLETE.md`, sets `foundation.complete = true` + `templateHash`; adapted layer tracked in state.

### 6.4 Quality gates

`super-react gate [lint|types|test|audit|all]` wraps eslint / `tsc --noEmit` / vitest / `npm audit`, returning structured pass/fail. `/review-*` and any "production ready" status depend on these passing.

---

## 7. Security Model (supply-chain integrity)

- **No postinstall scripts.**
- Minimal, **exact-pinned, audited** runtime deps.
- **No telemetry / no network** except explicit `npm audit` + registry during scaffold install.
- Entire prompt pack ships as **plain, auditable markdown** (no obfuscation, no remote instruction fetch).
- Scaffolds **reproducible from pinned templates**; lockfile committed; `gate audit` blocks on vulnerable deps.
- **Signed releases** via npm provenance (sigstore) so installs are verifiable.

---

## 8. Command Catalog & Workflow

**15 slash commands + `init` installer = 16 total surface.**

| # | Command | Phase | Foundation req'd? | Key CLI ops | Produces |
|---|---------|-------|:---:|---|---|
| — | `init` (installer) | — | — | compile, install pack, write state, dashboard | `.claude/`, `.super-react/` |
| 1 | `/analyze-project` | analyze | no | init state | `project-setup/`, `feature-plans/` |
| 2 | `/setup-project-foundation` | foundation | no → *completes it* | `scaffold`, `gate`, set `foundation.complete` | `src/`, `FOUNDATION_COMPLETE.md` |
| 3 | `/project-status` | status | no | `status` | dashboard render |
| 4 | `/create-feature-plan` | feature | no (planning allowed) | — | `feature-plans/<name>.md` |
| 5 | `/build-feature` | feature | **yes** | `guard`, `gate` | full feature (UI+API+tests) |
| 6 | `/build-feature-ui` | feature | **yes** | `guard` | screens/components, mock data, temp services |
| 7 | `/build-feature-api` | feature | **yes** | `guard` | services/clients/hooks/types (no UI) |
| 8 | `/update-feature` | feature | **yes** | `guard`, `gate` | synced UI+API+tests+docs |
| 9 | `/update-feature-ui` | feature | **yes** | `guard` | UI changes only |
| 10 | `/update-feature-api` | feature | **yes** | `guard` | API changes only |
| 11 | `/connect-external-service` | integrate | **yes** | `guard`, dep-install | services, env, updated arch docs, guide |
| 12 | `/review-project-architecture` | quality | **yes** | `gate audit` | architecture report |
| 13 | `/review-feature` | quality | **yes** | `gate` | scorecard |
| 14 | `/generate-feature-tests` | quality | **yes** | `gate test` | unit/integration/component/api tests |
| 15 | `/fix-project-issues` | quality | **yes** | `gate`, `fix` | fixes + report |

**Workflow state machine:** `analyze → [foundation lock] → features (build/update) → integrate → review/test → production-ready`; `/project-status` readable at any point.

**`/build-feature-ui` rule:** no real API calls; uses a temporary service layer that is automatically removed (architecture preserved) when the API is implemented later.

**Missing-documentation handling (`/analyze-project`):** if no docs exist, ask which the user has (SRS / MOM / BRD / product notes / existing screens); if none, generate `project-setup/` with the default enterprise architecture, leave `feature-plans/` empty, and recommend `/setup-project-foundation`.

---

## 9. Generated Artifacts, Install UX & Docs

### 9.1 Generated artifact tree

```
<project>/
  .super-react/state.json
  project-setup/                   # foundation docs — mirrors Project Setup/ depth
    architecture.md  folder-structure.md  routing.md  authentication.md
    state-management.md  api-strategy.md  error-handling.md
    testing-strategy.md  coding-standards.md  deployment.md
    + extended profile: theme, responsive, data-display, forms, layout,
      accessibility, security, performance, i18n, datetime, cross-browser
  feature-plans/<feature>.md       # Business Goal, User Stories, Acceptance Criteria,
                                   # UI/API reqs, Validation, State, Errors, Tests, Notes
  FOUNDATION_COMPLETE.md
  src/ ...                         # the scaffolded, adapted React app
```

### 9.2 Install / status dashboard

Rendered after `init` and by `/project-status`. Plain terminal, understandable in 30 seconds, no jargon, always ends with a recommended next step:

```
  +--------------------------------------------------------------+
  |  super-react  -  guided React engineering                    |
  +--------------------------------------------------------------+
  |  PROJECT HEALTH                                               |
  |    Requirements analyzed [x]   Foundation [x]   Agent: claude |
  |                                                              |
  |  FEATURES                                                     |
  |    patient-dashboard  [x] done    appointments  [~] building  |
  |    billing            [.] planned notifications [ ] no plan   |
  |                                                              |
  |  WHAT YOU CAN DO NEXT                                         |
  |    /build-feature billing        finish the planned feature  |
  |    /review-feature appointments  check quality before ship   |
  |                                                              |
  |  -> Recommended next step:  /build-feature billing           |
  +--------------------------------------------------------------+
```

### 9.3 Docs model

Every command spec *and* framework doc follows one beginner-friendly template (enforced by a docs lint check): **Purpose · Why it exists · Step-by-step · Examples · Best Practices · Common Mistakes · Troubleshooting.** Single-sourced content powers both the in-agent skill and the published docs site.

---

## 10. Testing the Framework Itself

- **Unit tests** — compiler, each adapter, gate runners, state transitions, scaffold engine.
- **Golden-file tests** — every spec has checked-in expected compiled output per adapter; spec changes appear as reviewable diffs; adapters can't silently drift.
- **Integration test** — run the whole pipeline (`init → analyze → setup → build-feature → review`) against a sample SRS in a temp dir; assert the generated app type-checks, lints, and tests green.
- **Supply-chain CI** — `npm audit` + license check + provenance-signed release on every publish.

---

## 11. Success Criteria

A developer can, without reading extensive docs: install the framework → analyze requirements → generate architecture → set up foundation → build features → integrate services → generate tests → review quality. The framework prioritizes **maintainability, scalability, consistency, and enterprise-grade React architecture over speed of code generation**, and *feels like a guided engineering assistant.*

---

## 12. Open Questions / Future Phases

- Verify npm name availability for `super-react` before publishing (fallback names: `react-forge`, `keystone-react`).
- Future adapters: Cursor, Codex, Windsurf, Antigravity (one `AgentAdapter` each).
- Future "lite" foundation profile for small projects.
- Confirm exact pinned versions of templates at build time (the reference uses React 19 / MUI v7 / Vite 8 / Router v7 / TanStack Query v5 / Zustand v5).
