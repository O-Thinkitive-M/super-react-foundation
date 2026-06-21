# 04 — Config Registries (`src/config/*`)

> **Single source of truth.** Every module, route, permission, status, icon, and PHI rule is **declared once** in `src/config/`. Screens read config; they never hardcode these values.
> **Portal note:** structure is **identical** across Admin / Provider / Patient / Website-Widget. Only the **values** differ (nav list, roles, status sets). Swap the data, keep the shape.

---

## Registry Files at a Glance

| File | Exports | Consumed by |
|---|---|---|
| `roles.ts` | `ROLES` enum + type | permissions, `RoleRoute`, PHI |
| `permissions.ts` | `PERMISSIONS` keys + `ROLE_PERMISSIONS` matrix + `can()` | guards, PHI masking, action gating |
| `routes.ts` | `ROUTES` path constants (11 modules + nested) | router, nav, links |
| `navigation.ts` | `NAV_MENU` array `{title,route,icon,children,perm}` | sidebar, breadcrumbs |
| `settings.config.ts` | `SETTINGS_HUB` typed registry (3 levels) | `SettingsHub`, `NestedTabPage` |
| `icons.ts` | semantic Lucide aliases | everywhere (no raw lucide imports) |
| `shortcuts.ts` | `SHORTCUTS` keymap | global hotkey handler |
| `constants.ts` | timeouts, page sizes, limits | hooks, api, tables |
| `status.ts` | `STATUS_REGISTRY` (status/priority → meta) | `StatusChip`, filters |
| `phi.ts` | `PHI_RULES` (field → mask + perm) | `DataTable` columns, detail views |

> All text labels are **i18n keys** (`labelKey`), never literals — resolved via `src/i18n/`.

---

## `roles.ts`
```ts
export const ROLES = {
  ADMIN: 'ADMIN', PROVIDER: 'PROVIDER', AGENT: 'AGENT',
  BILLER: 'BILLER', GUARDIAN: 'GUARDIAN',
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];
```

## `permissions.ts` — matrix
```ts
export const PERMISSIONS = {
  PATIENT_VIEW: 'patient.view', PATIENT_PHI_VIEW: 'patient.phi.view',
  BILLING_EDIT: 'billing.edit', SETTINGS_MANAGE: 'settings.manage',
  // …one key per gated capability
} as const;
export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  ADMIN:    Object.values(PERMISSIONS),               // full
  PROVIDER: [PERMISSIONS.PATIENT_VIEW, PERMISSIONS.PATIENT_PHI_VIEW],
  AGENT:    [PERMISSIONS.PATIENT_VIEW],
  BILLER:   [PERMISSIONS.PATIENT_VIEW, PERMISSIONS.BILLING_EDIT],
  GUARDIAN: [PERMISSIONS.PATIENT_VIEW],
};

export const can = (role: Role, perm: PermissionKey) =>
  ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
```

## `routes.ts` — 11 modules + nested path constants
```ts
export const ROUTES = {
  DASHBOARD: '/dashboard',
  LEADS: '/leads',
  PATIENTS: '/patients',          // ?tab=active|archived
  SCHEDULING: '/scheduling',      // /appointments | /encounter
  GROUPS: '/groups',
  REFERRALS: '/referrals',        // /in | /out  (sub: fax|email)
  COMMUNICATION: '/communication',// /messages|/fax|/triage|/contacts|/call-log|/requests
  BILLING: '/billing',            // /charge-capture|/claims|/remits|/ar|/invoicing|/payments|/collection
  LEGAL: '/legal',                // /delinquents | /depositions
  REPORTS: '/reports',            // ?category=marketing|billing|operational
  SETTINGS: '/settings',          // hub → :section → :tab
} as const;

// nested helpers keep deep paths DRY
export const COMM_ROUTES = {
  MESSAGES: `${ROUTES.COMMUNICATION}/messages`,
  TRIAGE: `${ROUTES.COMMUNICATION}/triage`,   // 7 status sub-tabs
  // …
} as const;
```

