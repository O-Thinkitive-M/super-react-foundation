import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadSpecs } from "@super-react-foundation/specs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

test("a generated command doc exists for every spec", () => {
  for (const spec of loadSpecs()) {
    assert.ok(existsSync(join(repo, "docs", "commands", `${spec.id}.md`)), `missing doc for ${spec.id}`);
  }
});
