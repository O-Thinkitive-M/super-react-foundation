import { test, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Exec } from "@super-react/ops";
import { runInit } from "../src/commands/init.ts";
import { runScaffold } from "../src/commands/scaffold.ts";
import { runGuard } from "../src/commands/guard.ts";
import { runGateCommand } from "../src/commands/gate.ts";

const roots: string[] = [];
function tempRoot(): string {
  const r = mkdtempSync(join(tmpdir(), "sr-scaffold-cli-"));
  roots.push(r);
  return r;
}
after(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

test("scaffold (no-install) stands up the foundation and unlocks the guard", async () => {
  const root = tempRoot();
  runInit({ projectRoot: root, agent: "claude-code" });
  assert.equal(runGuard({ projectRoot: root, requiresFoundation: true }), 1);
  const code = await runScaffold({ projectRoot: root, noInstall: true, force: false });
  assert.equal(code, 0);
  assert.ok(existsSync(join(root, "package.json")));
  assert.ok(existsSync(join(root, "FOUNDATION_COMPLETE.md")));
  assert.equal(runGuard({ projectRoot: root, requiresFoundation: true }), 0);
});

test("gate command returns 0 when all gates pass and 1 when one fails", async () => {
  const root = tempRoot();
  const passing: Exec = async () => ({ code: 0, stdout: "", stderr: "" });
  assert.equal(await runGateCommand({ projectRoot: root, gateArgs: ["all"], exec: passing }), 0);
  const failing: Exec = async (_cmd, args) => ({
    code: args.includes("tsc") ? 2 : 0,
    stdout: "",
    stderr: "boom",
  });
  assert.equal(await runGateCommand({ projectRoot: root, gateArgs: ["all"], exec: failing }), 1);
});
