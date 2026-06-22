# super-react-foundation Deterministic Build Ops — Implementation Plan (Plan 2 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the deterministic build operations to `super-react-foundation`: a `scaffold` engine that copies a pinned React foundation template (hashed + reproducible), `gate` runners (lint/types/test/audit), and a `fix` runner — wired into the CLI so `super-react-foundation scaffold` stands up a real foundation and flips the foundation lock.

**Architecture:** A new `@super-react-foundation/templates` package ships the pinned foundation files as data. A new `@super-react-foundation/ops` package holds pure, dependency-injected logic: `scaffoldFoundation` (copy + hash + install + state update), `runGate`/`runGates`, and `runFix`. All process execution goes through an injectable `Exec` function (`nodeExec` is the real implementation; tests inject fakes) so the suite stays hermetic. The CLI gains `scaffold`/`gate`/`fix` subcommands. This plan also clears the Plan-1 deferred items (sync stale-file cleanup, parser error context, test temp-dir teardown).

**Tech Stack:** TypeScript (strict, ESM), Node ≥ 22.18, pnpm workspaces; `node:child_process`/`node:crypto`/`node:fs` built-ins. Tests via `node:test` through the `tsx` loader.

## Global Constraints

- **Node ≥ 22.18**; **TypeScript strict** + `noUncheckedIndexedAccess`; **ESM only**; **erasable TS syntax only** (`erasableSyntaxOnly`).
- **Runtime deps stay minimal & exact-pinned.** The new `@super-react-foundation/ops` and `@super-react-foundation/templates` packages add **no external runtime dependencies** — only `workspace:*` deps and Node built-ins. (The pinned React versions inside the *template's* `package.json` are template **data**, not dependencies of our packages.)
- **No postinstall scripts. No telemetry.** Code performs no network I/O **except** the explicitly-invoked `pnpm install` (during `scaffold`) and `npm audit` (the `audit` gate) — this is the design's stated exception, not a violation.
- **All process execution is injectable** via the `Exec` type so tests never spawn real tools. The real `nodeExec` is used only by the CLI and by an optional, clearly-marked smoke step.
- Package names: `@super-react-foundation/templates`, `@super-react-foundation/ops`. CLI package stays `super-react-foundation`.
- Use the `tsx` loader for every test run: `node --import tsx --test <file>`.
- New tests must clean up their temp directories (register an `after` hook).

---

## File Structure

```
packages/
  templates/
    package.json                 # @super-react-foundation/templates  (files: src, files)
    src/index.ts                 # templateRoot(), listTemplateFiles()
    files/                       # the pinned foundation template (DATA, copied verbatim)
      package.json  tsconfig.json  tsconfig.node.json  vite.config.ts
      index.html  eslint.config.js  .prettierrc.json  .nvmrc  .gitignore  README.md
      src/main.tsx  src/App.tsx  src/theme/index.ts  src/vite-env.d.ts
    test/templates.test.ts
  ops/
    package.json                 # @super-react-foundation/ops  (deps: core, templates)
    src/
      exec.ts                    # Exec type, ExecResult, nodeExec
      scaffold.ts                # scaffoldFoundation()
      gates.ts                   # GateName, GateResult, runGate/runGates, resolveGateNames
      fix.ts                     # runFix()
      index.ts                   # barrel
    test/
      scaffold.test.ts
      gates.test.ts
      fix.test.ts
  cli/
    src/
      commands/scaffold.ts       # runScaffold()
      commands/gate.ts           # runGateCommand()
      commands/fix.ts            # runFixCommand()
      commands/sync.ts           # MODIFIED: stale-file cleanup
      cli.ts                     # MODIFIED: route scaffold/gate/fix; --no-install/--force
    test/
      scaffold-cli.test.ts       # scaffold + gate CLI integration (fake exec / no-install)
      sync.test.ts               # stale-file cleanup
  core/
    src/spec-parser.ts           # MODIFIED: toStringArray names the field
    src/specs... (specs pkg)     # loadSpecsFrom(dir) refactor + filename in errors
  specs/
    src/index.ts                 # MODIFIED: loadSpecsFrom(dir); error names the file
    test/load-specs.test.ts      # MODIFIED: add malformed-file error test + teardown
```

---

## Task 1: `@super-react-foundation/templates` — pinned foundation template

**Files:**
- Create: `packages/templates/package.json`, `packages/templates/src/index.ts`
- Create the template data files under `packages/templates/files/` (listed below)
- Test: `packages/templates/test/templates.test.ts`

**Interfaces:**
- Produces: `templateRoot(): string` (absolute path to the `files/` dir), `listTemplateFiles(): string[]` (template-relative paths, recursive, sorted), and `TEMPLATE_ROOT: string`.

- [ ] **Step 1: Create the package skeleton**

`packages/templates/package.json`:
```json
{
  "name": "@super-react-foundation/templates",
  "version": "0.0.0",
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "files": ["src", "files"]
}
```

- [ ] **Step 2: Create the template data files**

Create these under `packages/templates/files/`. All are copied verbatim by the scaffold engine.

`files/package.json` — the scaffolded app's manifest. **Pin each dependency to the latest stable version at implementation time** (run `pnpm view <pkg> version` for each and record the versions you chose in your report). Names and structure:
```json
{
  "name": "app",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.18" },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "<latest>",
    "react-dom": "<latest>",
    "@mui/material": "<latest>",
    "@emotion/react": "<latest>",
    "@emotion/styled": "<latest>",
    "react-router-dom": "<latest>",
    "@tanstack/react-query": "<latest>",
    "zustand": "<latest>"
  },
  "devDependencies": {
    "typescript": "<latest>",
    "vite": "<latest>",
    "@vitejs/plugin-react": "<latest>",
    "vitest": "<latest>",
    "eslint": "<latest>",
    "@eslint/js": "<latest>",
    "typescript-eslint": "<latest>",
    "prettier": "<latest>"
  }
}
```
Replace every `<latest>` with the exact resolved version (no `^`/`~`). This mirrors the reference "pin the newest stable" policy.

`files/tsconfig.json`:
```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`files/tsconfig.node.json`:
```jsonc
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true
  },
  "include": ["vite.config.ts"]
}
```

`files/vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
```

`files/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`files/eslint.config.js`:
```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
```

