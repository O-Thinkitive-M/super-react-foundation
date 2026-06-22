# super-react-foundation Engine & Install Pipeline — Implementation Plan (Plan 1 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `super-react-foundation` engine so that `super-react-foundation init` compiles single-sourced markdown command specs into a Claude Code prompt pack, writes workflow state, renders the dashboard, and enforces the foundation lock in code.

**Architecture:** A pnpm monorepo of small focused packages. `core` holds types, workflow-state I/O, the spec parser, and the guard. `compiler` turns specs into files via an `AgentAdapter`. `adapter-claude-code` is the v1 adapter. `specs` ships the canonical command definitions. `cli` wires it all into the `super-react-foundation` binary (`init`/`sync`/`status`/`guard`) and renders the dashboard. Reasoning/generation lives in the markdown specs; deterministic work lives in code.

**Tech Stack:** TypeScript (strict, ESM), Node ≥ 22.18, pnpm workspaces. Runtime dependencies are kept to **only `yaml`**. Dev tooling uses `tsx` (TypeScript loader) + `typescript` + `@types/node`. The framework's own tests use the built-in **`node:test`** runner, executed through the `tsx` loader.

## Global Constraints

Copied verbatim from the spec — every task implicitly includes these:

- **Node ≥ 22.18** required (`engines.node` + `.nvmrc`).
- **TypeScript strict** + `noUncheckedIndexedAccess`; **ESM only** (`"type": "module"`).
- **Erasable TS syntax only** (`erasableSyntaxOnly` in tsconfig) — no enums, namespaces, or parameter properties, so Node-native type handling and `tsx` stay compatible.
- **Runtime deps: minimal, exact-pinned, audited.** In this plan only `yaml@2.6.1` is a runtime dep (in `core`). No `^`/`~` ranges on runtime deps.
- **No postinstall scripts. No telemetry. No network access** in any package's code.
- The entire prompt pack ships as **plain, auditable markdown**.
- Package names: `@super-react-foundation/core`, `@super-react-foundation/compiler`, `@super-react-foundation/adapter-claude-code`, `@super-react-foundation/specs`; the CLI package is named **`super-react-foundation`** and provides the **`super-react-foundation`** binary.
- **Why `tsx` for dev/test:** Node refuses to strip types from files resolved under `node_modules`. pnpm symlinks workspace packages into `node_modules`, so cross-package TS imports won't run under bare `node`. `tsx` transpiles TS everywhere. `tsx` is a **dev dependency only** — it never ships to consumers, so the minimal-runtime-deps goal is preserved.

---

## File Structure

```
super-react-foundation/                              (repo root — already a git repo)
  package.json                            # workspace root: scripts, devDeps
  pnpm-workspace.yaml
  tsconfig.json                           # strict base + path aliases (typecheck)
  .nvmrc                                  # 22.18
  .gitignore
  packages/
    core/
      package.json                        # dep: yaml@2.6.1
      src/
        types.ts                          # CommandSpec, ProjectState, AgentAdapter, EmittedFile, ...
        state.ts                          # defaultState/readState/writeState/stateExists
        spec-parser.ts                    # parseSpec(raw) -> CommandSpec
        guard.ts                          # evaluateGuard(state, opts) -> GuardResult
        index.ts                          # public barrel
      test/
        state.test.ts
        spec-parser.test.ts
        guard.test.ts
    compiler/
      package.json
      src/
        compiler.ts                       # compile(specs, adapter) -> EmittedFile[]
        index.ts
      test/
        compiler.test.ts
    adapters/
      claude-code/
        package.json                      # name @super-react-foundation/adapter-claude-code
        src/
          index.ts                        # claudeCodeAdapter: AgentAdapter
        test/
          adapter.test.ts
          __golden__/
            project-status.SKILL.md       # golden output
    specs/
      package.json                        # name @super-react-foundation/specs
      src/
        index.ts                          # loadSpecs() -> CommandSpec[]
      definitions/
        project-status.spec.md            # real spec, requiresFoundation: false
        build-feature.spec.md             # real spec, requiresFoundation: true
      test/
        load-specs.test.ts
    cli/
      package.json                        # name "super-react-foundation", bin -> src/cli.ts
      src/
        cli.ts                            # arg routing (node:util parseArgs) + shebang
        write.ts                          # writeEmitted(projectRoot, files)
        dashboard.ts                      # renderDashboard(state) -> string
        commands/
          init.ts
          sync.ts
          status.ts
          guard.ts
      test/
        dashboard.test.ts
        init.test.ts
```

---

## Task 1: Monorepo bootstrap + core types & workflow state

**Files:**
- Create: `pnpm-workspace.yaml`, `package.json`, `tsconfig.json`, `.nvmrc`, `.gitignore`
- Create: `packages/core/package.json`, `packages/core/src/types.ts`, `packages/core/src/state.ts`, `packages/core/src/index.ts`
- Test: `packages/core/test/state.test.ts`

**Interfaces:**
- Produces: `Phase`, `CommandSpec`, `FeatureState`, `FoundationState`, `ProjectState`, `EmittedFile`, `AgentAdapter` (types); `defaultState(agent: string): ProjectState`, `readState(projectRoot: string): ProjectState`, `writeState(projectRoot: string, state: ProjectState): void`, `stateExists(projectRoot: string): boolean`, and constants `STATE_DIR=".super-react-foundation"`, `STATE_FILE="state.json"`, `statePath(projectRoot: string): string`.

- [ ] **Step 1: Create the workspace + tooling files**

