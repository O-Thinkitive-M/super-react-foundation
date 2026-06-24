import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export const TEMPLATE_ROOT = join(here, "..", "files");
/** Overlay applied when the project chooses the generated-SDK API option. */
export const SDK_VARIANT_ROOT = join(here, "..", "sdk-variant");

export function templateRoot(): string {
  return TEMPLATE_ROOT;
}

export function sdkVariantRoot(): string {
  return SDK_VARIANT_ROOT;
}

function walkFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry);
      if (statSync(abs).isDirectory()) walk(abs);
      else out.push(relative(root, abs));
    }
  };
  walk(root);
  return out.sort();
}

/** The default foundation files, copied into every project. */
export function listTemplateFiles(): string[] {
  return walkFiles(TEMPLATE_ROOT);
}

/**
 * Files overlaid (over the default) when the SDK API option is chosen. These are
 * written *in addition to* the default tree; {@link SDK_REPLACED_FILES} lists the
 * default files the SDK option makes obsolete and that scaffold removes.
 */
export function listSdkVariantFiles(): string[] {
  return walkFiles(SDK_VARIANT_ROOT);
}

/**
 * Default files the generated-SDK transport replaces. Scaffold deletes these when
 * --sdk is chosen so there is exactly one transport in the tree.
 */
export const SDK_REPLACED_FILES: readonly string[] = [
  "src/api/client.ts",
  "src/auth/token.ts",
];
