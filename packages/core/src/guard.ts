import type { ProjectState } from "./types.ts";

export interface GuardOptions {
  requiresFoundation?: boolean;
}

export interface GuardResult {
  ok: boolean;
  exitCode: number;
  message: string;
}

export function evaluateGuard(state: ProjectState, opts: GuardOptions): GuardResult {
  if (opts.requiresFoundation && !state.foundation.complete) {
    return {
      ok: false,
      exitCode: 1,
      message:
        "Project Foundation Not Found.\n" +
        "You must complete /setup-project-foundation before implementing features.",
    };
  }
  return { ok: true, exitCode: 0, message: "OK" };
}
