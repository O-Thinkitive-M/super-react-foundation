import type { Exec } from "./exec.ts";

export interface FixResult {
  ok: boolean;
  output: string;
}

export async function runFix(opts: { cwd: string; exec: Exec }): Promise<FixResult> {
  const lint = await opts.exec("npx", ["eslint", ".", "--fix"], { cwd: opts.cwd });
  const format = await opts.exec("npx", ["prettier", "--write", "."], { cwd: opts.cwd });
  return {
    ok: lint.code === 0 && format.code === 0,
    output: [lint.stdout, lint.stderr, format.stdout, format.stderr].join("\n").trim(),
  };
}
