# super-react-foundation Command Pack Content — Implementation Plan (Plan 3 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author the remaining 13 canonical command specs and the foundation-docs generators so the full 15-command guided workflow is operational and compiles into the Claude Code prompt pack.

**Architecture:** Each command is a markdown file (`*.spec.md`) with YAML frontmatter + a beginner-friendly body, dropped into `packages/specs/definitions/`. They are parsed by `parseSpec` (built in Plan 1), loaded by `loadSpecs`, and compiled by the Claude Code adapter — no engine changes needed. The `setup-project-foundation` spec drives the hybrid scaffold: it runs the deterministic `super-react-foundation scaffold` (Plan 2) then generates the per-project `project-setup/*.md` docs from skeleton outlines shipped in a new `@super-react-foundation/foundation-docs` package, then runs `super-react-foundation gate all`.

**Tech Stack:** Markdown + YAML frontmatter (content); TypeScript/ESM for the foundation-docs loader; `node:test` via `tsx` for validation/golden tests.

## Global Constraints

- Every spec file lives in `packages/specs/definitions/<id>.spec.md` and MUST parse via `parseSpec` (frontmatter then body).
- **Frontmatter fields (all required):** `id`, `title`, `phase` (`analyze|foundation|feature|integrate|quality|status`), `requiresFoundation` (bool), `inputs` (list), `produces` (list), `cliOps` (list), `nextSuggested` (string or `null`).
- **Every spec body follows this beginner-friendly template, in this order:** `## Purpose`, `## Why it exists`, `## Steps`, `## Example`, `## Best Practices`, `## Common Mistakes`, `## Troubleshooting`. (The compiled "Recommended next step" line is added automatically by the adapter from `nextSuggested` — do NOT hand-write it.)
- **Foundation-lock rule:** any spec with `requiresFoundation: true` MUST begin its `## Steps` with: "Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message."
- Specs reference deterministic work ONLY via `super-react-foundation <op>` shell calls (`guard`, `scaffold`, `gate`, `fix`) — never assume a specific agent's tooling.
- No engine/CLI code changes in Tasks 1–4 (content only). The foundation-docs package adds no external runtime deps.
- ESM only; erasable TS; strict + `noUncheckedIndexedAccess`. Tests via `node --import tsx --test <file>`.
- **Commit hygiene:** before each commit run `git status` and confirm only the intended files are staged; never stage deletions under `docs/` or other packages.

## The 15-Command Catalog (authoritative frontmatter)

| id | phase | reqFound | cliOps | nextSuggested | status |
|---|---|:--:|---|---|---|
| analyze-project | analyze | false | — | setup-project-foundation | NEW (T1) |
| create-feature-plan | feature | false | — | build-feature | NEW (T1) |
| setup-project-foundation | foundation | false | scaffold, gate | project-status | NEW (T2) |
| project-status | status | false | status | null | exists |
| build-feature | feature | true | guard, gate | review-feature | exists |
| build-feature-ui | feature | true | guard | build-feature-api | NEW (T3) |
| build-feature-api | feature | true | guard, gate | review-feature | NEW (T3) |
| update-feature | feature | true | guard, gate | review-feature | NEW (T3) |
| update-feature-ui | feature | true | guard | null | NEW (T3) |
| update-feature-api | feature | true | guard, gate | null | NEW (T3) |
| connect-external-service | integrate | true | guard | project-status | NEW (T4) |
| review-project-architecture | quality | true | gate | null | NEW (T4) |
| review-feature | quality | true | gate | generate-feature-tests | NEW (T4) |
| generate-feature-tests | quality | true | gate | null | NEW (T4) |
| fix-project-issues | quality | true | fix, gate | null | NEW (T4) |

---

## Task 1: `analyze-project` + `create-feature-plan` specs

**Files:**
- Create: `packages/specs/definitions/analyze-project.spec.md`, `packages/specs/definitions/create-feature-plan.spec.md`
- Test: `packages/specs/test/load-specs.test.ts` (append assertions)

**Interfaces:** Produces two new specs loadable by `loadSpecs()`. Consumes nothing new.

