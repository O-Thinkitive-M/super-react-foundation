import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export const FOUNDATION_DOCS_ROOT = join(here, "..", "docs");

export function foundationDocsRoot(): string {
  return FOUNDATION_DOCS_ROOT;
}

export function listFoundationDocs(): string[] {
  return readdirSync(FOUNDATION_DOCS_ROOT)
    .filter((f) => f.endsWith(".md"))
    .sort();
}
