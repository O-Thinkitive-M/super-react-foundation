import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  templateRoot,
  listTemplateFiles,
  listSdkVariantFiles,
  sdkVariantRoot,
  SDK_REPLACED_FILES,
} from "@super-react-foundation/templates";

test("templateRoot points at an existing files directory", () => {
  assert.ok(existsSync(templateRoot()));
  assert.ok(existsSync(join(templateRoot(), "package.json")));
});

test("listTemplateFiles returns sorted, template-relative paths including nested files", () => {
  const files = listTemplateFiles();
  assert.ok(files.includes("package.json"));
  assert.ok(files.includes("src/main.tsx"));
  assert.ok(files.includes("src/theme/index.ts"));
  const sorted = [...files].sort();
  assert.deepEqual(files, sorted);
});

test("listTemplateFiles includes dotfiles that must be scaffolded", () => {
  const files = listTemplateFiles();
  assert.ok(files.includes(".gitignore"));
  assert.ok(files.includes(".nvmrc"));
});

test("listTemplateFiles includes ds/algo lib helpers", () => {
  const files = listTemplateFiles();
  assert.ok(files.includes("src/lib/ds/collections.ts"));
  assert.ok(files.includes("src/lib/algo/rate.ts"));
});

test("scaffold ships the full end-to-end folder structure (each folder documented)", () => {
  const files = listTemplateFiles();
  // Every default folder is created up front (empty) and self-documented via a
  // README so the structure is identical and complete for every project.
  const requiredFolderDocs = [
    "src/theme/README.md",
    "src/config/README.md",
    "src/i18n/README.md",
    "src/components/README.md",
    "src/components/ui/README.md",
    "src/components/layout/README.md",
    "src/components/forms/README.md",
    "src/components/data/README.md",
    "src/components/feedback/README.md",
    "src/features/README.md",
    "src/features/_template/README.md",
    "src/features/_template/api/README.md",
    "src/features/_template/components/README.md",
    "src/features/_template/pages/README.md",
    "src/features/_template/hooks/README.md",
    "src/features/_template/config/README.md",
    "src/hooks/README.md",
    "src/api/README.md",
    "src/sdk/README.md",
    "src/store/README.md",
    "src/router/README.md",
    "src/types/README.md",
    "src/utils/README.md",
    "src/lib/README.md",
  ];
  for (const doc of requiredFolderDocs) {
    assert.ok(files.includes(doc), `missing folder doc: ${doc}`);
  }
  // The feature pattern ships a copy-me skeleton with a public barrel.
  assert.ok(files.includes("src/features/_template/index.ts"));
});

test("scaffold seeds a working router (config-driven, foundation-docs convention)", () => {
  const files = listTemplateFiles();
  for (const f of [
    "src/router/router.tsx",
    "src/router/paths.ts",
    "src/router/guards.tsx",
    "src/router/RootLayout.tsx",
    "src/router/AppLayout.tsx",
    "src/router/RouteError.tsx",
    "src/lib/auth.ts",
  ]) {
    assert.ok(files.includes(f), `missing router file: ${f}`);
  }
});

test("scaffold seeds the deletable demo page as a lazy route module", () => {
  assert.ok(listTemplateFiles().includes("src/features/_demo/pages/DashboardPage.tsx"));
});

test("scaffold seeds a working i18n registry with demo category files", () => {
  const files = listTemplateFiles();
  for (const f of [
    "src/i18n/index.ts",
    "src/i18n/react-i18next.d.ts",
    "src/i18n/en/index.ts",
    "src/i18n/en/buttons.ts",
    "src/i18n/en/titles.ts",
    "src/i18n/en/labels.ts",
    "src/i18n/en/descriptions.ts",
  ]) {
    assert.ok(files.includes(f), `missing i18n file: ${f}`);
  }
});

test("default API ships the hand-rolled typed client (no orval pipeline in the base)", () => {
  const files = listTemplateFiles();
  for (const f of [
    "src/api/client.ts",
    "src/api/errors.ts",
    "src/api/query-keys.ts",
    "src/api/query-client.ts",
  ]) {
    assert.ok(files.includes(f), `missing api file: ${f}`);
  }
  // The orval pipeline is NOT part of the default tree — it is the SDK overlay.
  assert.ok(!files.includes("orval.config.ts"));
  assert.ok(!files.includes("src/api/axios-instance.ts"));
});

test("SDK variant overlay holds the orval pipeline files", () => {
  assert.ok(existsSync(sdkVariantRoot()));
  const files = listSdkVariantFiles();
  for (const f of [
    "src/api/axios-instance.ts",
    "orval.config.ts",
    "orval-transformer.cjs",
    "scripts/check-node.cjs",
  ]) {
    assert.ok(files.includes(f), `missing sdk variant file: ${f}`);
  }
  // The overlay replaces the hand-rolled transport.
  assert.ok(SDK_REPLACED_FILES.includes("src/api/client.ts"));
});
