import type { AgentAdapter, CommandSpec, EmittedFile } from "@super-react-foundation/core";

export function compile(specs: CommandSpec[], adapter: AgentAdapter): EmittedFile[] {
  const files: EmittedFile[] = [];
  for (const spec of specs) {
    files.push(...adapter.emitCommand(spec));
  }
  files.push(...adapter.emitManifest(specs));
  return files;
}
