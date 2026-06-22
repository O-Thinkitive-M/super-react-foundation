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

test("sync removes orphaned managed commands and writes the current pack", () => {
  const root = tempRoot();
  const commandsDir = join(root, ".claude", "commands");
  mkdirSync(commandsDir, { recursive: true });
  const orphan = join(commandsDir, "old-removed.md");
  writeFileSync(orphan, "---\n---\n<!-- managed by super-react-foundation -->\nstale\n", "utf8");

  assert.equal(runSync({ projectRoot: root }), 0);

  assert.equal(existsSync(orphan), false);
  assert.ok(existsSync(join(commandsDir, "project-status.md")));
});

test("sync migrates away the legacy 0.1.0 skills directory", () => {
  const root = tempRoot();
  const legacyDir = join(root, ".claude", "skills", "super-react-foundation-old-removed");
  mkdirSync(legacyDir, { recursive: true });
  writeFileSync(join(legacyDir, "SKILL.md"), "stale", "utf8");

  runSync({ projectRoot: root });

  assert.equal(existsSync(legacyDir), false);
});

test("sync does not touch the user's own commands or skills", () => {
  const root = tempRoot();
  const userCmd = join(root, ".claude", "commands", "my-own.md");
  mkdirSync(join(root, ".claude", "commands"), { recursive: true });
  writeFileSync(userCmd, "# my own command, no marker\n", "utf8");
  const userSkill = join(root, ".claude", "skills", "my-own-skill");
  mkdirSync(userSkill, { recursive: true });
  writeFileSync(join(userSkill, "SKILL.md"), "mine", "utf8");

  runSync({ projectRoot: root });

  assert.ok(existsSync(userCmd));
  assert.ok(existsSync(join(userSkill, "SKILL.md")));
});
