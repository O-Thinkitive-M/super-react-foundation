import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ProjectState } from "./types.ts";

export const STATE_DIR = ".super-react-foundation";
export const STATE_FILE = "state.json";

export function statePath(projectRoot: string): string {
  return join(projectRoot, STATE_DIR, STATE_FILE);
}

export function defaultState(agent: string): ProjectState {
  return {
    version: 1,
    agent,
    phase: "analyze",
    foundation: { complete: false, completedAt: null, templateHash: null },
    features: {},
    integrations: {},
  };
}

export function stateExists(projectRoot: string): boolean {
  return existsSync(statePath(projectRoot));
}

export function readState(projectRoot: string): ProjectState {
  const path = statePath(projectRoot);
  if (!stateExists(projectRoot)) {
    throw new Error(
      `super-react-foundation state not found at ${path}. Run "super-react-foundation init" first.`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (cause) {
    throw new Error(`super-react-foundation state at ${path} is not valid JSON.`, { cause });
  }
  const state = parsed as ProjectState;
  if (state?.version !== 1) {
    const found = (state as { version?: unknown })?.version;
    throw new Error(
      `super-react-foundation state at ${path} has unsupported version ${String(found)} (expected 1).`,
    );
  }
  return state;
}

export function writeState(projectRoot: string, state: ProjectState): void {
  mkdirSync(join(projectRoot, STATE_DIR), { recursive: true });
  writeFileSync(statePath(projectRoot), JSON.stringify(state, null, 2) + "\n", "utf8");
}
