import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { EmittedFile } from "@super-react-foundation/core";
import { MANAGED_MARKER } from "@super-react-foundation/adapter-claude-code";

export function writeEmitted(projectRoot: string, files: EmittedFile[]): void {
  for (const file of files) {
    const abs = join(projectRoot, file.path);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, file.contents, "utf8");
  }
}

/**
 * Remove the command files super-react-foundation previously installed (those
 * carrying {@link MANAGED_MARKER}) so renamed/removed commands don't linger,
 * and migrate away the legacy `.claude/skills/super-react-foundation-*` dirs
 * shipped by 0.1.0. User-authored commands and skills are left untouched.
 */
export function cleanOwned(projectRoot: string): void {
  const commandsDir = join(projectRoot, ".claude", "commands");
  if (existsSync(commandsDir)) {
    for (const entry of readdirSync(commandsDir)) {
      if (!entry.endsWith(".md")) continue;
      const file = join(commandsDir, entry);
      if (readFileSync(file, "utf8").includes(MANAGED_MARKER)) {
        rmSync(file, { force: true });
      }
    }
  }
  const legacySkillsDir = join(projectRoot, ".claude", "skills");
  if (existsSync(legacySkillsDir)) {
    for (const entry of readdirSync(legacySkillsDir)) {
      if (entry.startsWith("super-react-foundation-")) {
        rmSync(join(legacySkillsDir, entry), { recursive: true, force: true });
      }
    }
  }
}
