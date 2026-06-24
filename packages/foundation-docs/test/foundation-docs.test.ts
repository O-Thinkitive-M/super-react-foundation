import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  foundationDocsRoot,
  listFoundationDocs,
  stateManagementSource,
} from "@super-react-foundation/foundation-docs";

test("foundationDocsRoot lists every doc, sorted by dest, with the two state-management variants collapsed to one", () => {
  assert.ok(existsSync(join(foundationDocsRoot(), "architecture.md")));
  const docs = listFoundationDocs();
  const dests = docs.map((d) => d.dest);

  // Derive the expected count from disk so adding a doc doesn't break the test:
  // every .md is one dest, except the two state-management.* sources collapse to one.
  const mdFiles = readdirSync(foundationDocsRoot()).filter((f) => f.endsWith(".md"));
  const stateVariants = mdFiles.filter((f) => f.startsWith("state-management.")).length;
  const expected = mdFiles.length - stateVariants + 1; // collapse N variants -> 1 canonical
  assert.equal(docs.length, expected);

  // Spot-check that the full topic set (including the ported Set-A docs) is seeded.
  for (const d of [
    "routing.md", "deployment.md", "data-structures.md", "state-management.md", "how-it-works.md",
    "tech-stack.md", "config-registries.md", "responsive-system.md", "data-display.md",
    "layout-and-overlays.md", "accessibility.md", "i18n.md", "datetime-timezone.md",
    "security.md", "cross-browser.md", "performance.md", "quality-gates.md",
    "mcp-integration.md", "theme.md", "forms.md", "project-plan.md", "foundation-checklist.md",
  ]) {
    assert.ok(dests.includes(d), `missing seeded doc: ${d}`);
  }
  assert.deepEqual(dests, [...dests].sort());
});

test("state-management doc source varies by library; dest is canonical", () => {
  const redux = listFoundationDocs("redux").find((d) => d.dest === "state-management.md");
  const zustand = listFoundationDocs("zustand").find((d) => d.dest === "state-management.md");
  assert.equal(redux?.source, "state-management.redux.md");
  assert.equal(zustand?.source, "state-management.zustand.md");
  assert.equal(stateManagementSource("redux"), "state-management.redux.md");
  assert.equal(existsSync(join(foundationDocsRoot(), stateManagementSource("redux"))), true);
  assert.equal(existsSync(join(foundationDocsRoot(), stateManagementSource("zustand"))), true);
});

test("the set of docs is identical across libraries except the state-management source", () => {
  const a = listFoundationDocs("redux").map((d) => d.dest);
  const b = listFoundationDocs("zustand").map((d) => d.dest);
  assert.deepEqual(a, b);
});
