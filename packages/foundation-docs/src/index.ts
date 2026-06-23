import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export const FOUNDATION_DOCS_ROOT = join(here, "..", "docs");

export type StateLib = "redux" | "zustand";
export const DEFAULT_STATE_LIB: StateLib = "redux";

/** The doc emitted at project-setup/state-management.md is chosen by library. */
const STATE_MANAGEMENT_DOC = "state-management.md";

export function foundationDocsRoot(): string {
  return FOUNDATION_DOCS_ROOT;
}

/** The source file backing the state-management doc for the chosen library. */
export function stateManagementSource(lib: StateLib): string {
  return `state-management.${lib}.md`;
}

/**
 * Foundation outlines, mapped from their source filename to the destination
 * filename written under project-setup/. Every project gets the *same* set of
 * docs; only the state-management source varies by the chosen library, so it is
 * always written as the canonical `state-management.md`.
 */
export function listFoundationDocs(
  lib: StateLib = DEFAULT_STATE_LIB,
): Array<{ source: string; dest: string }> {
  const out: Array<{ source: string; dest: string }> = [];
  for (const f of readdirSync(FOUNDATION_DOCS_ROOT).sort()) {
    if (!f.endsWith(".md")) continue;
    if (f.startsWith("state-management.")) continue; // handled explicitly below
    out.push({ source: f, dest: f });
  }
  out.push({ source: stateManagementSource(lib), dest: STATE_MANAGEMENT_DOC });
  return out.sort((a, b) => a.dest.localeCompare(b.dest));
}
