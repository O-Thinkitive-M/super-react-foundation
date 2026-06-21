import { compile } from "@super-react/compiler";
import { claudeCodeAdapter } from "@super-react/adapter-claude-code";
import { loadSpecs } from "@super-react/specs";
import { writeEmitted } from "../write.ts";

export function runSync(opts: { projectRoot: string }): number {
  writeEmitted(opts.projectRoot, compile(loadSpecs(), claudeCodeAdapter));
  console.log("super-react: prompt pack re-compiled.");
  return 0;
}
