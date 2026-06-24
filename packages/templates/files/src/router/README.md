# router/

Config-driven routing on `react-router-dom` v7 (data router). URL is the single
source of truth — every screen is refresh-safe and deep-linkable. See
`project-setup/routing.md` for the full spec.

## What ships by default (working, ready to use)

| File | Role |
| --- | --- |
| `router.tsx` | The route tree (`createBrowserRouter`). Add feature routes as children. |
| `paths.ts` | Typed path constants/builders — use these, never raw strings. |
| `guards.tsx` | `RequireAuth` / `RequireRole` — layout routes that render `<Outlet/>` or `<Navigate/>`. |
| `RootLayout.tsx` | Root layout at `/` (chrome + `<Outlet/>`). |
| `AppLayout.tsx` | Authenticated shell with the `<Suspense>` boundary around `<Outlet/>`. |
| `RouteError.tsx` | Shared `errorElement` + 404. |

Auth comes from the **demo stub** in `@/lib/auth` (returns a signed-in admin) so
the app renders; replace it to enforce. The home route redirects to `/dashboard`,
which renders the **deletable demo page** at `@/features/_demo/pages/DashboardPage`.

## Add a feature route

1. Add a path to `paths.ts`.
2. Add a child in `router.tsx`:
   `{ path: "patients", lazy: () => import("@/features/patients/pages/PatientsPage") }`.
3. The page module exports `Component` (and optionally `loader`/`action`).
4. Wrap in `RequireRole` if gated.

## Replace the demo

Point the `dashboard` route at your first feature page (or delete
`features/_demo/`). When real auth exists, replace `@/lib/auth`. The tree shape
stays the same.
