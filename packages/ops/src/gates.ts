import type { Exec } from "./exec.ts";

export type GateName = "lint" | "types" | "test" | "audit";

export interface GateResult {
  name: GateName;
  ok: boolean;
  output: string;
}

export const ALL_GATES: readonly GateName[] = ["lint", "types", "test", "audit"];

const COMMANDS: Record<GateName, [string, string[]]> = {
  lint: ["npx", ["eslint", "."]],
  types: ["npx", ["tsc", "--noEmit"]],
  test: ["npx", ["vitest", "run", "--passWithNoTests"]],
  audit: ["npm", ["audit", "--audit-level=high"]],
};

export function isGateName(value: string): value is GateName {
  return (ALL_GATES as readonly string[]).includes(value);
}

export async function runGate(
  name: GateName,
  opts: { cwd: string; exec: Exec },
): Promise<GateResult> {
  const [cmd, args] = COMMANDS[name];
  const result = await opts.exec(cmd, args, { cwd: opts.cwd });
  return { name, ok: result.code === 0, output: (result.stdout + result.stderr).trim() };
}

export async function runGates(
  names: readonly GateName[],
  opts: { cwd: string; exec: Exec },
): Promise<GateResult[]> {
  const results: GateResult[] = [];
  for (const name of names) {
    results.push(await runGate(name, opts));
  }
  return results;
}

export function resolveGateNames(args: readonly string[]): GateName[] {
  if (args.length === 0 || args.includes("all")) return [...ALL_GATES];
  const names: GateName[] = [];
  for (const arg of args) {
    if (!isGateName(arg)) {
      throw new Error(`Unknown gate "${arg}". Valid: ${ALL_GATES.join(", ")}, all.`);
    }
    if (!names.includes(arg)) names.push(arg);
  }
  return names;
}
