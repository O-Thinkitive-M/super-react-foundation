import { scaffoldFoundation } from "@super-react/ops";
import { readState } from "@super-react/core";
import { renderDashboard } from "../dashboard.ts";

export async function runScaffold(opts: {
  projectRoot: string;
  noInstall: boolean;
  force: boolean;
}): Promise<number> {
  const install = opts.noInstall ? async (): Promise<void> => {} : undefined;
  const result = await scaffoldFoundation({
    projectRoot: opts.projectRoot,
    force: opts.force,
    install,
  });
  console.log(
    `super-react: foundation scaffolded (${result.filesWritten.length} written, ${result.filesSkipped.length} skipped).`,
  );
  console.log(renderDashboard(readState(opts.projectRoot)));
  return 0;
}
