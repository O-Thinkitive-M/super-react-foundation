import { test } from "node:test";
import assert from "node:assert/strict";
import { compile } from "@super-react-foundation/compiler";
import { claudeCodeAdapter } from "@super-react-foundation/adapter-claude-code";
import { loadSpecs } from "@super-react-foundation/specs";

const EXPECTED = [
  "analyze-project", "build-feature", "build-feature-api", "build-feature-ui",
  "connect-external-service", "create-feature-plan", "fix-project-issues",
  "generate-feature-tests", "project-status", "review-feature",
  "review-project-architecture", "setup-project-foundation",
  "update-feature", "update-feature-api", "update-feature-ui",
];

const CATALOG: Record<string, { phase: string; requiresFoundation: boolean; cliOps: string[]; nextSuggested: string | null }> = {
  "analyze-project": { phase: "analyze", requiresFoundation: false, cliOps: [], nextSuggested: "setup-project-foundation" },
  "create-feature-plan": { phase: "feature", requiresFoundation: false, cliOps: [], nextSuggested: "build-feature" },
  "setup-project-foundation": { phase: "foundation", requiresFoundation: false, cliOps: ["scaffold", "gate"], nextSuggested: "project-status" },
  "project-status": { phase: "status", requiresFoundation: false, cliOps: ["status"], nextSuggested: null },
  "build-feature": { phase: "feature", requiresFoundation: true, cliOps: ["guard", "gate"], nextSuggested: "review-feature" },
  "build-feature-ui": { phase: "feature", requiresFoundation: true, cliOps: ["guard"], nextSuggested: "build-feature-api" },
  "build-feature-api": { phase: "feature", requiresFoundation: true, cliOps: ["guard", "gate"], nextSuggested: "review-feature" },
  "update-feature": { phase: "feature", requiresFoundation: true, cliOps: ["guard", "gate"], nextSuggested: "review-feature" },
  "update-feature-ui": { phase: "feature", requiresFoundation: true, cliOps: ["guard"], nextSuggested: null },
  "update-feature-api": { phase: "feature", requiresFoundation: true, cliOps: ["guard", "gate"], nextSuggested: null },
  "connect-external-service": { phase: "integrate", requiresFoundation: true, cliOps: ["guard"], nextSuggested: "project-status" },
  "review-project-architecture": { phase: "quality", requiresFoundation: true, cliOps: ["gate"], nextSuggested: null },
  "review-feature": { phase: "quality", requiresFoundation: true, cliOps: ["gate"], nextSuggested: "generate-feature-tests" },
  "generate-feature-tests": { phase: "quality", requiresFoundation: true, cliOps: ["gate"], nextSuggested: null },
  "fix-project-issues": { phase: "quality", requiresFoundation: true, cliOps: ["fix", "gate"], nextSuggested: null },
};

test("all 15 commands are present", () => {
  const ids = loadSpecs().map((s) => s.id).sort();
  assert.deepEqual(ids, [...EXPECTED].sort());
  assert.equal(ids.length, 15);
});

test("every foundation-required spec embeds the guard instruction", () => {
  for (const spec of loadSpecs()) {
    if (spec.requiresFoundation) {
      assert.match(spec.body, /super-react-foundation guard --requires-foundation/, `${spec.id} missing guard`);
    }
  }
});

test("every spec's frontmatter matches the authoritative catalog", () => {
  for (const spec of loadSpecs()) {
    const expected = CATALOG[spec.id];
    if (!expected) assert.fail(`${spec.id} is not in the catalog`);
    assert.equal(spec.phase, expected.phase, `${spec.id} phase`);
    assert.equal(spec.requiresFoundation, expected.requiresFoundation, `${spec.id} requiresFoundation`);
    assert.deepEqual(spec.cliOps, expected.cliOps, `${spec.id} cliOps`);
    assert.equal(spec.nextSuggested, expected.nextSuggested, `${spec.id} nextSuggested`);
  }
});

test("nextSuggested points to a real spec and cliOps reference only real ops", () => {
  const specs = loadSpecs();
  const ids = new Set(specs.map((s) => s.id));
  const validOps = new Set(["guard", "scaffold", "gate", "fix", "status"]);
  for (const spec of specs) {
    if (spec.nextSuggested !== null) {
      assert.ok(ids.has(spec.nextSuggested), `${spec.id} nextSuggested -> unknown "${spec.nextSuggested}"`);
    }
    for (const op of spec.cliOps) {
      assert.ok(validOps.has(op), `${spec.id} has unknown cliOp "${op}"`);
    }
  }
});

test("every spec body has the seven sections in order", () => {
  const sections = ["## Purpose", "## Why it exists", "## Steps", "## Example", "## Best Practices", "## Common Mistakes", "## Troubleshooting"];
  for (const spec of loadSpecs()) {
    let last = -1;
    for (const section of sections) {
      const idx = spec.body.indexOf(section);
      assert.ok(idx > last, `${spec.id}: section "${section}" missing or out of order`);
      last = idx;
    }
  }
});

test("the whole pack compiles to one command file per command plus a manifest", () => {
  const specs = loadSpecs();
  const files = compile(specs, claudeCodeAdapter);
  const commands = files.filter(
    (f) => f.path.startsWith(".claude/commands/") && f.path.endsWith(".md"),
  );
  assert.equal(commands.length, specs.length);
  assert.ok(files.some((f) => f.path.endsWith("super-react-foundation.manifest.json")));
});