`files/.prettierrc.json`:
```json
{ "semi": true, "singleQuote": false }
```

`files/.nvmrc`:
```
22.18
```

`files/.gitignore`:
```
node_modules/
dist/
*.local
.env*
```

`files/README.md`:
```md
# App

Scaffolded by super-react-foundation. Run `pnpm install` then `pnpm dev`.
```

`files/src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { theme } from "@/theme";
import { App } from "@/App";

const queryClient = new QueryClient();
const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

createRoot(rootEl).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
```

`files/src/App.tsx`:
```tsx
import { Container, Typography } from "@mui/material";

export function App() {
  return (
    <Container>
      <Typography variant="h4" component="h1">
        super-react-foundation foundation ready
      </Typography>
    </Container>
  );
}
```

`files/src/theme/index.ts`:
```ts
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: { primary: { main: "#2D5F8D" } },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});
```

`files/src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

- [ ] **Step 3: Write the failing test**

`packages/templates/test/templates.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { templateRoot, listTemplateFiles } from "@super-react-foundation/templates";

test("templateRoot points at an existing files directory", () => {
  assert.ok(existsSync(templateRoot()));
  assert.ok(existsSync(join(templateRoot(), "package.json")));
});

test("listTemplateFiles returns sorted, template-relative paths including nested files", () => {
  const files = listTemplateFiles();
  assert.ok(files.includes("package.json"));
  assert.ok(files.includes("src/main.tsx"));
  assert.ok(files.includes("src/theme/index.ts"));
  const sorted = [...files].sort();
  assert.deepEqual(files, sorted);
});
```

- [ ] **Step 4: Create the loader and run the test (RED → GREEN)**

`packages/templates/src/index.ts`:
```ts
import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export const TEMPLATE_ROOT = join(here, "..", "files");

export function templateRoot(): string {
  return TEMPLATE_ROOT;
}

export function listTemplateFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry);
      if (statSync(abs).isDirectory()) walk(abs);
      else out.push(relative(TEMPLATE_ROOT, abs));
    }
  };
  walk(TEMPLATE_ROOT);
  return out.sort();
}
```
Run (RED first if you wrote the test before `index.ts`; then GREEN):
```bash
pnpm install
node --import tsx --test packages/templates/test/templates.test.ts
pnpm typecheck
```
Expected: 2 tests pass; typecheck exits 0.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat(templates): pinned React foundation template + file loader"
```

---

## Task 2: `@super-react-foundation/ops` — exec + scaffold engine

**Files:**
- Create: `packages/ops/package.json`, `packages/ops/src/exec.ts`, `packages/ops/src/scaffold.ts`, `packages/ops/src/index.ts`
- Test: `packages/ops/test/scaffold.test.ts`

**Interfaces:**
- Consumes: `readState`/`writeState`/`stateExists` from `@super-react-foundation/core`; `templateRoot`/`listTemplateFiles` from `@super-react-foundation/templates`.
- Produces:
  - `ExecResult { code: number; stdout: string; stderr: string }`, `Exec` (function type), `nodeExec: Exec`.
  - `ScaffoldOptions { projectRoot: string; install?: (projectRoot: string) => Promise<void>; force?: boolean }`, `ScaffoldResult { filesWritten: string[]; filesSkipped: string[]; templateHash: string }`, `scaffoldFoundation(opts: ScaffoldOptions): Promise<ScaffoldResult>`.
  - Behavior: throws if not initialized; throws if `foundation.complete && !force`; copies template files (skips existing unless `force`); computes a deterministic sha256 `templateHash` over all template files; awaits `install` (default: real `pnpm install`); writes `FOUNDATION_COMPLETE.md`; sets `state.foundation = { complete: true, completedAt, templateHash }` and `state.phase = "feature"`.

- [ ] **Step 1: Create the package skeleton + exec**

`packages/ops/package.json`:
```json
{
  "name": "@super-react-foundation/ops",
  "version": "0.0.0",
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "@super-react-foundation/core": "workspace:*",
    "@super-react-foundation/templates": "workspace:*"
  }
}
```

