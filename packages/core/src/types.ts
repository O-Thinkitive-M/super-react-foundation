export type Phase =
  | "analyze"
  | "foundation"
  | "feature"
  | "integrate"
  | "quality"
  | "status";

export interface CommandSpec {
  id: string;
  title: string;
  phase: Phase;
  requiresFoundation: boolean;
  inputs: string[];
  produces: string[];
  cliOps: string[];
  nextSuggested: string | null;
  body: string;
}

export interface FeatureState {
  plan: boolean;
  ui: boolean;
  api: boolean;
  tests: boolean;
  reviewed: boolean;
}

export interface FoundationState {
  complete: boolean;
  completedAt: string | null;
  templateHash: string | null;
}

export interface ProjectState {
  version: 1;
  agent: string;
  phase: Phase;
  foundation: FoundationState;
  features: Record<string, FeatureState>;
  integrations: Record<string, string>;
}

export interface EmittedFile {
  /** Path relative to the project root. */
  path: string;
  contents: string;
}

export interface AgentAdapter {
  id: string;
  /** Absolute directory this adapter owns (reserved for future stale-file cleanup on sync; not yet used). */
  outDir(projectRoot: string): string;
  emitCommand(spec: CommandSpec): EmittedFile[];
  emitManifest(specs: CommandSpec[]): EmittedFile[];
}
