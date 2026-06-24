# Tech Stack & Decisions

> Generic foundation doc. Copied verbatim into every project's `project-setup/tech-stack.md`.
> Identical across projects — the pinned, coherent set the scaffold installs. TypeScript strict throughout. **Node ≥ 22.18**.

## Install policy — core now, integrations later

- The scaffold installs **only the core foundation packages** below.
- **Integration packages** (payments, generated API SDK, OCR, telehealth, analytics, …) are **not** installed up front. Add each only when that integration is actually built, so the base stays lean and free of unused third-party surface.
- The one exception is the **SDK option** (`scaffold --sdk`), which adds `axios` + `orval` because the API transport is a setup-time choice — see `api-strategy.md`.

## Core foundation dependencies

| Package | Version line | Purpose |
|---|---|---|
| `react` / `react-dom` | 19 | UI runtime — function components + hooks only |
| `typescript` | latest stable | Strict typing (`strict`, `noUncheckedIndexedAccess`) |
| `vite` | 8 | Build / dev server |
| `@vitejs/plugin-react` | latest stable | React + Fast Refresh |
| `@mui/material` | latest stable | Component library |
| `@emotion/react` / `@emotion/styled` | latest stable | MUI styling engine |
| `react-router-dom` | 7 | Routing (`createBrowserRouter`) |
| `@tanstack/react-query` | 5 | Server state / caching |
| `i18next` / `react-i18next` | latest stable | Text registry / localization (see `i18n.md`) |

## Commonly-added foundation deps (install when the matching system is built)

> These are part of the documented architecture but pulled in per the "install later" policy. Add them when you build the system that needs them — versions pinned to one coherent set at install time.

| Package | Adds | Doc |
|---|---|---|
| `@tanstack/react-virtual` | list/table virtualization | `data-display.md`, `performance.md` |
| `react-hook-form` + `zod` + `@hookform/resolvers` | schema-driven forms | `forms.md` |
| `dayjs` (+ utc/timezone plugins) | dates/times | `datetime-timezone.md` |
| `tabbable` | focus trap (drawer/modal a11y) | `accessibility.md` |
| state library (`@reduxjs/toolkit`+`react-redux` **or** `zustand`) | client state — chosen at scaffold | `state-management.md` |
| icon set (e.g. `lucide-react`) | semantic icons via a `config/icons.ts` alias layer | `config-registries.md` |

## Core dev dependencies

| Package | Purpose |
|---|---|
| `eslint` + `typescript-eslint` + `@eslint/js` | linting (flat config) |
| `prettier` | formatting (single source of truth) |
| `vitest` + `@testing-library/react` | unit/component tests |
| `@testing-library/jest-dom`, `jest-axe` | DOM matchers, a11y assertions (add when used) |
| `husky` + `lint-staged` | git hooks (see `quality-gates.md`) |

## Deferred / integration packages (not installed at scaffold)

| Integration | Package(s) | Add when |
|---|---|---|
| API typed SDK | `orval` (dev) + generated `src/sdk/**` | SDK option chosen (`--sdk`) or a backend OpenAPI spec exists |
| Payments | provider SDK (e.g. Stripe Elements) | a payments flow is built |
| File/OCR, telehealth, analytics, maps, … | per-vendor SDK | that feature is built |

> **E2E testing** (Playwright/Cypress) is typically owned by QA, not the FE foundation — add only if the project decides the FE repo owns it.

## Key decisions (rationale)

| Topic | Choice | Why |
|---|---|---|
| Language | TypeScript **strict** + `noUncheckedIndexedAccess` | safety on a large codebase; forces `undefined` handling for config-driven rendering |
| UI runtime | React 19 + MUI + Emotion | current generation; theme-token driven |
| Build | Vite | fast dev + esbuild/rollup production build |
| Server vs client state | React Query (server) + chosen store (client) | right tool per concern, no overlap |
| API layer | hand-rolled typed client **or** generated SDK (Orval) | decided at setup; same React Query layer above either — see `api-strategy.md` |
| Routing | react-router v7 data router | loaders/actions/`errorElement`, URL as source of truth |
| Forms | react-hook-form + zod | one schema → validation + types + payload |
| i18n | typed registry, no hardcoded UI text | reviewable, translatable, lint-enforced |

## Node / tooling

- **Node ≥ 22.18** — pinned via `.nvmrc` and `package.json` `engines`. `"type": "module"`.
- One coherent latest-stable version set; avoid mixing majors that cause peer conflicts.

## Adapt per project (from SRS/MOM)

- Confirm the exact version of each "verify latest stable" package at install time and pin it.
- Decide which integration packages this project needs and when each is scheduled.
- Pick the client-state library (`--state=redux|zustand`) and API transport (`--sdk` or default) at scaffold.