`packages/ops/src/exec.ts`:
```ts
import { spawn } from "node:child_process";

export interface ExecResult {
  code: number;
  stdout: string;
  stderr: string;
}

export type Exec = (
  cmd: string,
  args: string[],
  opts: { cwd: string },
) => Promise<ExecResult>;

export const nodeExec: Exec = (cmd, args, opts) =>
  new Promise<ExecResult>((resolve) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, shell: false });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    child.on("error", (err: Error) =>
      resolve({ code: 1, stdout, stderr: stderr + String(err) }),
    );
    child.on("close", (code: number | null) =>
      resolve({ code: code ?? 1, stdout, stderr }),
    );
  });
```

`packages/ops/src/index.ts`:
```ts
export * from "./exec.ts";
export * from "./scaffold.ts";
```

- [ ] **Step 2: Write the failing test**

`packages/ops/test/scaffold.test.ts`:
```ts
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultState, writeState, readState } from "@super-react-foundation/core";
import { scaffoldFoundation } from "@super-react-foundation/ops";

const roots: string[] = [];
function tempRoot(): string {
  const r = mkdtempSync(join(tmpdir(), "sr-scaffold-"));
  roots.push(r);
  return r;
}
after(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

const noInstall = async (): Promise<void> => {};

test("scaffold copies the template, writes FOUNDATION_COMPLETE.md, and completes the foundation", async () => {
  const root = tempRoot();
  writeState(root, defaultState("claude-code"));
  const result = await scaffoldFoundation({ projectRoot: root, install: noInstall });
  assert.match(result.templateHash, /^[0-9a-f]{64}$/);
  assert.ok(result.filesWritten.includes("package.json"));
  assert.ok(result.filesWritten.includes("src/main.tsx"));
  assert.ok(existsSync(join(root, "package.json")));
  assert.ok(existsSync(join(root, "FOUNDATION_COMPLETE.md")));
  const state = readState(root);
  assert.equal(state.foundation.complete, true);
  assert.equal(state.foundation.templateHash, result.templateHash);
  assert.equal(state.phase, "feature");
});

test("scaffold refuses to run twice without force", async () => {
  const root = tempRoot();
  writeState(root, defaultState("claude-code"));
  await scaffoldFoundation({ projectRoot: root, install: noInstall });
  await assert.rejects(
    () => scaffoldFoundation({ projectRoot: root, install: noInstall }),
    /already set up/,
  );
});

test("scaffold requires init first", async () => {
  const root = tempRoot();
  await assert.rejects(
    () => scaffoldFoundation({ projectRoot: root, install: noInstall }),
    /not initialized/,
  );
});

test("templateHash is deterministic across projects", async () => {
  const a = tempRoot();
  const b = tempRoot();
  writeState(a, defaultState("claude-code"));
  writeState(b, defaultState("claude-code"));
  const ra = await scaffoldFoundation({ projectRoot: a, install: noInstall });
  const rb = await scaffoldFoundation({ projectRoot: b, install: noInstall });
  assert.equal(ra.templateHash, rb.templateHash);
});
```

- [ ] **Step 3: Run the test to verify it fails**
```bash
pnpm install
node --import tsx --test packages/ops/test/scaffold.test.ts
```
Expected: FAIL — `scaffoldFoundation` not defined.

- [ ] **Step 4: Implement the scaffold engine**

`packages/ops/src/scaffold.ts`:
```ts
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { readState, stateExists, writeState } from "@super-react-foundation/core";
import { listTemplateFiles, templateRoot } from "@super-react-foundation/templates";
import { nodeExec } from "./exec.ts";

export interface ScaffoldOptions {
  projectRoot: string;
  install?: (projectRoot: string) => Promise<void>;
  force?: boolean;
}

export interface ScaffoldResult {
  filesWritten: string[];
  filesSkipped: string[];
  templateHash: string;
}

async function defaultInstall(projectRoot: string): Promise<void> {
  const result = await nodeExec("pnpm", ["install"], { cwd: projectRoot });
  if (result.code !== 0) {
    throw new Error(`Dependency install failed:\n${result.stderr || result.stdout}`);
  }
}

export async function scaffoldFoundation(opts: ScaffoldOptions): Promise<ScaffoldResult> {
  const { projectRoot, force = false } = opts;

  if (!stateExists(projectRoot)) {
    throw new Error('super-react-foundation is not initialized here. Run "super-react-foundation init" first.');
  }
  const state = readState(projectRoot);
  if (state.foundation.complete && !force) {
    throw new Error("Project foundation is already set up. Use --force to re-scaffold.");
  }

  const root = templateRoot();
  const files = listTemplateFiles();
  const filesWritten: string[] = [];
  const filesSkipped: string[] = [];
  const hash = createHash("sha256");

  for (const rel of files) {
    const contents = readFileSync(join(root, rel));
    hash.update(rel + "\0");
    hash.update(contents);
    const dest = join(projectRoot, rel);
    if (existsSync(dest) && !force) {
      filesSkipped.push(rel);
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(join(root, rel), dest);
    filesWritten.push(rel);
  }

  const templateHash = hash.digest("hex");

  const install = opts.install ?? defaultInstall;
  await install(projectRoot);

  writeFileSync(join(projectRoot, "FOUNDATION_COMPLETE.md"), foundationDoc(templateHash), "utf8");

  state.foundation = {
    complete: true,
    completedAt: new Date().toISOString(),
    templateHash,
  };
  state.phase = "feature";
  writeState(projectRoot, state);

  return { filesWritten, filesSkipped, templateHash };
}

function foundationDoc(hash: string): string {
  return [
    "# Project Foundation Complete",
    "",
    "- Architecture Ready",
    "- Routing Ready",
    "- State Management Ready",
    "- Testing Ready",
    "",
    "Feature development is unlocked.",
    "",
    `Template hash: \`${hash}\``,
    "",
  ].join("\n");
}
```

- [ ] **Step 5: Run the test to verify it passes**
```bash
node --import tsx --test packages/ops/test/scaffold.test.ts
pnpm typecheck
```
Expected: 4 tests pass; typecheck exits 0.

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat(ops): scaffold engine (copy + hash + install + state) with injectable install"
```

