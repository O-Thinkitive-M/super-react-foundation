import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { readState, stateExists, writeState } from "@super-react-foundation/core";
import {
  listSdkVariantFiles,
  listTemplateFiles,
  SDK_REPLACED_FILES,
  sdkVariantRoot,
  templateRoot,
} from "@super-react-foundation/templates";
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

/** API transport mode. "client" = hand-rolled fetch client (default); "sdk" = Orval. */
export type ApiMode = "client" | "sdk";
export const DEFAULT_API_MODE: ApiMode = "client";

/** Extra deps + scripts injected when the generated-SDK option is chosen. */
const SDK_DEPS: Record<string, string> = { axios: "1.7.9" };
const SDK_DEV_DEPS: Record<string, string> = { orval: "7.4.1" };
const SDK_SCRIPTS: Record<string, string> = {
  preinstall: "node scripts/check-node.cjs",
  "generate-sdk": "orval --config ./orval.config.ts",
};

export interface ScaffoldOptions {
  projectRoot: string;
  install?: (projectRoot: string) => Promise<void>;
  force?: boolean;
  /** Client-state library to wire up. Defaults to {@link DEFAULT_STATE_LIB} (redux). */
  stateLib?: StateLib;
  /** API transport. Defaults to {@link DEFAULT_API_MODE} ("client"). */
  apiMode?: ApiMode;
}

export interface ScaffoldResult {
  filesWritten: string[];
  filesSkipped: string[];
  templateHash: string;
  stateLib: StateLib;
  apiMode: ApiMode;
}

export async function defaultInstall(projectRoot: string, exec: Exec = nodeExec): Promise<void> {
  const result = await exec("pnpm", ["install"], { cwd: projectRoot });
  if (result.code !== 0) {
    throw new Error(`Dependency install failed:\n${result.stderr || result.stdout}`);
  }
}

export async function scaffoldFoundation(opts: ScaffoldOptions): Promise<ScaffoldResult> {
  const {
    projectRoot,
    force = false,
    stateLib = DEFAULT_STATE_LIB,
    apiMode = DEFAULT_API_MODE,
  } = opts;

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
  // The chosen library + API mode are part of what makes a scaffold reproducible.
  hash.update("state-lib:" + stateLib + "\0");
  hash.update("api-mode:" + apiMode + "\0");

  const writeFile = (rel: string, contents: Buffer): void => {
    hash.update(rel + "\0");
    hash.update(contents);
    const dest = join(projectRoot, rel);
    if (existsSync(dest) && !force) {
      filesSkipped.push(rel);
      return;
    }
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, contents);
    filesWritten.push(rel);
  };

  for (const rel of files) {
    // The app package.json gets the chosen state library's deps (and SDK deps,
    // when chosen) injected so the foundation is never tied to a choice at the
    // template level.
    const contents =
      rel === "package.json"
        ? Buffer.from(withScaffoldDeps(readFileSync(join(root, rel), "utf8"), stateLib, apiMode), "utf8")
        : readFileSync(join(root, rel));
    writeFile(rel, contents);
  }

  // SDK option: overlay the Orval pipeline and remove the default hand-rolled
  // transport it replaces, so the tree has exactly one API transport.
  if (apiMode === "sdk") {
    const variantRoot = sdkVariantRoot();
    for (const rel of listSdkVariantFiles()) {
      writeFile(rel, readFileSync(join(variantRoot, rel)));
    }
    for (const rel of SDK_REPLACED_FILES) {
      hash.update("remove:" + rel + "\0");
      const target = join(projectRoot, rel);
      if (existsSync(target)) rmSync(target);
    }
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

  writeFileSync(
    join(projectRoot, "FOUNDATION_COMPLETE.md"),
    foundationDoc(templateHash, stateLib, apiMode),
    "utf8",
  );

  state.foundation = {
    complete: true,
    completedAt: new Date().toISOString(),
    templateHash,
    stateLib,
    apiMode,
  };
  state.phase = "feature";
  writeState(projectRoot, state);

  return { filesWritten, filesSkipped, templateHash, stateLib, apiMode };
}

/**
 * Inject the chosen state-management library's dependencies (and, for the SDK
 * option, axios + orval + the SDK scripts) into the app package.json. The
 * template ships choice-neutral; this is the only place a choice is bound,
 * keeping the foundation detached from any one option.
 */
export function withScaffoldDeps(
  packageJson: string,
  stateLib: StateLib,
  apiMode: ApiMode = DEFAULT_API_MODE,
): string {
  const pkg = JSON.parse(packageJson) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };

  pkg.dependencies = {
    ...(pkg.dependencies ?? {}),
    ...STATE_LIB_DEPS[stateLib],
    ...(apiMode === "sdk" ? SDK_DEPS : {}),
  };
  if (apiMode === "sdk") {
    pkg.devDependencies = { ...(pkg.devDependencies ?? {}), ...SDK_DEV_DEPS };
    pkg.scripts = { ...(pkg.scripts ?? {}), ...SDK_SCRIPTS };
  }

  // Keep dependency maps sorted for a stable, diff-friendly output.
  pkg.dependencies = sortRecord(pkg.dependencies);
  if (pkg.devDependencies) pkg.devDependencies = sortRecord(pkg.devDependencies);
  return JSON.stringify(pkg, null, 2) + "\n";
}

function sortRecord(rec: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(rec).sort(([a], [b]) => a.localeCompare(b)));
}

function foundationDoc(hash: string, stateLib: StateLib, apiMode: ApiMode): string {
  const apiLabel = apiMode === "sdk" ? "Generated SDK (Orval)" : "Typed HTTP client";
  return [
    "# Project Foundation Complete",
    "",
    "- Architecture Ready",
    "- Routing Ready (config-driven, demo page at /dashboard — deletable)",
    "- i18n Ready (no hardcoded UI strings; demo keys in src/i18n/)",
    `- API Ready (${apiLabel})`,
    `- State Management Ready (${stateLib})`,
    "- Testing Ready",
    "",
    "See `project-setup/how-it-works.md` for a step-by-step walkthrough of the",
    "default app and how each demo is replaced as features are added.",
    "",
    "Feature development is unlocked.",
    "",
    `Template hash: \`${hash}\``,
    "",
  ].join("\n");
}
