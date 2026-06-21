# 16 — Foundation Definition-of-Done Checklist

Master acceptance gate for the Harmony EMR frontend foundation. All boxes must be checked before building features.

## Scaffold
- [ ] Vite 8 + React 19 + TS strict; Node ≥ 22.18 (`engines`)
- [ ] Folder-by-feature structure (`src/features/`, `src/shared/`)
- [ ] Path aliases (`@/`) + absolute imports
- [ ] `.env.example` present; `.env` gitignored

## Theme
- [ ] MUI v7 theme with brand primary `#2D5F8D`
- [ ] System-UI / SF font stack
- [ ] All colors/spacing via theme tokens (no hardcoded values)
- [ ] Light/contrast verified ≥ WCAG AA

## Config Registries
- [ ] DataTable column-config registry
- [ ] Form-field config registry (label/validation/i18n keys)
- [ ] i18n text registry (single source of UI strings)
- [ ] Permissions registry (for `CanAccess`)

## Responsive
- [ ] Usable 320px → 1920px; no horizontal scroll traps
- [ ] Breakpoint behavior verified for nav, tables, forms

## Navigation / Routing + URL State
- [ ] react-router v7 routes, lazy per feature
- [ ] Filters/tabs/pagination reflected in URL (shareable, back/forward safe)
- [ ] `aria-current` on active nav; skip-to-content link

## State / Data
- [ ] zustand v5 stores (auth, UI) with stable selectors
- [ ] TanStack Query v5 for server state (caching/dedup/optimistic)
- [ ] No server data duplicated into zustand

## SDK
- [ ] Orval-generated SDK from OpenAPI
- [ ] Single `customAxios` mutator (auth, audit-log, error mapping)
- [ ] `npm run generate-sdk` reproducible

## Primitives
- [ ] DataTable (sort/filter/paginate/virtualize, loading/empty/error states)
- [ ] Forms (react-hook-form + zod, required asterisk, errors below field)
- [ ] Layout (app shell, header, sidebar, content region)
- [ ] Overlays (modal/drawer/menu/toast) with focus trap + Esc + restore
- [ ] All primitives change-safe by contract (prop API locked by tests)

## A11y / Keyboard
- [ ] 13 mandatory UX standards met (see 11)
- [ ] Keyboard hooks wired (`useShortcut`, `useKeyboardList`, `useFocusTrap`, `useAriaAnnounce`)
- [ ] Command Palette (Ctrl+K) + Shortcut Help (Shift+?)
- [ ] `shortcuts.ts` registry in use
- [ ] jest-axe passes on all primitives

## i18n — Zero Literal Text
- [ ] `no-literal-string` ESLint rule active and passing
- [ ] No hardcoded UI strings anywhere
- [ ] All labels/messages/errors from registry

## Security / HIPAA
- [ ] Audit-log interceptor on all PHI endpoints
- [ ] PHI masking + `CanAccess` gating (PHQ-9 providers only)
- [ ] Soft-delete only (`isArchived`); no hard delete
- [ ] 30-min idle timeout (warn at 28)
- [ ] Stripe tokenization (`cardToken` only)
- [ ] XSS/CSRF/CSP controls in place; token-storage path documented
- [ ] HTTPS enforced; secrets in AWS Secrets Manager

## Quality Gates
- [ ] Strict ESLint rules (see 13) `--max-warnings=0`
- [ ] Husky pre-commit / commit-msg / pre-push active
- [ ] lint-staged + commitlint configured
- [ ] CI on self-hosted EC2 runner green
- [ ] No `--no-verify` usage

## Performance / Fast Load
- [ ] Route-level code-splitting + Suspense skeletons
- [ ] Bundle within budget (initial ≤ 200 KB gzip)
- [ ] Tables + document library virtualized
- [ ] Memoization rules applied; no inline props to memoized children
- [ ] Prefetch-on-intent for routes/data
- [ ] Performance targets met (TTI < 2.5s, CLS < 0.1)

## Cross-Browser
- [ ] Chrome, Firefox, Safari, Edge smoke-tested
- [ ] No console errors per browser

## Error Handling
- [ ] Route + component error boundaries
- [ ] API errors mapped to friendly toasts (i18n)
- [ ] Empty/loading/error states for all async views
- [ ] No broken/blank pages on failure

## Change-Safe Components
- [ ] Primitives consumed only via documented props
- [ ] Contract tests lock prop APIs + variants
- [ ] Breaking a primitive fails CI (not silently breaks consumers)

## Testing (FE scope — e2e owned by QA, not FE)
- [ ] Vitest + RTL + jest-axe configured (no Playwright/MSW on FE)
- [ ] Per-feature + per-primitive contract tests
- [ ] Negative/edge-case + infinite-scroll tests
- [ ] Coverage gates met (≥80% global; 100% primitives/utils)

## End-to-End Verification

| Step | Command | Expected |
|------|---------|----------|
| Run app | `npm run dev` | Loads, no console errors |
| Lint | `npm run lint` | 0 warnings/errors |
| Type-check | `npm run type-check` | 0 errors |
| Test | `npm run test -- --coverage` | Pass + coverage gates |
| Build | `npm run build` | Succeeds, within budget |
| Security | `npm run security:audit` | No high/critical CVEs |
| Per-browser smoke | manual | Chrome/Firefox/Safari/Edge OK |

## Ready-to-Build-Features Gate
- [ ] **Every box above checked**
- [ ] All verification commands green
- [ ] No open Critical/High review findings
- [ ] Foundation docs (11–16) reviewed and signed off

> When this gate passes, the foundation is **change-safe** and feature development can begin.
