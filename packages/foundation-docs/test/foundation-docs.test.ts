import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  foundationDocsRoot,
  listFoundationDocs,
  stateManagementSource,
} from "@super-react-foundation/foundation-docs";

test("foundationDocsRoot exists and lists the eleven core docs, sorted by dest", () => {
  assert.ok(existsSync(join(foundationDocsRoot(), "architecture.md")));
  const docs = listFoundationDocs();
  const dests = docs.map((d) => d.dest);
  assert.equal(docs.length, 11);
  assert.ok(dests.includes("routing.md"));
  assert.ok(dests.includes("deployment.md"));
  assert.ok(dests.includes("data-structures.md"));
  assert.ok(dests.includes("state-management.md"));
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
