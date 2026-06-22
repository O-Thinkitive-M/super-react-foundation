import { readState, stateExists } from "@super-react-foundation/core";
import { renderDashboard } from "../dashboard.ts";

export function runStatus(opts: { projectRoot: string }): number {
  if (!stateExists(opts.projectRoot)) {
    console.error('super-react-foundation is not initialized here. Run "super-react-foundation init" first.');
    return 1;
  }
  console.log(renderDashboard(readState(opts.projectRoot)));
  return 0;
}