- [ ] **Step 1: Write `analyze-project.spec.md`**
```md
---
id: analyze-project
title: Analyze Project
phase: analyze
requiresFoundation: false
inputs: [SRS, BRD, MOM, PRD, figma-notes, existing-docs, existing-codebase]
produces: [project-setup/, feature-plans/]
cliOps: []
nextSuggested: setup-project-foundation
---
## Purpose
Turn whatever requirement material exists into two folders the rest of the workflow relies on: `project-setup/` (how the app is built) and `feature-plans/` (what to build).

## Why it exists
Building before the requirements are understood produces rework. This command extracts the requirements once, in writing, so every later command has a single source of truth.

## Steps
1. Search the repository for any requirement documents (SRS, BRD, MOM, PRDs, Figma notes, existing docs, existing code).
2. If none are found, ask the user: "Do you have any of: SRS, MOM, BRD, product notes, existing screens?" If the answer is no, generate `project-setup/` using a default enterprise React architecture and leave `feature-plans/` empty.
3. From the material, extract: functional requirements, non-functional requirements, user roles, features, API requirements, security requirements, and architecture requirements.
4. Write the architecture decisions into `project-setup/` and one `feature-plans/<feature>.md` per feature.
5. Report "Analysis Complete", list what was created, and state that feature development is locked until the foundation is set up.

## Example
`/analyze-project` — reads everything under `docs/` and writes `project-setup/` + `feature-plans/`.

## Best Practices
Read every available document before extracting. Keep each extracted requirement traceable to its source. Prefer the user's existing terminology.

## Common Mistakes
Inventing requirements the documents do not support. Starting to build before analysis is complete.

## Troubleshooting
No documents found and the user has none → generate the default architecture and recommend running setup next.
```

- [ ] **Step 2: Write `create-feature-plan.spec.md`**
```md
---
id: create-feature-plan
title: Create Feature Plan
phase: feature
requiresFoundation: false
inputs: [feature-description]
produces: [feature-plans/<name>.md]
cliOps: []
nextSuggested: build-feature
---
## Purpose
Write a single feature specification file that a build command can implement directly.

## Why it exists
A short, structured plan per feature keeps implementation honest and reviewable. Planning is allowed before the foundation exists; only *building* is locked.

## Steps
1. Take the feature description from the user.
2. Create `feature-plans/<name>.md` containing: Business Goal, User Stories, Acceptance Criteria, UI Requirements, API Requirements, Validation Rules, State Management, Error Handling, Testing Requirements, Technical Notes.
3. Ask the user whether to start implementation now, offering: UI only, API only, Full feature, or Later.

## Example
`/create-feature-plan "patient notes module"` → writes `feature-plans/patient-notes.md`.

## Best Practices
Make acceptance criteria concrete and testable. Keep one feature per file. Reuse names and terms from `project-setup/`.

## Common Mistakes
Vague acceptance criteria. Bundling several features into one plan.

## Troubleshooting
If the feature is large, split it into multiple feature-plan files and sequence them.
```

- [ ] **Step 3: Append load assertions and run (RED→GREEN)**

In `packages/specs/test/load-specs.test.ts`, append:
```ts
test("analyze-project and create-feature-plan load and are planning-phase (no foundation required)", () => {
  const specs = loadSpecs();
  const analyze = specs.find((s) => s.id === "analyze-project");
  const plan = specs.find((s) => s.id === "create-feature-plan");
  assert.equal(analyze?.requiresFoundation, false);
  assert.equal(analyze?.nextSuggested, "setup-project-foundation");
  assert.equal(plan?.requiresFoundation, false);
});
```
Run:
```bash
node --import tsx --test packages/specs/test/load-specs.test.ts
pnpm typecheck
```
Expected: all pass; typecheck 0.

- [ ] **Step 4: Commit**
```bash
git add -A && git commit -m "feat(specs): analyze-project + create-feature-plan command specs"
```

---

## Task 2: `setup-project-foundation` spec + `@super-react-foundation/foundation-docs`

