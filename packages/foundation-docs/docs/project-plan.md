# Project Plan (Master Plan)

> Foundation doc — copied into every project's `project-setup/project-plan.md`.
> **The architecture/thesis is fixed; the project specifics are filled in per project.** This is the top-level map: the build philosophy, how the topic docs compose, and the per-project sections (screens, modules, phases) that the agent completes from the **UI / SRS / MOM**.
> This is a **project-variable** doc — the sections marked *(fill per project)* are populated during analyze/plan; the thesis and composition map stay the same.

## Core thesis — config-driven primitives

- Build a **small set of config-driven primitives** (DataTable, FilterBar, StatusChip, SchemaForm, layouts, overlays), then **assemble every screen declaratively** from `config + primitives`.
- Each screen = a declarative config object (columns, filters, tabs, form schema, status map) + a generic primitive that renders it. One primitive serves dozens of screens — fix once, propagates everywhere.
- No bespoke per-screen layout code. Config lives in `src/config/` and per-feature `features/<feature>/config/`; primitives in `src/components/`.

## Screen → primitive map (the assembly vocabulary)

| Screen pattern | Primitive(s) | Doc |
|---|---|---|
| List / index | `DataTable` + `FilterBar` + `StatusChip` | `data-display.md` |
| KPI / dashboard strip | `KpiCard` grid | `data-display.md` |
| Detail page | layout + nested tabs / `MasterDetail` | `layout-and-overlays.md` |
| Create / edit | `SchemaForm` (`FormSection` + fields) | `forms.md` |
| Settings (nested) | config-driven hub | `config-registries.md`, `routing.md` |
| Async / error states | query state + error boundary | `error-handling.md` |

## Topic docs — composition map

| Doc | Purpose |
|---|---|
| `tech-stack.md` | pinned deps + decisions |
| `folder-structure.md` | the scaffolded `src/` tree |
| `architecture.md` | layers + data flow |
| `theme.md` | design tokens *(values fill per project)* |
| `config-registries.md` | nav/roles/permissions/status/icons/constants *(values fill per project)* |
| `responsive-system.md` | breakpoints, no-break rules |
| `routing.md` | router tree, guards, URL state |
| `state-management.md` | client state (chosen library) |
| `api-strategy.md` | typed client or generated SDK |
| `data-display.md` | DataTable + list primitives |
| `forms.md` | schema-driven forms *(schemas fill per project)* |
| `layout-and-overlays.md` | shells, drawer/modal/toast |
| `accessibility.md` | WCAG 2.1 AA, keyboard |
| `i18n.md` | typed text registry, no literals |
| `datetime-timezone.md` | UTC store / tz display |
| `error-handling.md` | boundaries, query states, toasts |
| `security.md` | baseline + compliance overlay |
| `performance.md` | code-split, virtualize, budgets |
| `cross-browser.md` | support matrix, smoke tests |
| `quality-gates.md` | lint/type/test/CI gates |
| `data-structures.md` | reusable `src/lib/ds` + `src/lib/algo` |
| `testing-strategy.md` | unit/component/a11y testing |
| `deployment.md` | build + host |
| `mcp-integration.md` | Figma/GitHub/Jira MCP setup |
| `foundation-checklist.md` | the DoD gate before features |
| `how-it-works.md` | step-by-step walkthrough of the default app |

## Global definition of done (every screen)

- [ ] No hardcoded UI strings — all text via `src/i18n/` (`no-literal-string` passes).
- [ ] Built from config + existing primitives; no bespoke layout duplication.
- [ ] Responsive 320px → large; no horizontal scroll traps.
- [ ] WCAG 2.1 AA: keyboard nav, focus, contrast, ARIA.
- [ ] TypeScript strict, zero `any`, zero TS errors.
- [ ] All colors/spacing/type from theme tokens (no hardcoded hex/px).
- [ ] Data via React Query hooks; loading/error states handled.
- [ ] URL deep-linking for filters/tabs/pagination where applicable.
- [ ] Lint + typecheck + tests green.

---

## Project specifics *(fill per project from UI / SRS / MOM)*

### Executive summary *(fill per project)*
- What the product is, who uses it, and the core thesis applied to it.

### Modules / feature set *(fill per project)*
- The list of nav modules/features (drives `NAV_MENU` in `config-registries.md`).

### Screen → primitive map for THIS project *(fill per project)*
- Each real screen mapped to the primitives above + its config location.

### Build phase sequence *(fill per project)*

| Phase | Output |
|---|---|
| 1. Scaffold | foundation in place (this repo) |
| 2. Theme + config | brand tokens + registries from the design/SRS |
| 3. Primitives | the data/form/layout primitives the screens need |
| 4. Features | assemble each module from config + primitives |

### Key decisions record *(fill per project)*
- Brand color, state library, API transport (client/SDK), compliance overlay on/off, target browsers, locales.
