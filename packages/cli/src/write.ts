import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { EmittedFile } from "@super-react-foundation/core";

export function writeEmitted(projectRoot: string, files: EmittedFile[]): void {
  for (const file of files) {
    const abs = join(projectRoot, file.path);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, file.contents, "utf8");
  }
}