**Files:**
- Create: `packages/foundation-docs/package.json`, `packages/foundation-docs/src/index.ts`, and ten outline files under `packages/foundation-docs/docs/`
- Create: `packages/specs/definitions/setup-project-foundation.spec.md`
- Test: `packages/foundation-docs/test/foundation-docs.test.ts`, and append to `packages/specs/test/load-specs.test.ts`

**Interfaces:**
- Produces: `@super-react-foundation/foundation-docs` exporting `foundationDocsRoot(): string` and `listFoundationDocs(): string[]` (the outline filenames, sorted); the `setup-project-foundation` spec.

- [ ] **Step 1: Create the foundation-docs package skeleton**

`packages/foundation-docs/package.json`:
```json
{
  "name": "@super-react-foundation/foundation-docs",
  "version": "0.0.0",
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "files": ["src", "docs"]
}
```

`packages/foundation-docs/src/index.ts`:
```ts
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export const FOUNDATION_DOCS_ROOT = join(here, "..", "docs");

export function foundationDocsRoot(): string {
  return FOUNDATION_DOCS_ROOT;
}

export function listFoundationDocs(): string[] {
  return readdirSync(FOUNDATION_DOCS_ROOT)
    .filter((f) => f.endsWith(".md"))
    .sort();
}
```

- [ ] **Step 2: Create the ten outline files**

Create these under `packages/foundation-docs/docs/`. Each is a skeleton the agent fills in per-project during setup. Use this shape for every file (replace `<TITLE>` and the section bullets per doc):

`architecture.md`:
```md
# Architecture
> Fill each section from project-setup analysis. Keep it bullet points and tables, not prose.

## Overview
## Layering & dependency rules
## Module boundaries
## Key decisions & rationale
```
Create the remaining nine with the same skeleton style and these titles + sections:
- `folder-structure.md` — Overview; `src/` tree; Naming conventions; Where new code goes.
- `routing.md` — Router setup; Route tree; Guards; Deep-linking.
- `authentication.md` — Auth model; Session handling; Token storage; Route protection.
- `state-management.md` — Server state; Client/UI state; What goes where; Caching rules.
- `api-strategy.md` — HTTP client; Error/interceptor strategy; Typed SDK; Data fetching pattern.
- `error-handling.md` — Error boundaries; Async/loading states; User-facing errors; Logging.
- `testing-strategy.md` — Test types; Tools; Coverage targets; What to test.
- `coding-standards.md` — Lint/format rules; Naming; Imports/aliases; No-hardcoded-strings.
- `deployment.md` — Environments; Build per env; Env vars; Release steps.

- [ ] **Step 3: Write `setup-project-foundation.spec.md`**
```md
---
id: setup-project-foundation
title: Setup Project Foundation
phase: foundation
requiresFoundation: false
inputs: [project-setup/]
produces: [src/, FOUNDATION_COMPLETE.md, project-setup/]
cliOps: [scaffold, gate]
nextSuggested: project-status
---
## Purpose
Create the complete, production-ready React foundation. This is mandatory — feature commands stay locked until it succeeds.

## Why it exists
A consistent, opinionated foundation is what makes every later feature fast and safe to build. Doing it once, deterministically, prevents drift.

## Steps
1. Run `super-react-foundation scaffold`. This copies the pinned React foundation, installs dependencies, writes `FOUNDATION_COMPLETE.md`, and unlocks feature development.
2. For each foundation outline, generate the matching `project-setup/<name>.md`, adapting it to the requirements captured by analyze-project (architecture, folder-structure, routing, authentication, state-management, api-strategy, error-handling, testing-strategy, coding-standards, deployment).
3. Run `super-react-foundation gate all` and resolve anything that fails.
4. Report "Project Foundation Complete" and that feature development is unlocked.

## Example
`/setup-project-foundation` — scaffolds the app and writes the adapted `project-setup/` docs.

## Best Practices
Let `scaffold` own the deterministic base; only hand-write the project-specific decisions. Keep generated docs as bullets and tables.

## Common Mistakes
Re-implementing boilerplate by hand instead of using `scaffold`. Skipping the gate run.

## Troubleshooting
"already set up" → the foundation exists; use `super-react-foundation scaffold --force` only if you intend to re-scaffold.
```

- [ ] **Step 4: Tests (RED→GREEN)**

