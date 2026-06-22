import { join } from "node:path";
import type { AgentAdapter, CommandSpec, EmittedFile } from "@super-react/core";
import { stringify as stringifyYaml } from "yaml";

function renderSkill(spec: CommandSpec): string {
  const next = spec.nextSuggested
    ? `\n\n---\n**Recommended next step:** \`/${spec.nextSuggested}\`\n`
    : "\n";
  const frontmatter = stringifyYaml({
    name: `super-react-${spec.id}`,
    description: spec.title,
  });
  return `---\n${frontmatter}---\n\n${spec.body}${next}`;
}

export const claudeCodeAdapter: AgentAdapter = {
  id: "claude-code",
  outDir(projectRoot: string): string {
    return join(projectRoot, ".claude");
  },
  emitCommand(spec: CommandSpec): EmittedFile[] {
    return [
      {
        path: `.claude/skills/super-react-${spec.id}/SKILL.md`,
        contents: renderSkill(spec),
      },
    ];
  },
  emitManifest(specs: CommandSpec[]): EmittedFile[] {
    const manifest = {
      name: "super-react",
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
        path: ".claude/super-react.manifest.json",
        contents: JSON.stringify(manifest, null, 2) + "\n",
      },
    ];
  },
};
