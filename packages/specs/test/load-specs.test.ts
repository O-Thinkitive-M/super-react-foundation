import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSpecs, loadSpecsFrom } from "@super-react/specs";

const roots: string[] = [];
function tempRoot(): string {
  const r = mkdtempSync(join(tmpdir(), "sr-loadspecs-"));
  roots.push(r);
  return r;
}
after(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

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

test("loadSpecsFrom names the offending file when a spec is malformed", () => {
  const dir = tempRoot();
  writeFileSync(join(dir, "broken.spec.md"), "no frontmatter here", "utf8");
  assert.throws(() => loadSpecsFrom(dir), /Failed to parse spec "broken\.spec\.md"/);
});

test("analyze-project and create-feature-plan load and are planning-phase (no foundation required)", () => {
  const specs = loadSpecs();
  const analyze = specs.find((s) => s.id === "analyze-project");
  const plan = specs.find((s) => s.id === "create-feature-plan");
  assert.equal(analyze?.requiresFoundation, false);
  assert.equal(analyze?.nextSuggested, "setup-project-foundation");
  assert.equal(plan?.requiresFoundation, false);
});
