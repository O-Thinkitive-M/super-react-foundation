import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { readState, stateExists, writeState } from "@super-react/core";
import { listTemplateFiles, templateRoot } from "@super-react/templates";
import { foundationDocsRoot, listFoundationDocs } from "@super-react/foundation-docs";
import { nodeExec, type Exec } from "./exec.ts";

export interface ScaffoldOptions {
  projectRoot: string;
  install?: (projectRoot: string) => Promise<void>;
  force?: boolean;
}

export interface ScaffoldResult {
  filesWritten: string[];
  filesSkipped: string[];
  templateHash: string;
}

export async function defaultInstall(projectRoot: string, exec: Exec = nodeExec): Promise<void> {
  const result = await exec("pnpm", ["install"], { cwd: projectRoot });
  if (result.code !== 0) {
    throw new Error(`Dependency install failed:\n${result.stderr || result.stdout}`);
  }
}

export async function scaffoldFoundation(opts: ScaffoldOptions): Promise<ScaffoldResult> {
  const { projectRoot, force = false } = opts;

  if (!stateExists(projectRoot)) {
    throw new Error('super-react is not initialized here. Run "super-react init" first.');
  }
  const state = readState(projectRoot);
  if (state.foundation.complete && !force) {
    throw new Error("Project foundation is already set up. Use --force to re-scaffold.");
  }

  const root = templateRoot();
  const files = listTemplateFiles();
  const filesWritten: string[] = [];
  const filesSkipped: string[] = [];
  const hash = createHash("sha256");

  for (const rel of files) {
    const contents = readFileSync(join(root, rel));
    hash.update(rel + "\0");
    hash.update(contents);
    const dest = join(projectRoot, rel);
    if (existsSync(dest) && !force) {
      filesSkipped.push(rel);
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(join(root, rel), dest);
    filesWritten.push(rel);
  }

  const templateHash = hash.digest("hex");

  // Seed project-setup/ skeletons from the foundation-docs outlines (skip existing).
  const docsRoot = foundationDocsRoot();
  for (const docName of listFoundationDocs()) {
    const dest = join(projectRoot, "project-setup", docName);
    if (!existsSync(dest)) {
      mkdirSync(join(projectRoot, "project-setup"), { recursive: true });
      copyFileSync(join(docsRoot, docName), dest);
    }
  }

  const install = opts.install ?? ((root) => defaultInstall(root));
  await install(projectRoot);

  writeFileSync(join(projectRoot, "FOUNDATION_COMPLETE.md"), foundationDoc(templateHash), "utf8");

  state.foundation = {
    complete: true,
    completedAt: new Date().toISOString(),
    templateHash,
  };
  state.phase = "feature";
  writeState(projectRoot, state);

  return { filesWritten, filesSkipped, templateHash };
}

function foundationDoc(hash: string): string {
  return [
    "# Project Foundation Complete",
    "",
    "- Architecture Ready",
    "- Routing Ready",
    "- State Management Ready",
    "- Testing Ready",
    "",
    "Feature development is unlocked.",
    "",
    `Template hash: \`${hash}\``,
    "",
  ].join("\n");
}