## `navigation.ts` — menu config
```ts
export interface NavItem {
  titleKey: string; route: string; icon: IconName;
  perm?: PermissionKey; children?: NavItem[];
}
export const NAV_MENU: NavItem[] = [
  { titleKey: 'nav.dashboard', route: ROUTES.DASHBOARD, icon: 'dashboard' },
  { titleKey: 'nav.communication', route: ROUTES.COMMUNICATION, icon: 'message',
    children: [
      { titleKey: 'nav.comm.messages', route: COMM_ROUTES.MESSAGES, icon: 'message' },
      { titleKey: 'nav.comm.triage', route: COMM_ROUTES.TRIAGE, icon: 'triage' },
      // …fax, contacts, callLog, requests
    ]},
  // …all 11 modules; `perm` hides items the role can't access
];
```

## `settings.config.ts` — typed 3-level hub
> Hub card-grid → 7 sections → each section's inner tabs → each tab = **table** or **form** descriptor. Drives `SettingsHub` + `NestedTabPage` so **30+ settings screens are 0 hand-built pages**.
```ts
type TabDescriptor =
  | { kind: 'table'; tableId: string }       // → DataTable config id
  | { kind: 'form';  formId: string };       // → SchemaForm config id

interface SettingsTab { key: string; labelKey: string; perm?: PermissionKey; view: TabDescriptor; }
interface SettingsSection { key: string; labelKey: string; icon: IconName; tabs: SettingsTab[]; }

export const SETTINGS_HUB: SettingsSection[] = [
  { key: 'appointment', labelKey: 'settings.appointment', icon: 'calendar', tabs: [
      { key: 'availability', labelKey: 'settings.availability', view: { kind: 'table', tableId: 'availability' } },
      { key: 'holidays',     labelKey: 'settings.holidays',     view: { kind: 'table', tableId: 'holidays' } },
      { key: 'apptTypes',    labelKey: 'settings.apptTypes',    view: { kind: 'table', tableId: 'apptTypes' } },
  ]},
  { key: 'clinic', labelKey: 'settings.clinic', icon: 'building', tabs: [
      /* profile(form) · locations · users · roles · phiConfig · departments · securityQuestions */ ]},
  { key: 'billing', labelKey: 'settings.billing', icon: 'billing', tabs: [
      /* feeSchedule · allowedAmount · legalOtherFee · paymentPolicy */ ]},
  { key: 'templates', labelKey: 'settings.templates', icon: 'template', tabs: [ /* visitNote · macros */ ]},
  { key: 'master', labelKey: 'settings.master', icon: 'database', tabs: [ /* dataImport · icd10 · cpt · payer */ ]},
  { key: 'alerts', labelKey: 'settings.alerts', icon: 'alert', tabs: [ /* alert */ ]},
  { key: 'auditLog', labelKey: 'settings.auditLog', icon: 'audit', tabs: [ /* auditLog(table) */ ]},
];
```

## `icons.ts` — semantic Lucide aliases
> One indirection layer: components reference **roles** (`'patient'`), never icon file names. Re-skin globally in one place.
```ts
import { Users, Calendar, MessageSquare, FileText, /* … */ } from 'lucide-react';
export const ICONS = {
  patient: Users, calendar: Calendar, message: MessageSquare, document: FileText,
  triage: /* … */, billing: /* … */, settings: /* … */,
} as const;
export type IconName = keyof typeof ICONS;
```

## `shortcuts.ts`
```ts
export const SHORTCUTS = {
  GLOBAL_SEARCH: 'mod+k', NEW_PATIENT: 'mod+shift+p',
  GO_DASHBOARD: 'g d', CLOSE_DRAWER: 'esc',
} as const;
```

## `constants.ts`
```ts
export const SESSION_TIMEOUT_MS = 15 * 60_000;     // 15 min idle → logout
export const SESSION_WARN_MS = 60_000;             // warn 1 min before
export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;
export const DEBOUNCE_MS = 300;                    // search/autocomplete
export const TOAST_DURATION_MS = 4000;
export const MAX_UPLOAD_MB = 25;
```

