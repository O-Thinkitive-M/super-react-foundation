# 02 — Project Scaffold

> Vite + React + TypeScript (strict), feature-slice layout, path aliases, multi-env config.
> Identical scaffold across Admin/Provider/Patient/Website-Widget portals.

---

## Init & Install

> **Install Core Foundation packages ONLY (see `01`).** Integration packages — `orval`/generated SDK,
> Stripe, OCR, telehealth — are **NOT** installed here; add each later when that integration is built and
> rolled out across **all four portals together**. **E2E (Playwright/MSW) is out of FE scope entirely** —
> owned by QA, never installed in the FE project.

```bash
# Node >= 22.18 required (Node guard runs on install; see 17-api-sdk-orval.md)
npm create vite@latest harmony-emr-provider -- --template react-ts
cd harmony-emr-provider

# runtime (core foundation only)
npm i @mui/material @mui/icons-material @emotion/react @emotion/styled \
  react-router-dom @tanstack/react-query @tanstack/react-virtual \
  zustand react-hook-form zod @hookform/resolvers \
  axios dayjs react-i18next i18next lucide-react tabbable

# dev (core foundation only)
npm i -D vitest @testing-library/react @testing-library/jest-dom jest-axe \
  @tanstack/react-query-devtools husky lint-staged \
  eslint typescript-eslint eslint-plugin-react-hooks eslint-plugin-i18next prettier

# --- DEFERRED: run these only when building that integration, for all portals ---
# API SDK:    npm i -D orval        (then `npm run generate-sdk` once a spec URL exists)
# Payments:   npm i @stripe/stripe-js @stripe/react-stripe-js
# OCR / Telehealth: add when those features are implemented
# (E2E testing is out of FE scope — owned separately by QA; no Playwright/MSW here)
```

---

## `tsconfig.json` (strict settings)

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

---

## `src/` Feature-Slice Tree

```text
src/
  theme/          # palette, typography, spacing, shadows, breakpoints, radii, components, index
  config/         # app-wide config: nav, status registries, table/filter defaults
  i18n/           # text registry (no hardcoded strings), locales
  components/
    ui/           # buttons, chips, badges, TruncatedText
    layout/       # AppShell, Nav, SplitPane, MasterDetail, NestedTabPage
    forms/        # SchemaForm, FormSection, AsyncAutocomplete
    data/         # DataTable, FilterBar, KpiCard
    feedback/     # ErrorBoundary, QueryState, Drawer, Modal, toasts
  features/
    <feature>/    # leads, patients, scheduling, groups, referrals, ...
      api/        # feature-specific query/mutation wrappers (over sdk)
      components/ # feature-only components
      pages/      # route page components
      hooks/      # feature hooks
      config/     # column/filter/tab/form configs
      index.ts    # public barrel
  hooks/          # shared hooks
  api/            # axios mutator (instance + interceptors)
  sdk/            # Orval-generated (do not hand-edit)
  store/          # zustand stores
  router/         # createBrowserRouter, route tree, guards
  types/          # shared types
  utils/          # helpers
  App.tsx
  main.tsx
```

---

## Path Aliases

**`vite.config.ts`**
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
```
- `tsconfig.json` `paths: { "@/*": ["src/*"] }` (above) keeps editor + build in sync.
- Import style: `import { DataTable } from "@/components/data";`

---

## Environment Strategy

Per-environment files, Vite-prefixed (`VITE_*`) vars only are exposed to the client.

| File | Used for |
|---|---|
| `.env.development` | local dev |
| `.env.qa` | QA |
| `.env.uat` | UAT |
| `.env.production` | prod |

**Example `.env.development`**
```ini
VITE_API_URL=https://api.dev.harmony.local
VITE_APP_ENV=development
VITE_DEFAULT_TZ=America/New_York
VITE_PORTAL=provider   # admin | provider | patient | widget
# Integration vars added only when that integration ships, e.g.:
# VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx   (added with Stripe/payments)
```

- Access via `import.meta.env.VITE_API_URL`.
- Build per env: `vite build --mode qa` (reads `.env.qa`).

**`.gitignore` (env entries)**
```gitignore
.env
.env.*.local
.env.local
*.local
```
> Commit `.env.{development,qa,uat,production}` only if they hold **no secrets**; keep real keys in `.env.*.local` (ignored).
