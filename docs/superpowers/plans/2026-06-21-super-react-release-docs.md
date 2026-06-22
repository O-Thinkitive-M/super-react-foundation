# super-react-foundation Release & Docs — Implementation Plan (Plan 4 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `super-react-foundation` installable and runnable by end users without the monorepo or `tsx` — a self-contained, auditable, documented package — and close the remaining Plan-2/3 deferrals.

**Architecture:** Bundle the CLI + its `@super-react-foundation/*` workspace deps into one self-contained `super-react-foundation` package via esbuild; ship the three data directories (`files/`, `definitions/`, `docs/`) alongside the bundle so the existing `import.meta.url`-relative loaders resolve unchanged (each uses a distinct dir name, so they don't collide). Verify with `npm pack` + a tarball install (no registry needed). Add single-sourced docs, supply-chain CI, and an example.

**Tech Stack:** esbuild (dev-only bundler), Node ≥ 22.18, pnpm; GitHub Actions YAML; `node:test` via `tsx`.

## Global Constraints

- ESM only; TypeScript strict + `noUncheckedIndexedAccess`; erasable TS in framework `src/`.
- **The published `super-react-foundation` package must be self-contained:** zero runtime dependencies (everything, including `yaml`, is bundled), no `postinstall` scripts, no telemetry, no network at runtime except the sanctioned `pnpm install`/`npm audit` the user's commands invoke.
- Dev/test still runs from source via `tsx` (`node --import tsx --test <file>`); the build is additive and must not break the source workflow.
- Data dirs keep their distinct names so the loaders' `join(here, "..", "<dir>")` resolves both from `src/` (dev) and from `dist/` (bundled): templates→`files`, specs→`definitions`, foundation-docs→`docs`.
- Commit hygiene: `git status` before each commit; never stage deletions under `docs/superpowers/`.

## File Structure

```
packages/cli/
  build.mjs                      # esbuild bundling script (+ copy data dirs)
  package.json                   # bin -> dist/cli.js; files: [dist, files, definitions, docs]; build script
scripts/
  gen-docs.mjs                   # single-sourced command reference generator (reads loadSpecs)
docs/
  README.md (repo root)          # install, quickstart, 30-second dashboard, command table
  docs/commands/<id>.md          # generated per-command reference (committed)
.github/workflows/
  ci.yml                         # install + typecheck + test + audit + license check
  release.yml                    # npm publish --provenance on tag
examples/
  README.md                      # how the example was produced
RELEASE.md                       # release checklist
```

---

## Task 1: Close Plan-2/3 deferrals (foundation-docs wiring, guard de-dup, defaultInstall test)

**Files:**
- Modify: `packages/ops/src/scaffold.ts` (copy foundation-docs outlines into `project-setup/`), `packages/ops/package.json` (add `@super-react-foundation/foundation-docs` dep)
- Modify: `packages/adapters/claude-code/src/index.ts` (remove the duplicated guard auto-header), `packages/adapters/claude-code/test/adapter.test.ts` + golden
- Modify: `packages/ops/src/scaffold.ts` `defaultInstall` to take an injectable runner; `packages/ops/test/scaffold.test.ts`
- Test: `packages/ops/test/scaffold.test.ts`

**Interfaces:**
- `scaffoldFoundation` additionally writes the foundation-docs outlines to `project-setup/<name>.md` (only if absent), using `listFoundationDocs()`/`foundationDocsRoot()`.
- The Claude Code adapter no longer injects its own guard header; the guard now lives solely in each spec body's Step 1 (single source).

- [ ] **Step 1: Wire foundation-docs into scaffold — write the failing test**

Append to `packages/ops/test/scaffold.test.ts`:
```ts
test("scaffold seeds project-setup/ from the foundation-docs outlines", async () => {
  const root = tempRoot();
  writeState(root, defaultState("claude-code"));
  await scaffoldFoundation({ projectRoot: root, install: noInstall });
  assert.ok(existsSync(join(root, "project-setup", "architecture.md")));
  assert.ok(existsSync(join(root, "project-setup", "data-structures.md")));
});
```
(`existsSync`/`join` are already imported in this file.)

- [ ] **Step 2: Implement the wiring**

In `packages/ops/package.json` add `"@super-react-foundation/foundation-docs": "workspace:*"` to `dependencies`, then `pnpm install`.

In `packages/ops/src/scaffold.ts`, add imports:
```ts
import { foundationDocsRoot, listFoundationDocs } from "@super-react-foundation/foundation-docs";
```
After the template copy loop and before/with the FOUNDATION_COMPLETE write, seed `project-setup/`:
```ts
  // Seed project-setup/ skeletons from the foundation-docs outlines (skip existing).
  const docsRoot = foundationDocsRoot();
  for (const docName of listFoundationDocs()) {
    const dest = join(projectRoot, "project-setup", docName);
    if (!existsSync(dest)) {
      mkdirSync(join(projectRoot, "project-setup"), { recursive: true });
      copyFileSync(join(docsRoot, docName), dest);
    }
  }
```
(`mkdirSync`, `copyFileSync`, `existsSync`, `join` are already imported.)

- [ ] **Step 3: Run the scaffold tests**
```bash
node --import tsx --test packages/ops/test/scaffold.test.ts
```
Expected: all pass (including the new project-setup seeding test).

- [ ] **Step 4: De-duplicate the guard — update the adapter and golden test**

In `packages/adapters/claude-code/src/index.ts`, REMOVE the `guard` auto-header logic from `renderSkill` (the `requiresFoundation ? "> **Before doing anything..." : ""` block) and the `guard` variable, so the body is rendered as-authored (the spec's own Step 1 carries the guard). The frontmatter + body + `next` composition stays.

In `packages/adapters/claude-code/test/adapter.test.ts`:
- The "foundation-required commands embed the guard instruction" test currently passes a fixture whose body has no guard line. Change that test to assert the rendered output contains the spec **body** verbatim and does NOT add an extra guard header — i.e. give the fixture a body that itself contains `Run \`super-react-foundation guard --requires-foundation\``, and assert the rendered skill contains exactly one occurrence:
```ts
test("the adapter renders the body as-authored without injecting an extra guard header", () => {
  const spec = { ...statusSpec, requiresFoundation: true, body: "## Steps\n1. Run `super-react-foundation guard --requires-foundation`." };
  const out = claudeCodeAdapter.emitCommand(spec)[0]!.contents;
  const count = out.split("super-react-foundation guard --requires-foundation").length - 1;
  assert.equal(count, 1);
});
```
- If the golden file `__golden__/project-status.SKILL.md` is unaffected (project-status has `requiresFoundation:false`, so it never had a header), leave it. Run the adapter tests and, if the golden differs, reconcile the golden to the new (un-headered) output for any foundation case — but project-status should be unchanged.

Run:
```bash
node --import tsx --test packages/adapters/claude-code/test/adapter.test.ts
```
Expected: pass.

- [ ] **Step 5: defaultInstall — make it injectable and test it**

In `packages/ops/src/scaffold.ts`, refactor `defaultInstall` to delegate to an exec:
```ts
import { nodeExec, type Exec } from "./exec.ts";

export async function defaultInstall(projectRoot: string, exec: Exec = nodeExec): Promise<void> {
  const result = await exec("pnpm", ["install"], { cwd: projectRoot });
  if (result.code !== 0) {
    throw new Error(`Dependency install failed:\n${result.stderr || result.stdout}`);
  }
}
```
(Keep `scaffoldFoundation` using `opts.install ?? ((root) => defaultInstall(root))`.)

Append to `packages/ops/test/scaffold.test.ts`:
```ts
test("defaultInstall runs pnpm install and throws on non-zero exit", async () => {
  const { defaultInstall } = await import("@super-react-foundation/ops");
  const calls: string[][] = [];
  const ok: Exec = async (cmd, args) => { calls.push([cmd, ...args]); return { code: 0, stdout: "", stderr: "" }; };
  await defaultInstall("/x", ok);
  assert.deepEqual(calls[0], ["pnpm", "install"]);
  const bad: Exec = async () => ({ code: 1, stdout: "", stderr: "boom" });
  await assert.rejects(() => defaultInstall("/x", bad), /install failed/);
});
```
Add `import type { Exec } from "@super-react-foundation/ops";` to the test imports if not present, and export `defaultInstall` from `packages/ops/src/index.ts` (it's exported via `export * from "./scaffold.ts"` already — confirm).

- [ ] **Step 6: Full sweep + commit**
```bash
pnpm test
pnpm typecheck
```
Expected: all green.
```bash
git add -A
git commit -m "feat(ops,adapter): seed project-setup from foundation-docs; single-source the guard; testable defaultInstall"
```

---

## Task 2: Build & package the self-contained CLI

**Files:**
- Create: `packages/cli/build.mjs`
- Modify: `packages/cli/package.json` (bin, files, scripts, devDeps), root `package.json` (add `esbuild` devDep + `build` script)
- Test: manual via `npm pack` + tarball install (documented below)

**Interfaces:** `pnpm --filter super-react-foundation build` (or root `pnpm build`) produces `packages/cli/dist/cli.js` (bundled, shebang, executable) and copies the three data dirs into `packages/cli/`.

- [ ] **Step 1: Add esbuild and the build script**

Root `package.json` devDependencies: add `"esbuild": "0.24.2"` (verify latest stable at implementation time; pin exact). Add root script `"build": "pnpm --filter super-react-foundation build"`.

`packages/cli/build.mjs`:
```js
import { build } from "esbuild";
import { cpSync, rmSync, mkdirSync, chmodSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));         // packages/cli
const repo = join(root, "..", "..");

rmSync(join(root, "dist"), { recursive: true, force: true });
mkdirSync(join(root, "dist"), { recursive: true });

await build({
  entryPoints: [join(root, "src", "cli.ts")],
  outfile: join(root, "dist", "cli.js"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  banner: { js: "#!/usr/bin/env node" },
  // bundle everything (workspace deps + yaml) -> self-contained, zero runtime deps
});
chmodSync(join(root, "dist", "cli.js"), 0o755);

// Ship the data dirs adjacent to dist so the loaders' join(here,"..",<dir>) resolves:
// here === packages/cli/dist  ->  ../files | ../definitions | ../docs
cpSync(join(repo, "packages", "templates", "files"), join(root, "files"), { recursive: true });
cpSync(join(repo, "packages", "specs", "definitions"), join(root, "definitions"), { recursive: true });
cpSync(join(repo, "packages", "foundation-docs", "docs"), join(root, "docs"), { recursive: true });

console.log("super-react-foundation: build complete (dist/cli.js + data dirs).");
```

- [ ] **Step 2: Update the CLI package manifest**

`packages/cli/package.json`:
- `"bin": { "super-react-foundation": "dist/cli.js" }`
- `"files": ["dist", "files", "definitions", "docs"]`
- add `"scripts": { "build": "node build.mjs" }`
- Move the four `@super-react-foundation/*` deps and `yaml` reality: keep the workspace deps under `dependencies` for the build to resolve them, BUT since they are bundled, the published package should not require them at runtime. Use `"publishConfig"` is overkill; instead rely on `files` excluding nothing problematic and the bundle being self-contained. (Document in RELEASE.md that the workspace deps are build-time only and bundled.) Leave `dependencies` as-is for dev; the bundle inlines them.

- [ ] **Step 3: Build and verify the bundle runs without tsx**
```bash
pnpm build
rm -rf /tmp/sr-built && mkdir -p /tmp/sr-built
node packages/cli/dist/cli.js init --cwd /tmp/sr-built
node packages/cli/dist/cli.js scaffold --no-install --cwd /tmp/sr-built
ls /tmp/sr-built/.claude/skills | grep -c '^super-react-foundation-'   # expect 15
ls /tmp/sr-built/project-setup | grep -c '\.md$'            # expect 11
```
Expected: dashboard prints, 15 skills, 11 project-setup docs — all via plain `node`, no tsx, no workspace.

- [ ] **Step 4: Verify the packed tarball is self-contained**
```bash
cd packages/cli && npm pack && cd -
mkdir -p /tmp/sr-pack && cd /tmp/sr-pack && npm init -y >/dev/null
npm install /home/ttpl-lnvl15-0287/Desktop/super-ui/packages/cli/super-react-foundation-*.tgz
npx super-react-foundation init && ls .claude/skills | grep -c '^super-react-foundation-'   # expect 15
cd - && rm -f packages/cli/super-react-foundation-*.tgz
```
Expected: installing ONLY the tarball (no monorepo) and running `npx super-react-foundation init` works and installs 15 skills — proving the package is self-contained. If a data dir or workspace import is missing, fix the build script / `files` and repeat.

- [ ] **Step 5: Add `dist/` to gitignore (already ignored) and commit the build tooling**
```bash
git add packages/cli/build.mjs packages/cli/package.json package.json pnpm-lock.yaml
git commit -m "build(cli): self-contained esbuild bundle + data dirs; verified via npm pack"
```

---

## Task 3: Documentation (README + single-sourced command reference)

**Files:**
- Create: `scripts/gen-docs.mjs`, `README.md` (repo root), `docs/commands/<id>.md` (generated, committed)
- Test: a check that generated docs exist for all 15 commands

- [ ] **Step 1: Command-reference generator**

`scripts/gen-docs.mjs`:
```js
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadSpecs } from "@super-react-foundation/specs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(repo, "docs", "commands");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const spec of loadSpecs()) {
  const front = `# /${spec.id}\n\n- **Phase:** ${spec.phase}\n- **Requires foundation:** ${spec.requiresFoundation}\n- **Next:** ${spec.nextSuggested ? "/" + spec.nextSuggested : "—"}\n\n`;
  writeFileSync(join(outDir, `${spec.id}.md`), front + spec.body + "\n", "utf8");
}
console.log(`super-react-foundation: wrote ${loadSpecs().length} command docs.`);
```
Run it via `node --import tsx scripts/gen-docs.mjs` and add a root script `"gen-docs": "node --import tsx scripts/gen-docs.mjs"`.

- [ ] **Step 2: Write the README**

`README.md` (repo root) — beginner-friendly, covering: what super-react-foundation is; install (`npx super-react-foundation init`); the strict workflow (analyze → setup-foundation → build/update → integrate → review/test); the 30-second dashboard (show the rendered example); a command table (all 15, one line each, linking to `docs/commands/<id>.md`); the security stance (self-contained, no telemetry, pinned/audited); and "works with any agent (Claude Code today, adapters next)". Keep it practical, no jargon.

- [ ] **Step 3: Generate docs + add a presence test**

Run `pnpm gen-docs`. Then `packages/specs/test/docs.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadSpecs } from "@super-react-foundation/specs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

test("a generated command doc exists for every spec", () => {
  for (const spec of loadSpecs()) {
    assert.ok(existsSync(join(repo, "docs", "commands", `${spec.id}.md`)), `missing doc for ${spec.id}`);
  }
});
```

- [ ] **Step 4: Sweep + commit**
```bash
pnpm test && pnpm typecheck
git add -A
git commit -m "docs: README + single-sourced per-command reference (generated from specs)"
```

---

## Task 4: Supply-chain CI + release workflow

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/release.yml`

- [ ] **Step 1: CI workflow**

`.github/workflows/ci.yml`:
```yaml
name: ci
on:
  push: { branches: [main, master] }
  pull_request: {}
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22.18", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm --filter super-react-foundation build
      - run: pnpm audit --audit-level=high
      - run: npx --yes license-checker-rseidelsohn --production --failOn "GPL;AGPL" || true
```

- [ ] **Step 2: Release workflow (npm provenance)**

`.github/workflows/release.yml`:
```yaml
name: release
on:
  push: { tags: ["v*"] }
permissions: { contents: read, id-token: write }
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22.18", registry-url: "https://registry.npmjs.org", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test && pnpm --filter super-react-foundation build
      - run: npm publish --provenance --access public
        working-directory: packages/cli
        env: { NODE_AUTH_TOKEN: "${{ secrets.NPM_TOKEN }}" }
```

- [ ] **Step 3: Commit**
```bash
git add .github/workflows
git commit -m "ci: supply-chain checks + provenance-signed release workflow"
```

---

## Task 5: Example + final verification

**Files:**
- Create: `examples/README.md`, `RELEASE.md`

- [ ] **Step 1: Example doc**

`examples/README.md`: explain that `npx super-react-foundation init && super-react-foundation scaffold` produces the foundation, and show the resulting top-level tree (`.claude/`, `.super-react-foundation/`, `project-setup/`, `src/lib/ds`, `src/lib/algo`, the scaffolded app). Do not commit `node_modules` or a full generated app — describe how to reproduce it.

- [ ] **Step 2: RELEASE.md checklist**

`RELEASE.md`: the release steps — verify npm name availability for `super-react-foundation`; `pnpm install && pnpm typecheck && pnpm test`; `pnpm --filter super-react-foundation build`; `npm pack` + tarball smoke; bump version; tag `vX.Y.Z`; the release workflow publishes with provenance. Note the workspace deps are build-time-only (bundled).

- [ ] **Step 3: Final whole-suite + built + packed verification**
```bash
pnpm test && pnpm typecheck
pnpm --filter super-react-foundation build
node packages/cli/dist/cli.js init --cwd /tmp/sr-final-v1 2>/dev/null; echo "built CLI ok"
```
Expected: suite green; built CLI runs.

- [ ] **Step 4: Commit**
```bash
git add examples RELEASE.md
git commit -m "docs: example walkthrough + release checklist"
```

---

## Self-Review

**1. Spec coverage (design §7, §9.2, §10, §11):** Self-contained install + no-telemetry/no-deps → Task 2 (bundle) + verified by tarball smoke. Beginner-friendly docs + 30-second dashboard → Task 3. Supply-chain CI + signed release → Task 4. Example + success-criteria walkthrough → Task 5. Plan-2/3 deferrals (foundation-docs wiring, guard de-dup, defaultInstall test) → Task 1. ✓

**2. Placeholder scan:** Pin `esbuild` and any tool versions to exact at implementation time (the only deferred value, resolved via the registry). All scripts/workflows are complete.

**3. Consistency:** Data-dir resolution holds because `files`/`definitions`/`docs` are distinct names resolved as `join(here,"..",<dir>)` from both `src/` and `dist/`. The bundle inlines all workspace deps + `yaml`, so the published package is self-contained. `defaultInstall` exported from `@super-react-foundation/ops` and used by `scaffoldFoundation`. Generated docs derive from the same `loadSpecs()` single source as the prompt pack.

> **Note:** `npm publish` itself requires registry auth and is intentionally NOT executed here — it runs in `release.yml` on tag. Plan 4 verifies release-readiness via `npm pack` + local tarball install, which needs no registry.
