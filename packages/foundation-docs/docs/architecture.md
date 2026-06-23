# Architecture

## Overview

- Single-page application (SPA) built on a fixed, opinionated stack.
- Rendered client-side; no server-side rendering. Served as static assets behind any CDN/host.
- Composed of small, replaceable units organized into strict layers (see below).

| Concern | Technology | Notes |
|---|---|---|
| UI runtime | React 19 | Function components + hooks only; no class components |
| Language | TypeScript | `strict` mode; no implicit `any`; explicit public types at module edges |
| Build/dev | Vite | ESM-native, fast HMR, env via `import.meta.env` |
| Components + theming | MUI (Material UI) | Single source of design tokens via theme; no ad-hoc CSS frameworks |
| Routing | react-router-dom v7 | Declarative routes; data/loader patterns optional |
| Server state | TanStack React Query | Caching, dedup, retries, background refetch for all remote data |
| Client state | the client-state store | Redux Toolkit **or** Zustand — treated generically; one store per app |
| Local state | `useState` / `useReducer` | Component-scoped UI state only |

## Layering & dependency rules

- Five layers, ordered from outermost (composition) to innermost (pure logic).
- **Dependency rule: imports point inward only.** An inner layer must never import from an outer layer.
- `src/lib/` is the innermost layer and **depends on nothing** in the app (no React, no MUI, no router, no store, no network).

| # | Layer | Folder(s) | May import from | Must NOT import |
|---|---|---|---|---|
| 1 | App shell | `src/App.tsx`, `src/main.tsx`, `src/theme/` | router, features, shared UI, lib | — |
| 2 | Router | `src/router/` | features, shared UI, lib | app shell |
| 3 | Features | `src/features/*` (each with its own `pages/`) | shared UI, lib | app shell, router, other features* |
| 4 | Shared UI | `src/components/` | lib | app shell, router, features |
| 5 | Lib (pure logic) | `src/lib/`, `src/lib/ds/`, `src/lib/algo/` | nothing (std lib only) | everything above |

- *Feature-to-feature imports are disallowed by default. Shared needs are promoted down into shared UI or `lib/`, or coordinated at the router/shell layer.
- Enforce mechanically where possible: path aliases (`@/lib`, `@/features`, ...), `eslint-plugin-import`/boundary rules, and `tsconfig` paths.

### Layer responsibilities

| Layer | Owns | Does not own |
|---|---|---|
| App shell | Root render, providers (theme, query client, router, store), global error boundary, suspense fallbacks | Business logic, page content |
| Router | URL → screen mapping (`createBrowserRouter`, route tree, guards, route error element, typed path constants); route-level data orchestration; code-splitting boundaries. Route-screen components live in each feature's `pages/`. | Reusable widgets, domain rules |
| Features | A vertical slice of domain behavior: its hooks, queries, components, local store slice | Routing decisions, global providers |
| Shared UI | Presentational, reusable, app-agnostic components driven by props | Server calls, global/client state, domain rules |
| Lib | Pure functions, data structures (`ds/`), algorithms (`algo/`), formatters, validators, types | Side effects, I/O, framework APIs |

## Module boundaries

- Each feature is a self-contained folder exposing a small public surface via a barrel (`index.ts`); internals stay private.
- Cross-layer access goes through that public surface only — never deep-import another module's internal file.

```
src/
  main.tsx            # entry: mount React, install providers
  App.tsx             # app shell: router outlet, global error/suspense boundaries
  theme/              # MUI theme, design tokens, palette, typography
  router/             # createBrowserRouter, route tree, guards (RequireAuth, RequireRole),
                      #   route error element, typed path constants (lazy-loaded)
  features/
    <feature>/
      index.ts        # public API of the feature (the ONLY import target)
      api/            # React Query hooks (useXQuery / useXMutation)
      components/     # feature-scoped components
      pages/          # this feature's route-screen components
      hooks/          # feature-scoped hooks
      config/         # feature-scoped config
  components/         # shared, app-agnostic UI: ui/, layout/, forms/, data/, feedback/
  lib/
    ds/               # data structures (pure)
    algo/             # algorithms (pure)
    ...               # formatters, validators, shared types, constants
```