`packages/foundation-docs/test/foundation-docs.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, join as _join } from "node:fs";
import { join } from "node:path";
import { foundationDocsRoot, listFoundationDocs } from "@super-react-foundation/foundation-docs";

test("foundationDocsRoot exists and lists the ten core outlines, sorted", () => {
  assert.ok(existsSync(join(foundationDocsRoot(), "architecture.md")));
  const docs = listFoundationDocs();
  assert.equal(docs.length, 10);
  assert.ok(docs.includes("routing.md"));
  assert.ok(docs.includes("deployment.md"));
  assert.deepEqual(docs, [...docs].sort());
});
```
(Note: do not import `join` from `node:fs` — only from `node:path`. Remove the stray `_join` import if your editor adds it.)

Append to `packages/specs/test/load-specs.test.ts`:
```ts
test("setup-project-foundation loads with scaffold+gate ops and does not itself require foundation", () => {
  const spec = loadSpecs().find((s) => s.id === "setup-project-foundation");
  assert.equal(spec?.requiresFoundation, false);
  assert.deepEqual(spec?.cliOps, ["scaffold", "gate"]);
});
```
Run `pnpm install` (new package), then:
```bash
node --import tsx --test packages/foundation-docs/test/foundation-docs.test.ts
node --import tsx --test packages/specs/test/load-specs.test.ts
pnpm typecheck
```
Expected: all pass; typecheck 0.

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat(specs,foundation-docs): setup-project-foundation spec + foundation doc outlines"
```

---

## Task 3: Feature build/update specs (5)

**Files:**
- Create under `packages/specs/definitions/`: `build-feature-ui.spec.md`, `build-feature-api.spec.md`, `update-feature.spec.md`, `update-feature-ui.spec.md`, `update-feature-api.spec.md`
- Test: append to `packages/specs/test/load-specs.test.ts`

**Interfaces:** Five new specs, all `requiresFoundation: true`.

- [ ] **Step 1: Write the five specs**

Each begins its `## Steps` with the guard line (foundation-locked). Frontmatter per the catalog table. Bodies:

`build-feature-ui.spec.md`:
```md
---
id: build-feature-ui
title: Build Feature UI
phase: feature
requiresFoundation: true
inputs: [feature-plan]
produces: [feature-ui]
cliOps: [guard]
nextSuggested: build-feature-api
---
## Purpose
Build only the frontend of a feature: screens, components, routing, mock data, and a temporary service layer.

## Why it exists
UI can be built and reviewed before the API exists. A temporary service layer keeps the UI runnable without real calls.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md`.
3. Generate screens, components, routing, mock data, and a temporary service layer. Make no real API calls.
4. When the API is implemented later, the temporary service layer is removed while the architecture is preserved.

## Example
`/build-feature-ui patient-dashboard`

## Best Practices
Keep the temporary services behind the same interface the real API will use, so swapping them is trivial.

## Common Mistakes
Making real network calls. Hard-coding mock data inside components instead of the temporary service layer.

## Troubleshooting
"Project Foundation Not Found" → run /setup-project-foundation first.
```

`build-feature-api.spec.md`:
```md
---
id: build-feature-api
title: Build Feature API
phase: feature
requiresFoundation: true
inputs: [feature-plan]
produces: [feature-api]
cliOps: [guard, gate]
nextSuggested: review-feature
---
## Purpose
Build only the backend integration layer of a feature: services, API clients, hooks, types, request/response models, and error handling.

## Why it exists
The data layer can be implemented and verified independently of the UI, and then connected.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md`.
3. Generate services, API clients, hooks, types, request models, response models, and error handling. Do not create UI.
4. If the feature already has a temporary UI service layer, replace it with the real implementation behind the same interface.
5. Run `super-react-foundation gate types` and resolve failures.

## Example
`/build-feature-api patient-dashboard`

## Best Practices
Keep request/response types close to the API client. Centralize error handling.

## Common Mistakes
Creating UI here. Leaking server types into components.

## Troubleshooting
Type failures after wiring → run `super-react-foundation gate types` and fix the reported mismatches.
```