---

## Task 3: `@super-react-foundation/ops` — gate runners

**Files:**
- Create: `packages/ops/src/gates.ts`
- Modify: `packages/ops/src/index.ts` (export gates)
- Test: `packages/ops/test/gates.test.ts`

**Interfaces:**
- Consumes: `Exec` from `./exec.ts`.
- Produces: `GateName = "lint" | "types" | "test" | "audit"`; `GateResult { name: GateName; ok: boolean; output: string }`; `ALL_GATES: readonly GateName[]`; `isGateName(value: string): value is GateName`; `runGate(name, { cwd, exec }): Promise<GateResult>`; `runGates(names, { cwd, exec }): Promise<GateResult[]>`; `resolveGateNames(args: readonly string[]): GateName[]` (empty or contains `"all"` → all four; dedupes; throws on unknown).

- [ ] **Step 1: Write the failing test**

`packages/ops/test/gates.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Exec } from "@super-react-foundation/ops";
import { runGate, runGates, resolveGateNames, ALL_GATES } from "@super-react-foundation/ops";

function fakeExec(code: number, stdout = "", stderr = ""): Exec {
  return async () => ({ code, stdout, stderr });
}
function recordingExec(code: number): { exec: Exec; calls: string[][] } {
  const calls: string[][] = [];
  const exec: Exec = async (cmd, args) => {
    calls.push([cmd, ...args]);
    return { code, stdout: "", stderr: "" };
  };
  return { exec, calls };
}

test("runGate reports ok on exit 0 and merges output", async () => {
  const r = await runGate("lint", { cwd: "/x", exec: fakeExec(0, "clean") });
  assert.equal(r.name, "lint");
  assert.equal(r.ok, true);
  assert.equal(r.output, "clean");
});

test("runGate reports failure and captures stderr on non-zero exit", async () => {
  const r = await runGate("types", { cwd: "/x", exec: fakeExec(2, "", "TS error") });
  assert.equal(r.ok, false);
  assert.match(r.output, /TS error/);
});

test("runGates('all') runs every gate", async () => {
  const { exec, calls } = recordingExec(0);
  const results = await runGates(resolveGateNames(["all"]), { cwd: "/x", exec });
  assert.equal(results.length, ALL_GATES.length);
  assert.equal(calls.length, ALL_GATES.length);
});

test("resolveGateNames defaults to all, dedupes, and rejects unknown", () => {
  assert.deepEqual(resolveGateNames([]), [...ALL_GATES]);
  assert.deepEqual(resolveGateNames(["lint", "lint"]), ["lint"]);
  assert.throws(() => resolveGateNames(["bogus"]), /Unknown gate/);
});
```

- [ ] **Step 2: Run the test to verify it fails**
```bash
node --import tsx --test packages/ops/test/gates.test.ts
```
Expected: FAIL — exports not defined.

- [ ] **Step 3: Implement the gate runners**

`packages/ops/src/gates.ts`:
```ts
import type { Exec } from "./exec.ts";

export type GateName = "lint" | "types" | "test" | "audit";

export interface GateResult {
  name: GateName;
  ok: boolean;
  output: string;
}

export const ALL_GATES: readonly GateName[] = ["lint", "types", "test", "audit"];

const COMMANDS: Record<GateName, [string, string[]]> = {
  lint: ["npx", ["eslint", "."]],
  types: ["npx", ["tsc", "--noEmit"]],
  test: ["npx", ["vitest", "run", "--passWithNoTests"]],
  audit: ["npm", ["audit", "--audit-level=high"]],
};

export function isGateName(value: string): value is GateName {
  return (ALL_GATES as readonly string[]).includes(value);
}

export async function runGate(
  name: GateName,
  opts: { cwd: string; exec: Exec },
): Promise<GateResult> {
  const [cmd, args] = COMMANDS[name];
  const result = await opts.exec(cmd, args, { cwd: opts.cwd });
  return { name, ok: result.code === 0, output: (result.stdout + result.stderr).trim() };
}

export async function runGates(
  names: readonly GateName[],
  opts: { cwd: string; exec: Exec },
): Promise<GateResult[]> {
  const results: GateResult[] = [];
  for (const name of names) {
    results.push(await runGate(name, opts));
  }
  return results;
}

export function resolveGateNames(args: readonly string[]): GateName[] {
  if (args.length === 0 || args.includes("all")) return [...ALL_GATES];
  const names: GateName[] = [];
  for (const arg of args) {
    if (!isGateName(arg)) {
      throw new Error(`Unknown gate "${arg}". Valid: ${ALL_GATES.join(", ")}, all.`);
    }
    if (!names.includes(arg)) names.push(arg);
  }
  return names;
}
```

