# 00 — Master Plan: Harmony EMR Frontend Foundation

> **Scope:** Foundation architecture for the HUPC / Harmony EMR React frontend (client: Harmony United Psychiatric Care).
> **Portal note:** The **foundation, theme system, scaffold, and config-driven primitives** are shared
> verbatim across the Admin / Provider / Patient / Website-Widget portals. The **portal-specific sections
> in THIS file** — Screen→Primitive Map, module/feature set, and Build Phase Sequence — are tailored to the
> **Provider** portal. Config values (nav modules, route maps, status registries, permissions,
> integration set) differ per portal.

---

## Executive Summary
- Large psychiatric-care EHR: screens are **complex but highly repetitive** (tables, filters, KPI strips, tabbed detail pages, schema-driven forms).
- **Core thesis:** build a *small set of config-driven primitives*, then **assemble every screen declaratively** from `config + primitives` across the **17-module** nav-shell EHR clinician workspace. No bespoke per-screen layout code.
- Outcome: change-safe, consistent, fully-responsive, i18n-clean, cross-browser UI delivered fast.

---

## Config-Driven-Primitive Thesis
- Each screen = **declarative config object** (columns, filters, tabs, form schema, status map) + **generic primitive** that renders it.
- One primitive serves dozens of screens → fix/improve once, propagates everywhere.
- Config lives in `src/config/` and per-feature `features/<feature>/config`; primitives in `src/components/`.

---

## Screen → Primitive Map

| Screen pattern | Primitive(s) |
|---|---|
| List/index (Leads, Patients, Referrals, Groups, Reports) | DataTable + FilterBar + StatusChip + ActionDock |
| KPI / dashboard strip | KpiCard grid |
| Patient chart (detail) | NestedTabPage + MasterDetail / SplitPane |
| Create/Edit (Registration, Clinical Documentation) | SchemaForm + FormSection + AsyncAutocomplete |
| Scheduling / calendar | Calendar + TimeSlotGrid |
| Documents (Legal, charts) | DocumentViewer + DocumentLibrary |
| Telehealth visit | Video panel + Drawer |
| Settings (nested) | SettingsHub |
| Async/data states | QueryState + ErrorBoundary |

---

## Topic Files (00–22) — Composition Map

| # | File | One-line purpose |
|---|---|---|
| 00 | MASTER-PLAN | This file — foundation thesis + portal map |
| 01 | tech-stack-and-decisions | Pinned deps + conflict resolution |
| 02 | project-scaffold | Vite init, tsconfig, folder tree, env |
| 03 | theme-system | `src/theme/` tokens + `createTheme` |
| 04 | config-registries | Nav / status / table / filter config registries |
| 05 | responsive-system | Breakpoints, fluid layout 320→1440+ |
| 06 | navigation-and-routing | `createBrowserRouter`, route tree, deep-linking |
| 07 | state-and-data | Zustand stores + React Query cache split |
| 08 | data-display-system | DataTable + FilterBar + StatusChip + KpiCard |
| 09 | forms-system | RHF + zod SchemaForm / FormSection / AsyncAutocomplete |
| 10 | layout-and-overlays | AppShell, SplitPane, NestedTabPage, Drawer / Modal |
| 11 | accessibility-keyboard | WCAG 2.1 AA, keyboard nav, focus, ARIA |
| 12 | security-hipaa | PHI handling, audit, session, HIPAA controls |
| 13 | quality-gates | Lint / typecheck / test gates, CI |
| 14 | performance-scalability | Virtualization, code-split, bundle budgets |
| 15 | testing | Vitest + Testing Library + jest-axe |
| 16 | foundation-checklist | Phase completion checklist |
| 17 | api-sdk-orval | Orval SDK + axios mutator + React Query |
| 18 | cross-browser-compat | Chrome / Edge / Safari / Firefox + iOS / Android |
| 19 | i18n-and-text-registry | No-literal-string typed registry + ESLint |
| 20 | error-handling | ErrorBoundary + QueryState + toasts |
| 21 | datetime-timezone | dayjs, timezone handling |
| 22 | mcp-integration-setup | MCP integration setup |

---

## Reconciled Key Decisions

| Decision | Choice | Note |
|---|---|---|
| Primary color | `#2D5F8D` (Harmony Blue) | Authoritative per brand guidelines |
| Typography | System UI / SF stack | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`; min body 16px |
| TypeScript | Strict + `noUncheckedIndexedAccess` | No `any` escape hatches |
| API layer | Orval-generated typed SDK | Replaces hand-written services |
| Responsiveness | Mobile 320px+ → Large 1440+ | Mac/Retina/any device |
| Cross-browser | Chrome/Edge/Safari/Firefox last-2 + iOS/Android | |
| i18n | No hardcoded UI text | ESLint `no-literal-string`, `src/i18n/` |
| Components | Strong, fully-configurable, change-safe | Config-driven primitives |
| Deep-linking | URL is source of truth | Filters/tabs/pagination in URL |
| Error handling | `ErrorBoundary` + `QueryState` | Consistent async/error UX |
| Accessibility | WCAG 2.1 AA | |

---

## Build Phase Sequence

| Phase | Output |
|---|---|
| 1. Scaffold | Vite + TS strict, folder tree, env, aliases (file 02) |
| 2. Theme | `src/theme/` tokens + `createTheme` + provider (file 03) |
| 3. Config | i18n registry, router, status registries, SDK (files 04–07) |
| 4. Primitives | DataTable…QueryState (files 08–19) |
| 5. Features | Assemble **17 modules** from config + primitives (file 20 + features) |

---

## Global Definition of Done
- [ ] No hardcoded UI strings — all text via `src/i18n/` (ESLint passes `no-literal-string`).
- [ ] Built from config + existing primitives; no bespoke layout duplication.
- [ ] Responsive 320px → 1440px+; verified Mac/Retina.
- [ ] Cross-browser: Chrome/Edge/Safari/Firefox (last-2) + iOS/Android.
- [ ] WCAG 2.1 AA: keyboard nav, focus, contrast, ARIA.
- [ ] TypeScript strict, zero `any`, zero TS errors.
- [ ] All colors/spacing/type from theme tokens (no hardcoded hex/px).
- [ ] Data fetched via Orval SDK hooks; loading/error via `QueryState`.
- [ ] URL deep-linking for filters/tabs/pagination where applicable.
- [ ] Lint + typecheck + tests green.
