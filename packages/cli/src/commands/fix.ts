import { type Exec, nodeExec, runFix } from "@super-react/ops";

export async function runFixCommand(opts: {
  projectRoot: string;
  exec?: Exec;
}): Promise<number> {
  const result = await runFix({ cwd: opts.projectRoot, exec: opts.exec ?? nodeExec });
  console.log(result.output || "super-react: fix complete.");
  return result.ok ? 0 : 1;
}
