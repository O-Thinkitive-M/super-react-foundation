import { test, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runSync } from "../src/commands/sync.ts";

const roots: string[] = [];
function tempRoot(): string {
  const r = mkdtempSync(join(tmpdir(), "sr-sync-"));
  roots.push(r);
  return r;
}
after(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

test("sync removes orphaned super-react skills and writes the current pack", () => {
  const root = tempRoot();
  const orphanDir = join(root, ".claude", "skills", "super-react-old-removed");
  mkdirSync(orphanDir, { recursive: true });
  writeFileSync(join(orphanDir, "SKILL.md"), "stale", "utf8");

  assert.equal(runSync({ projectRoot: root }), 0);

  assert.equal(existsSync(orphanDir), false);
  assert.ok(existsSync(join(root, ".claude", "skills", "super-react-project-status", "SKILL.md")));
});

test("sync does not touch non-super-react skills", () => {
  const root = tempRoot();
  const userDir = join(root, ".claude", "skills", "my-own-skill");
  mkdirSync(userDir, { recursive: true });
  writeFileSync(join(userDir, "SKILL.md"), "mine", "utf8");

  runSync({ projectRoot: root });

  assert.ok(existsSync(join(userDir, "SKILL.md")));
});