`packages/ops/src/index.ts` — add:
```ts
export * from "./exec.ts";
export * from "./scaffold.ts";
export * from "./gates.ts";
```

- [ ] **Step 4: Run the test to verify it passes**
```bash
node --import tsx --test packages/ops/test/gates.test.ts
pnpm typecheck
```
Expected: 4 tests pass; typecheck exits 0.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat(ops): quality-gate runners (lint/types/test/audit) with injectable exec"
```

---

## Task 4: `@super-react-foundation/ops` — fix runner

**Files:**
- Create: `packages/ops/src/fix.ts`
- Modify: `packages/ops/src/index.ts` (export fix)
- Test: `packages/ops/test/fix.test.ts`

**Interfaces:**
- Consumes: `Exec` from `./exec.ts`.
- Produces: `FixResult { ok: boolean; output: string }`; `runFix({ cwd, exec }): Promise<FixResult>` — runs `eslint . --fix` then `prettier --write .`; `ok` is true only if both exit 0.

- [ ] **Step 1: Write the failing test**

`packages/ops/test/fix.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Exec } from "@super-react-foundation/ops";
import { runFix } from "@super-react-foundation/ops";

function recordingExec(codes: number[]): { exec: Exec; calls: string[][] } {
  const calls: string[][] = [];
  let i = 0;
  const exec: Exec = async (cmd, args) => {
    calls.push([cmd, ...args]);
    const code = codes[i] ?? 0;
    i += 1;
    return { code, stdout: "", stderr: "" };
  };
  return { exec, calls };
}

test("runFix runs eslint --fix then prettier --write and reports ok when both pass", async () => {
  const { exec, calls } = recordingExec([0, 0]);
  const r = await runFix({ cwd: "/x", exec });
  assert.equal(r.ok, true);
  assert.deepEqual(calls[0], ["npx", "eslint", ".", "--fix"]);
  assert.deepEqual(calls[1], ["npx", "prettier", "--write", "."]);
});

test("runFix reports not-ok when either command fails", async () => {
  const { exec } = recordingExec([1, 0]);
  const r = await runFix({ cwd: "/x", exec });
  assert.equal(r.ok, false);
});
```

- [ ] **Step 2: Run the test to verify it fails**
```bash
node --import tsx --test packages/ops/test/fix.test.ts
```
Expected: FAIL — `runFix` not defined.

- [ ] **Step 3: Implement the fix runner**

`packages/ops/src/fix.ts`:
```ts
import type { Exec } from "./exec.ts";

export interface FixResult {
  ok: boolean;
  output: string;
}

export async function runFix(opts: { cwd: string; exec: Exec }): Promise<FixResult> {
  const lint = await opts.exec("npx", ["eslint", ".", "--fix"], { cwd: opts.cwd });
  const format = await opts.exec("npx", ["prettier", "--write", "."], { cwd: opts.cwd });
  return {
    ok: lint.code === 0 && format.code === 0,
    output: [lint.stdout, lint.stderr, format.stdout, format.stderr].join("\n").trim(),
  };
}
```

`packages/ops/src/index.ts` — add `export * from "./fix.ts";`.

- [ ] **Step 4: Run the test to verify it passes**
```bash
node --import tsx --test packages/ops/test/fix.test.ts
pnpm typecheck
```
Expected: 2 tests pass; typecheck exits 0.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat(ops): fix runner (eslint --fix + prettier --write)"
```

---

## Task 5: CLI — `scaffold`/`gate`/`fix` commands + wiring

**Files:**
- Create: `packages/cli/src/commands/scaffold.ts`, `packages/cli/src/commands/gate.ts`, `packages/cli/src/commands/fix.ts`
- Modify: `packages/cli/package.json` (add `@super-react-foundation/ops` dep), `packages/cli/src/cli.ts` (route + options)
- Test: `packages/cli/test/scaffold-cli.test.ts`

**Interfaces:**
- Consumes: `scaffoldFoundation`, `runGates`, `resolveGateNames`, `runFix`, `nodeExec`, `Exec` from `@super-react-foundation/ops`; `readState` from `@super-react-foundation/core`; `renderDashboard` from `../dashboard.ts`.
- Produces: `runScaffold({ projectRoot, noInstall, force }): Promise<number>`; `runGateCommand({ projectRoot, gateArgs, exec? }): Promise<number>` (exit 1 if any gate fails); `runFixCommand({ projectRoot, exec? }): Promise<number>`. CLI routes `scaffold`/`gate`/`fix`; adds `--no-install` and `--force` boolean options; gate names are positionals after `gate`.

- [ ] **Step 1: Add the ops dependency**

In `packages/cli/package.json` `dependencies`, add `"@super-react-foundation/ops": "workspace:*"`. Then run `pnpm install`.

- [ ] **Step 2: Write the command runners**