- Public/private boundary rules:
  - Import a feature only via `features/<feature>` (its `index.ts`).
  - Import shared UI via the components barrel.
  - Import pure logic via `@/lib`, `@/lib/ds`, `@/lib/algo`.
- A module is "too big" when its barrel exports an entire internal tree — split it before that happens.

## Data flow

| State kind | Source of truth | Tool | Lifetime / scope |
|---|---|---|---|
| Server state | Remote API | React Query cache | Keyed by query key; shared app-wide; auto-invalidated |
| Client state | In-app, cross-component | the client-state store | App session; explicit actions/updates |
| Local state | One component subtree | `useState` / `useReducer` | Component mount |
| URL state | Address bar | react-router-dom | Navigation; shareable/bookmarkable |
| Theme/tokens | Design system | MUI theme provider | App-wide, static |

- **Decision order for new state:** URL → server (React Query) → local (`useState`) → client store. Reach for the global store last, only for genuinely shared, non-server, non-URL state.
- Server data is never copied into the client store. Components read it from React Query hooks; mutations invalidate or update the query cache.
- One-directional flow: events → hooks/actions → state update → re-render. No component mutates another layer's state directly.

```
User → Component → (React Query hook | store action | setState | navigate)
                       │                  │              │          │
                  remote API         client store   local state   router
                       └──────────────── re-render ◄──────────────┘
```

## Cross-cutting concerns

| Concern | Approach |
|---|---|
| Providers | Installed once in the app shell, outermost-in order: ThemeProvider → QueryClientProvider → StoreProvider → RouterProvider |
| Error handling | Global React error boundary at the shell; per-route boundaries for isolation; React Query `error` states for data failures |
| Loading | React `Suspense` + route-level fallbacks; React Query `isLoading`/`isFetching` for data |
| Data fetching | Centralized fetch/client wrapper in `lib`; all reads/writes go through React Query hooks in `features/<f>/api` |
| Auth/session | Token/session handled in shell + a thin lib client; React Query reacts to auth state via query keys/invalidation |
| Theming | All visual tokens in `src/theme`; components consume the MUI theme, never hardcode colors/spacing |
| Config/env | Read via `import.meta.env`; typed and validated in `lib`; never read `import.meta.env` inside features |
| Code splitting | Lazy-load routes at the router layer (`src/router/`); keep `lib` and shared UI in the common chunk |
| Types | Domain types live in `lib`; features extend/map them; no `any` at module boundaries |
| Testing | Pure logic in `lib` is unit-tested in isolation (no mocks needed); features test hooks/components with mocked queries |

## Key decisions & rationale

| Decision | Rationale | Trade-off accepted |
|---|---|---|
| Strict inward dependency rule | Keeps `lib` reusable, testable, and framework-free; prevents circular/spaghetti deps | Requires discipline + lint enforcement |
| `lib` depends on nothing | Pure logic is trivially unit-testable and portable across apps | Some glue code must live one layer up |
| React Query owns server state | Removes hand-rolled caching/loading/error logic; consistent freshness model | Team must learn query-key + invalidation patterns |
| Client store kept generic (RTK or Zustand) | Lets each app pick its store without changing the architecture | Docs avoid store-specific idioms |
| Feature-to-feature imports banned | Forces shared code down into `lib`/shared UI; keeps features deletable | Occasional duplication until promotion |
| MUI theme as the only token source | One place for design changes; consistent UI | Bound to MUI's theming model |
| Barrel-only public surface | Internals can refactor freely without breaking consumers | Must maintain `index.ts` per module |
| Lazy routes | Smaller initial bundle, faster first paint | Slight added complexity at route boundaries |
| Vite + ESM | Fast dev loop and builds; modern module semantics | No legacy/CJS-only tooling support |