`pnpm-workspace.yaml`:
```yaml
packages:
  - "packages/*"
  - "packages/adapters/*"
```

`.nvmrc`:
```
22.18
```

`.gitignore`:
```
node_modules/
dist/
*.log
.DS_Store
```

`package.json` (root):
```json
{
  "name": "super-react-foundation-monorepo",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.18" },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "node --import tsx --test \"packages/**/test/**/*.test.ts\"",
    "sr": "node --import tsx packages/cli/src/cli.ts"
  },
  "devDependencies": {
    "@types/node": "22.10.2",
    "tsx": "4.19.2",
    "typescript": "5.8.2"
  }
}
```

`tsconfig.json` (root):
```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "target": "es2023",
    "lib": ["es2023"],
    "types": ["node"],
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@super-react-foundation/core": ["packages/core/src/index.ts"],
      "@super-react-foundation/compiler": ["packages/compiler/src/index.ts"],
      "@super-react-foundation/adapter-claude-code": ["packages/adapters/claude-code/src/index.ts"],
      "@super-react-foundation/specs": ["packages/specs/src/index.ts"]
    }
  },
  "include": ["packages/*/src", "packages/*/test", "packages/adapters/*/src", "packages/adapters/*/test"]
}
```

- [ ] **Step 2: Create the `core` package skeleton + types**

`packages/core/package.json`:
```json
{
  "name": "@super-react-foundation/core",
  "version": "0.0.0",
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "yaml": "2.6.1" }
}
```

`packages/core/src/types.ts`:
```ts
export type Phase =
  | "analyze"
  | "foundation"
  | "feature"
  | "integrate"
  | "quality"
  | "status";

export interface CommandSpec {
  id: string;
  title: string;
  phase: Phase;
  requiresFoundation: boolean;
  inputs: string[];
  produces: string[];
  cliOps: string[];
  nextSuggested: string | null;
  body: string;
}

export interface FeatureState {
  plan: boolean;
  ui: boolean;
  api: boolean;
  tests: boolean;
  reviewed: boolean;
}

export interface FoundationState {
  complete: boolean;
  completedAt: string | null;
  templateHash: string | null;
}

export interface ProjectState {
  version: 1;
  agent: string;
  phase: Phase;
  foundation: FoundationState;
  features: Record<string, FeatureState>;
  integrations: Record<string, string>;
}

export interface EmittedFile {
  /** Path relative to the project root. */
  path: string;
  contents: string;
}

export interface AgentAdapter {
  id: string;
  /** Absolute directory this adapter writes into (used to clean on sync). */
  outDir(projectRoot: string): string;
  emitCommand(spec: CommandSpec): EmittedFile[];
  emitManifest(specs: CommandSpec[]): EmittedFile[];
}
```

`packages/core/src/state.ts`:
```ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ProjectState } from "./types.ts";

export const STATE_DIR = ".super-react-foundation";
export const STATE_FILE = "state.json";

export function statePath(projectRoot: string): string {
  return join(projectRoot, STATE_DIR, STATE_FILE);
}

export function defaultState(agent: string): ProjectState {
  return {
    version: 1,
    agent,
    phase: "analyze",
    foundation: { complete: false, completedAt: null, templateHash: null },
    features: {},
    integrations: {},
  };
}

export function stateExists(projectRoot: string): boolean {
  return existsSync(statePath(projectRoot));
}

export function readState(projectRoot: string): ProjectState {
  const path = statePath(projectRoot);
  if (!existsSync(path)) {
    throw new Error(
      `super-react-foundation state not found at ${path}. Run "super-react-foundation init" first.`,
    );
  }
  return JSON.parse(readFileSync(path, "utf8")) as ProjectState;
}

export function writeState(projectRoot: string, state: ProjectState): void {
  mkdirSync(join(projectRoot, STATE_DIR), { recursive: true });
  writeFileSync(statePath(projectRoot), JSON.stringify(state, null, 2) + "\n", "utf8");
}
```

`packages/core/src/index.ts`:
```ts
export * from "./types.ts";
export * from "./state.ts";
```

- [ ] **Step 3: Write the failing test**

`packages/core/test/state.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultState, readState, writeState, stateExists } from "@super-react-foundation/core";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "sr-state-"));
}

test("defaultState has the expected shape", () => {
  const s = defaultState("claude-code");
  assert.equal(s.version, 1);
  assert.equal(s.agent, "claude-code");
  assert.equal(s.phase, "analyze");
  assert.equal(s.foundation.complete, false);
  assert.deepEqual(s.features, {});
});

test("writeState then readState round-trips", () => {
  const root = tempRoot();
  assert.equal(stateExists(root), false);
  const s = defaultState("claude-code");
  s.features["billing"] = { plan: true, ui: false, api: false, tests: false, reviewed: false };
  writeState(root, s);
  assert.equal(stateExists(root), true);
  assert.deepEqual(readState(root), s);
});

test("readState throws when state is missing", () => {
  const root = tempRoot();
  assert.throws(() => readState(root), /state not found/);
});
```

- [ ] **Step 4: Install dependencies, then run the test to verify it fails**

