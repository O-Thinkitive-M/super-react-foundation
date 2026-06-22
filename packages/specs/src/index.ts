import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseSpec } from "@super-react-foundation/core";
import type { CommandSpec } from "@super-react-foundation/core";

const here = dirname(fileURLToPath(import.meta.url));
export const SPECS_DIR = join(here, "..", "definitions");

export function loadSpecsFrom(dir: string): CommandSpec[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".spec.md"))
    .sort()
    .map((file) => {
      try {
        return parseSpec(readFileSync(join(dir, file), "utf8"));
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        throw new Error(`Failed to parse spec "${file}": ${message}`, { cause });
      }
    });
}

export function loadSpecs(): CommandSpec[] {
  return loadSpecsFrom(SPECS_DIR);
}
