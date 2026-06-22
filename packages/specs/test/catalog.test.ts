import { test } from "node:test";
import assert from "node:assert/strict";
import { compile } from "@super-react/compiler";
import { claudeCodeAdapter } from "@super-react/adapter-claude-code";
import { loadSpecs } from "@super-react/specs";

const EXPECTED = [
  "analyze-project", "build-feature", "build-feature-api", "build-feature-ui",
  "connect-external-service", "create-feature-plan", "fix-project-issues",
  "generate-feature-tests", "project-status", "review-feature",
  "review-project-architecture", "setup-project-foundation",
  "update-feature", "update-feature-api", "update-feature-ui",
];

test("all 15 commands are present", () => {
  const ids = loadSpecs().map((s) => s.id).sort();
  assert.deepEqual(ids, [...EXPECTED].sort());
  assert.equal(ids.length, 15);
});

test("every foundation-required spec embeds the guard instruction", () => {
  for (const spec of loadSpecs()) {
    if (spec.requiresFoundation) {
      assert.match(spec.body, /super-react guard --requires-foundation/, `${spec.id} missing guard`);
    }
  }
});

test("every spec body has all beginner-friendly sections", () => {
  const sections = ["## Purpose", "## Why it exists", "## Steps", "## Example", "## Best Practices", "## Common Mistakes", "## Troubleshooting"];
  for (const spec of loadSpecs()) {
    for (const section of sections) {
      assert.ok(spec.body.includes(section), `${spec.id} missing "${section}"`);
    }
  }
});

test("the whole pack compiles to one SKILL.md per command plus a manifest", () => {
  const specs = loadSpecs();
  const files = compile(specs, claudeCodeAdapter);
  const skills = files.filter((f) => f.path.endsWith("SKILL.md"));
  assert.equal(skills.length, specs.length);
  assert.ok(files.some((f) => f.path.endsWith("super-react.manifest.json")));
});
