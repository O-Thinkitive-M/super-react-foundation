import { evaluateGuard, readState, stateExists } from "@super-react/core";

export function runGuard(opts: { projectRoot: string; requiresFoundation: boolean }): number {
  if (!stateExists(opts.projectRoot)) {
    console.error('super-react is not initialized here. Run "super-react init" first.');
    return 1;
  }
  const result = evaluateGuard(readState(opts.projectRoot), {
    requiresFoundation: opts.requiresFoundation,
  });
  if (!result.ok) {
    console.error(result.message);
    return result.exitCode;
  }
  console.log(result.message);
  return 0;
}
