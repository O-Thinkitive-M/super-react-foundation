import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultState, evaluateGuard } from "@super-react/core";

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
