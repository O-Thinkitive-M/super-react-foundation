# Coding Standards

> Foundation doc — copied verbatim into every project's `project-setup/coding-standards.md`.
> Generic and identical across projects. React + TypeScript SPA (Vite).

The scaffold ships with ESLint (`eslint.config.js`), Prettier (`.prettierrc.json`), TypeScript strict mode, the `@/` → `src/` path alias, and a pinned Node version (`.nvmrc`). These standards are enforced by tooling and CI — they are not optional style preferences.

## Lint/format rules

- **ESLint** owns code-quality rules; **Prettier** owns formatting. They do not overlap.
- ESLint uses the flat config (`eslint.config.js`) built on `@eslint/js` + `typescript-eslint` recommended.
- Prettier config (`.prettierrc.json`) is the single source of truth for formatting — never hand-format against it.
- **No ESLint warnings allowed.** Warnings are treated as errors in CI.
- Do **not** disable rules inline without justification. If unavoidable, scope it tightly and explain:

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 3rd-party lib types are wrong, tracked in TICKET-123
```

| Script | Command | Purpose |
|---|---|---|
| `lint` | `eslint .` | Code-quality rules, zero warnings |
| `format` | `prettier --write .` | Apply formatting |
| `format:check` | `prettier --check .` | Verify formatting (CI) |
| `typecheck` | `tsc --noEmit` | Type-level verification |

- **CI runs `lint`, `format:check`, and `typecheck` on every PR.** All must pass green.
- Run `lint` + `typecheck` locally before every commit (a pre-commit hook is recommended).

## TypeScript rules

- **`strict: true`** is mandatory and must never be weakened (`strictNullChecks`, `noImplicitAny`, etc. all on).
- **No `any`.** Use `unknown` and narrow with type guards before use.

```ts
function parse(input: unknown): User {
  if (typeof input !== 'object' || input === null) throw new Error('invalid');
  // narrow further...
}
```

- **Explicit return types on all exported functions** (and exported hooks). Local helpers may infer.
- **Prefer `type` aliases** for props and object shapes; use `interface` only when declaration merging is needed.
- **No non-null assertions (`!`)** except where provably safe — annotate with a justifying comment.
- Prefer `unknown` over `any` in `catch` clauses; narrow before accessing properties.
- Use `as const` for literal tuples/objects; avoid blanket type assertions (`as Foo`).
- No `@ts-ignore`; use `@ts-expect-error` with a reason comment when a suppression is truly required.
- Model nullable/optional data explicitly (`T | undefined`), do not paper over it.

## Naming

| Kind | Convention | Example |
|---|---|---|
| Component | PascalCase | `UserCard` |
| Type / Interface | PascalCase | `UserCardProps`, `ApiResponse` |
| Variable / function | camelCase | `userCount`, `fetchUser` |
| React hook | camelCase, `use` prefix | `useUserData` |
| Constant (module-level, fixed) | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| Enum / enum member | PascalCase | `Status.Active` |
| Boolean | `is/has/should` prefix | `isLoading`, `hasError` |

- Props type is the component name + `Props`: `UserCard` → `UserCardProps`.
- Avoid abbreviations except well-known ones (`id`, `url`, `http`).

### File naming

| File kind | Convention | Example |
|---|---|---|
| Component file | PascalCase, matches component | `UserCard.tsx` |
| Hook file | camelCase, `use` prefix | `useUserData.ts` |
| Util / helper module | camelCase | `formatDate.ts` |
| Type-only module | camelCase, `.types` | `user.types.ts` |
| Constants module | camelCase | `constants.ts` |
| Test file | mirror source + `.test` | `UserCard.test.tsx` |
| Barrel | `index.ts` | `index.ts` |

## Imports/aliases

- **Always import via the `@/` alias** for `src/` modules — never deep relative paths (`../../../`).

```ts
// Good
import { UserCard } from '@/components/UserCard';
// Bad
import { UserCard } from '../../../components/UserCard';
```

- Sibling/same-folder relative imports (`./UserCard`) are fine.
- **Ordered import groups**, separated by a blank line:
  1. Node/builtin
  2. External packages (`react`, third-party)
  3. Internal aliased (`@/...`)
  4. Relative (`./`, `../`)
  5. Style/asset imports
- Within each group, sort alphabetically.
- **No circular dependencies.** Use barrels deliberately and break cycles by extracting shared code.
- Prefer named exports; reserve `default` export for lazy-loaded route components.

## No-hardcoded-strings

- **User-facing strings go through i18n / a constants module** — never inline literals in JSX.

```tsx
// Bad
<button>Save changes</button>
// Good
<button>{t('common.save')}</button>
```

- **No magic numbers.** Name them as `UPPER_SNAKE` constants with intent.

```ts
// Bad
if (retries > 3) ...
// Good
const MAX_RETRIES = 3;
if (retries > MAX_RETRIES) ...
```

- **Configuration comes from env**, not literals — access via `import.meta.env`.

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

- No secrets, URLs, or environment-specific values hardcoded in source.
- Exempt: keys/log messages/test fixtures and obvious non-config values (e.g. `0`, `1`, `''`).

## Component conventions

- **Function components + hooks only.** No class components.
- **One component per file** (small, tightly-coupled subcomponents may co-locate).
- **Props are always typed** with a `type` alias named `<Component>Props`.

```tsx
type UserCardProps = {
  user: User;
  onSelect: (id: string) => void;
};

export function UserCard({ user, onSelect }: UserCardProps): JSX.Element {
  return <button onClick={() => onSelect(user.id)}>{user.name}</button>;
}
```

- **No business logic in JSX.** Compute in the function body or a custom hook; keep JSX declarative.
- Extract data fetching, side effects, and stateful logic into custom hooks.
- Follow the Rules of Hooks — call hooks unconditionally at the top level.
- Keep components small and focused; lift shared logic into hooks/utils, not copy-paste.
- Memoize (`useMemo`/`useCallback`/`memo`) only when there is a measured need.

## Commit & PR hygiene

- **Conventional Commits**: `type(scope): summary`.

| Type | Use for |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | No behavior change |
| `test` | Tests only |
| `docs` | Docs only |
| `chore` | Tooling/build/deps |

- Imperative, present tense; keep the subject ≤ 72 chars; explain *why* in the body when non-obvious.
- **One logical change per commit**; do not mix refactors with features.
- Branch naming: `<type>/<short-description>` (e.g. `feat/user-card`).
- **PRs must be green**: `lint`, `format:check`, `typecheck`, and tests all pass — no warnings.
- Keep PRs small and reviewable; include a clear description and link the tracking ticket.
- No commented-out code, debug logs, or `console.*` left in the diff.
- Rebase/squash to a clean history before merge; no merge-commit noise.
