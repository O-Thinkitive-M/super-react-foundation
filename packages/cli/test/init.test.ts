import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInit } from "../src/commands/init.ts";
import { runGuard } from "../src/commands/guard.ts";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "sr-init-"));
}

test("init installs the prompt pack and writes state", () => {
  const root = tempRoot();
  const code = runInit({ projectRoot: root, agent: "claude-code" });
  assert.equal(code, 0);
  assert.ok(existsSync(join(root, ".super-react", "state.json")));
  assert.ok(existsSync(join(root, ".claude", "skills", "super-react-project-status", "SKILL.md")));
  assert.ok(existsSync(join(root, ".claude", "super-react.manifest.json")));
  const skill = readFileSync(
    join(root, ".claude", "skills", "super-react-build-feature", "SKILL.md"),
    "utf8",
  );
  assert.match(skill, /super-react guard --requires-foundation/);
});

test("guard blocks feature work right after init (foundation incomplete)", () => {
  const root = tempRoot();
  runInit({ projectRoot: root, agent: "claude-code" });
  const code = runGuard({ projectRoot: root, requiresFoundation: true });
  assert.equal(code, 1);
});
