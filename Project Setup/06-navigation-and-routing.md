# 06 — Navigation & Routing

> **Thesis:** routing is **config-driven**. Nav modules, sub-tabs, and the 3-level Settings hub render from `navigation.ts` / `settings.config.ts` via generic shells (`NestedTabPage`, `SettingsHub`). **Not 30 hand-built pages.** URL is the single source of truth — every screen is refresh-safe and deep-linkable.

---

## Router Tree (`createBrowserRouter`)
```tsx
// src/router/index.tsx
const router = createBrowserRouter([
  { path: '/', element: <PublicRoute><AuthLayout /></PublicRoute>, children: [
      { path: 'login', element: <LoginPage /> },
  ]},
  { element: <ProtectedRoute><MainLayout /></ProtectedRoute>, children: [
      { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'patients', element: lazyEl(() => import('@/features/patients/PatientsPage')) },
      { path: 'communication/:tab?', element: <CommunicationPage /> },   // tab from URL
      { path: 'billing/:tab?', element: <BillingPage /> },
      { path: 'settings', element: <SettingsHub /> },                    // hub card-grid
      { path: 'settings/:section/:tab?', element: <SettingsHub /> },     // 3-level deep
      // …all 11 modules
      { path: '*', element: <NotFoundPage /> },
  ]},
]);
```
- **Layout routes** (no `path`) wrap children with shared chrome. `MainLayout` = sidebar + topbar + `<Outlet/>` + `ActionDock`.
- Module sub-tabs ride as **path params** (`:tab`/`:section`) so they survive refresh and are linkable.

## Route Guards
```tsx
// ProtectedRoute — auth required
const ProtectedRoute = ({ children }: PropsWithChildren) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <QueryState loading />;
  return user ? <>{children}</> : <Navigate to="/login" replace state={{ from: location }} />;
};

// PublicRoute — bounce authed users away from /login
const PublicRoute = ({ children }: PropsWithChildren) => {
  const { user } = useAuth();
  return user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <>{children}</>;
};

// RoleRoute — RBAC gate
const RoleRoute = ({ perm, children }: { perm: PermissionKey } & PropsWithChildren) => {
  const { role } = useAuth();
  return can(role, perm) ? <>{children}</> : <ForbiddenPage />;
};
```

---

## Config-Driven Multi-Level Tabs (counts/badges from config)
> One `NestedTabPage` shell renders any module's sub-nav. Tab list, perms, and badge counts come from config + a count source; zero per-tab boilerplate.
```tsx
interface TabDef { key: string; labelKey: string; perm?: PermissionKey; badge?: number; render: () => ReactNode; }

function NestedTabPage({ tabs, basePath }: { tabs: TabDef[]; basePath: string }) {
  const { tab } = useParams();
  const nav = useNavigate();
  const visible = tabs.filter(t => !t.perm || can(role, t.perm));
  const active = visible.find(t => t.key === tab) ?? visible[0];
  return (
    <>
      <Tabs value={active.key} onChange={(_, k) => nav(`${basePath}/${k}`)}>
        {visible.map(t => (
          <Tab key={t.key} value={t.key}
               label={<Badge badgeContent={t.badge} color="error">{t(t.labelKey)}</Badge>} />
        ))}
      </Tabs>
      {active.render()}
    </>
  );
}
```
- Drives: Communication (6 tabs), Billing (7 tabs + tertiary), Triage (7 status tabs), Referrals (In/Out + Fax/Email), Legal (Delinquents/Depositions), Patients (Active/Archived), Scheduling (Appointments/Encounter).
- Badge counts pull from a query keyed by tab — counts stay live, config stays static.

## `SettingsHub` — 3-level from `settings.config.ts`
```tsx
function SettingsHub() {
  const { section, tab } = useParams();
  if (!section)                                   // level 1: card grid
    return <CardGrid items={SETTINGS_HUB} onPick={s => nav(`/settings/${s.key}`)} />;
  const sec = SETTINGS_HUB.find(s => s.key === section)!;
  const tabs = sec.tabs.map(t => ({              // level 2 + 3
    ...t, render: () => t.view.kind === 'table'
      ? <DataTable configId={t.view.tableId} />
      : <SchemaForm  configId={t.view.formId} />,
  }));
  return <NestedTabPage tabs={tabs} basePath={`/settings/${section}`} />;
}
```
- **7 sections × N inner tabs = 0 bespoke pages.** Add a settings screen = add a config entry + a table/form descriptor.

---

## Refresh-Safe Deep-Linkable URL State — ONE small helper
> **Path** carries module/sub-module/inner-tab. **Query params** carry filters, page, sort, search. One ~20-line `useUrlState` over `useSearchParams`. Keep it simple — not a framework.
```ts
// src/hooks/useUrlState.ts
import { useSearchParams } from 'react-router-dom';
export function useUrlState<T extends Record<string, string>>(defaults: T) {
  const [params, setParams] = useSearchParams();
  const state = { ...defaults } as T;
  for (const k in defaults) { const v = params.get(k); if (v != null) state[k] = v as T[Extract<keyof T, string>]; }
  const set = (patch: Partial<T>) => setParams(prev => {
    const next = new URLSearchParams(prev);
    for (const k in patch) {
      const v = patch[k];
      if (v == null || v === defaults[k]) next.delete(k);   // omit defaults → clean URLs
      else next.set(k, String(v));
    }
    return next;
  }, { replace: true });                                     // no history spam on filter change
  return [state, set] as const;
}
// usage: const [{ status, page }, setUrl] = useUrlState({ status: 'all', page: '1' });
```
- Reload restores filters/tabs/pagination exactly. Links are shareable. `replace:true` keeps Back button sane.

---

## Lazy-Loading / Code-Split
```tsx
const lazyEl = (imp: () => Promise<{ default: ComponentType }>) => {
  const C = lazy(imp);
  return <Suspense fallback={<QueryState loading />}><C /></Suspense>;
};
```
- Each feature module is a split chunk; primitives stay in the main bundle (shared everywhere).

## ActionDock in MainLayout
```tsx
// MainLayout.tsx
<Box sx={{ display: 'flex', minHeight: '100dvh' }}>
  <Sidebar items={NAV_MENU} />
  <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
    <TopBar /><Outlet />
  </Box>
  <ActionDock />   {/* persistent right rail / mobile bottom bar; context actions from active route */}
</Box>
```
- One mount point. `ActionDock` reads the active route to show relevant actions (New, Filter, Export). Mobile → fixed bottom bar with safe-area inset.

---

## Recipes

| Task | Steps |
|---|---|
| **Add a route** | 1) add path const to `routes.ts` · 2) add `NAV_MENU` entry (`titleKey`,`icon`,`perm`) · 3) add router child (`lazyEl`) · 4) wrap in `RoleRoute` if gated. No layout code. |
| **Add a sub-tab** | 1) add `TabDef` to the module's tab config (`key`,`labelKey`,`perm`,`render`) · 2) wire badge count query if needed. `NestedTabPage` renders it. |
| **Add a Settings section/tab** | 1) add section/tab to `SETTINGS_HUB` · 2) point `view` at a `tableId`/`formId` · 3) define that table/form config. `SettingsHub` renders it — no new page file. |

> Anything client-specific (exact perm keys per tab) — confirm against the live RBAC matrix before locking.
