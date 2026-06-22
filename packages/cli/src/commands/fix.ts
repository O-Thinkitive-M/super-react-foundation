import { type Exec, nodeExec, runFix } from "@super-react-foundation/ops";

export async function runFixCommand(opts: {
  projectRoot: string;
  exec?: Exec;
}): Promise<number> {
  const result = await runFix({ cwd: opts.projectRoot, exec: opts.exec ?? nodeExec });
  console.log(result.output || "super-react-foundation: fix complete.");
  return result.ok ? 0 : 1;
}
