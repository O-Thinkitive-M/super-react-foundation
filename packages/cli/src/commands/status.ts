import { readState, stateExists } from "@super-react/core";
import { renderDashboard } from "../dashboard.ts";

export function runStatus(opts: { projectRoot: string }): number {
  if (!stateExists(opts.projectRoot)) {
    console.error('super-react is not initialized here. Run "super-react init" first.');
    return 1;
  }
  console.log(renderDashboard(readState(opts.projectRoot)));
  return 0;
}