`packages/cli/src/commands/scaffold.ts`:
```ts
import { scaffoldFoundation } from "@super-react-foundation/ops";
import { readState } from "@super-react-foundation/core";
import { renderDashboard } from "../dashboard.ts";

export async function runScaffold(opts: {
  projectRoot: string;
  noInstall: boolean;
  force: boolean;
}): Promise<number> {
  const install = opts.noInstall ? async (): Promise<void> => {} : undefined;
  const result = await scaffoldFoundation({
    projectRoot: opts.projectRoot,
    force: opts.force,
    install,
  });
  console.log(
    `super-react-foundation: foundation scaffolded (${result.filesWritten.length} written, ${result.filesSkipped.length} skipped).`,
  );
  console.log(renderDashboard(readState(opts.projectRoot)));
  return 0;
}
```

`packages/cli/src/commands/gate.ts`:
```ts
import { type Exec, nodeExec, resolveGateNames, runGates } from "@super-react-foundation/ops";

export async function runGateCommand(opts: {
  projectRoot: string;
  gateArgs: string[];
  exec?: Exec;
}): Promise<number> {
  const exec = opts.exec ?? nodeExec;
  const results = await runGates(resolveGateNames(opts.gateArgs), {
    cwd: opts.projectRoot,
    exec,
  });
  let allOk = true;
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}`);
    if (!r.ok) {
      allOk = false;
      if (r.output) console.error(r.output);
    }
  }
  return allOk ? 0 : 1;
}
```

`packages/cli/src/commands/fix.ts`:
```ts
import { type Exec, nodeExec, runFix } from "@super-react-foundation/ops";

export async function runFixCommand(opts: {
  projectRoot: string;
  exec?: Exec;
}): Promise<number> {
  const result = await runFix({ cwd: opts.projectRoot, exec: opts.exec ?? nodeExec });
  console.log(result.output || "super-react-foundation: fix complete.");
  return result.ok ? 0 : 1;
}
```

- [ ] **Step 3: Wire the binary**

In `packages/cli/src/cli.ts`:
1. Add imports:
```ts
import { runScaffold } from "./commands/scaffold.ts";
import { runGateCommand } from "./commands/gate.ts";
import { runFixCommand } from "./commands/fix.ts";
```
2. Add two options to the `parseArgs` `options` object (keep the existing `agent`, `requires-foundation`, `cwd`):
```ts
    "no-install": { type: "boolean", default: false },
    force: { type: "boolean", default: false },
```
3. Add three `case` branches inside the existing `try { switch (command) { ... } }` (use `await`, matching the existing style; do not change existing cases or the catch):
```ts
    case "scaffold":
      code = await runScaffold({
        projectRoot,
        noInstall: values["no-install"] as boolean,
        force: values.force as boolean,
      });
      break;
    case "gate":
      code = await runGateCommand({ projectRoot, gateArgs: positionals.slice(1) });
      break;
    case "fix":
      code = await runFixCommand({ projectRoot });
      break;
```
4. Update the `default` branch usage string to: `"Usage: super-react-foundation <init|sync|status|guard|scaffold|gate|fix>"`.

- [ ] **Step 4: Write the failing integration test**

`packages/cli/test/scaffold-cli.test.ts`:
```ts
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Exec } from "@super-react-foundation/ops";
import { runInit } from "../src/commands/init.ts";
import { runScaffold } from "../src/commands/scaffold.ts";
import { runGuard } from "../src/commands/guard.ts";
import { runGateCommand } from "../src/commands/gate.ts";

