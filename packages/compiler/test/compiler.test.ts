import { test } from "node:test";
import assert from "node:assert/strict";
import type { AgentAdapter, CommandSpec, EmittedFile } from "@super-react/core";
import { compile } from "@super-react/compiler";

function spec(id: string): CommandSpec {
  return {
    id,
    title: id,
    phase: "feature",
    requiresFoundation: false,
    inputs: [],
    produces: [],
    cliOps: [],
    nextSuggested: null,
    body: `body-${id}`,
  };
}

const fakeAdapter: AgentAdapter = {
  id: "fake",
  outDir: (root) => `${root}/.fake`,
  emitCommand: (s): EmittedFile[] => [{ path: `.fake/${s.id}.md`, contents: s.body }],
  emitManifest: (specs): EmittedFile[] => [
    { path: ".fake/manifest.json", contents: JSON.stringify(specs.map((s) => s.id)) },
  ],
};

test("emits each command then the manifest, in order", () => {
  const files = compile([spec("a"), spec("b")], fakeAdapter);
  assert.deepEqual(
    files.map((f) => f.path),
    [".fake/a.md", ".fake/b.md", ".fake/manifest.json"],
  );
  assert.equal(files[0]?.contents, "body-a");
});
