import { compile } from "@super-react-foundation/compiler";
import { claudeCodeAdapter } from "@super-react-foundation/adapter-claude-code";
import { loadSpecs } from "@super-react-foundation/specs";
import { cleanOwned, writeEmitted } from "../write.ts";

export function runSync(opts: { projectRoot: string }): number {
  cleanOwned(opts.projectRoot);
  writeEmitted(opts.projectRoot, compile(loadSpecs(), claudeCodeAdapter));
  console.log("super-react-foundation: prompt pack re-compiled.");
  return 0;
}