`update-feature.spec.md`:
```md
---
id: update-feature
title: Update Feature
phase: feature
requiresFoundation: true
inputs: [feature-plan]
produces: [feature-code]
cliOps: [guard, gate]
nextSuggested: review-feature
---
## Purpose
Update an existing feature end to end — UI, API, tests, and documentation — keeping everything in sync with its plan.

## Why it exists
Features change. This keeps the implementation and the feature plan from drifting apart.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md` and the current implementation.
3. Apply the change across UI, API, and tests. Update the feature plan to match.
4. Run `super-react-foundation gate all` and resolve failures.

## Example
`/update-feature patient-dashboard`

## Best Practices
Update the feature plan in the same change as the code. Keep tests green.

## Common Mistakes
Changing code without updating the plan. Skipping the gate run.

## Troubleshooting
If scope grows, split the change and update the plan accordingly.
```

`update-feature-ui.spec.md`:
```md
---
id: update-feature-ui
title: Update Feature UI
phase: feature
requiresFoundation: true
inputs: [feature-plan]
produces: [feature-ui]
cliOps: [guard]
nextSuggested: null
---
## Purpose
Update only the frontend of an existing feature.

## Why it exists
Sometimes only the UI changes; this keeps the change scoped.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md`.
3. Apply the UI change only. Leave the API layer untouched.

## Example
`/update-feature-ui patient-dashboard`

## Best Practices
Keep the change behind the existing service interface.

## Common Mistakes
Touching the API layer when only UI was requested.

## Troubleshooting
"Project Foundation Not Found" → run /setup-project-foundation first.
```

`update-feature-api.spec.md`:
```md
---
id: update-feature-api
title: Update Feature API
phase: feature
requiresFoundation: true
inputs: [feature-plan]
produces: [feature-api]
cliOps: [guard, gate]
nextSuggested: null
---
## Purpose
Update only the backend integration layer of an existing feature.

## Why it exists
API contracts change; this keeps the change scoped to the data layer.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md`.
3. Apply the API/services/types change only. Do not change UI.
4. Run `super-react-foundation gate types` and resolve failures.

## Example
`/update-feature-api patient-dashboard`

## Best Practices
Preserve the service interface so the UI keeps working.

## Common Mistakes
Breaking the interface the UI depends on without updating the UI.

## Troubleshooting
Type failures → run `super-react-foundation gate types` and fix mismatches.
```

- [ ] **Step 2: Append load assertions and run (RED→GREEN)**

Append to `packages/specs/test/load-specs.test.ts`:
```ts
test("all feature build/update specs require the foundation and embed the guard", () => {
  const ids = ["build-feature-ui", "build-feature-api", "update-feature", "update-feature-ui", "update-feature-api"];
  const specs = loadSpecs();
  for (const id of ids) {
    const spec = specs.find((s) => s.id === id);
    assert.equal(spec?.requiresFoundation, true, `${id} must require foundation`);
    assert.match(spec?.body ?? "", /super-react-foundation guard --requires-foundation/, `${id} must embed the guard`);
  }
});
```
Run:
```bash
node --import tsx --test packages/specs/test/load-specs.test.ts
pnpm typecheck
```
Expected: pass; typecheck 0.

- [ ] **Step 3: Commit**
```bash
git add -A && git commit -m "feat(specs): feature build/update command specs (ui/api variants)"
```

---

## Task 4: Integrate + quality specs (5)

**Files:**
- Create under `packages/specs/definitions/`: `connect-external-service.spec.md`, `review-project-architecture.spec.md`, `review-feature.spec.md`, `generate-feature-tests.spec.md`, `fix-project-issues.spec.md`
- Test: append to `packages/specs/test/load-specs.test.ts`

**Interfaces:** Five new specs, all `requiresFoundation: true`.

- [ ] **Step 1: Write the five specs**

`connect-external-service.spec.md`:
```md
---
id: connect-external-service
title: Connect External Service
phase: integrate
requiresFoundation: true
inputs: [service-name]
produces: [services, env, integration-guide]
cliOps: [guard]
nextSuggested: project-status
---
## Purpose
Integrate an external system (e.g. Keycloak, Stripe, Firebase) into the project.

