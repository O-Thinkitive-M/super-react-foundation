import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { readState, stateExists, writeState } from "@super-react-foundation/core";
import { listTemplateFiles, templateRoot } from "@super-react-foundation/templates";
import {
  DEFAULT_STATE_LIB,
  foundationDocsRoot,
  listFoundationDocs,
  type StateLib,
} from "@super-react-foundation/foundation-docs";
import { nodeExec, type Exec } from "./exec.ts";

/** npm deps added to the scaffolded app for each state-management library. */
const STATE_LIB_DEPS: Record<StateLib, Record<string, string>> = {
  redux: {
    "@reduxjs/toolkit": "2.5.0",
    "react-redux": "9.2.0",
  },
  zustand: {
    zustand: "5.0.14",
  },
};

export interface ScaffoldOptions {
  projectRoot: string;
  install?: (projectRoot: string) => Promise<void>;
  force?: boolean;
  /** Client-state library to wire up. Defaults to {@link DEFAULT_STATE_LIB} (redux). */
  stateLib?: StateLib;
}

export interface ScaffoldResult {
  filesWritten: string[];
  filesSkipped: string[];
  templateHash: string;
  stateLib: StateLib;
}

export async function defaultInstall(projectRoot: string, exec: Exec = nodeExec): Promise<void> {
  const result = await exec("pnpm", ["install"], { cwd: projectRoot });
  if (result.code !== 0) {
    throw new Error(`Dependency install failed:\n${result.stderr || result.stdout}`);
  }
}

export async function scaffoldFoundation(opts: ScaffoldOptions): Promise<ScaffoldResult> {
  const { projectRoot, force = false, stateLib = DEFAULT_STATE_LIB } = opts;

  if (!stateExists(projectRoot)) {
    throw new Error('super-react-foundation is not initialized here. Run "super-react-foundation init" first.');
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
  // The chosen library is part of what makes a scaffold reproducible.
  hash.update("state-lib:" + stateLib + "\0");

  for (const rel of files) {
    // The app package.json gets the chosen state library's deps injected so the
    // foundation is never tied to a single library at the template level.
    const contents =
      rel === "package.json"
        ? Buffer.from(withStateLibDeps(readFileSync(join(root, rel), "utf8"), stateLib), "utf8")
        : readFileSync(join(root, rel));
    hash.update(rel + "\0");
    hash.update(contents);
    const dest = join(projectRoot, rel);
    if (existsSync(dest) && !force) {
      filesSkipped.push(rel);
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, contents);
    filesWritten.push(rel);
  }

  const templateHash = hash.digest("hex");

  // Seed project-setup/ from the foundation-docs outlines (skip existing). Every
  // project gets the same set of docs; only the state-management source varies.
  const docsRoot = foundationDocsRoot();
  for (const { source, dest: destName } of listFoundationDocs(stateLib)) {
    const dest = join(projectRoot, "project-setup", destName);
    if (!existsSync(dest)) {
      mkdirSync(join(projectRoot, "project-setup"), { recursive: true });
      copyFileSync(join(docsRoot, source), dest);
    }
  }

  const install = opts.install ?? ((root) => defaultInstall(root));
  await install(projectRoot);

  writeFileSync(join(projectRoot, "FOUNDATION_COMPLETE.md"), foundationDoc(templateHash, stateLib), "utf8");

  state.foundation = {
    complete: true,
    completedAt: new Date().toISOString(),
    templateHash,
    stateLib,
  };
  state.phase = "feature";
  writeState(projectRoot, state);

  return { filesWritten, filesSkipped, templateHash, stateLib };
}

/**
 * Inject the chosen state-management library's dependencies into the app
 * package.json. The template ships library-neutral; this is the only place a
 * library version is bound, keeping the foundation detached from any one choice.
 */
export function withStateLibDeps(packageJson: string, stateLib: StateLib): string {
  const pkg = JSON.parse(packageJson) as { dependencies?: Record<string, string> };
  pkg.dependencies = { ...(pkg.dependencies ?? {}), ...STATE_LIB_DEPS[stateLib] };
  // Keep dependencies sorted for a stable, diff-friendly output.
  pkg.dependencies = Object.fromEntries(
    Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b)),
  );
  return JSON.stringify(pkg, null, 2) + "\n";
}

function foundationDoc(hash: string, stateLib: StateLib): string {
  return [
    "# Project Foundation Complete",
    "",
    "- Architecture Ready",
    "- Routing Ready",
    `- State Management Ready (${stateLib})`,
    "- Testing Ready",
    "",
    "Feature development is unlocked.",
    "",
    `Template hash: \`${hash}\``,
    "",
  ].join("\n");
}
