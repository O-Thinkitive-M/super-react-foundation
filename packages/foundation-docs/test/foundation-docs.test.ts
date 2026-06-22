import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { foundationDocsRoot, listFoundationDocs } from "@super-react/foundation-docs";

test("foundationDocsRoot exists and lists the eleven core outlines, sorted", () => {
  assert.ok(existsSync(join(foundationDocsRoot(), "architecture.md")));
  const docs = listFoundationDocs();
  assert.equal(docs.length, 11);
  assert.ok(docs.includes("routing.md"));
  assert.ok(docs.includes("deployment.md"));
  assert.ok(docs.includes("data-structures.md"));
  assert.deepEqual(docs, [...docs].sort());
});
