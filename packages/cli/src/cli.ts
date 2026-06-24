#!/usr/bin/env node
import { parseArgs } from "node:util";
import { runInit } from "./commands/init.ts";
import { runSync } from "./commands/sync.ts";
import { runStatus } from "./commands/status.ts";
import { runGuard } from "./commands/guard.ts";
import { runScaffold } from "./commands/scaffold.ts";
import { runGateCommand } from "./commands/gate.ts";
import { runFixCommand } from "./commands/fix.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    agent: { type: "string", default: "claude-code" },
    "requires-foundation": { type: "boolean", default: false },
    cwd: { type: "string", default: process.cwd() },
    "no-install": { type: "boolean", default: false },
    force: { type: "boolean", default: false },
    state: { type: "string" },
    sdk: { type: "boolean", default: false },
  },
});

const projectRoot = values.cwd as string;
const command = positionals[0];

let code: number;
try {
  switch (command) {
    case "init":
      code = runInit({ projectRoot, agent: values.agent as string });
      break;
    case "sync":
      code = runSync({ projectRoot });
      break;
    case "status":
      code = runStatus({ projectRoot });
      break;
    case "guard":
      code = runGuard({
        projectRoot,
        requiresFoundation: values["requires-foundation"] as boolean,
      });
      break;
    case "scaffold":
      code = await runScaffold({
        projectRoot,
        noInstall: values["no-install"] as boolean,
        force: values.force as boolean,
        state: values.state as string | undefined,
        sdk: values.sdk as boolean,
      });
      break;
    case "gate":
      code = await runGateCommand({ projectRoot, gateArgs: positionals.slice(1) });
      break;
    case "fix":
      code = await runFixCommand({ projectRoot });
      break;
    default:
      console.error(
        `Unknown command: ${command ?? "(none)"}\n` +
          "Usage: super-react-foundation <init|sync|status|guard|scaffold|gate|fix>",
      );
      code = 2;
  }
} catch (err) {
  console.error(`super-react-foundation: ${err instanceof Error ? err.message : String(err)}`);
  code = 1;
}
process.exit(code);