Run:
```bash
corepack enable && pnpm install
node --import tsx --test packages/core/test/state.test.ts
```
Expected: the test FAILS — the first run before `pnpm install` resolves workspace links may error on the import; after install it fails only if code is wrong. (If you wrote Step 2 correctly it will PASS — that's fine; the point is the test executes. If it errors on resolution, re-run `pnpm install`.)

- [ ] **Step 5: Run the test to verify it passes**

Run:
```bash
node --import tsx --test packages/core/test/state.test.ts
```
Expected: PASS — `tests 3`, `pass 3`, `fail 0`.

- [ ] **Step 6: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: no output, exit 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(core): monorepo bootstrap + workflow state types & I/O"
```

---

## Task 2: Spec parser (`parseSpec`)

**Files:**
- Create: `packages/core/src/spec-parser.ts`
- Modify: `packages/core/src/index.ts` (export the parser)
- Test: `packages/core/test/spec-parser.test.ts`

**Interfaces:**
- Consumes: `CommandSpec`, `Phase` from `./types.ts`; `yaml` (`parse`).
- Produces: `parseSpec(raw: string): CommandSpec`. Throws `Error` on missing/unterminated frontmatter, missing required string fields (`id`, `title`, `phase`), or invalid `phase`.

- [ ] **Step 1: Write the failing test**

`packages/core/test/spec-parser.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSpec } from "@super-react-foundation/core";

const VALID = `---
id: project-status
title: Project Status
phase: status
requiresFoundation: false
inputs: []
produces: []
cliOps: [status]
nextSuggested: null
---
## Goal
Show the dashboard.
`;

test("parses frontmatter and body", () => {
  const spec = parseSpec(VALID);
  assert.equal(spec.id, "project-status");
  assert.equal(spec.title, "Project Status");
  assert.equal(spec.phase, "status");
  assert.equal(spec.requiresFoundation, false);
  assert.deepEqual(spec.cliOps, ["status"]);
  assert.equal(spec.nextSuggested, null);
  assert.match(spec.body, /Show the dashboard\./);
  assert.doesNotMatch(spec.body, /^---/);
});

test("requiresFoundation defaults to false when omitted", () => {
  const spec = parseSpec(`---
id: x
title: X
phase: feature
---
body`);
  assert.equal(spec.requiresFoundation, false);
  assert.deepEqual(spec.inputs, []);
});

test("throws when frontmatter is missing", () => {
  assert.throws(() => parseSpec("no frontmatter here"), /missing YAML frontmatter/);
});

test("throws on invalid phase", () => {
  assert.throws(
    () => parseSpec(`---\nid: x\ntitle: X\nphase: bogus\n---\nbody`),
    /Invalid phase/,
  );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
node --import tsx --test packages/core/test/spec-parser.test.ts
```
Expected: FAIL — `parseSpec` is not exported / not defined.

- [ ] **Step 3: Implement the parser**

`packages/core/src/spec-parser.ts`:
```ts
import { parse as parseYaml } from "yaml";
import type { CommandSpec, Phase } from "./types.ts";

const PHASES: readonly Phase[] = [
  "analyze",
  "foundation",
  "feature",
  "integrate",
  "quality",
  "status",
];

interface Frontmatter {
  frontmatter: string;
  body: string;
}

function extractFrontmatter(raw: string): Frontmatter {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  if (lines[0] !== "---") {
    throw new Error("Spec is missing YAML frontmatter (must start with '---').");
  }
  let close = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      close = i;
      break;
    }
  }
  if (close === -1) {
    throw new Error("Spec frontmatter is not terminated with '---'.");
  }
  return {
    frontmatter: lines.slice(1, close).join("\n"),
    body: lines.slice(close + 1).join("\n").trim(),
  };
}

function requireString(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Spec is missing required string field "${key}".`);
  }
  return value;
}

function toStringArray(value: unknown): string[] {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new Error("Expected a list value in spec frontmatter.");
  }
  return value.map((v) => String(v));
}

export function parseSpec(raw: string): CommandSpec {
  const { frontmatter, body } = extractFrontmatter(raw);
  const data = (parseYaml(frontmatter) ?? {}) as Record<string, unknown>;

  const id = requireString(data, "id");
  const title = requireString(data, "title");
  const phase = requireString(data, "phase");
  if (!PHASES.includes(phase as Phase)) {
    throw new Error(
      `Invalid phase "${phase}" in spec "${id}". Must be one of: ${PHASES.join(", ")}.`,
    );
  }

  return {
    id,
    title,
    phase: phase as Phase,
    requiresFoundation: data.requiresFoundation === true,
    inputs: toStringArray(data.inputs),
    produces: toStringArray(data.produces),
    cliOps: toStringArray(data.cliOps),
    nextSuggested:
      data.nextSuggested == null ? null : String(data.nextSuggested),
    body,
  };
}
```

`packages/core/src/index.ts` — add the export:
```ts
export * from "./types.ts";
export * from "./state.ts";
export * from "./spec-parser.ts";
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
node --import tsx --test packages/core/test/spec-parser.test.ts
```
Expected: PASS — `tests 4`, `pass 4`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(core): markdown+YAML spec parser"
```

---

## Task 3: Compiler + `AgentAdapter` contract

**Files:**
- Create: `packages/compiler/package.json`, `packages/compiler/src/compiler.ts`, `packages/compiler/src/index.ts`
- Test: `packages/compiler/test/compiler.test.ts`

**Interfaces:**
- Consumes: `AgentAdapter`, `CommandSpec`, `EmittedFile` from `@super-react-foundation/core`.
- Produces: `compile(specs: CommandSpec[], adapter: AgentAdapter): EmittedFile[]` — emits every command's files in spec order, then appends the manifest files.

- [ ] **Step 1: Create the package skeleton**

`packages/compiler/package.json`:
```json
{
  "name": "@super-react-foundation/compiler",
  "version": "0.0.0",
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "@super-react-foundation/core": "workspace:*" }
}
```

`packages/compiler/src/index.ts`:
```ts
export * from "./compiler.ts";
```

- [ ] **Step 2: Write the failing test**

`packages/compiler/test/compiler.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { AgentAdapter, CommandSpec, EmittedFile } from "@super-react-foundation/core";
import { compile } from "@super-react-foundation/compiler";

