import { createInterface } from "node:readline/promises";
import { scaffoldFoundation } from "@super-react-foundation/ops";
import { readState } from "@super-react-foundation/core";
import { DEFAULT_STATE_LIB, type StateLib } from "@super-react-foundation/foundation-docs";
import { renderDashboard } from "../dashboard.ts";

/**
 * Resolve the state-management library. Precedence:
 *   1. explicit --state flag,
 *   2. interactive prompt (when stdin is a TTY),
 *   3. default (redux).
 */
async function resolveStateLib(flag: string | undefined): Promise<StateLib> {
  if (flag === "redux" || flag === "zustand") return flag;
  if (flag !== undefined) {
    throw new Error(`Unknown --state value "${flag}". Use "redux" or "zustand".`);
  }
  if (!process.stdin.isTTY) return DEFAULT_STATE_LIB;

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (
      await rl.question("State management — Redux or Zustand? [redux]: ")
    )
      .trim()
      .toLowerCase();
    if (answer === "" || answer === "redux" || answer === "r") return "redux";
    if (answer === "zustand" || answer === "z") return "zustand";
    console.log(`Unrecognized choice "${answer}"; defaulting to ${DEFAULT_STATE_LIB}.`);
    return DEFAULT_STATE_LIB;
  } finally {
    rl.close();
  }
}

export async function runScaffold(opts: {
  projectRoot: string;
  noInstall: boolean;
  force: boolean;
  state?: string;
}): Promise<number> {
  const stateLib = await resolveStateLib(opts.state);
  const install = opts.noInstall ? async (): Promise<void> => {} : undefined;
  const result = await scaffoldFoundation({
    projectRoot: opts.projectRoot,
    force: opts.force,
    install,
    stateLib,
  });
  console.log(
    `super-react-foundation: foundation scaffolded with ${result.stateLib} ` +
      `(${result.filesWritten.length} written, ${result.filesSkipped.length} skipped).`,
  );
  console.log(renderDashboard(readState(opts.projectRoot)));
  return 0;
}
