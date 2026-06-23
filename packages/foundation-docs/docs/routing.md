# Routing

- Stack: `react-router-dom` v7, TypeScript, `@/` alias -> `src/`.
- Routes are the **source of truth** for navigable state. Read from URL params/search, not in-memory globals.
- Use a data router (`createBrowserRouter` + `RouterProvider`) so loaders, actions, and `errorElement` work.
- Code-split every page via `React.lazy` + `<Suspense>`.

## Router setup

- One `createBrowserRouter` tree wrapped by a single `<RouterProvider>` at the app root.
- A **root layout route** owns the shared chrome and renders `<Outlet/>` for children.
- An `errorElement` on the root catches thrown errors, loader rejections, and renders 404s via `useRouteError`.
- Page components are **lazy route modules** (default export `Component`).

`src/main.tsx`
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router/router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
```

`src/router/router.tsx` (the tree)
```tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import RootLayout from "@/router/RootLayout";
import AppLayout from "@/router/AppLayout";
import RouteError from "@/router/RouteError";
import { RequireAuth, RequireRole } from "@/router/guards";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      // public
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "login", lazy: () => import("@/features/auth/pages/LoginPage") },
      { path: "register", lazy: () => import("@/features/auth/pages/RegisterPage") },

      // authenticated (nested under guard + app chrome)
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: "dashboard", lazy: () => import("@/features/dashboard/pages/DashboardPage") },
              { path: "settings", lazy: () => import("@/features/settings/pages/SettingsPage") },
              { path: "users/:userId", lazy: () => import("@/features/users/pages/UserDetailPage") },
              {
                path: "admin",
                element: <RequireRole role="admin" />,
                children: [
                  { index: true, lazy: () => import("@/features/admin/pages/AdminPage") },
                ],
              },
            ],
          },
        ],
      },

      // 404 catch-all
      { path: "*", lazy: () => import("@/router/NotFound") },
    ],
  },
]);
```

- `lazy: () => import(...)` is v7's per-route lazy API. Each page module exports `Component` (and optionally `loader`, `action`, `ErrorBoundary`).

`src/features/dashboard/pages/DashboardPage.tsx`
```tsx
// React Router v7 lazy module contract
export function Component() {
  return <DashboardView />;
}
// optional: export async function loader() { ... }
```

`src/router/RouteError.tsx`
```tsx
import { isRouteErrorResponse, useRouteError, Link } from "react-router-dom";

