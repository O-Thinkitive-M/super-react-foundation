import { test, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultState, writeState, readState } from "@super-react/core";
import { scaffoldFoundation } from "@super-react/ops";

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