const roots: string[] = [];
function tempRoot(): string {
  const r = mkdtempSync(join(tmpdir(), "sr-scaffold-cli-"));
  roots.push(r);
  return r;
}
after(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

test("scaffold (no-install) stands up the foundation and unlocks the guard", async () => {
  const root = tempRoot();
  runInit({ projectRoot: root, agent: "claude-code" });
  assert.equal(runGuard({ projectRoot: root, requiresFoundation: true }), 1);
  const code = await runScaffold({ projectRoot: root, noInstall: true, force: false });
  assert.equal(code, 0);
  assert.ok(existsSync(join(root, "package.json")));
  assert.ok(existsSync(join(root, "FOUNDATION_COMPLETE.md")));
  assert.equal(runGuard({ projectRoot: root, requiresFoundation: true }), 0);
});

test("gate command returns 0 when all gates pass and 1 when one fails", async () => {
  const root = tempRoot();
  const passing: Exec = async () => ({ code: 0, stdout: "", stderr: "" });
  assert.equal(await runGateCommand({ projectRoot: root, gateArgs: ["all"], exec: passing }), 0);
  const failing: Exec = async (_cmd, args) => ({
    code: args.includes("tsc") ? 2 : 0,
    stdout: "",
    stderr: "boom",
  });
  assert.equal(await runGateCommand({ projectRoot: root, gateArgs: ["all"], exec: failing }), 1);
});
```

- [ ] **Step 5: Run the integration test, then the full sweep**
```bash
node --import tsx --test packages/cli/test/scaffold-cli.test.ts
pnpm test
pnpm typecheck
```
Expected: the scaffold-cli tests pass; the full suite is green; typecheck exits 0.

- [ ] **Step 6: Smoke-test the real binary (no-install path — no network)**
```bash
rm -rf /tmp/sr-p2 && mkdir -p /tmp/sr-p2
pnpm sr init --cwd /tmp/sr-p2 >/dev/null
pnpm sr scaffold --no-install --cwd /tmp/sr-p2
pnpm sr guard --requires-foundation --cwd /tmp/sr-p2; echo "guard exit=$?"
ls /tmp/sr-p2
```
Expected: scaffold prints the dashboard with foundation ready; `guard exit=0`; the app files (package.json, src/, etc.) are present.

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "feat(cli): scaffold/gate/fix commands wired into the binary"
```

---

## Task 6: `sync` stale-file cleanup

**Files:**
- Modify: `packages/cli/src/commands/sync.ts`
- Test: `packages/cli/test/sync.test.ts`

**Interfaces:**
- Consumes: `compile` (`@super-react-foundation/compiler`), `claudeCodeAdapter` (`@super-react-foundation/adapter-claude-code`), `loadSpecs` (`@super-react-foundation/specs`); `writeEmitted` from `../write.ts`.
- Produces: `runSync({ projectRoot }): number` that first removes super-react-foundation-owned skill directories (`.claude/skills/super-react-foundation-*`) so renamed/removed specs leave no orphans, then writes the freshly compiled pack.

- [ ] **Step 1: Write the failing test**

`packages/cli/test/sync.test.ts`:
```ts
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runSync } from "../src/commands/sync.ts";

const roots: string[] = [];
function tempRoot(): string {
  const r = mkdtempSync(join(tmpdir(), "sr-sync-"));
  roots.push(r);
  return r;
}
after(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

test("sync removes orphaned super-react-foundation skills and writes the current pack", () => {
  const root = tempRoot();
  const orphanDir = join(root, ".claude", "skills", "super-react-foundation-old-removed");
  mkdirSync(orphanDir, { recursive: true });
  writeFileSync(join(orphanDir, "SKILL.md"), "stale", "utf8");

  assert.equal(runSync({ projectRoot: root }), 0);

  assert.equal(existsSync(orphanDir), false);
  assert.ok(existsSync(join(root, ".claude", "skills", "super-react-foundation-project-status", "SKILL.md")));
});

test("sync does not touch non-super-react-foundation skills", () => {
  const root = tempRoot();
  const userDir = join(root, ".claude", "skills", "my-own-skill");
  mkdirSync(userDir, { recursive: true });
  writeFileSync(join(userDir, "SKILL.md"), "mine", "utf8");

  runSync({ projectRoot: root });

  assert.ok(existsSync(join(userDir, "SKILL.md")));
});
```

- [ ] **Step 2: Run the test to verify it fails**
```bash
node --import tsx --test packages/cli/test/sync.test.ts
```
Expected: FAIL — orphan dir is not removed (current `runSync` only overwrites).

- [ ] **Step 3: Implement stale-file cleanup**

Replace the contents of `packages/cli/src/commands/sync.ts` with:
```ts
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { compile } from "@super-react-foundation/compiler";
import { claudeCodeAdapter } from "@super-react-foundation/adapter-claude-code";
import { loadSpecs } from "@super-react-foundation/specs";
import { writeEmitted } from "../write.ts";

function cleanOwnedSkills(projectRoot: string): void {
  const skillsDir = join(projectRoot, ".claude", "skills");
  if (!existsSync(skillsDir)) return;
  for (const entry of readdirSync(skillsDir)) {
    if (entry.startsWith("super-react-foundation-")) {
      rmSync(join(skillsDir, entry), { recursive: true, force: true });
    }
  }
}

export function runSync(opts: { projectRoot: string }): number {
  cleanOwnedSkills(opts.projectRoot);
  writeEmitted(opts.projectRoot, compile(loadSpecs(), claudeCodeAdapter));
  console.log("super-react-foundation: prompt pack re-compiled.");
  return 0;
}
```

- [ ] **Step 4: Run the test to verify it passes**
```bash
node --import tsx --test packages/cli/test/sync.test.ts
pnpm typecheck
```
Expected: 2 tests pass; typecheck exits 0.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "fix(cli): sync removes orphaned super-react-foundation skills before writing"
```

---

## Task 7: Spec-parser error context + test temp-dir teardown

**Files:**
- Modify: `packages/core/src/spec-parser.ts` (name the field in `toStringArray` errors)
- Modify: `packages/specs/src/index.ts` (`loadSpecsFrom(dir)`; name the file on parse failure)
- Test: `packages/specs/test/load-specs.test.ts` (add malformed-file test + teardown)
- Modify: `packages/core/test/state.test.ts`, `packages/cli/test/init.test.ts` (add temp-dir teardown)

**Interfaces:**
- Produces: `loadSpecsFrom(dir: string): CommandSpec[]` (parses every `*.spec.md` in `dir`, sorted; on `parseSpec` failure throws `Failed to parse spec "<file>": <message>`); `loadSpecs()` delegates to `loadSpecsFrom(SPECS_DIR)`. `toStringArray` errors read `Expected a list for field "<key>" in spec frontmatter`.

- [ ] **Step 1: Write the failing test**

In `packages/specs/test/load-specs.test.ts`, add the imports and tests (keep the existing two tests):
```ts
import { test, after } from "node:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSpecsFrom } from "@super-react-foundation/specs";

const roots: string[] = [];
function tempRoot(): string {
  const r = mkdtempSync(join(tmpdir(), "sr-loadspecs-"));
  roots.push(r);
  return r;
}
after(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

test("loadSpecsFrom names the offending file when a spec is malformed", () => {
  const dir = tempRoot();
  writeFileSync(join(dir, "broken.spec.md"), "no frontmatter here", "utf8");
  assert.throws(() => loadSpecsFrom(dir), /Failed to parse spec "broken\.spec\.md"/);
});
```
(`assert` and `test` are already imported at the top of the file — do not duplicate; merge the `node:test` import to include `after`.)

- [ ] **Step 2: Run the test to verify it fails**
```bash
node --import tsx --test packages/specs/test/load-specs.test.ts
```
Expected: FAIL — `loadSpecsFrom` not exported.

- [ ] **Step 3: Implement the refactor + error context**

Replace `packages/specs/src/index.ts` with:
```ts
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseSpec } from "@super-react-foundation/core";
import type { CommandSpec } from "@super-react-foundation/core";

const here = dirname(fileURLToPath(import.meta.url));
export const SPECS_DIR = join(here, "..", "definitions");

export function loadSpecsFrom(dir: string): CommandSpec[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".spec.md"))
    .sort()
    .map((file) => {
      try {
        return parseSpec(readFileSync(join(dir, file), "utf8"));
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        throw new Error(`Failed to parse spec "${file}": ${message}`, { cause });
      }
    });
}

