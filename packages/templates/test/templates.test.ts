import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { templateRoot, listTemplateFiles } from "@super-react/templates";

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
