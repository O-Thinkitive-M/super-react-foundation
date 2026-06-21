import { evaluateGuard, readState } from "@super-react/core";

export function runGuard(opts: { projectRoot: string; requiresFoundation: boolean }): number {
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
