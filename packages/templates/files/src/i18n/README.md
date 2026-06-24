# i18n/

Text registry — the home for **all user-facing strings**. No hardcoded copy in
components. Reference strings by key; never inline literals in JSX. See
`project-setup/i18n.md` for the full spec.

## What ships by default (working, ready to use)

| Path | Purpose |
| --- | --- |
| `index.ts` | i18n init + `t()` / `useTranslation` / `setLocale()` exports. Import from `@/i18n`. |
| `react-i18next.d.ts` | Makes `t()` **typed** — missing/typo keys are compile errors. |
| `en/index.ts` | Assembles the `common` namespace from the category files. |
| `en/buttons.ts` · `titles.ts` · `labels.ts` · `descriptions.ts` | Demo keys, grouped by category. |

These demo keys back the default home screen. They are **safe to delete/replace**
once you add real features — keep the structure, swap the keys.

## Add a string

1. Add the key to the right category file (`buttons.ts`, `titles.ts`, …).
2. Use it: `const { t } = useTranslation(); t('buttons.getStarted')`.
3. Autocomplete confirms it exists; a typo fails the type-check.

## Add a locale / namespace (upgrade path)

Mirror `en/` into `es/`, `ar/`, … and switch `index.ts` to the lazy
`i18next-resources-to-backend` loader. Namespace portal-only copy (e.g.
`provider:*`) and keep shared copy in `common.*`. Details in `project-setup/i18n.md`.
