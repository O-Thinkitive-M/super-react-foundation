import { compile } from "@super-react-foundation/compiler";
import { claudeCodeAdapter } from "@super-react-foundation/adapter-claude-code";
import { loadSpecs } from "@super-react-foundation/specs";
import { defaultState, readState, stateExists, writeState } from "@super-react-foundation/core";
import { writeEmitted } from "../write.ts";
import { renderDashboard } from "../dashboard.ts";

export function runInit(opts: { projectRoot: string; agent: string }): number {
  const specs = loadSpecs();
  const files = compile(specs, claudeCodeAdapter);
  writeEmitted(opts.projectRoot, files);
  if (!stateExists(opts.projectRoot)) {
    writeState(opts.projectRoot, defaultState(opts.agent));
  }
  console.log(renderDashboard(readState(opts.projectRoot)));
  return 0;
}
