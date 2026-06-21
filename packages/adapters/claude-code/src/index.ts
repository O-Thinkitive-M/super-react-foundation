import { join } from "node:path";
import type { AgentAdapter, CommandSpec, EmittedFile } from "@super-react/core";

function renderSkill(spec: CommandSpec): string {
  const guard = spec.requiresFoundation
    ? "> **Before doing anything, run `super-react guard --requires-foundation`. " +
      "If it exits non-zero, stop and show its message to the user.**\n\n"
    : "";
  const next = spec.nextSuggested
    ? `\n\n---\n**Recommended next step:** \`/${spec.nextSuggested}\`\n`
    : "\n";
  return (
    `---\n` +
    `name: super-react-${spec.id}\n` +
    `description: ${spec.title}\n` +
    `---\n\n` +
    `${guard}${spec.body}${next}`
  );
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
