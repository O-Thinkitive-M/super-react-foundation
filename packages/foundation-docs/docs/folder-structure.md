# Folder Structure

> Foundation doc. Generic and identical across all projects. Documents every file/folder of the scaffolded React + TypeScript + Vite SPA. Keep it bullet points and tables, not prose.

## Overview

- **Stack**: React + TypeScript + Vite SPA.
- **Path alias**: `@/` → `src/` (configured in `vite.config.ts` and `tsconfig.json`). Always import internal modules via `@/...`, never long relative `../../..` chains.
- **Entry flow**: `index.html` → `src/main.tsx` → `src/App.tsx`.
- **Layering convention**:
  - `src/lib/` — framework-agnostic, pure, reusable building blocks (data structures + algorithms). No React, no app state.
  - `src/theme/` — design tokens / theme configuration (palette, typography, spacing, shadows, breakpoints, radii, components).
  - `src/store/` — client state. State library is pluggable: Redux Toolkit (`*.slice.ts`) or Zustand (`*.store.ts`).
  - `src/components/` — shared UI, grouped by role: `ui/`, `layout/`, `forms/`, `data/`, `feedback/`.
  - `src/features/<feature>/` — **feature-first** vertical slices; each holds `api/`, `components/`, `pages/` (the feature's route screens), `hooks/`, `config/`, `index.ts`.
  - `src/api/` (axios mutator), `src/sdk/` (generated client — do not edit), `src/router/`, `src/config/`, `src/i18n/`, `src/hooks/`, `src/types/`, `src/utils/`.
- **Created up front**: the scaffold creates the **entire** structure below by default — every folder exists from day one, empty, each carrying a `README.md` that says what belongs in it. You never invent the structure per project; you fill it in.
- **Tests**: co-located next to the unit under test as `*.test.ts` / `*.test.tsx`.

## src/ tree

```text
.
├── .gitignore                    # Git ignore rules (node_modules, dist, env, logs)
├── .nvmrc                        # Pinned Node.js version for nvm / CI parity
├── .prettierrc.json              # Prettier formatting config (shared style)
├── README.md                     # Project intro, setup, scripts, conventions
├── eslint.config.js              # ESLint flat config (lint rules + plugins)
├── index.html                    # HTML entry; mounts #root, loads src/main.tsx
├── package.json                  # Deps, scripts, metadata, packageManager
├── tsconfig.json                 # App TypeScript config + @/ path alias
├── tsconfig.node.json            # TypeScript config for Node-side tooling (Vite)
├── vite.config.ts                # Vite build/dev config, plugins, @/ alias
└── src/
    ├── main.tsx                  # App bootstrap; renders <App/> into #root
    ├── App.tsx                   # Root React component / top-level layout
    ├── vite-env.d.ts             # Vite client type references (env, assets)
    ├── theme/                    # MUI theme + design tokens (single source of style)
    │   └── index.ts              # createTheme export (split palette/typography/... as it grows)
    ├── config/                   # App-wide config: nav, status registries, table/filter defaults
    ├── i18n/                     # Text registry + locales (no hardcoded strings)
    ├── components/               # Shared, reusable UI (grouped by role)
    │   ├── ui/                   # Primitives: buttons, chips, badges, TruncatedText
    │   ├── layout/               # AppShell, Nav, SplitPane, MasterDetail, NestedTabPage
    │   ├── forms/                # SchemaForm, FormSection, AsyncAutocomplete
    │   ├── data/                 # DataTable, FilterBar, KpiCard
    │   └── feedback/             # ErrorBoundary, QueryState, Drawer, Modal, toasts
    ├── features/                 # Feature-first vertical slices
    │   └── _template/            # Copy-me feature skeleton (rename per feature)
    │       ├── api/              # Feature query/mutation wrappers over the sdk
    │       ├── components/       # Feature-only components
    │       ├── pages/            # Feature's route screen components
    │       ├── hooks/            # Feature-only hooks
    │       ├── config/           # Column/filter/tab/form configs
    │       └── index.ts          # Public barrel (the feature's only import surface)
    ├── hooks/                    # Shared hooks (use* prefix), reused across features
    ├── api/                      # Axios mutator: instance + interceptors
    ├── sdk/                      # Orval/OpenAPI-generated client — DO NOT hand-edit
    ├── store/                    # Client state (Redux *.slice.ts or Zustand *.store.ts)
    ├── router/                   # createBrowserRouter, route tree, guards
    ├── types/                    # Shared TypeScript types
    ├── utils/                    # Small, pure helper functions
    └── lib/                      # Pure, framework-agnostic building blocks
        ├── ds/                   # Reusable data structures
        │   ├── collections.ts    # Generic collection helpers (sets, maps, groups)
        │   ├── lru.ts            # LRU cache implementation
        │   ├── normalize.ts      # Normalize/denormalize entities (id-keyed maps)
        │   └── tree.ts           # Tree node utilities (traverse, build, flatten)
        └── algo/                 # Pure algorithms (no side effects)
            ├── binarySearch.ts   # Binary search over sorted arrays
            ├── comparator.ts     # Comparator builders for sorting
            ├── graph.ts          # Graph traversal/shortest-path utilities
            ├── intervals.ts      # Interval merge/overlap/insert operations
            └── rate.ts           # Rate limiting / throttling helpers
```

> Every folder above is created by the initial scaffold (empty, with a `README.md`
> describing its purpose). The structure is identical for every project — you fill
> the folders in, you do not create them. Delete `features/_template/` if you don't want
> the example skeleton.

## File reference

| File / Folder | Purpose |
| --- | --- |
| `.gitignore` | Files/dirs Git must ignore (`node_modules/`, `dist/`, env files, logs). |
| `.nvmrc` | Pins the Node.js version so local + CI use the same runtime. |
| `.prettierrc.json` | Prettier formatting rules shared by all contributors. |
| `README.md` | Project overview, setup steps, available scripts, and conventions. |
| `eslint.config.js` | ESLint flat config: lint rules, parser, and plugins. |
| `index.html` | HTML document entry; defines `#root` and loads `src/main.tsx`. |
| `package.json` | Dependencies, npm scripts, project metadata, pinned package manager. |
| `tsconfig.json` | App TypeScript compiler options and the `@/` → `src/` path alias. |
| `tsconfig.node.json` | TypeScript config for Node-side tooling (e.g. Vite config). |
| `vite.config.ts` | Vite dev/build configuration, plugins, and `@/` alias resolution. |
| `src/main.tsx` | Application bootstrap; mounts `<App/>` into the `#root` element. |
| `src/App.tsx` | Root React component; top-level layout / router shell. |
| `src/vite-env.d.ts` | Ambient types for Vite client features (env vars, asset imports). |
| `src/theme/index.ts` | Central design tokens / theme object and its export. |
| `src/lib/ds/collections.ts` | Generic collection helpers (sets, maps, grouping). |
| `src/lib/ds/lru.ts` | Least-Recently-Used cache implementation. |
| `src/lib/ds/normalize.ts` | Normalize/denormalize entities into id-keyed maps. |
| `src/lib/ds/tree.ts` | Tree utilities: traverse, build, and flatten nodes. |
| `src/lib/algo/binarySearch.ts` | Binary search over sorted arrays. |
| `src/lib/algo/comparator.ts` | Comparator builders for stable, composable sorting. |
| `src/lib/algo/graph.ts` | Graph traversal and shortest-path utilities. |
| `src/lib/algo/intervals.ts` | Interval merge / overlap / insert operations. |
| `src/lib/algo/rate.ts` | Rate limiting / throttling helpers. |
| `src/theme/` | MUI theme + design tokens; split palette/typography/spacing/etc. as it grows. |
| `src/config/` | App-wide config: nav, status registries, table/filter defaults (no secrets). |
| `src/i18n/` | Text registry + locales; all user-facing strings live here. |
| `src/components/ui/` | Presentational primitives (buttons, chips, badges, `TruncatedText`). |
| `src/components/layout/` | Layout/structure: `AppShell`, `Nav`, `SplitPane`, `MasterDetail`, `NestedTabPage`. |
| `src/components/forms/` | Form building blocks: `SchemaForm`, `FormSection`, `AsyncAutocomplete`. |
| `src/components/data/` | Data display: `DataTable`, `FilterBar`, `KpiCard`. |
| `src/components/feedback/` | `ErrorBoundary`, `QueryState`, `Drawer`, `Modal`, toasts. |
| `src/features/_template/` | Copy-me feature skeleton (`api/`, `components/`, `pages/`, `hooks/`, `config/`, `index.ts`). |
| `src/hooks/` | Shared `use*` hooks reused across features. |
| `src/api/` | Axios mutator: configured instance + interceptors. |
| `src/sdk/` | Generated API client (Orval/OpenAPI) — do not hand-edit. |
| `src/store/` | Global client state (`*.slice.ts` Redux / `*.store.ts` Zustand). |
| `src/router/` | `createBrowserRouter`, route tree, guards. |
| `src/types/` | Shared TypeScript types/interfaces/enums. |
| `src/utils/` | Small, pure helper functions (no React, no state). |

## Naming conventions

| Kind | Convention | Example |
| --- | --- | --- |
| React components | PascalCase identifier **and** file name | `UserCard.tsx` |
| Functions / variables | camelCase | `getUserById`, `isLoading` |
| Hooks | camelCase, `use` prefix | `useAuth.ts` |
| Pure utilities / lib modules | camelCase file name | `binarySearch.ts` |
| Types / interfaces / enums | PascalCase | `type UserProfile`, `enum Role` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Folders | kebab-case (or feature name) | `user-profile/` |
| File names per type | kebab-case for non-component modules; PascalCase for components | `date-utils.ts`, `Button.tsx` |
| Tests | co-located, mirror source name + `.test` | `Button.test.tsx`, `lru.test.ts` |
| Redux state | `*.slice.ts` | `auth.slice.ts` |
| Zustand state | `*.store.ts` | `auth.store.ts` |
| Barrels | `index.ts` re-exporting a folder's public API | `theme/index.ts` |

- Import internal modules with the `@/` alias: `import { lru } from '@/lib/ds/lru'`.
- Default to **named exports**; reserve `default` exports for React component files.

## Where new code goes

| You are adding... | Put it in... |
| --- | --- |
| A pure data structure | `src/lib/ds/` |
| A pure algorithm | `src/lib/algo/` |
| Design tokens / theme changes | `src/theme/` |
| App-wide config / registries (nav, statuses, defaults) | `src/config/` |
| A user-facing string / locale | `src/i18n/` |
| A shared presentational component | `src/components/{ui,layout,forms,data,feedback}/` |
| A self-contained product feature | `src/features/<feature>/` (copy `features/_template/`) |
| A routed screen / page | `src/features/<feature>/pages/` |
| A feature-only component / hook | `src/features/<feature>/components|hooks/` |
| A reusable React hook (2+ features) | `src/hooks/` |
| The HTTP instance + interceptors | `src/api/` |
| Generated API client | `src/sdk/` (do not hand-edit) |
| A feature's query/mutation wrappers | `src/features/<feature>/api/` |
| Client state (slice/store) | `src/store/` or `src/features/<feature>/` |
| Route definitions / guards | `src/router/` |
| A shared type | `src/types/` |
| A small pure helper | `src/utils/` |
| A unit test | next to its source as `*.test.ts(x)` |

- Every folder above already exists (scaffolded empty with a `README.md`) — drop files in, don't recreate the structure.
- **Feature-first**: keep a feature's components, hooks, api, and state inside `src/features/<feature>/`. Promote to a shared top-level folder (`components/`, `hooks/`, `api/`) only once a second feature needs it.
- Keep `src/lib/` and `src/utils/` free of React and app state — they must stay portable and pure.

## Adding a feature (the one per-instance pattern)

All top-level folders already exist. The only structure you create per project is each feature under `src/features/<feature>/` — and even that ships as a copy-me skeleton.

1. Copy `src/features/_template/` → `src/features/<feature-name>/` (kebab-case).
2. Fill the sub-structure:

| Subfolder | Contents | Naming |
| --- | --- | --- |
| `pages/` | Route-level page components for the feature | PascalCase (`LeadsListPage.tsx`) |
| `components/` | Components used only by this feature | PascalCase |
| `hooks/` | Feature-only hooks | camelCase, `use` prefix |
| `api/` | React Query wrappers over the generated `sdk/` | camelCase (`useLeads.ts`) |
| `config/` | Column / filter / tab / form configs | kebab-case |
| `index.ts` | Public barrel — the feature's only import surface | — |

3. Register the feature's routes in `src/router/`.

- **Promote, don't duplicate**: when a second feature needs a component/hook, move it to the shared top-level folder (`components/`, `hooks/`).
- **State library is pluggable**: pick Redux Toolkit *or* Zustand per project and stay consistent. File suffix signals the choice (`*.slice.ts` vs `*.store.ts`).
- **Barrels**: expose a folder's public surface via `index.ts`; import via `@/<folder>` rather than reaching into internal files.
- Delete `src/features/_template/` if you don't want the example skeleton.
