import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSpecs } from "@super-react/specs";

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