export function loadSpecs(): CommandSpec[] {
  return loadSpecsFrom(SPECS_DIR);
}
```

In `packages/core/src/spec-parser.ts`, update `toStringArray` to take the field name and use it in the message, and update its two call sites:
```ts
function toStringArray(value: unknown, key: string): string[] {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`Expected a list for field "${key}" in spec frontmatter.`);
  }
  return value.map((v) => String(v));
}
```
Call sites become `toStringArray(data.inputs, "inputs")`, `toStringArray(data.produces, "produces")`, `toStringArray(data.cliOps, "cliOps")`.

- [ ] **Step 4: Add a focused parser test for the field-named error**

In `packages/core/test/spec-parser.test.ts`, append:
```ts
test("names the offending field when a list value is not a list", () => {
  assert.throws(
    () => parseSpec(`---\nid: x\ntitle: X\nphase: feature\ninputs: notalist\n---\nbody`),
    /Expected a list for field "inputs"/,
  );
});
```

- [ ] **Step 5: Add temp-dir teardown to the two Plan-1 test files**

In `packages/core/test/state.test.ts` and `packages/cli/test/init.test.ts`: change `import { test } from "node:test";` to `import { test, after } from "node:test";`, collect each created temp root into a module-level `const roots: string[] = []` (push inside the existing `tempRoot()` helper), and add once per file:
```ts
after(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});
```
Add `rmSync` to each file's existing `node:fs` import. Do not change any assertions.

- [ ] **Step 6: Run the full sweep**
```bash
pnpm test
pnpm typecheck
```
Expected: all tests pass (including the new error-context and teardown changes); typecheck exits 0.

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "fix(core,specs): name files/fields in parse errors; tests clean up temp dirs"
```

---

## Self-Review

**1. Spec coverage (design spec, Plan-2 scope):**
- §6.3 scaffold engine (pinned templates copied, hash, install, FOUNDATION_COMPLETE.md, state flip) → Tasks 1, 2. ✓
- §6.4 quality gates (lint/types/test/audit) → Task 3; `fix` → Task 4; CLI exposure → Task 5. ✓
- Hybrid scaffold: deterministic template copy here; AI-adapted `project-setup/*.md` is Plan 3 content (correctly out of scope). ✓
- §7 security: no new external runtime deps; the only network is the explicit `pnpm install`/`npm audit`; install is injectable so tests are hermetic. ✓
- Plan-1 deferred items: sync stale-file cleanup → Task 6; parser error file/field context + temp-dir teardown → Task 7. ✓
- *Deferred to Plan 3:* the 13 remaining command specs + foundation-docs generators. *Deferred to Plan 4:* docs site, signed release, `tsc`→`dist` build.

**2. Placeholder scan:** The only intentional placeholder is `<latest>` in the template `package.json`, with explicit instructions to resolve exact versions via `pnpm view` at implementation time (mirrors the reference's "pin newest stable" policy). Every code/test step has complete content.

**3. Type consistency:** `Exec`/`ExecResult` defined in Task 2 and consumed in Tasks 3, 4, 5. `GateName`/`GateResult`/`runGate`/`runGates`/`resolveGateNames`/`ALL_GATES` defined in Task 3, consumed in Task 5. `ScaffoldOptions`/`ScaffoldResult`/`scaffoldFoundation` defined in Task 2, consumed in Task 5. `runScaffold`/`runGateCommand`/`runFixCommand` defined in Task 5 and routed in the same task. `loadSpecsFrom` defined in Task 7, used by `loadSpecs`. Names are consistent across producer/consumer tasks.
