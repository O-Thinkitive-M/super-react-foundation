import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultState } from "@super-react/core";
import { renderDashboard } from "../src/dashboard.ts";

test("recommends analyze when nothing is done", () => {
  const out = renderDashboard(defaultState("claude-code"));
  assert.match(out, /super-react/);
  assert.match(out, /Recommended next step:\s+\/analyze-project/);
});

test("recommends foundation once analyzed, then build once founded", () => {
  const analyzed = defaultState("claude-code");
  analyzed.features["billing"] = { plan: true, ui: false, api: false, tests: false, reviewed: false };
  assert.match(renderDashboard(analyzed), /\/setup-project-foundation/);

  analyzed.foundation.complete = true;
  assert.match(renderDashboard(analyzed), /\/build-feature billing/);
});