## `status.ts` — status / priority registry
> `status key → { labelKey, color, variant }`. `StatusChip` + filter dropdowns read this. **Never** style status inline.
```ts
type StatusMeta = { labelKey: string; color: string; variant: 'filled' | 'outlined' | 'soft' };
export const STATUS_REGISTRY: Record<string, StatusMeta> = {
  // generic record
  ACTIVE:      { labelKey: 'status.active',   color: 'success', variant: 'soft' },
  INACTIVE:    { labelKey: 'status.inactive', color: 'default', variant: 'soft' },
  PENDING:     { labelKey: 'status.pending',  color: 'warning', variant: 'soft' },
  // request / message lifecycle
  OPEN:        { labelKey: 'status.open',        color: 'info',    variant: 'soft' },
  IN_PROGRESS: { labelKey: 'status.inProgress',  color: 'warning', variant: 'soft' },
  RESPONDED:   { labelKey: 'status.responded',   color: 'primary', variant: 'soft' },
  CLOSED:      { labelKey: 'status.closed',      color: 'default', variant: 'soft' },
  // priority / triage
  STAT:        { labelKey: 'priority.stat',   color: 'error',   variant: 'filled' },
  URGENT:      { labelKey: 'priority.urgent', color: 'error',   variant: 'soft' },
  HIGH:        { labelKey: 'priority.high',   color: 'warning', variant: 'soft' },
  MEDIUM:      { labelKey: 'priority.medium', color: 'info',    variant: 'soft' },
  LOW:         { labelKey: 'priority.low',    color: 'default', variant: 'soft' },
  NEW_PATIENT: { labelKey: 'status.newPatient', color: 'primary', variant: 'soft' },
  // legal / collections pipeline
  PRE_DEMAND:    { labelKey: 'legal.preDemand',    color: 'default', variant: 'soft' },
  DEMAND_SENT:   { labelKey: 'legal.demandSent',   color: 'info',    variant: 'soft' },
  LAWSUIT_FILED: { labelKey: 'legal.lawsuitFiled', color: 'error',   variant: 'soft' },
  MSA_PENDING:   { labelKey: 'legal.msaPending',   color: 'warning', variant: 'soft' },
  MSA_PARTIAL:   { labelKey: 'legal.msaPartial',   color: 'warning', variant: 'soft' },
  SSA_PENDING:   { labelKey: 'legal.ssaPending',   color: 'warning', variant: 'soft' },
  SSA_COMPLETE:  { labelKey: 'legal.ssaComplete',  color: 'success', variant: 'soft' },
  // processing / jobs
  PROCESSING:  { labelKey: 'status.processing', color: 'info',    variant: 'soft' },
  COMPLETED:   { labelKey: 'status.completed',  color: 'success', variant: 'soft' },
  FAILED:      { labelKey: 'status.failed',     color: 'error',   variant: 'soft' },
};
```
> `color` maps to MUI theme palette keys (resolved in `StatusChip`) — not raw hex. Mark client-specific legal stages **uncertain**: confirm exact set per portal before locking.

## `phi.ts` — per-field masking + permission
```ts
type PhiRule = { mask: (raw: string) => string; revealPerm: PermissionKey };
export const PHI_RULES: Record<string, PhiRule> = {
  phone: { mask: p => `+1 (***) ***-${p.slice(-4)}`, revealPerm: PERMISSIONS.PATIENT_PHI_VIEW },
  ssn:   { mask: s => `***-**-${s.slice(-4)}`,        revealPerm: PERMISSIONS.PATIENT_PHI_VIEW },
  email: { mask: e => `${e[0]}***@${e.split('@')[1]}`, revealPerm: PERMISSIONS.PATIENT_PHI_VIEW },
  dob:   { mask: () => '**/**/****',                   revealPerm: PERMISSIONS.PATIENT_PHI_VIEW },
};
// DataTable column: value = can(role, rule.revealPerm) ? raw : rule.mask(raw)
```

---

## Conventions / Rules
| Rule | Why |
|---|---|
| All labels are `labelKey` (i18n), never literals | `no-literal-string` lint gate |
| `color` = palette key, never hex | theme-token consistency |
| New status/role/route = edit config only | no screen code touched |
| PHI rendering goes through `PHI_RULES` + `can()` | HIPAA, single audit point |
| Components import `ICONS`, not `lucide-react` directly | global re-skin |
