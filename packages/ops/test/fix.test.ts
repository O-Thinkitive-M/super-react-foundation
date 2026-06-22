import { test } from "node:test";
import assert from "node:assert/strict";
import type { Exec } from "@super-react-foundation/ops";
import { runFix } from "@super-react-foundation/ops";

function recordingExec(codes: number[]): { exec: Exec; calls: string[][] } {
  const calls: string[][] = [];
  let i = 0;
  const exec: Exec = async (cmd, args) => {
    calls.push([cmd, ...args]);
    const code = codes[i] ?? 0;
    i += 1;
    return { code, stdout: "", stderr: "" };
  };
  return { exec, calls };
}

test("runFix runs eslint --fix then prettier --write and reports ok when both pass", async () => {
  const { exec, calls } = recordingExec([0, 0]);
  const r = await runFix({ cwd: "/x", exec });
  assert.equal(r.ok, true);
  assert.deepEqual(calls[0], ["npx", "eslint", ".", "--fix"]);
  assert.deepEqual(calls[1], ["npx", "prettier", "--write", "."]);
});

test("runFix reports not-ok when either command fails", async () => {
  const { exec } = recordingExec([1, 0]);
  const r = await runFix({ cwd: "/x", exec });
  assert.equal(r.ok, false);
});
