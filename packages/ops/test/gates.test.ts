import { test } from "node:test";
import assert from "node:assert/strict";
import type { Exec } from "@super-react-foundation/ops";
import { runGate, runGates, resolveGateNames, ALL_GATES } from "@super-react-foundation/ops";

function fakeExec(code: number, stdout = "", stderr = ""): Exec {
  return async () => ({ code, stdout, stderr });
}
function recordingExec(code: number): { exec: Exec; calls: string[][] } {
  const calls: string[][] = [];
  const exec: Exec = async (cmd, args) => {
    calls.push([cmd, ...args]);
    return { code, stdout: "", stderr: "" };
  };
  return { exec, calls };
}

test("runGate reports ok on exit 0 and merges output", async () => {
  const r = await runGate("lint", { cwd: "/x", exec: fakeExec(0, "clean") });
  assert.equal(r.name, "lint");
  assert.equal(r.ok, true);
  assert.equal(r.output, "clean");
});

test("runGate reports failure and captures stderr on non-zero exit", async () => {
  const r = await runGate("types", { cwd: "/x", exec: fakeExec(2, "", "TS error") });
  assert.equal(r.ok, false);
  assert.match(r.output, /TS error/);
});

test("runGates('all') runs every gate", async () => {
  const { exec, calls } = recordingExec(0);
  const results = await runGates(resolveGateNames(["all"]), { cwd: "/x", exec });
  assert.equal(results.length, ALL_GATES.length);
  assert.equal(calls.length, ALL_GATES.length);
});

test("resolveGateNames defaults to all, dedupes, and rejects unknown", () => {
  assert.deepEqual(resolveGateNames([]), [...ALL_GATES]);
  assert.deepEqual(resolveGateNames(["lint", "lint"]), ["lint"]);
  assert.throws(() => resolveGateNames(["bogus"]), /Unknown gate/);
});

test("each gate maps to its expected command", async () => {
  const seen: Record<string, string[]> = {};
  const exec: Exec = async (cmd, args) => {
    seen[args[0] ?? cmd] = [cmd, ...args];
    return { code: 0, stdout: "", stderr: "" };
  };
  await runGates(["lint", "types", "test", "audit"], { cwd: "/x", exec });
  assert.deepEqual(seen["eslint"], ["npx", "eslint", "."]);
  assert.deepEqual(seen["tsc"], ["npx", "tsc", "--noEmit"]);
  assert.deepEqual(seen["vitest"], ["npx", "vitest", "run", "--passWithNoTests"]);
  assert.deepEqual(seen["audit"], ["npm", "audit", "--audit-level=high"]);
});
