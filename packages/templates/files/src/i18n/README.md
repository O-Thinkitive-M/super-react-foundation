# i18n/

Text registry — the home for **all user-facing strings**. No hardcoded copy in components (see coding-standards).

| Path | Purpose |
| --- | --- |
| `index.ts` | i18n setup + `t()` / `useTranslation` export. |
| `locales/en.json` | Default locale strings, namespaced by feature. |
| `locales/<lang>.json` | Additional locales. |

Reference strings by key; never inline literals in JSX.
