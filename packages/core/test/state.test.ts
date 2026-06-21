import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultState, readState, writeState, stateExists } from "@super-react/core";

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
