# 01 — Tech Stack & Decisions

> Pinned, coherent, latest-stable set. **TypeScript strict** throughout. **Node >= 22.18** (Orval 8 requirement).
> **Core Foundation deps are identical** across Admin/Provider/Patient/Website-Widget. The **Integration
> set differs per portal** — see the per-portal Integration table below. TypeScript strict throughout.
> Node >= 22.18 (Orval 8).

---

## Install policy — Core now, Integrations later

> **At first setup install ONLY the Core Foundation packages below.** Integration packages (payments,
> generated API SDK, OCR, telehealth, etc.) are **NOT** installed during initial scaffold — each is added
> **only when that integration is actually built, and rolled out across all four portals together** (so
> every portal stays on the same version). This keeps the base lean, fast to install, and free of unused
> third-party surface/security exposure until needed.

### Core Foundation Dependencies (install at first setup)

| Package | Version | Purpose |
|---|---|---|
| react / react-dom | 19 | UI runtime |
| typescript | 5.x (verify latest stable) | Strict typing |
| vite | 8 | Build/dev server |
| @vitejs/plugin-react | verify latest stable | React + Fast Refresh |
| @mui/material | v7 | Component library |
| @emotion/react | verify latest stable | MUI styling engine |
| @emotion/styled | verify latest stable | Styled API |
| @mui/icons-material | v7 | MUI icons (secondary) |
| lucide-react | verify latest stable | Primary icon set |
| react-router-dom | v7 | Routing (`createBrowserRouter`) |
| @tanstack/react-query | v5 | Server state / caching |
| @tanstack/react-virtual | verify latest stable | List/table virtualization |
| zustand | v5 | Client/UI state |
| react-hook-form | verify latest stable | Form state |
| zod | verify latest stable | Schema validation |
| @hookform/resolvers | verify latest stable | RHF + zod bridge |
| axios | verify latest stable | HTTP client (base instance + interceptors) |
| dayjs | verify latest stable | Dates/times (see `21-datetime-timezone.md`) |
| react-i18next / i18next | verify latest stable | Text registry / localization |
| tabbable | verify latest stable | Focus trap (Drawer/Modal a11y) |

### Core Dev Dependencies (install at first setup)

| Package | Version | Purpose |
|---|---|---|
| eslint + typescript-eslint | latest stable | Linting |
| eslint-plugin-react / -hooks | latest stable | React rules |
| eslint-plugin-i18next (no-literal-string) | latest stable | Enforce i18n (no hardcoded strings) |
| prettier | latest stable | Formatting |
| husky + lint-staged | latest stable | Git hooks |
| vitest + @testing-library/react + jest-axe | latest stable | Unit/component/a11y tests |
| @tanstack/react-query-devtools | v5 | Query debugging (dev) |

### Integration Packages (DEFERRED — install only when building that integration, for all portals)

| Integration | Package(s) | Added at step |
|---|---|---|
| API typed SDK | `orval` (devDep) + generated `src/sdk/**` ✅ used by all portals (shared) | When a backend OpenAPI spec exists — see `17-api-sdk-orval.md` (wired now, generate later) |
| Payments | `@stripe/stripe-js`, `@stripe/react-stripe-js` – not used by Provider (billing here is view/manage; patient payments live in Patient & Website-Widget) | When Billing/payments integration is built |
| Insurance-card OCR | OCR SDK/lib (TBD) – not used by Provider | When Website-Widget / registration OCR is built |
| Telehealth | Google Meet integration lib (TBD) ✅ Telehealth feature (Provider ships telehealth) | When telehealth is built |

> **insurance-eligibility** is consumed via a backend API (no frontend npm package).

> **E2E testing is out of FE scope** (owned separately by QA) — no Playwright/MSW e2e packages here.
> Backend-side vendors (**SMS = AWS SNS**, **Email = EnGard**, **Telehealth = Google Meet**) are not
> frontend npm packages — the frontend only consumes their API endpoints when those features ship.
> "verify latest stable" = pin the newest stable release at install time; keep one coherent version set.

---

## Conflict-Resolution Decisions

| Topic | Options seen | **Chosen** | Why |
|---|---|---|---|
| Primary color | `#4A75B2` vs `#2D5F8D` | **`#2D5F8D`** | Brand-guideline authoritative "Harmony Blue" |
| Typography | Inter vs System UI/SF | **System UI / SF stack** | Native rendering, zero font load, brand-spec |
| TS config | loose vs strict | **strict + `noUncheckedIndexedAccess`** | Safety on large EHR codebase |
| API layer | hand-written services vs generated | **Orval SDK** | Typed, OpenAPI-synced, eliminates drift |
| Versions | mixed | **one coherent latest-stable set** | Avoid peer conflicts |
| Icons | MUI vs lucide | **lucide-react primary**, MUI secondary | Lighter, consistent line style |
| State | everything in store vs split | **Zustand (UI) + React Query (server)** | Right tool per concern |

---

## Rationale Bullets
- **React 19 + MUI v7 + Vite 8** = current generation; MUI v7 supports React 19 + Emotion.
- **Orval** generates fully-typed hooks from the backend OpenAPI spec → no manual API plumbing, no type drift; uses a single **axios mutator** for auth/interceptors.
- **React Query v5** owns server cache; **Zustand v5** owns light client/UI state — no overlap.
- **react-hook-form + zod** = performant uncontrolled forms with one source of truth for validation, reused by `SchemaForm`.
- **System UI/SF fonts** = no webfont download, crisp on Retina, matches brand.
- **`noUncheckedIndexedAccess`** forces handling of `undefined` from array/record access — critical for config-driven rendering.
- **lucide-react** as primary icons; consistent stroke style, tree-shakeable.

---

## Node / Tooling Note
- **Node >= 22.18** required (Orval 8). Pin via `.nvmrc` / `package.json` `engines`.
- `"engines": { "node": ">=22.18" }` and `"type": "module"`.
