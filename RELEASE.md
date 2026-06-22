# Release Checklist — super-react

Follow these steps in order before and during every release.

---

## 1. Verify npm name availability (first release only)

```bash
npm view super-react version 2>&1 || echo "name is available"
```

If the name is already taken, resolve the conflict before continuing.

---

## 2. Full quality gate

```bash
pnpm install       # ensure a clean lockfile
pnpm typecheck     # tsc --noEmit; must exit 0 with no errors
pnpm test          # must be 70/70 pass, 0 fail
```

All three commands must exit cleanly before proceeding.

---

## 3. Build

```bash
pnpm --filter super-react build
```

Expected output: `super-react: build complete (dist/cli.js + data dirs).`

Verify the dist artefacts:

```bash
ls packages/cli/dist/cli.js
ls packages/cli/files/   # scaffold template
ls packages/cli/definitions/  # spec YAML
ls packages/cli/docs/    # generated command docs
```

---

## 4. Pack and smoke-test the tarball

```bash
cd packages/cli
npm pack --dry-run   # inspect included files — no node_modules, no src
npm pack            # creates super-react-X.Y.Z.tgz

# Smoke-test in an isolated directory
mkdir /tmp/sr-smoke && cd /tmp/sr-smoke
npm install /path/to/packages/cli/super-react-X.Y.Z.tgz
npx super-react init  --cwd /tmp/sr-smoke
npx super-react scaffold --no-install --cwd /tmp/sr-smoke
ls /tmp/sr-smoke/.claude/skills | grep -c '^super-react-'
# Expected: 15
```

Clean up:

```bash
rm /path/to/packages/cli/super-react-X.Y.Z.tgz
```

> **Workspace deps are build-time-only (bundled).**
> `@super-react/core`, `@super-react/compiler`, `@super-react/adapter-claude-code`,
> `@super-react/specs`, and `@super-react/ops` are `devDependencies` in the CLI package.
> The esbuild bundle inlines them all, so the published tarball has zero runtime dependencies.

---

## 5. Bump the version

Edit `packages/cli/package.json` — update the `"version"` field:

```json
{
  "version": "X.Y.Z"
}
```

The package also has `"engines": { "node": ">=22.18" }` and a `"prepack"` script (`node build.mjs`) that automatically rebuilds the bundle whenever `npm pack` or `npm publish` is run. This ensures `dist/` (which is gitignored) is always fresh in the published tarball. `prepack` is a publish-time hook only — it does **not** run on consumer `npm install`.

Follow semver:

| Change | Bump |
|---|---|
| Breaking CLI / skill-format change | major |
| New command or scaffold file | minor |
| Bug fix, doc update | patch |

---

## 6. Commit and tag

```bash
git add packages/cli/package.json
git commit -m "chore: release vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

Pushing the tag triggers the `.github/workflows/release.yml` workflow.

---

## 7. Release workflow (automated)

The `release.yml` workflow runs the same gates as CI before publishing:

1. Checks out the tag.
2. Installs dependencies: `pnpm install --frozen-lockfile`.
3. Runs the full quality + build gate in order:
   - `pnpm typecheck` — tsc must exit 0
   - `pnpm test` — full suite must pass
   - `pnpm --filter super-react build` — bundle must build cleanly
   - `pnpm audit --audit-level=high` — no high/critical vulnerabilities
4. Publishes to npm with **provenance** (`--provenance`) so the package is
   verifiably linked to this repository and commit.

No manual `npm publish` is needed — pushing the tag is sufficient.

---

## Post-release

- Confirm the package appears on [npmjs.com/package/super-react](https://www.npmjs.com/package/super-react).
- Verify the provenance attestation is visible on the npm page.
- Test the published package end-to-end: `npx super-react@X.Y.Z init`.
- Create a GitHub Release from the tag and copy the relevant CHANGELOG entries.
