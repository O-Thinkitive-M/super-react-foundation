import { spawn } from "node:child_process";

export interface ExecResult {
  code: number;
  stdout: string;
  stderr: string;
}

export type Exec = (
  cmd: string,
  args: string[],
  opts: { cwd: string },
) => Promise<ExecResult>;

export const nodeExec: Exec = (cmd, args, opts) =>
  new Promise<ExecResult>((resolve) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, shell: false });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    child.on("error", (err: Error) =>
      resolve({ code: 1, stdout, stderr: stderr + String(err) }),
    );
    child.on("close", (code: number | null) =>
      resolve({ code: code ?? 1, stdout, stderr }),
    );
  });
