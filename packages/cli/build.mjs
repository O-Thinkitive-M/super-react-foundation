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
// Clean each destination first so renamed/removed source files don't linger in
// the build output (and thus never get scaffolded into user projects).
for (const [src, destName] of [
  [join(repo, "packages", "templates", "files"), "files"],
  [join(repo, "packages", "specs", "definitions"), "definitions"],
  [join(repo, "packages", "foundation-docs", "docs"), "docs"],
]) {
  const dest = join(root, destName);
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
}

console.log("super-react-foundation: build complete (dist/cli.js + data dirs).");