function spec(id: string): CommandSpec {
  return {
    id,
    title: id,
    phase: "feature",
    requiresFoundation: false,
    inputs: [],
    produces: [],
    cliOps: [],
    nextSuggested: null,
    body: `body-${id}`,
  };
}

const fakeAdapter: AgentAdapter = {
  id: "fake",
  outDir: (root) => `${root}/.fake`,
  emitCommand: (s): EmittedFile[] => [{ path: `.fake/${s.id}.md`, contents: s.body }],
  emitManifest: (specs): EmittedFile[] => [
    { path: ".fake/manifest.json", contents: JSON.stringify(specs.map((s) => s.id)) },
  ],
};

test("emits each command then the manifest, in order", () => {
  const files = compile([spec("a"), spec("b")], fakeAdapter);
  assert.deepEqual(
    files.map((f) => f.path),
    [".fake/a.md", ".fake/b.md", ".fake/manifest.json"],
  );
  assert.equal(files[0]?.contents, "body-a");
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run:
```bash
node --import tsx --test packages/compiler/test/compiler.test.ts
```
Expected: FAIL — `compile` not defined.

- [ ] **Step 4: Implement the compiler**

`packages/compiler/src/compiler.ts`:
```ts
import type { AgentAdapter, CommandSpec, EmittedFile } from "@super-react-foundation/core";

export function compile(specs: CommandSpec[], adapter: AgentAdapter): EmittedFile[] {
  const files: EmittedFile[] = [];
  for (const spec of specs) {
    files.push(...adapter.emitCommand(spec));
  }
  files.push(...adapter.emitManifest(specs));
  return files;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run:
```bash
node --import tsx --test packages/compiler/test/compiler.test.ts
```
Expected: PASS — `tests 1`, `pass 1`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(compiler): compile specs through an AgentAdapter"
```

---

## Task 4: Claude Code adapter + golden-file test

**Files:**
- Create: `packages/adapters/claude-code/package.json`, `packages/adapters/claude-code/src/index.ts`
- Test: `packages/adapters/claude-code/test/adapter.test.ts`, `packages/adapters/claude-code/test/__golden__/project-status.SKILL.md`

**Interfaces:**
- Consumes: `AgentAdapter`, `CommandSpec`, `EmittedFile` from `@super-react-foundation/core`.
- Produces: `claudeCodeAdapter: AgentAdapter` (`id = "claude-code"`). `emitCommand` writes `.claude/skills/super-react-foundation-<id>/SKILL.md`; `emitManifest` writes `.claude/super-react-foundation.manifest.json`.

- [ ] **Step 1: Create the package skeleton**

`packages/adapters/claude-code/package.json`:
```json
{
  "name": "@super-react-foundation/adapter-claude-code",
  "version": "0.0.0",
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "@super-react-foundation/core": "workspace:*" }
}
```

- [ ] **Step 2: Write the golden file**

`packages/adapters/claude-code/test/__golden__/project-status.SKILL.md`:
```md
---
name: super-react-foundation-project-status
description: Project Status
---

## Goal
Show the dashboard.

---
**Recommended next step:** `/analyze-project`
```
(Note: exactly one trailing newline at end of file.)

- [ ] **Step 3: Write the failing test**

`packages/adapters/claude-code/test/adapter.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { CommandSpec } from "@super-react-foundation/core";
import { claudeCodeAdapter } from "@super-react-foundation/adapter-claude-code";

const here = dirname(fileURLToPath(import.meta.url));

const statusSpec: CommandSpec = {
  id: "project-status",
  title: "Project Status",
  phase: "status",
  requiresFoundation: false,
  inputs: [],
  produces: [],
  cliOps: ["status"],
  nextSuggested: "analyze-project",
  body: "## Goal\nShow the dashboard.",
};

test("emitCommand matches the golden SKILL.md", () => {
  const files = claudeCodeAdapter.emitCommand(statusSpec);
  assert.equal(files.length, 1);
  assert.equal(files[0]?.path, ".claude/skills/super-react-foundation-project-status/SKILL.md");
  const golden = readFileSync(join(here, "__golden__", "project-status.SKILL.md"), "utf8");
  assert.equal(files[0]?.contents, golden);
});

test("foundation-required commands embed the guard instruction", () => {
  const files = claudeCodeAdapter.emitCommand({ ...statusSpec, requiresFoundation: true });
  assert.match(files[0]!.contents, /super-react-foundation guard --requires-foundation/);
});

test("emitManifest lists all commands", () => {
  const files = claudeCodeAdapter.emitManifest([statusSpec]);
  assert.equal(files[0]?.path, ".claude/super-react-foundation.manifest.json");
  const manifest = JSON.parse(files[0]!.contents) as { commands: { id: string }[] };
  assert.equal(manifest.commands[0]?.id, "project-status");
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run:
```bash
node --import tsx --test packages/adapters/claude-code/test/adapter.test.ts
```
Expected: FAIL — `claudeCodeAdapter` not defined.

- [ ] **Step 5: Implement the adapter**

`packages/adapters/claude-code/src/index.ts`:
```ts
import { join } from "node:path";
import type { AgentAdapter, CommandSpec, EmittedFile } from "@super-react-foundation/core";

function renderSkill(spec: CommandSpec): string {
  const guard = spec.requiresFoundation
    ? "> **Before doing anything, run `super-react-foundation guard --requires-foundation`. " +
      "If it exits non-zero, stop and show its message to the user.**\n\n"
    : "";
  const next = spec.nextSuggested
    ? `\n\n---\n**Recommended next step:** \`/${spec.nextSuggested}\`\n`
    : "\n";
  return (
    `---\n` +
    `name: super-react-foundation-${spec.id}\n` +
    `description: ${spec.title}\n` +
    `---\n\n` +
    `${guard}${spec.body}${next}`
  );
}

export const claudeCodeAdapter: AgentAdapter = {
  id: "claude-code",
  outDir(projectRoot: string): string {
    return join(projectRoot, ".claude");
  },
  emitCommand(spec: CommandSpec): EmittedFile[] {
    return [
      {
        path: `.claude/skills/super-react-foundation-${spec.id}/SKILL.md`,
        contents: renderSkill(spec),
      },
    ];
  },
  emitManifest(specs: CommandSpec[]): EmittedFile[] {
    const manifest = {
      name: "super-react-foundation",
      version: 1,
      commands: specs.map((s) => ({
        id: s.id,
        title: s.title,
        phase: s.phase,
        requiresFoundation: s.requiresFoundation,
      })),
    };
    return [
      {
        path: ".claude/super-react-foundation.manifest.json",
        contents: JSON.stringify(manifest, null, 2) + "\n",
      },
    ];
  },
};
```

- [ ] **Step 6: Run the test to verify it passes**

Run:
```bash
node --import tsx --test packages/adapters/claude-code/test/adapter.test.ts
```
Expected: PASS — `tests 3`, `pass 3`. If the golden test fails on whitespace, align the golden file exactly to the rendered output (one blank line after the `---` header, one trailing newline).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(adapter-claude-code): emit SKILL.md + manifest, golden-tested"
```

---

## Task 5: Foundation-lock guard

**Files:**
- Create: `packages/core/src/guard.ts`
- Modify: `packages/core/src/index.ts` (export guard)
- Test: `packages/core/test/guard.test.ts`

**Interfaces:**
- Consumes: `ProjectState` from `./types.ts`.
- Produces: `GuardOptions { requiresFoundation?: boolean }`, `GuardResult { ok: boolean; exitCode: number; message: string }`, `evaluateGuard(state: ProjectState, opts: GuardOptions): GuardResult`. When `requiresFoundation` and `!state.foundation.complete` → `{ ok: false, exitCode: 1, message: "Project Foundation Not Found…" }`; otherwise `{ ok: true, exitCode: 0, message: "OK" }`.

- [ ] **Step 1: Write the failing test**

`packages/core/test/guard.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultState, evaluateGuard } from "@super-react-foundation/core";

test("blocks feature work before foundation is complete", () => {
  const state = defaultState("claude-code");
  const result = evaluateGuard(state, { requiresFoundation: true });
  assert.equal(result.ok, false);
  assert.equal(result.exitCode, 1);
  assert.match(result.message, /Project Foundation Not Found/);
});

test("allows feature work once foundation is complete", () => {
  const state = defaultState("claude-code");
  state.foundation.complete = true;
  const result = evaluateGuard(state, { requiresFoundation: true });
  assert.equal(result.ok, true);
  assert.equal(result.exitCode, 0);
});

test("passes when foundation is not required", () => {
  const result = evaluateGuard(defaultState("claude-code"), {});
  assert.equal(result.ok, true);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
node --import tsx --test packages/core/test/guard.test.ts
```
Expected: FAIL — `evaluateGuard` not defined.

- [ ] **Step 3: Implement the guard**

`packages/core/src/guard.ts`:
```ts
import type { ProjectState } from "./types.ts";

export interface GuardOptions {
  requiresFoundation?: boolean;
}

export interface GuardResult {
  ok: boolean;
  exitCode: number;
  message: string;
}

export function evaluateGuard(state: ProjectState, opts: GuardOptions): GuardResult {
  if (opts.requiresFoundation && !state.foundation.complete) {
    return {
      ok: false,
      exitCode: 1,
      message:
        "Project Foundation Not Found.\n" +
        "You must complete /setup-project-foundation before implementing features.",
    };
  }
  return { ok: true, exitCode: 0, message: "OK" };
}
```

`packages/core/src/index.ts` — add the export:
```ts
export * from "./types.ts";
export * from "./state.ts";
export * from "./spec-parser.ts";
export * from "./guard.ts";
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
node --import tsx --test packages/core/test/guard.test.ts
```
Expected: PASS — `tests 3`, `pass 3`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(core): code-enforced foundation-lock guard"
```

---

## Task 6: Canonical specs package + `loadSpecs`

**Files:**
- Create: `packages/specs/package.json`, `packages/specs/src/index.ts`
- Create: `packages/specs/definitions/project-status.spec.md`, `packages/specs/definitions/build-feature.spec.md`
- Test: `packages/specs/test/load-specs.test.ts`

**Interfaces:**
- Consumes: `parseSpec`, `CommandSpec` from `@super-react-foundation/core`.
- Produces: `loadSpecs(): CommandSpec[]` (reads every `*.spec.md` in `packages/specs/definitions`, sorted by filename) and `SPECS_DIR: string` (absolute path).

- [ ] **Step 1: Create the package skeleton**

`packages/specs/package.json`:
```json
{
  "name": "@super-react-foundation/specs",
  "version": "0.0.0",
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "files": ["src", "definitions"],
  "dependencies": { "@super-react-foundation/core": "workspace:*" }
}
```

- [ ] **Step 2: Create two real spec definitions**

`packages/specs/definitions/project-status.spec.md`:
```md
---
id: project-status
title: Project Status
phase: status
requiresFoundation: false
inputs: []
produces: []
cliOps: [status]
nextSuggested: null
---
## Purpose
Show the current state of the project so the developer always knows what to do next.

## Steps
1. Run `super-react-foundation status`.
2. Show the dashboard it prints, unchanged.
```

`packages/specs/definitions/build-feature.spec.md`:
```md
---
id: build-feature
title: Build Feature
phase: feature
requiresFoundation: true
inputs: [feature-plan]
produces: [feature-code]
cliOps: [guard, gate]
nextSuggested: review-feature
---
## Purpose
Implement a complete feature (UI + API + tests) from its feature plan.

## Steps
1. Run `super-react-foundation guard --requires-foundation`. If it exits non-zero, stop and show its message.
2. Read `feature-plans/<name>.md`.
3. Implement UI, API, validation, state, error handling, types, and tests.
```

- [ ] **Step 3: Write the failing test**

`packages/specs/test/load-specs.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSpecs } from "@super-react-foundation/specs";

test("loads and parses all spec definitions", () => {
  const specs = loadSpecs();
  const ids = specs.map((s) => s.id);
  assert.ok(ids.includes("project-status"));
  assert.ok(ids.includes("build-feature"));
});

test("build-feature requires the foundation; project-status does not", () => {
  const specs = loadSpecs();
  const build = specs.find((s) => s.id === "build-feature");
  const status = specs.find((s) => s.id === "project-status");
  assert.equal(build?.requiresFoundation, true);
  assert.equal(status?.requiresFoundation, false);
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run:
```bash
node --import tsx --test packages/specs/test/load-specs.test.ts
```
Expected: FAIL — `loadSpecs` not defined.

- [ ] **Step 5: Implement the loader**

`packages/specs/src/index.ts`:
```ts
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseSpec } from "@super-react-foundation/core";
import type { CommandSpec } from "@super-react-foundation/core";

const here = dirname(fileURLToPath(import.meta.url));
export const SPECS_DIR = join(here, "..", "definitions");

export function loadSpecs(): CommandSpec[] {
  return readdirSync(SPECS_DIR)
    .filter((file) => file.endsWith(".spec.md"))
    .sort()
    .map((file) => parseSpec(readFileSync(join(SPECS_DIR, file), "utf8")));
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run:
```bash
node --import tsx --test packages/specs/test/load-specs.test.ts
```
Expected: PASS — `tests 2`, `pass 2`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(specs): canonical spec definitions + loadSpecs"
```

---

## Task 7: CLI — `init`/`sync`/`status`/`guard`, dashboard, and the binary

**Files:**
- Create: `packages/cli/package.json`, `packages/cli/src/cli.ts`, `packages/cli/src/write.ts`, `packages/cli/src/dashboard.ts`, `packages/cli/src/commands/init.ts`, `packages/cli/src/commands/sync.ts`, `packages/cli/src/commands/status.ts`, `packages/cli/src/commands/guard.ts`
- Test: `packages/cli/test/dashboard.test.ts`, `packages/cli/test/init.test.ts`

**Interfaces:**
- Consumes: `compile` (`@super-react-foundation/compiler`), `claudeCodeAdapter` (`@super-react-foundation/adapter-claude-code`), `loadSpecs` (`@super-react-foundation/specs`), and `defaultState`/`readState`/`writeState`/`stateExists`/`evaluateGuard`/`ProjectState`/`EmittedFile` (`@super-react-foundation/core`).
- Produces: `renderDashboard(state: ProjectState): string`; `writeEmitted(projectRoot: string, files: EmittedFile[]): void`; command runners `runInit({ projectRoot, agent })`, `runSync({ projectRoot })`, `runStatus({ projectRoot })`, `runGuard({ projectRoot, requiresFoundation })`, each returning a `number` exit code; a `super-react-foundation` binary dispatching `init|sync|status|guard`.

- [ ] **Step 1: Create the package skeleton**

`packages/cli/package.json`:
```json
{
  "name": "super-react-foundation",
  "version": "0.0.0",
  "type": "module",
  "bin": { "super-react-foundation": "src/cli.ts" },
  "files": ["src"],
  "dependencies": {
    "@super-react-foundation/core": "workspace:*",
    "@super-react-foundation/compiler": "workspace:*",
    "@super-react-foundation/adapter-claude-code": "workspace:*",
    "@super-react-foundation/specs": "workspace:*"
  }
}
```

- [ ] **Step 2: Write the failing dashboard test**

`packages/cli/test/dashboard.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultState } from "@super-react-foundation/core";
import { renderDashboard } from "../src/dashboard.ts";

test("recommends analyze when nothing is done", () => {
  const out = renderDashboard(defaultState("claude-code"));
  assert.match(out, /super-react-foundation/);
  assert.match(out, /Recommended next step:\s+\/analyze-project/);
});

test("recommends foundation once analyzed, then build once founded", () => {
  const analyzed = defaultState("claude-code");
  analyzed.features["billing"] = { plan: true, ui: false, api: false, tests: false, reviewed: false };
  assert.match(renderDashboard(analyzed), /\/setup-project-foundation/);

  analyzed.foundation.complete = true;
  assert.match(renderDashboard(analyzed), /\/build-feature billing/);
});
```

- [ ] **Step 3: Run the dashboard test to verify it fails**

Run:
```bash
node --import tsx --test packages/cli/test/dashboard.test.ts
```
Expected: FAIL — `renderDashboard` not defined.

- [ ] **Step 4: Implement the dashboard**

`packages/cli/src/dashboard.ts`:
```ts
import type { FeatureState, ProjectState } from "@super-react-foundation/core";

function featureStatus(f: FeatureState): string {
  if (f.ui && f.api && f.tests) return "done";
  if (f.plan && (f.ui || f.api)) return "building";
  if (f.plan) return "planned";
  return "no plan";
}

function recommendNext(state: ProjectState): string {
  const analyzed =
    Object.keys(state.features).length > 0 || state.foundation.complete;
  if (!analyzed) return "/analyze-project";
  if (!state.foundation.complete) return "/setup-project-foundation";
  const unfinished = Object.entries(state.features).find(
    ([, f]) => featureStatus(f) !== "done",
  );
  if (unfinished) return `/build-feature ${unfinished[0]}`;
  return "/review-project-architecture";
}

export function renderDashboard(state: ProjectState): string {
  const analyzed =
    Object.keys(state.features).length > 0 || state.foundation.complete;
  const lines: string[] = [];
  lines.push("================ super-react-foundation ================");
  lines.push("  guided React engineering");
  lines.push("--------------------------------------------");
  lines.push("PROJECT HEALTH");
  lines.push(`  Requirements analyzed: ${analyzed ? "yes" : "no"}`);
  lines.push(`  Foundation: ${state.foundation.complete ? "ready" : "not set up"}`);
  lines.push(`  Agent: ${state.agent}`);
  lines.push("");
  lines.push("FEATURES");
  const features = Object.entries(state.features);
  if (features.length === 0) {
    lines.push("  (none yet)");
  } else {
    for (const [name, f] of features) {
      lines.push(`  ${name} — ${featureStatus(f)}`);
    }
  }
  lines.push("");
  lines.push(`-> Recommended next step:  ${recommendNext(state)}`);
  lines.push("============================================");
  return lines.join("\n") + "\n";
}
```

- [ ] **Step 5: Run the dashboard test to verify it passes**

Run:
```bash
node --import tsx --test packages/cli/test/dashboard.test.ts
```
Expected: PASS — `tests 2`, `pass 2`.

- [ ] **Step 6: Implement `writeEmitted` and the command runners**

`packages/cli/src/write.ts`:
```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { EmittedFile } from "@super-react-foundation/core";

export function writeEmitted(projectRoot: string, files: EmittedFile[]): void {
  for (const file of files) {
    const abs = join(projectRoot, file.path);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, file.contents, "utf8");
  }
}
```

`packages/cli/src/commands/init.ts`:
```ts
import { compile } from "@super-react-foundation/compiler";
import { claudeCodeAdapter } from "@super-react-foundation/adapter-claude-code";
import { loadSpecs } from "@super-react-foundation/specs";
import { defaultState, readState, stateExists, writeState } from "@super-react-foundation/core";
import { writeEmitted } from "../write.ts";
import { renderDashboard } from "../dashboard.ts";

export function runInit(opts: { projectRoot: string; agent: string }): number {
  const specs = loadSpecs();
  const files = compile(specs, claudeCodeAdapter);
  writeEmitted(opts.projectRoot, files);
  if (!stateExists(opts.projectRoot)) {
    writeState(opts.projectRoot, defaultState(opts.agent));
  }
  console.log(renderDashboard(readState(opts.projectRoot)));
  return 0;
}
```

`packages/cli/src/commands/sync.ts`:
```ts
import { compile } from "@super-react-foundation/compiler";
import { claudeCodeAdapter } from "@super-react-foundation/adapter-claude-code";
import { loadSpecs } from "@super-react-foundation/specs";
import { writeEmitted } from "../write.ts";

export function runSync(opts: { projectRoot: string }): number {
  writeEmitted(opts.projectRoot, compile(loadSpecs(), claudeCodeAdapter));
  console.log("super-react-foundation: prompt pack re-compiled.");
  return 0;
}
```

`packages/cli/src/commands/status.ts`:
```ts
import { readState, stateExists } from "@super-react-foundation/core";
import { renderDashboard } from "../dashboard.ts";

export function runStatus(opts: { projectRoot: string }): number {
  if (!stateExists(opts.projectRoot)) {
    console.error('super-react-foundation is not initialized here. Run "super-react-foundation init" first.');
    return 1;
  }
  console.log(renderDashboard(readState(opts.projectRoot)));
  return 0;
}
```

`packages/cli/src/commands/guard.ts`:
```ts
import { evaluateGuard, readState } from "@super-react-foundation/core";

export function runGuard(opts: { projectRoot: string; requiresFoundation: boolean }): number {
  const result = evaluateGuard(readState(opts.projectRoot), {
    requiresFoundation: opts.requiresFoundation,
  });
  if (!result.ok) {
    console.error(result.message);
    return result.exitCode;
  }
  console.log(result.message);
  return 0;
}
```

- [ ] **Step 7: Implement the binary**

`packages/cli/src/cli.ts`:
```ts
#!/usr/bin/env node
import { parseArgs } from "node:util";
import { runInit } from "./commands/init.ts";
import { runSync } from "./commands/sync.ts";
import { runStatus } from "./commands/status.ts";
import { runGuard } from "./commands/guard.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    agent: { type: "string", default: "claude-code" },
    "requires-foundation": { type: "boolean", default: false },
    cwd: { type: "string", default: process.cwd() },
  },
});

const projectRoot = values.cwd as string;
const command = positionals[0];

let code: number;
switch (command) {
  case "init":
    code = runInit({ projectRoot, agent: values.agent as string });
    break;
  case "sync":
    code = runSync({ projectRoot });
    break;
  case "status":
    code = runStatus({ projectRoot });
    break;
  case "guard":
    code = runGuard({
      projectRoot,
      requiresFoundation: values["requires-foundation"] as boolean,
    });
    break;
  default:
    console.error(
      `Unknown command: ${command ?? "(none)"}\n` +
        "Usage: super-react-foundation <init|sync|status|guard>",
    );
    code = 2;
}
process.exit(code);
```

- [ ] **Step 8: Write the failing integration test**

`packages/cli/test/init.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInit } from "../src/commands/init.ts";
import { runGuard } from "../src/commands/guard.ts";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "sr-init-"));
}

test("init installs the prompt pack and writes state", () => {
  const root = tempRoot();
  const code = runInit({ projectRoot: root, agent: "claude-code" });
  assert.equal(code, 0);
  assert.ok(existsSync(join(root, ".super-react-foundation", "state.json")));
  assert.ok(existsSync(join(root, ".claude", "skills", "super-react-foundation-project-status", "SKILL.md")));
  assert.ok(existsSync(join(root, ".claude", "super-react-foundation.manifest.json")));
  const skill = readFileSync(
    join(root, ".claude", "skills", "super-react-foundation-build-feature", "SKILL.md"),
    "utf8",
  );
  assert.match(skill, /super-react-foundation guard --requires-foundation/);
});

test("guard blocks feature work right after init (foundation incomplete)", () => {
  const root = tempRoot();
  runInit({ projectRoot: root, agent: "claude-code" });
  const code = runGuard({ projectRoot: root, requiresFoundation: true });
  assert.equal(code, 1);
});
```

- [ ] **Step 9: Run the integration test to verify it fails, then passes**

Run:
```bash
node --import tsx --test packages/cli/test/init.test.ts
```
Expected: FAIL first if any runner is missing; after Steps 6–7 are in place, PASS — `tests 2`, `pass 2`.

- [ ] **Step 10: Smoke-test the real binary**

Run:
```bash
rm -rf /tmp/sr-demo && mkdir -p /tmp/sr-demo
pnpm sr init --cwd /tmp/sr-demo
pnpm sr guard --requires-foundation --cwd /tmp/sr-demo; echo "exit=$?"
```
Expected: the dashboard prints with `-> Recommended next step:  /analyze-project`; the guard prints "Project Foundation Not Found." and `exit=1`.

- [ ] **Step 11: Full test + typecheck sweep**

Run:
```bash
pnpm test
pnpm typecheck
```
Expected: all tests pass across every package; typecheck exits 0.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(cli): init/sync/status/guard binary + dashboard"
```

---

## Self-Review

**1. Spec coverage (against the design spec, Plan-1 scope):**
- §4 two-layer architecture → Tasks 3 (compiler) + 4 (adapter) + 6 (specs) + 7 (CLI). ✓
- §4.1 repo layout (monorepo, packages) → Task 1 + each package task. ✓
- §5.1 markdown+YAML spec format → Task 2 (parser) + Task 6 (real specs). ✓
- §5.2 compiler + `AgentAdapter` + Claude Code adapter + golden tests → Tasks 3, 4. ✓
- §6.1 `.super-react-foundation/state.json` → Task 1. ✓
- §6.2 code-enforced foundation lock → Task 5 + wired in Task 7 (`guard`) + embedded in compiled skills (Task 4). ✓
- §9.2 install/status dashboard → Task 7. ✓
- §7 security: minimal pinned runtime deps (`yaml` only), no postinstall, no network → enforced by package.json files in every task + Global Constraints. ✓
- §10 testing: unit tests per package + golden-file tests + integration test → present throughout (Tasks 2–7). ✓
- *Deferred to later plans (correctly out of Plan-1 scope):* `scaffold`, `gate`, `fix` ops (Plan 2); the remaining 13 command specs + foundation-docs generators (Plan 3); docs site + signed-release CI + `tsc` build-to-`dist` for publishing (Plan 4).

**2. Placeholder scan:** No "TBD"/"add error handling"/"similar to Task N"; every code step shows complete code; every spec definition is fully written. ✓

**3. Type consistency:** `CommandSpec`, `ProjectState`, `EmittedFile`, `AgentAdapter` defined once in Task 1 and consumed unchanged in Tasks 2–7. `evaluateGuard`/`GuardOptions`/`GuardResult` defined in Task 5 and consumed in Task 7. `renderDashboard`, `writeEmitted`, `loadSpecs`, `compile`, `claudeCodeAdapter` names match across producer and consumer tasks. ✓

> **Note:** The published-package build (`tsc` → `dist`, `bin` → `dist/cli/index.js`, exports → `dist`) is intentionally deferred to **Plan 4 (Release & docs)**. Plan 1 runs entirely from source via the `tsx` loader, which is the fastest path to a verifiable, testable engine.
