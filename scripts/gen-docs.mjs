import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadSpecs } from "@super-react/specs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(repo, "docs", "commands");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const spec of loadSpecs()) {
  const front = `# /${spec.id}\n\n- **Phase:** ${spec.phase}\n- **Requires foundation:** ${spec.requiresFoundation}\n- **Next:** ${spec.nextSuggested ? "/" + spec.nextSuggested : "—"}\n\n`;
  writeFileSync(join(outDir, `${spec.id}.md`), front + spec.body + "\n", "utf8");
}
console.log(`super-react: wrote ${loadSpecs().length} command docs.`);
