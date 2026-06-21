import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { CommandSpec } from "@super-react/core";
import { claudeCodeAdapter } from "@super-react/adapter-claude-code";
import { parse as parseYaml } from "yaml";

const here = dirname(fileURLToPath(import.meta.url));

const statusSpec: CommandSpec = {
  id: "project-status",
  title: "Project Status",
  phase: "status",
  requiresFoundation: false,
  inputs: [],
  produces: [],
  cliOps: ["status"],
  nextSuggested: "analyze-project",
  body: "## Goal\nShow the dashboard.",
};

test("emitCommand matches the golden SKILL.md", () => {
  const files = claudeCodeAdapter.emitCommand(statusSpec);
  assert.equal(files.length, 1);
  assert.equal(files[0]?.path, ".claude/skills/super-react-project-status/SKILL.md");
  const golden = readFileSync(join(here, "__golden__", "project-status.SKILL.md"), "utf8");
  assert.equal(files[0]?.contents, golden);
});

test("foundation-required commands embed the guard instruction", () => {
  const files = claudeCodeAdapter.emitCommand({ ...statusSpec, requiresFoundation: true });
  assert.equal(files.length, 1);
  assert.match(files[0]!.contents, /super-react guard --requires-foundation/);
});

test("emitManifest lists all commands", () => {
  const files = claudeCodeAdapter.emitManifest([statusSpec]);
  assert.equal(files.length, 1);
  assert.equal(files[0]?.path, ".claude/super-react.manifest.json");
  const manifest = JSON.parse(files[0]!.contents) as { commands: { id: string }[] };
  assert.equal(manifest.commands[0]?.id, "project-status");
});

test("escapes special characters in frontmatter values", () => {
  const files = claudeCodeAdapter.emitCommand({ ...statusSpec, id: "x", title: "Plan: build it now" });
  assert.equal(files.length, 1);
  const between = files[0]!.contents.split("---");
  const data = parseYaml(between[1]!) as { name: string; description: string };
  assert.equal(data.name, "super-react-x");
  assert.equal(data.description, "Plan: build it now");
});
