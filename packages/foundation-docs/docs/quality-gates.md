# Quality Gates

> Generic foundation doc. Copied verbatim into every project's `project-setup/quality-gates.md`.
> Strict ESLint + git hooks + CI block bad code before it merges. Zero-warning policy. See also `coding-standards.md`.

## Strict ESLint rules

`eslint.config.js` (flat config) builds on `@eslint/js` + `typescript-eslint` recommended, then adds:

| Rule | Setting | Why |
|---|---|---|
| `no-console` | error | no stray logs in prod |
| `no-debugger` | error | no breakpoints shipped |
| `@typescript-eslint/no-unused-vars` | error (`^_` ignore) | dead code |
| `@typescript-eslint/no-explicit-any` | error | type safety |
| `eqeqeq` | error | `===` only |
| `no-var` / `prefer-const` | error | immutability |
| `i18next/no-literal-string` | error | ban hardcoded UI text → i18n registry (see `i18n.md`) |

```js
rules: {
  "no-console": "error",
  "no-debugger": "error",
  "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
  "@typescript-eslint/no-explicit-any": "error",
  eqeqeq: ["error", "always"],
  "no-var": "error",
  "prefer-const": "error",
}
```

> The scaffold ships the base flat config; the stricter rules above are added as the project hardens. The `no-literal-string` rule is added together with the i18n setup.

## Git hooks (Husky + lint-staged)

| Hook | Runs | Blocks on |
|---|---|---|
| `pre-commit` | `lint-staged` (eslint `--max-warnings=0`, prettier `--check`) | any lint warning/error or format drift |
| `commit-msg` | conventional-commit validation (optional) | non-conforming message |
| `pre-push` | `tsc --noEmit` + `vitest run` | type error / failing test |

```sh
# .husky/pre-commit
npx lint-staged
# .husky/pre-push
npm run typecheck && npm run test
```

```jsonc
// package.json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --max-warnings=0", "prettier --check"],
  "*.{json,md,css}": ["prettier --check"]
}
```

> `--no-verify` is not allowed for normal work — hooks exist to catch problems before CI.

## CI pipeline

| Stage | Command | Gate |
|---|---|---|
| Install | `pnpm install` (or `npm ci`) | lockfile honored |
| Lint | `npm run lint` | 0 warnings/errors |
| Type-check | `npm run typecheck` | 0 errors |
| Test | `npm run test` (+ coverage) | pass + coverage gates (see `testing-strategy.md`) |
| Build | `npm run build` | succeeds, within bundle budget (see `performance.md`) |
| Audit | `npm audit` / `npm run security:audit` | no high/critical CVEs (see `security.md`) |

- Run on every PR; merges blocked until green.

## Definition of done (per PR)

- [ ] `npm run lint` — 0 warnings.
- [ ] `npm run typecheck` — 0 errors.
- [ ] `npm run test` — green, coverage gates met.
- [ ] `npm run build` — succeeds within budget.
- [ ] No `any`, no `console`, no hardcoded UI strings.
- [ ] No open Critical/High review findings.

## Adapt per project (from SRS/MOM)

- Choose the CI provider and runner; wire the stages above.
- Decide commit-message convention and coverage thresholds.
- Add project-specific gates (e.g. visual regression, a11y CI, license check) as needed.
