import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { compile } from "@super-react/compiler";
import { claudeCodeAdapter } from "@super-react/adapter-claude-code";
import { loadSpecs } from "@super-react/specs";
import { writeEmitted } from "../write.ts";

function cleanOwnedSkills(projectRoot: string): void {
  const skillsDir = join(projectRoot, ".claude", "skills");
  if (!existsSync(skillsDir)) return;
  for (const entry of readdirSync(skillsDir)) {
    if (entry.startsWith("super-react-")) {
      rmSync(join(skillsDir, entry), { recursive: true, force: true });
    }
  }
}

export function runSync(opts: { projectRoot: string }): number {
  cleanOwnedSkills(opts.projectRoot);
  writeEmitted(opts.projectRoot, compile(loadSpecs(), claudeCodeAdapter));
  console.log("super-react: prompt pack re-compiled.");
  return 0;
}
