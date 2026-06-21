import { type Exec, nodeExec, resolveGateNames, runGates } from "@super-react/ops";

export async function runGateCommand(opts: {
  projectRoot: string;
  gateArgs: string[];
  exec?: Exec;
}): Promise<number> {
  const exec = opts.exec ?? nodeExec;
  const results = await runGates(resolveGateNames(opts.gateArgs), {
    cwd: opts.projectRoot,
    exec,
  });
  let allOk = true;
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}`);
    if (!r.ok) {
      allOk = false;
      if (r.output) console.error(r.output);
    }
  }
  return allOk ? 0 : 1;
}
