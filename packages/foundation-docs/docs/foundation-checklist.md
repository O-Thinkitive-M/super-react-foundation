# Foundation Definition-of-Done Checklist

> Generic foundation doc. Copied verbatim into every project's `project-setup/foundation-checklist.md`.
> The acceptance gate before building features. The scaffold satisfies the baseline items; the *(adapt)* items are completed per project. Each section links to its full doc.

## Scaffold (`folder-structure.md`, `tech-stack.md`)
- [ ] Vite + React + TS strict; Node ≥ 22.18 (`engines`).
- [ ] Feature-slice structure (`src/features/`), `@/` path alias.
- [ ] `.env.example` present; `.env` gitignored.

## Theme (`theme.md`)
- [ ] `ThemeProvider` + `CssBaseline` wired (seeded).
- [ ] *(adapt)* Brand palette + typography from the design; tokens only, no hardcoded hex/px.

## Config registries (`config-registries.md`)
- [ ] *(adapt)* `NAV_MENU`, roles/permissions matrix, `STATUS_REGISTRY`, `ICONS`, constants populated.

## Responsive (`responsive-system.md`)
- [ ] Usable 320px → large; no horizontal scroll traps.
- [ ] Tables collapse to cards below `sm`.

## Routing + URL state (`routing.md`)
- [ ] react-router v7 data router; routes lazy per feature (seeded).
- [ ] Filters/tabs/pagination reflected in the URL.
- [ ] *(adapt)* Real auth wired (demo stub replaced); role guards enforce.

## State / data (`state-management.md`, `api-strategy.md`)
- [ ] Chosen client-state library wired (Redux or Zustand).
- [ ] React Query for server state; defaults in `query-client.ts`.
- [ ] API transport in place (typed client or generated SDK).

## i18n — zero literal text (`i18n.md`)
- [ ] Typed registry seeded; demo screen has no hardcoded strings.
- [ ] *(adapt)* `no-literal-string` rule enabled; real copy in place.

## Primitives (`data-display.md`, `forms.md`, `layout-and-overlays.md`)
- [ ] *(adapt)* DataTable, forms, layout, overlays built as the screens require — change-safe by contract.

## A11y / keyboard (`accessibility.md`)
- [ ] 13 mandatory UX standards met; focus trap + Esc + restore on overlays.
- [ ] `jest-axe` passes on primitives.

## Security (`security.md`)
- [ ] Baseline: token-storage path documented, idle timeout, CSP/HSTS, no secrets in bundle.
- [ ] *(adapt)* Compliance overlay enabled if the project handles regulated data.

## Date/time (`datetime-timezone.md`)
- [ ] All dates via the helpers; UTC store / tz display; no `new Date()` in components.

## Quality gates (`quality-gates.md`)
- [ ] Strict ESLint `--max-warnings=0`; Husky pre-commit/pre-push; CI green.

## Performance (`performance.md`)
- [ ] Route code-splitting + Suspense skeletons; bundle within budget; long lists virtualized.

## Cross-browser (`cross-browser.md`)
- [ ] `browserslist` set; per-release smoke matrix passes (Safari/iOS especially).

## Error handling (`error-handling.md`)
- [ ] Route + component error boundaries; API errors → friendly toasts; empty/loading/error states everywhere.

## Testing (`testing-strategy.md`)
- [ ] Vitest + RTL configured; per-primitive contract tests; coverage gates met.

## End-to-end verification

| Step | Command | Expected |
|---|---|---|
| Run | `npm run dev` | loads, no console errors |
| Lint | `npm run lint` | 0 warnings/errors |
| Type-check | `npm run typecheck` | 0 errors |
| Test | `npm run test` | pass + coverage gates |
| Build | `npm run build` | succeeds, within budget |

## Ready-to-build gate
- [ ] Every box above checked (or consciously deferred with a note).
- [ ] All verification commands green.
- [ ] No open Critical/High review findings.

> When this gate passes, the foundation is change-safe and feature development can begin.
