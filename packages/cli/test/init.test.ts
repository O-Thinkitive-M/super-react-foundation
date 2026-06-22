import { test, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInit } from "../src/commands/init.ts";
import { runGuard } from "../src/commands/guard.ts";
import { runSync } from "../src/commands/sync.ts";
import { readState, writeState } from "@super-react-foundation/core";

const roots: string[] = [];
function tempRoot(): string {
  const r = mkdtempSync(join(tmpdir(), "sr-init-"));
  roots.push(r);
  return r;
}
after(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

test("init installs the prompt pack and writes state", () => {
  const root = tempRoot();
  const code = runInit({ projectRoot: root, agent: "claude-code" });
  assert.equal(code, 0);
  assert.ok(existsSync(join(root, ".super-react-foundation", "state.json")));
  assert.ok(existsSync(join(root, ".claude", "commands", "project-status.md")));
  assert.ok(existsSync(join(root, ".claude", "super-react-foundation.manifest.json")));
  const command = readFileSync(
    join(root, ".claude", "commands", "build-feature.md"),
    "utf8",
  );
  assert.match(command, /super-react-foundation guard --requires-foundation/);
});

test("guard blocks feature work right after init (foundation incomplete)", () => {
  const root = tempRoot();
  runInit({ projectRoot: root, agent: "claude-code" });
  const code = runGuard({ projectRoot: root, requiresFoundation: true });
  assert.equal(code, 1);
});

test("init does not overwrite existing state", () => {
  const root = tempRoot();
  runInit({ projectRoot: root, agent: "claude-code" });
  const state = readState(root);
  state.features["billing"] = { plan: true, ui: false, api: false, tests: false, reviewed: false };
  writeState(root, state);
  runInit({ projectRoot: root, agent: "claude-code" });
  assert.deepEqual(readState(root).features, {
    billing: { plan: true, ui: false, api: false, tests: false, reviewed: false },
  });
});

test("guard fails cleanly in an uninitialized directory", () => {
  const root = tempRoot();
  assert.equal(runGuard({ projectRoot: root, requiresFoundation: true }), 1);
});

test("sync writes the prompt pack", () => {
  const root = tempRoot();
  assert.equal(runSync({ projectRoot: root }), 0);
  assert.ok(existsSync(join(root, ".claude", "commands", "project-status.md")));
});

test("init installs a command for every spec in the catalog", () => {
  const root = tempRoot();
  runInit({ projectRoot: root, agent: "claude-code" });
  const commandsDir = join(root, ".claude", "commands");
  const installed = readdirSync(commandsDir).filter((f) => f.endsWith(".md"));
  assert.equal(installed.length, 15);
});
