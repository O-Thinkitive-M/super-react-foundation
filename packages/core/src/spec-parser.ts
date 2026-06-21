import { parse as parseYaml } from "yaml";
import type { CommandSpec, Phase } from "./types.ts";

const PHASES: readonly Phase[] = [
  "analyze",
  "foundation",
  "feature",
  "integrate",
  "quality",
  "status",
];

interface Frontmatter {
  frontmatter: string;
  body: string;
}

function extractFrontmatter(raw: string): Frontmatter {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  if (lines[0] !== "---") {
    throw new Error("Spec is missing YAML frontmatter (must start with '---').");
  }
  let close = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      close = i;
      break;
    }
  }
  if (close === -1) {
    throw new Error("Spec frontmatter is not terminated with '---'.");
  }
  return {
    frontmatter: lines.slice(1, close).join("\n"),
    body: lines.slice(close + 1).join("\n").trim(),
  };
}

function requireString(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Spec is missing required string field "${key}".`);
  }
  return value;
}

function toStringArray(value: unknown, key: string): string[] {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`Expected a list for field "${key}" in spec frontmatter.`);
  }
  return value.map((v) => String(v));
}

export function parseSpec(raw: string): CommandSpec {
  const { frontmatter, body } = extractFrontmatter(raw);
  const data = (parseYaml(frontmatter) ?? {}) as Record<string, unknown>;

  const id = requireString(data, "id");
  const title = requireString(data, "title");
  const phase = requireString(data, "phase");
  if (!PHASES.includes(phase as Phase)) {
    throw new Error(
      `Invalid phase "${phase}" in spec "${id}". Must be one of: ${PHASES.join(", ")}.`,
    );
  }

  return {
    id,
    title,
    phase: phase as Phase,
    requiresFoundation: data.requiresFoundation === true,
    inputs: toStringArray(data.inputs, "inputs"),
    produces: toStringArray(data.produces, "produces"),
    cliOps: toStringArray(data.cliOps, "cliOps"),
    nextSuggested:
      data.nextSuggested == null ? null : String(data.nextSuggested),
    body,
  };
}
