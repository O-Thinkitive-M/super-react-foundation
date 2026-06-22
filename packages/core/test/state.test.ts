import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultState, readState, writeState, stateExists } from "@super-react-foundation/core";

const roots: string[] = [];
function tempRoot(): string {
  const r = mkdtempSync(join(tmpdir(), "sr-state-"));
  roots.push(r);
  return r;
}
after(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

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

test("readState throws a clear error on corrupt JSON", () => {
  const root = tempRoot();
  mkdirSync(join(root, ".super-react-foundation"), { recursive: true });
  writeFileSync(join(root, ".super-react-foundation", "state.json"), "{ not json", "utf8");
  assert.throws(() => readState(root), /not valid JSON/);
});

test("readState rejects an unsupported state version", () => {
  const root = tempRoot();
  const s = defaultState("claude-code");
  writeState(root, s);
  writeFileSync(
    join(root, ".super-react-foundation", "state.json"),
    JSON.stringify({ ...s, version: 2 }),
    "utf8",
  );
  assert.throws(() => readState(root), /unsupported version/);
});