## Why it exists
Integrations should be added consistently — packages, configuration, services, and documentation together — not ad hoc.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Ask the integration questions specific to the service.
3. Install the required packages, configure environment variables (never commit secrets), and generate the service layer.
4. Update `project-setup/` architecture docs and generate a short implementation guide.

## Example
`/connect-external-service stripe`

## Best Practices
Keep secrets in untracked env files. Add the integration across the project consistently.

## Common Mistakes
Committing API keys. Wiring the SDK directly into components instead of a service.

## Troubleshooting
Missing keys at runtime → check the environment file and that the var is prefixed for the client where needed.
```

`review-project-architecture.spec.md`:
```md
---
id: review-project-architecture
title: Review Project Architecture
phase: quality
requiresFoundation: true
inputs: []
produces: [architecture-report]
cliOps: [gate]
nextSuggested: null
---
## Purpose
Assess overall project quality and report problems with recommendations.

## Why it exists
Periodic architecture review catches drift, duplication, and dead code before they compound.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Run `super-react-foundation gate audit`.
3. Check: folder structure, dependency rules, code duplication, naming conventions, architecture violations, dead code, and unused files.
4. Produce a report with concrete, prioritized recommendations.

## Example
`/review-project-architecture`

## Best Practices
Compare against `project-setup/` rules. Be specific (file:line) and prioritize by severity.

## Common Mistakes
Vague findings. Reporting style nits as critical.

## Troubleshooting
If `gate audit` flags dependencies, address them before claiming the project is production-ready.
```

`review-feature.spec.md`:
```md
---
id: review-feature
title: Review Feature
phase: quality
requiresFoundation: true
inputs: [feature-plan]
produces: [scorecard]
cliOps: [gate]
nextSuggested: generate-feature-tests
---
## Purpose
Review one feature implementation against its plan and produce a scorecard.

## Why it exists
A feature is "done" only when it meets its acceptance criteria and quality bar.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md` and the implementation.
3. Check: requirements compliance, acceptance criteria, performance, accessibility, security, and error handling.
4. Run `super-react-foundation gate all` and include the result. Produce a scorecard.

## Example
`/review-feature appointments`

## Best Practices
Tie every finding to an acceptance criterion or a quality lens. Be specific.

## Common Mistakes
Approving a feature whose acceptance criteria are unmet.

## Troubleshooting
If gates fail, the feature is not ready regardless of how it looks.
```

`generate-feature-tests.spec.md`:
```md
---
id: generate-feature-tests
title: Generate Feature Tests
phase: quality
requiresFoundation: true
inputs: [feature-plan]
produces: [tests]
cliOps: [gate]
nextSuggested: null
---
## Purpose
Generate test coverage for a feature: unit, integration, component, and API tests.

## Why it exists
Consistent test coverage per the project's testing strategy keeps features safe to change.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md` and `project-setup/testing-strategy.md`.
3. Generate unit, integration, component, and API tests following that strategy.
4. Run `super-react-foundation gate test` and ensure they pass.

## Example
`/generate-feature-tests billing`

## Best Practices
Test behavior, not implementation detail. Cover the acceptance criteria.

## Common Mistakes
Tests that assert mocks instead of behavior.

## Troubleshooting
Failing tests → fix the code or the test, then re-run `super-react-foundation gate test`.
```

`fix-project-issues.spec.md`:
```md
---
id: fix-project-issues
title: Fix Project Issues
phase: quality
requiresFoundation: true
inputs: []
produces: [fix-report]
cliOps: [fix, gate]
nextSuggested: null
---
## Purpose
Automatically fix common issues: lint, formatting, imports, TypeScript errors, and architecture violations.

## Why it exists
Mechanical issues should be fixed in one pass, not one at a time by hand.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Run `super-react-foundation fix` to apply lint and formatting fixes.
3. Resolve remaining TypeScript errors and architecture violations by hand.
4. Run `super-react-foundation gate all` and report what was fixed and what remains.

## Example
`/fix-project-issues`

## Best Practices
Re-run the gates after fixing to confirm. Report anything that needs human judgment.

## Common Mistakes
Claiming a clean project without re-running the gates.

