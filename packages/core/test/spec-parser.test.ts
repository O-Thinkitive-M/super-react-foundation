import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSpec } from "@super-react/core";

const VALID = `---
id: project-status
title: Project Status
phase: status
requiresFoundation: false
inputs: []
produces: []
cliOps: [status]
nextSuggested: null
---
## Goal
Show the dashboard.
`;

test("parses frontmatter and body", () => {
  const spec = parseSpec(VALID);
  assert.equal(spec.id, "project-status");
  assert.equal(spec.title, "Project Status");
  assert.equal(spec.phase, "status");
  assert.equal(spec.requiresFoundation, false);
  assert.deepEqual(spec.cliOps, ["status"]);
  assert.equal(spec.nextSuggested, null);
  assert.match(spec.body, /Show the dashboard\./);
  assert.doesNotMatch(spec.body, /^---/);
});

test("requiresFoundation defaults to false when omitted", () => {
  const spec = parseSpec(`---
id: x
title: X
phase: feature
---
body`);
  assert.equal(spec.requiresFoundation, false);
  assert.deepEqual(spec.inputs, []);
});

test("throws when frontmatter is missing", () => {
  assert.throws(() => parseSpec("no frontmatter here"), /missing YAML frontmatter/);
});

test("throws on invalid phase", () => {
  assert.throws(
    () => parseSpec(`---\nid: x\ntitle: X\nphase: bogus\n---\nbody`),
    /Invalid phase/,
  );
});

test("names the offending field when a list value is not a list", () => {
  assert.throws(
    () => parseSpec(`---\nid: x\ntitle: X\nphase: feature\ninputs: notalist\n---\nbody`),
    /Expected a list for field "inputs"/,
  );
});
