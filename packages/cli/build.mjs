import { build } from "esbuild";
import { cpSync, rmSync, mkdirSync, chmodSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));         // packages/cli
const repo = join(root, "..", "..");

rmSync(join(root, "dist"), { recursive: true, force: true });
mkdirSync(join(root, "dist"), { recursive: true });

await build({
  entryPoints: [join(root, "src", "cli.ts")],
  outfile: join(root, "dist", "cli.js"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  // esbuild preserves the shebang from the entry file automatically
  // bundle everything (workspace deps + yaml) -> self-contained, zero runtime deps
});
chmodSync(join(root, "dist", "cli.js"), 0o755);

// Ship the data dirs adjacent to dist so the loaders' join(here,"..",<dir>) resolves:
// here === packages/cli/dist  ->  ../files | ../definitions | ../docs
cpSync(join(repo, "packages", "templates", "files"), join(root, "files"), { recursive: true });
cpSync(join(repo, "packages", "specs", "definitions"), join(root, "definitions"), { recursive: true });
cpSync(join(repo, "packages", "foundation-docs", "docs"), join(root, "docs"), { recursive: true });

console.log("super-react: build complete (dist/cli.js + data dirs).");
