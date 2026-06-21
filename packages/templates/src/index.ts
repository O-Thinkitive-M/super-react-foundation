import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export const TEMPLATE_ROOT = join(here, "..", "files");

export function templateRoot(): string {
  return TEMPLATE_ROOT;
}

export function listTemplateFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry);
      if (statSync(abs).isDirectory()) walk(abs);
      else out.push(relative(TEMPLATE_ROOT, abs));
    }
  };
  walk(TEMPLATE_ROOT);
  return out.sort();
}