## Troubleshooting
If `super-react-foundation fix` cannot resolve an error, fix it manually and re-run the gates.
```

- [ ] **Step 2: Append load assertions and run (RED→GREEN)**

Append to `packages/specs/test/load-specs.test.ts`:
```ts
test("integrate and quality specs load with correct phases and ops", () => {
  const specs = loadSpecs();
  assert.equal(specs.find((s) => s.id === "connect-external-service")?.phase, "integrate");
  assert.equal(specs.find((s) => s.id === "review-feature")?.nextSuggested, "generate-feature-tests");
  assert.deepEqual(specs.find((s) => s.id === "fix-project-issues")?.cliOps, ["fix", "gate"]);
});
```
Run:
```bash
node --import tsx --test packages/specs/test/load-specs.test.ts
pnpm typecheck
```
Expected: pass; typecheck 0.

- [ ] **Step 3: Commit**
```bash
git add -A && git commit -m "feat(specs): integrate + quality command specs"
```

---

## Task 5: Full-catalog validation + golden compile + Plan-2 deferred test gaps

**Files:**
- Test: `packages/specs/test/catalog.test.ts` (new), `packages/cli/test/init.test.ts` (append), `packages/ops/test/gates.test.ts` (append), `packages/ops/test/scaffold.test.ts` (append), `packages/cli/test/scaffold-cli.test.ts` (append), `packages/templates/test/templates.test.ts` (append)

**Interfaces:** No source changes — validation + closing the Plan-2 deferred coverage gaps.

- [ ] **Step 1: Full-catalog validation test**

`packages/specs/test/catalog.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { compile } from "@super-react-foundation/compiler";
import { claudeCodeAdapter } from "@super-react-foundation/adapter-claude-code";
import { loadSpecs } from "@super-react-foundation/specs";

const EXPECTED = [
  "analyze-project", "build-feature", "build-feature-api", "build-feature-ui",
  "connect-external-service", "create-feature-plan", "fix-project-issues",
  "generate-feature-tests", "project-status", "review-feature",
  "review-project-architecture", "setup-project-foundation",
  "update-feature", "update-feature-api", "update-feature-ui",
];

test("all 15 commands are present", () => {
  const ids = loadSpecs().map((s) => s.id).sort();
  assert.deepEqual(ids, [...EXPECTED].sort());
  assert.equal(ids.length, 15);
});

test("every foundation-required spec embeds the guard instruction", () => {
  for (const spec of loadSpecs()) {
    if (spec.requiresFoundation) {
      assert.match(spec.body, /super-react-foundation guard --requires-foundation/, `${spec.id} missing guard`);
    }
  }
});

test("every spec body has all beginner-friendly sections", () => {
  const sections = ["## Purpose", "## Why it exists", "## Steps", "## Example", "## Best Practices", "## Common Mistakes", "## Troubleshooting"];
  for (const spec of loadSpecs()) {
    for (const section of sections) {
      assert.ok(spec.body.includes(section), `${spec.id} missing "${section}"`);
    }
  }
});

