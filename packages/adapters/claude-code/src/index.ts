import { join } from "node:path";
import type { AgentAdapter, CommandSpec, EmittedFile } from "@super-react-foundation/core";
import { stringify as stringifyYaml } from "yaml";

/**
 * Marker written into every command file we own, so `sync`/`init` can safely
 * remove our managed commands without touching the user's own ones.
 */
export const MANAGED_MARKER = "<!-- managed by super-react-foundation -->";

function renderCommand(spec: CommandSpec): string {
  const next = spec.nextSuggested
    ? `\n\n---\n**Recommended next step:** \`/${spec.nextSuggested}\`\n`
    : "\n";
  // Claude Code derives the slash command name from the FILE name (`<id>.md`
  // -> `/<id>`), so the file is written unprefixed at `.claude/commands/`.
  const frontmatter = stringifyYaml({
    description: spec.title,
  });
  return `---\n${frontmatter}---\n${MANAGED_MARKER}\n\n${spec.body}${next}`;
}

export const claudeCodeAdapter: AgentAdapter = {
  id: "claude-code",
  outDir(projectRoot: string): string {
    return join(projectRoot, ".claude");
  },
  emitCommand(spec: CommandSpec): EmittedFile[] {
    return [
      {
        path: `.claude/commands/${spec.id}.md`,
        contents: renderCommand(spec),
      },
    ];
  },
  emitManifest(specs: CommandSpec[]): EmittedFile[] {
    const manifest = {
      name: "super-react-foundation",
      version: 1,
      commands: specs.map((s) => ({
        id: s.id,
        title: s.title,
        phase: s.phase,
        requiresFoundation: s.requiresFoundation,
      })),
    };
    return [
      {
        path: ".claude/super-react-foundation.manifest.json",
        contents: JSON.stringify(manifest, null, 2) + "\n",
      },
    ];
  },
};
