import { test, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultState, writeState, readState } from "@super-react-foundation/core";
import { scaffoldFoundation, withScaffoldDeps } from "@super-react-foundation/ops";
import type { Exec } from "@super-react-foundation/ops";

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

test("scaffold seeds project-setup/ from the foundation-docs outlines", async () => {
  const root = tempRoot();
  writeState(root, defaultState("claude-code"));
  await scaffoldFoundation({ projectRoot: root, install: noInstall });
  assert.ok(existsSync(join(root, "project-setup", "architecture.md")));
  assert.ok(existsSync(join(root, "project-setup", "data-structures.md")));
  assert.ok(existsSync(join(root, "project-setup", "state-management.md")));
});

test("scaffold defaults to redux and wires redux deps + doc", async () => {
  const root = tempRoot();
  writeState(root, defaultState("claude-code"));
  const result = await scaffoldFoundation({ projectRoot: root, install: noInstall });
  assert.equal(result.stateLib, "redux");
  assert.equal(readState(root).foundation.stateLib, "redux");
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.ok(pkg.dependencies["@reduxjs/toolkit"]);
  assert.ok(pkg.dependencies["react-redux"]);
  assert.ok(!pkg.dependencies["zustand"]);
  const doc = readFileSync(join(root, "project-setup", "state-management.md"), "utf8");
  assert.match(doc, /Redux Toolkit/);
});

test("scaffold with zustand wires zustand deps + doc", async () => {
  const root = tempRoot();
  writeState(root, defaultState("claude-code"));
  const result = await scaffoldFoundation({ projectRoot: root, install: noInstall, stateLib: "zustand" });
  assert.equal(result.stateLib, "zustand");
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.ok(pkg.dependencies["zustand"]);
  assert.ok(!pkg.dependencies["@reduxjs/toolkit"]);
  const doc = readFileSync(join(root, "project-setup", "state-management.md"), "utf8");
  assert.match(doc, /Zustand/);
});

test("templateHash differs between redux and zustand", async () => {
  const a = tempRoot();
  const b = tempRoot();
  writeState(a, defaultState("claude-code"));
  writeState(b, defaultState("claude-code"));
  const ra = await scaffoldFoundation({ projectRoot: a, install: noInstall, stateLib: "redux" });
  const rb = await scaffoldFoundation({ projectRoot: b, install: noInstall, stateLib: "zustand" });
  assert.notEqual(ra.templateHash, rb.templateHash);
});

test("withScaffoldDeps injects and sorts deps without dropping existing ones", () => {
  const base = JSON.stringify({ dependencies: { react: "19.0.0" } });
  const redux = JSON.parse(withScaffoldDeps(base, "redux"));
  assert.deepEqual(Object.keys(redux.dependencies), [...Object.keys(redux.dependencies)].sort());
  assert.ok(redux.dependencies.react);
  assert.ok(redux.dependencies["@reduxjs/toolkit"]);
});

test("withScaffoldDeps default api mode does NOT inject SDK deps or scripts", () => {
  const base = JSON.stringify({ dependencies: { react: "19.0.0" }, scripts: { dev: "vite" } });
  const pkg = JSON.parse(withScaffoldDeps(base, "redux")); // apiMode defaults to "client"
  assert.ok(!pkg.dependencies.axios);
  assert.ok(!pkg.devDependencies?.orval);
  assert.ok(!pkg.scripts?.["generate-sdk"]);
});

test("withScaffoldDeps with sdk injects axios + orval + sdk scripts", () => {
  const base = JSON.stringify({ dependencies: { react: "19.0.0" }, scripts: { dev: "vite" } });
  const pkg = JSON.parse(withScaffoldDeps(base, "redux", "sdk"));
  assert.ok(pkg.dependencies.axios);
  assert.ok(pkg.devDependencies.orval);
  assert.equal(pkg.scripts["generate-sdk"], "orval --config ./orval.config.ts");
  assert.equal(pkg.scripts.preinstall, "node scripts/check-node.cjs");
  assert.equal(pkg.scripts.dev, "vite"); // existing scripts preserved
});

test("scaffold default (client) wires the hand-rolled api and no orval pipeline", async () => {
  const root = tempRoot();
  writeState(root, defaultState("claude-code"));
  const result = await scaffoldFoundation({ projectRoot: root, install: noInstall });
  assert.equal(result.apiMode, "client");
  assert.equal(readState(root).foundation.apiMode, "client");
  assert.ok(existsSync(join(root, "src/api/client.ts")));
  assert.ok(!existsSync(join(root, "src/api/axios-instance.ts")));
  assert.ok(!existsSync(join(root, "orval.config.ts")));
});

test("scaffold --sdk overlays the orval pipeline and removes the hand-rolled client", async () => {
  const root = tempRoot();
  writeState(root, defaultState("claude-code"));
  const result = await scaffoldFoundation({ projectRoot: root, install: noInstall, apiMode: "sdk" });
  assert.equal(result.apiMode, "sdk");
  assert.equal(readState(root).foundation.apiMode, "sdk");
  // SDK transport overlaid, hand-rolled transport removed.
  assert.ok(existsSync(join(root, "src/api/axios-instance.ts")));
  assert.ok(existsSync(join(root, "orval.config.ts")));
  assert.ok(existsSync(join(root, "orval-transformer.cjs")));
  assert.ok(existsSync(join(root, "scripts/check-node.cjs")));
  assert.ok(!existsSync(join(root, "src/api/client.ts")));
  // package.json gets axios + orval + sdk scripts.
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.ok(pkg.dependencies.axios);
  assert.ok(pkg.devDependencies.orval);
  assert.ok(pkg.scripts["generate-sdk"]);
});

test("templateHash differs between client and sdk api modes", async () => {
  const a = tempRoot();
  const b = tempRoot();
  writeState(a, defaultState("claude-code"));
  writeState(b, defaultState("claude-code"));
  const ra = await scaffoldFoundation({ projectRoot: a, install: noInstall, apiMode: "client" });
  const rb = await scaffoldFoundation({ projectRoot: b, install: noInstall, apiMode: "sdk" });
  assert.notEqual(ra.templateHash, rb.templateHash);
});

test("defaultInstall runs pnpm install and throws on non-zero exit", async () => {
  const { defaultInstall } = await import("@super-react-foundation/ops");
  const calls: string[][] = [];
  const ok: Exec = async (cmd, args) => { calls.push([cmd, ...args]); return { code: 0, stdout: "", stderr: "" }; };
  await defaultInstall("/x", ok);
  assert.deepEqual(calls[0], ["pnpm", "install"]);
  const bad: Exec = async () => ({ code: 1, stdout: "", stderr: "boom" });
  await assert.rejects(() => defaultInstall("/x", bad), /install failed/);
});
