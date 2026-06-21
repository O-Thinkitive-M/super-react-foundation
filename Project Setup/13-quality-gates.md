# 13 — Quality Gates

Strict ESLint + Husky + CI block bad code before it merges. Zero-warning policy.

## Strict ESLint Rules

`eslint.config.js` (flat config)

| Rule | Setting | Why |
|------|---------|-----|
| `no-console` | error | No stray logs in prod |
| `no-debugger` | error | No breakpoints shipped |
| `no-unused-vars` (off, use TS rule) | — | superseded |
| `@typescript-eslint/no-unused-vars` | error | Dead code |
| `@typescript-eslint/no-explicit-any` | error | Type safety |
| `eqeqeq` | error | `===` only |
| `no-var` | error | `let`/`const` only |
| `prefer-const` | error | Immutability |
| `prefer-arrow-callback` | error | Consistent callbacks |
| `no-empty-function` | error | No silent stubs |
| `no-implicit-coercion` | error | Explicit casts |
| `no-literal-string` (eslint-plugin-i18next / jsx-no-literals) | error | **Ban hardcoded UI text** → i18n registry |

```js
// excerpt
rules: {
  'no-console': 'error',
  'no-debugger': 'error',
  '@typescript-eslint/no-unused-vars': 'error',
  '@typescript-eslint/no-explicit-any': 'error',
  eqeqeq: ['error', 'always'],
  'no-var': 'error',
  'prefer-const': 'error',
  'prefer-arrow-callback': 'error',
  'no-empty-function': 'error',
  'no-implicit-coercion': 'error',
  'i18next/no-literal-string': ['error', { markupOnly: true }],
}
```

## Husky Hooks

| Hook | Runs | Blocks on |
|------|------|-----------|
| `pre-commit` | lint-staged (eslint, `--max-warnings=0`) | any lint warning/error |
| `commit-msg` | conventional-commits validation | non-conforming message |
| `pre-push` | `tsc --noEmit` + `vitest run` | type error / failing test |

`.husky/pre-commit`
```sh
npx lint-staged
```
`.husky/commit-msg`
```sh
npx --no-install commitlint --edit "$1"
```
`.husky/pre-push`
```sh
npm run type-check && npm run test
```

## lint-staged Config

`package.json`
```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --max-warnings=0"],
  "*.{ts,tsx,json,css,md}": ["prettier --write"]
}
```

## commitlint

`commitlint.config.js` — conventional commits: `feat|fix|chore|docs|refactor|test|perf|ci|build|style|revert`
```
feat(patients): add archive action
fix(auth): reset idle timer on scroll
```

## CI/CD — Self-Hosted EC2 Runner

GitHub Actions on a **self-hosted EC2 runner** (no GitHub minutes consumed).

`.github/workflows/ci.yml` steps

| Step | Command |
|------|---------|
| Node guard | check `node >= 22.18` (engines) |
| Install | `npm ci` |
| Lint | `npm run lint` (`--max-warnings=0`) |
| Type-check | `npm run type-check` |
| Test | `npm run test -- --coverage` |
| Build | `npm run build` |
| Security audit | `npm run security:audit` |

```yaml
jobs:
  verify:
    runs-on: [self-hosted, linux, ec2]
    steps:
      - uses: actions/checkout@v4
      - run: node -e "process.exit(+process.versions.node.split('.')[0] >= 22 ? 0 : 1)"
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test -- --coverage
      - run: npm run build
      - run: npm run security:audit
```

## npm Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Dev server |
| `build` | `tsc -b && vite build` | Prod build |
| `lint` | `eslint . --max-warnings=0` | Lint gate |
| `type-check` | `tsc --noEmit` | Types |
| `test` | `vitest run` | Unit/component tests |
| `generate-sdk` | `orval --config orval.config.ts` | Regenerate API SDK |
| `security:audit` | `npm audit --audit-level=high` | Dependency CVEs |
| `security:check` | `eslint . && npm audit --audit-level=high` | Combined gate |

## `--no-verify` Caution

- **Do not** bypass hooks with `git commit --no-verify` / `git push --no-verify`.
- CI re-runs the same gates — bypassing locally only delays the failure and pollutes history.
- Emergency bypass requires lead approval + immediate follow-up fix commit.
