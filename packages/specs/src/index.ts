import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseSpec } from "@super-react/core";
import type { CommandSpec } from "@super-react/core";

const here = dirname(fileURLToPath(import.meta.url));
export const SPECS_DIR = join(here, "..", "definitions");

export function loadSpecs(): CommandSpec[] {
  return readdirSync(SPECS_DIR)
    .filter((file) => file.endsWith(".spec.md"))
    .sort()
    .map((file) => parseSpec(readFileSync(join(SPECS_DIR, file), "utf8")));
}