export default function RouteError() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundView />;
  }
  return (
    <div role="alert">
      <h1>Something went wrong</h1>
      <Link to="/">Go home</Link>
    </div>
  );
}
```

### `src/router/` convention

| Path | Responsibility |
|------|----------------|
| `src/router/router.tsx` | Defines the full route tree + `createBrowserRouter`. |
| `src/router/guards.tsx` | `RequireAuth`, `RequireRole`. |
| `src/router/RouteError.tsx` | Shared `errorElement`. |
| `src/router/paths.ts` | Typed path constants + builders (no magic strings). |
| `src/router/*` or `src/components/layout/*` | Layout routes that render `<Outlet/>`. |
| `src/features/<feature>/pages/*` | One lazy route module per feature screen (`Component` export). |

`src/router/paths.ts`
```ts
export const paths = {
  login: "/login",
  dashboard: "/dashboard",
  user: (id: string) => `/users/${id}`,
  admin: "/admin",
} as const;
```

## Route tree

| Route | Type | Layout | Element |
|-------|------|--------|---------|
| `/` | redirect | RootLayout | `<Navigate to="/dashboard">` |
| `/login` | public | RootLayout | `features/auth/pages/LoginPage` |
| `/register` | public | RootLayout | `features/auth/pages/RegisterPage` |
| `/dashboard` | authenticated | RootLayout > RequireAuth > AppLayout | `features/dashboard/pages/DashboardPage` |
| `/settings` | authenticated | RootLayout > RequireAuth > AppLayout | `features/settings/pages/SettingsPage` |
| `/users/:userId` | authenticated | RootLayout > RequireAuth > AppLayout | `features/users/pages/UserDetailPage` |
| `/admin` | role: admin | ... > RequireRole | `features/admin/pages/AdminPage` |
| `*` | 404 | RootLayout | `router/NotFound` |

Nesting conventions:
- **RootLayout** — app-wide providers, global chrome, `errorElement` host. Always at `/`.
- **AppLayout** — authenticated shell (sidebar, header). Sits under `RequireAuth`.
- Guards are layout-less wrapper routes (`element` only) that render `<Outlet/>` when access is allowed.
- Order matters: guard route -> chrome layout -> pages. Put `path: "*"` **last**.
- Prefer relative child `path` segments; let nesting build the full URL.

## Guards

- A guard is a layout route whose `element` checks access and either renders `<Outlet/>` or `<Navigate/>`.
- **Preserve intended location** on redirect so login can bounce the user back.

`src/router/guards.tsx`
```tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    // preserve where the user was headed
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export function RequireRole({ role }: { role: string }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.roles.includes(role)) {
    return <Navigate to="/dashboard" replace />; // or a 403 page
  }
  return <Outlet />;
}
```

Login restores the intended location:
```tsx
import { useLocation, useNavigate } from "react-router-dom";

const location = useLocation();
const navigate = useNavigate();
const from = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";
// after successful sign-in:
navigate(from, { replace: true });
```

- **Loader-based variant** (for data routers): throw a `redirect` from a loader instead of rendering `<Navigate>`.
```tsx
import { redirect } from "react-router-dom";

export async function loader({ request }: { request: Request }) {
  if (!isAuthenticated()) {
    const next = new URL(request.url).pathname;
    throw redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return null;
}
```

| Guard | Redirects to | Preserves intent via |
|-------|--------------|----------------------|
| `RequireAuth` (element) | `/login` | `state.from` |
| `RequireAuth` (loader) | `/login` | `?next=` search param |
| `RequireRole` | `/dashboard` or 403 | n/a |

## Deep-linking

- Every screen must be reachable and reconstructable from its URL alone.
- **Read state from the URL**, not from in-memory globals or context that resets on reload.
  - Path identity -> `useParams()` (e.g. `:userId`).
  - View/filter state -> `useSearchParams()` (e.g. `?tab=billing&page=2`).
- Writing state updates the URL; the URL re-renders the view (one-way data flow).

```tsx
import { useParams, useSearchParams } from "react-router-dom";

const { userId } = useParams();
const [searchParams, setSearchParams] = useSearchParams();
const tab = searchParams.get("tab") ?? "overview";

function selectTab(next: string) {
  setSearchParams(prev => {
    prev.set("tab", next);
    return prev;
  });
}
```

- Use `replace` for transient UI state (tabs, filters) to avoid polluting history; push for navigations.
- Load data in a route `loader` keyed off `params`/`request.url` so deep links fetch correctly on first paint.
- Always use `<Link>` / `<NavLink>` / `navigate()` — never `window.location` — to keep the router in control.

## Lazy loading / code-splitting

- Two complementary mechanisms:
  - **Route `lazy`** (v7 data router) — splits the route module (`Component` + `loader`).
  - **`React.lazy` + `<Suspense>`** — splits a component and shows a fallback while the chunk loads.
- Put a `<Suspense>` boundary in each layout so child route chunks resolve gracefully.

`src/router/AppLayout.tsx` (or `src/components/layout/AppLayout.tsx`)
```tsx
import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import PageSpinner from "@/components/PageSpinner";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main>
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
```

`React.lazy` for a heavy component inside a page:
```tsx
import { lazy, Suspense } from "react";
const Chart = lazy(() => import("@/components/Chart"));

<Suspense fallback={<Skeleton />}>
  <Chart data={data} />
</Suspense>
```

- Keep one `<Suspense>` near the `<Outlet/>` of each layout; add finer-grained boundaries around heavy widgets.
- Each `import("@/features/<feature>/pages/...")` becomes its own bundle chunk automatically (Vite/webpack).

## URL & query-param conventions

| Concern | Mechanism | Example |
|---------|-----------|---------|
| Resource identity | path param | `/users/:userId` |
| Filtering / sorting | search param | `?status=active&sort=-createdAt` |
| Pagination | search param | `?page=2&pageSize=25` |
| Active tab / sub-view | search param | `?tab=billing` |
| Post-login return | search param or state | `?next=/dashboard` |

- Path segments: lowercase, `kebab-case`, plural collections (`/users`, `/order-items`).
- Path params: `camelCase` and resource-specific (`:userId`, not `:id`).
- Search keys: lowercase `snake_case` or `camelCase` — pick one and keep it consistent project-wide (`camelCase` default).
- Booleans as presence/value: `?archived=true` (avoid bare `?archived`).
- Always `encodeURIComponent` user-supplied values; rely on `URLSearchParams` (via `useSearchParams`/`createSearchParams`) for encoding.
- Build URLs from `src/router/paths.ts` helpers — no string concatenation of routes in components.
- Default values live in code, not the URL: omit a param to mean "default" rather than writing the default into the link.