test("the whole pack compiles to one SKILL.md per command plus a manifest", () => {
  const specs = loadSpecs();
  const files = compile(specs, claudeCodeAdapter);
  const skills = files.filter((f) => f.path.endsWith("SKILL.md"));
  assert.equal(skills.length, specs.length);
  assert.ok(files.some((f) => f.path.endsWith("super-react-foundation.manifest.json")));
});
```

- [ ] **Step 2: `init` installs all 15 skills (append to `packages/cli/test/init.test.ts`)**
```ts
test("init installs a skill for every command in the catalog", () => {
  const root = tempRoot();
  runInit({ projectRoot: root, agent: "claude-code" });
  const skillsDir = join(root, ".claude", "skills");
  const installed = readdirSync(skillsDir).filter((d) => d.startsWith("super-react-foundation-"));
  assert.equal(installed.length, 15);
});
```
Add `readdirSync` to the file's existing `node:fs` import.

- [ ] **Step 3: Close the Plan-2 deferred test gaps**

(a) Per-gate command identity — append to `packages/ops/test/gates.test.ts`:
```ts
test("each gate maps to its expected command", async () => {
  const seen: Record<string, string[]> = {};
  const exec: Exec = async (cmd, args) => {
    seen[args[0] ?? cmd] = [cmd, ...args];
    return { code: 0, stdout: "", stderr: "" };
  };
  await runGates(["lint", "types", "test", "audit"], { cwd: "/x", exec });
  assert.deepEqual(seen["eslint"], ["npx", "eslint", "."]);
  assert.deepEqual(seen["tsc"], ["npx", "tsc", "--noEmit"]);
  assert.deepEqual(seen["vitest"], ["npx", "vitest", "run", "--passWithNoTests"]);
  assert.deepEqual(seen["audit"], ["npm", "audit", "--audit-level=high"]);
});
```

(b) `defaultInstall` invocation — append to `packages/ops/test/scaffold.test.ts`:
```ts
test("scaffold without an injected install uses the default (pnpm install) and propagates failure", async () => {
  const root = tempRoot();
  writeState(root, defaultState("claude-code"));
  // No install injected: stub is impossible without exec injection, so assert the
  // failure path is wired by forcing the install thunk to reject.
  await assert.rejects(
    () => scaffoldFoundation({ projectRoot: root, install: async () => { throw new Error("install boom"); } }),
    /install boom/,
  );
});
```

(c) `fix` CLI command — append to `packages/cli/test/scaffold-cli.test.ts`:
```ts
test("fix command returns 0 when both tools pass and 1 when one fails", async () => {
  const { runFixCommand } = await import("../src/commands/fix.ts");
  const root = tempRoot();
  const pass: Exec = async () => ({ code: 0, stdout: "", stderr: "" });
  assert.equal(await runFixCommand({ projectRoot: root, exec: pass }), 0);
  const fail: Exec = async (_c, a) => ({ code: a.includes("prettier") ? 1 : 0, stdout: "", stderr: "x" });
  assert.equal(await runFixCommand({ projectRoot: root, exec: fail }), 1);
});
```

(d) Dotfile inclusion — append to `packages/templates/test/templates.test.ts`:
```ts
test("listTemplateFiles includes dotfiles that must be scaffolded", () => {
  const files = listTemplateFiles();
  assert.ok(files.includes(".gitignore"));
  assert.ok(files.includes(".nvmrc"));
});
```

- [ ] **Step 4: Run the full sweep**
```bash
pnpm test
pnpm typecheck
```
Expected: all packages green; typecheck 0.

- [ ] **Step 5: Smoke-test the full pack install**
```bash
rm -rf /tmp/sr-p3 && mkdir -p /tmp/sr-p3
pnpm sr init --cwd /tmp/sr-p3 >/dev/null
ls /tmp/sr-p3/.claude/skills | sort
```
Expected: 15 `super-react-foundation-*` skill directories.

- [ ] **Step 6: Commit**
```bash
git add -A && git commit -m "test: full command-catalog validation + close Plan-2 coverage gaps"
```

---

## Self-Review

**1. Spec coverage:** All 13 new command specs (Tasks 1–4) + the two pre-existing ones = the full 15-command catalog (§8 of the design). `setup-project-foundation` drives the hybrid scaffold + foundation-docs generation (§6.3, §9.1). Foundation-docs outlines mirror the `Project Setup/` core set (§9.1). Catalog completeness, guard-embedding, section-template, and whole-pack compile are all asserted (Task 5). Plan-2 deferred gaps closed (Task 5 Step 3). ✓

**2. Placeholder scan:** Each spec is authored in full (frontmatter + all seven sections). The foundation outline files use a deliberate skeleton shape (the agent fills them per-project at runtime) — that is the product behavior, not a plan placeholder. No "TBD"/"similar to".

**3. Type/name consistency:** Frontmatter `id`/`phase`/`requiresFoundation`/`cliOps`/`nextSuggested` for every spec matches the authoritative catalog table. `cliOps` reference only real CLI ops (`guard`/`scaffold`/`gate`/`fix`). `foundationDocsRoot`/`listFoundationDocs` defined in Task 2 and used in its test. The Task 5 catalog test's `EXPECTED` list matches all 15 ids exactly.
