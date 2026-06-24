# Config Registries (`src/config/*`)

> Generic foundation doc. Copied verbatim into every project's `project-setup/config-registries.md`.
> **Single source of truth:** every route, nav item, permission, status, icon, and tunable constant is **declared once** in `src/config/`. Screens read config; they never hardcode these values. Structure is identical across projects — only the *values* differ.

## Why config-driven

- One registry change propagates everywhere — add a status/role/route by editing config, not screen code.
- Data, not control flow: enum → label/color/icon is a `Record`, never a `switch` chain.
- Keeps text out of components (labels are i18n keys) and styling out of components (colors are theme keys).

## Registry files at a glance

| File | Exports | Consumed by |
|---|---|---|
| `routes.ts` (in `src/router/`) | `ROUTES` / `paths` path constants | router, nav, links |
| `navigation.ts` | `NAV_MENU` array `{ titleKey, route, icon, perm, children }` | sidebar, breadcrumbs |
| `roles.ts` | `ROLES` + `Role` type | permissions, role guards |
| `permissions.ts` | `PERMISSIONS` keys + `ROLE_PERMISSIONS` matrix + `can()` | guards, action gating |
| `icons.ts` | semantic icon aliases | everywhere (no raw icon imports) |
| `status.ts` | `STATUS_REGISTRY` (status → meta) | `StatusChip`, filters |
| `constants.ts` | timeouts, page sizes, debounce, limits | hooks, api, tables |
| `shortcuts.ts` | keymap (combo → i18n label) | global hotkeys (see `accessibility.md`) |

> All text labels are **i18n keys** (`titleKey`/`labelKey`), never literals. All colors are **theme palette keys**, never hex.

## `navigation.ts`

```ts
import type { IconName } from "./icons";
import type { PermissionKey } from "./permissions";

export interface NavItem {
  titleKey: string;
  route: string;
  icon: IconName;
  perm?: PermissionKey;     // hides the item if the role lacks it
  children?: NavItem[];     // nested groups
}

export const NAV_MENU: NavItem[] = [
  { titleKey: "nav.dashboard", route: "/dashboard", icon: "dashboard" },
  // { titleKey: "nav.users", route: "/users", icon: "users", perm: "users.view" },
];
```

## `roles.ts` + `permissions.ts` (RBAC matrix)

```ts
// roles.ts
export const ROLES = { ADMIN: "ADMIN", USER: "USER" } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

// permissions.ts
export const PERMISSIONS = {
  USERS_VIEW: "users.view",
  USERS_EDIT: "users.edit",
} as const;
export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  ADMIN: Object.values(PERMISSIONS),       // full
  USER: [PERMISSIONS.USERS_VIEW],
};

export const can = (role: Role, perm: PermissionKey): boolean =>
  ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
```

- `can()` powers route role-guards (`router/guards.tsx`), action gating, and (with a `<CanAccess>` wrapper) conditional rendering — see `security.md`.

## `icons.ts` — one indirection layer

```ts
// Components reference semantic roles ('users'), never icon file names → re-skin globally in one place.
import { LayoutDashboard, Users, Settings } from "lucide-react";

export const ICONS = {
  dashboard: LayoutDashboard,
  users: Users,
  settings: Settings,
} as const;
export type IconName = keyof typeof ICONS;
```

> Components import `ICONS`, never the icon library directly. Swapping the icon set is a one-file change.

## `status.ts` — status / priority registry

```ts
type StatusMeta = { labelKey: string; color: "success" | "warning" | "error" | "info" | "default"; variant: "filled" | "outlined" | "soft" };

export const STATUS_REGISTRY: Record<string, StatusMeta> = {
  active:   { labelKey: "enums.status.active",   color: "success", variant: "soft" },
  pending:  { labelKey: "enums.status.pending",  color: "warning", variant: "soft" },
  inactive: { labelKey: "enums.status.inactive", color: "default", variant: "outlined" },
};
export type StatusKey = keyof typeof STATUS_REGISTRY;
```

- `color` maps to theme palette keys (resolved in `StatusChip`), never raw hex. New status = one entry + one i18n key, zero component edits. See `data-display.md`.

## `constants.ts`

```ts
export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;
export const DEBOUNCE_MS = 300;          // search / autocomplete
export const TOAST_DURATION_MS = 4000;
export const SESSION_IDLE_MS = 30 * 60_000;   // see security.md
```

## Conventions

| Rule | Why |
|---|---|
| Labels are i18n keys, never literals | `no-literal-string` lint gate (see `i18n.md`) |
| `color` = palette key, never hex | theme-token consistency |
| New status/role/route = edit config only | no screen code touched |
| Components import `ICONS`, not the icon lib | global re-skin in one place |
| Constants live here, not inlined | one place to tune page size, timeouts, debounce |

## Adapt per project (from UI/SRS/MOM)

- Fill `NAV_MENU` with the real modules/screens and their icons.
- Define the real `ROLES`, `PERMISSIONS`, and `ROLE_PERMISSIONS` matrix from the RBAC spec.
- Populate `STATUS_REGISTRY` with the project's real statuses/priorities and their colors.
- Map `ICONS` to the chosen icon set's symbols.
- The **shape** of every registry stays fixed; only the data changes.
