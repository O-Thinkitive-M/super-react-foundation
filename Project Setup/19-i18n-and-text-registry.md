# 19 — i18n & Text Registry

> **No literal text in any component.** Every string flows through a typed `t()` from the `src/i18n/` registry. Framework: **react-i18next** + typed keys (autocomplete + compile error on missing key). Enforced by ESLint `no-literal-string`.

## Why
- Single source of truth for copy → consistent, reviewable, translatable.
- Typed keys → renaming/missing keys are **compile errors**, not runtime blanks.
- WCAG/locale/RTL ready from day one.

## `src/i18n/` structure
| Path | Holds |
|------|-------|
| `src/i18n/index.ts` | i18next init, `t`, `useTranslation` re-export |
| `src/i18n/types.ts` | generated key union → typed `t()` |
| `src/i18n/en/messages/success.ts` | success toasts |
| `src/i18n/en/messages/error.ts` | error toasts / API failures |
| `src/i18n/en/labels.ts` | field + UI labels |
| `src/i18n/en/titles.ts` | page / section / dialog titles |
| `src/i18n/en/descriptions.ts` | helper / empty-state / warning copy |
| `src/i18n/en/buttons.ts` | button + action text |
| `src/i18n/en/tableHeaders.ts` | DataTable column headers |
| `src/i18n/en/validation.ts` | zod error messages |
| `src/i18n/en/enums.ts` | status / enum labels (StatusChip) |
- Mirror per locale: `src/i18n/es/…`, `src/i18n/ar/…` (RTL).

## Category files (shape)
```ts
// src/i18n/en/buttons.ts
export const buttons = {
  createPatient: 'Create Patient',
  addPatient: 'Add Patient',
  cancel: 'Cancel',
  savePatient: 'Save Patient',
  export: 'Export',
  expandAll: 'Expand All',
  collapseAll: 'Collapse All',
} as const;
```
```ts
// src/i18n/en/messages/success.ts
export const success = {
  patientCreated: 'Patient {{name}} created successfully',
  saved: 'Changes saved',
} as const;
```
```ts
// src/i18n/en/validation.ts
export const validation = {
  required: 'This field is required',
  email: 'Enter a valid email',
  phone: 'Enter a valid phone number',
  maxFiles: 'Up to {{count}} files allowed',
} as const;
```

## Bundle assembly + namespaces
Two namespaces: **`common`** (shared across portals) + **`provider`** (portal-only keys).
```ts
// src/i18n/en/index.ts
export const en = {
  common:   { buttons, labels, titles, descriptions, tableHeaders, validation, enums,
              messages: { success, error } },         // shared across portals
  provider: { /* provider-portal-only keys */ },
};
```
Locales are **lazy-loaded per (locale, namespace)** — only the active locale + namespace is fetched,
keeping the bundle lean:
```ts
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

i18n
  .use(resourcesToBackend((lng, ns) => import(`./${lng}/${ns}.ts`)))  // lazy per (locale, namespace)
  .use(initReactI18next)
  .init({
    lng: 'en', fallbackLng: 'en',
    ns: ['common', 'provider'], defaultNS: 'common',
    interpolation: { escapeValue: false },
  });
export { useTranslation } from 'react-i18next';
export const t = i18n.t.bind(i18n);
```
> Add **`i18next-resources-to-backend`** as a dependency.

## Typed keys (compile error on missing key)
The typed union spans **every namespace** (not just `common`) so portal keys are also compile-checked:
```ts
// src/i18n/types.ts  (generated from the en bundle — ALL namespaces, not just common)
import type { common } from './en/common';
import type { provider } from './en/provider';
type Paths<T> = /* recursive dotted-path union */;
export type TxKey =
  | `common:${Paths<typeof common>}`
  | `provider:${Paths<typeof provider>}`;   // every namespace typed → missing keys are compile errors
```
```ts
// react-i18next.d.ts — make t() typed
declare module 'react-i18next' {
  interface CustomTypeOptions { resources: { translation: FlatEn }; }
}
```
- `t('buttons.cratePatient')` → **TS error** (typo caught at build).

## How components consume text
```tsx
const { t } = useTranslation();
<Button>{t('buttons.createPatient')}</Button>
toast.success('messages.success.patientCreated', { name });   // interpolation
<DataTable columns={[{ key:'name', headerKey:'tableHeaders.patientName', /* … */ }]} />
<StatusChip status="active" /> // reads enums.status.active via status registry
```
- DataTable/forms/overlays take **`*Key`** props (string keys), never resolved strings — they call `t()` internally.

## Interpolation & pluralization
```ts
// en
inboxCount_one: '{{count}} new message',
inboxCount_other: '{{count}} new messages',
```
```tsx
t('labels.inboxCount', { count });          // picks _one/_other by count
t('messages.success.patientCreated', { name: 'Jane' });
```

## Locale switch & RTL
```tsx
i18n.changeLanguage('ar');
document.dir = i18n.dir();                   // 'rtl' for ar/he
```
- MUI theme reads `direction: i18n.dir()`; emotion + `stylis-plugin-rtl` flips layout. Use logical CSS (`marginInlineStart`) in primitives.

## ESLint `no-literal-string` (forbid hardcoded text)
```js
// eslint.config.js
import i18next from 'eslint-plugin-i18next';
export default [
  i18next.configs['flat/recommended'],
  { rules: {
      'i18next/no-literal-string': ['error', {
        markupOnly: true,                    // JSX text + string attrs
        'jsx-attributes': { include: ['label','title','placeholder','aria-label','alt'] },
        ignore: ['^[#@/].*', '^\\d+$'],      // allow css tokens, ids, numbers
      }],
  } },
];
// (alternative: react/jsx-no-literals from eslint-plugin-react)
```
- CI fails on any raw JSX string or untranslated label/placeholder/aria attr.

## Workflow to add copy
| Step | Action |
|------|--------|
| 1 | Add key to the right category file (`buttons.ts`, `validation.ts`, …) |
| 2 | Add same key to every locale (en + es + ar) |
| 3 | Regenerate `types.ts` (build/codegen) |
| 4 | Use `t('category.key')` — autocomplete confirms it exists |

## Translation validation in CI
English is the **source of truth**; a CI check fails the build if any locale (`es`, `ar`) drifts from `en`.
```ts
// scripts/i18n-validate.ts — English = source of truth.
// Flatten each locale's key set per namespace and diff against en.
// Exit non-zero on any MISSING or EXTRA key. Wired into 13-quality-gates CI.
```
Add to package scripts and note it runs in CI (file 13):
```jsonc
"scripts": { "i18n:check": "tsx scripts/i18n-validate.ts" }
```

## Legal & business content stays out of the FE bundle
Long-form legal / consent / Terms / clinical-template / marketing copy is served from the backend / CMS
APIs at runtime — it is **NOT** placed in i18n category files. The i18n registry is for **UI chrome only**
(labels, buttons, titles, validation, enums, toasts). This keeps legally-reviewed content versioned
server-side and out of the frontend build.

## Do / Don't
- ✅ Every visible string + aria/alt/placeholder via `t()`; zod messages are validation keys.
- ✅ Namespace portal-specific copy (`provider:*`); share `common.*`. Namespaces are **lazy-loaded** per (locale, namespace).
- ✅ Locales are **CI-validated** against en (source of truth) — missing/extra keys fail the build.
- ✅ Legal / consent / clinical-template / marketing copy is served from the **backend / CMS**, not the i18n bundle.
- ❌ No literal JSX text, no string concatenation for sentences (use interpolation), no per-component copy constants.
