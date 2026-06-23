# Testing Strategy

Testing approach for a React + TypeScript + Vite SPA. Optimize for fast, deterministic feedback and confidence in user-facing behavior.

## Test types

Follow the **test pyramid**: many fast unit tests, fewer component/integration tests, very few E2E tests.

| Layer | What it covers | Tooling | Volume |
|-------|----------------|---------|--------|
| Unit | Pure logic in `lib/` — formatters, validators, reducers, utils. No DOM, no network | Vitest | Most (base of pyramid) |
| Component | Single component rendered in jsdom; props, user events, conditional UI | Vitest + RTL | Many |
| Integration | Hooks + React Query + data flow, with network stubbed by MSW | Vitest + RTL + MSW | Some |
| E2E | Critical user journeys through the real built app in a browser | Playwright | Few (top of pyramid) |

- Push assertions **down** the pyramid: if logic can be unit-tested, do not cover it only via E2E.
- E2E is reserved for flows that span pages, routing, and real rendering (login, checkout, primary task completion).

## Tools

| Tool | Role | Notes |
|------|------|-------|
| **Vitest** | Test runner + assertions | Already wired (`"test": "vitest run"`). Vite-native, shares config |
| **@testing-library/react** | Component rendering + queries | `render`, `screen`, `userEvent` |
| **@testing-library/jest-dom** | DOM matchers | `toBeInTheDocument`, `toBeDisabled`, etc. |
| **jsdom** | Browser-like environment | Set as Vitest `environment` |
| **MSW** | Network mocking | Intercepts `fetch`/XHR at the boundary; shared handlers |
| **Playwright** | E2E (optional, standard choice) | Real Chromium/Firefox/WebKit; runs against built app |

Install:

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom @vitejs/plugin-react msw
pnpm add -D @playwright/test   # optional, E2E
```

`vite.config.ts` (or `vitest.config.ts`):

```ts
/// <reference types="vitest" />
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'html', 'lcov'] },
  },
});
```

## Coverage targets

Coverage is a floor, not a goal. Targets are enforced as CI gates.

| Scope | Lines | Branches | Rationale |
|-------|-------|----------|-----------|
| `src/lib/` (pure logic) | ~100% | ~95% | Cheap to test, high value, no excuses |
| Components / hooks | ~80% | ~70% | Cover behavior + states, skip trivial markup |
| **Overall** | **~80%** | **~70%** | Project-wide gate |
| Critical flows | n/a | n/a | **Must** have at least one E2E test each |

Vitest config thresholds (fails CI when unmet):

```ts
coverage: {
  thresholds: { lines: 80, branches: 70, functions: 80, statements: 80 },
  exclude: ['**/*.config.*', '**/*.d.ts', 'src/mocks/**', 'src/test/**'],
}
```

## What to test

Do:
- Test **behavior, not implementation** — assert on rendered output and outcomes, not internal state or call counts.
- Query by **role/text/label** (`getByRole`, `getByText`, `getByLabelText`); fall back to `getByTestId` only when needed.
- Simulate real interaction with `userEvent` (not `fireEvent` where avoidable).
- Cover **loading, error, and empty states** for any async/data-driven UI.
- Test edge cases in `lib/` logic: boundaries, nulls, invalid input.

Don't:
- Don't test **third-party libraries** (React Query internals, router, UI kit) — assume they work.
- Don't assert on implementation details (class names, hook call order, snapshot of entire DOM).
- Don't over-use snapshots; prefer explicit assertions. Keep any snapshots small and intentional.
- Don't reach into component internals or mock things you own just to make a test pass.

## File layout & naming

- Co-locate tests next to source: `Button.tsx` → `Button.test.tsx`.
- Unit tests for logic: `format.ts` → `format.test.ts`.
- Single setup file registers matchers + MSW server lifecycle.
- MSW handlers live under `src/mocks/`.
- E2E tests live in a top-level `e2e/` folder.

```
src/
  lib/
    format.ts
    format.test.ts          # unit
  components/
    Button.tsx
    Button.test.tsx         # component
  hooks/
    useUser.ts
    useUser.test.tsx        # integration (hook + React Query + MSW)
  mocks/
    handlers.ts             # MSW request handlers
    server.ts               # MSW node server (tests)
    browser.ts              # MSW worker (dev, optional)
  test/
    setup.ts                # jest-dom + MSW lifecycle
e2e/
  login.spec.ts             # Playwright
playwright.config.ts
```

`src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { server } from '../mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Mocking strategy

- **Network**: MSW only. Mock at the HTTP boundary — never mock `fetch`/`axios` or your own API client directly. Same handlers reused by tests and (optionally) dev.
- **Per-test overrides**: use `server.use(...)` inside a test to simulate errors/edge responses; `resetHandlers()` clears them.
- **React Query in tests**: wrap with a fresh `QueryClient` per test; disable retries and set `gcTime: 0` so failures surface fast and state doesn't leak.
- **Timers/dates**: `vi.useFakeTimers()` / `vi.setSystemTime()` for time-dependent logic.
- **Modules**: prefer real implementations; `vi.mock()` only for unavoidable boundaries (e.g. analytics, env). Avoid mocking what you own.
- **E2E**: hit a real/staging API or a seeded test backend; avoid MSW in Playwright.

```ts
// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);
```

```tsx
// test QueryClient helper
const client = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 0 } },
});
```

## CI

- Run on every PR and on push to the main branch.
- Pipeline stages: install → lint/typecheck → `vitest run --coverage` → build → Playwright E2E.
- **Coverage gate**: Vitest thresholds fail the build; do not merge below target.
- Run tests in parallel; Vitest uses workers by default.
- Cache `node_modules` (pnpm store) and the Playwright browser binaries.
- Upload coverage (`lcov`) and Playwright HTML report / traces as artifacts.

```yaml
# .github/workflows/test.yml
- run: pnpm install --frozen-lockfile
- run: pnpm typecheck && pnpm lint
- run: pnpm test -- --coverage        # vitest run, fails under thresholds
- run: pnpm build
- run: pnpm exec playwright install --with-deps
- run: pnpm exec playwright test       # optional E2E
```
