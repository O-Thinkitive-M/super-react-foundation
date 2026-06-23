# Authentication

> Generic foundation doc. Copied verbatim into every project's `project-setup/authentication.md`.
> Stack: react-router-dom v7 route guards, React Query for the current-user query, a pluggable client-state store for session, typed API client under `src/api/`.
> Keep it bullet points and tables, not prose.

## Auth model

- **Default: token-based** — backend issues a short-lived **JWT access token** + a longer-lived **refresh token**.
  - Access token authorizes API calls; refresh token mints new access tokens without re-login.
  - Access token TTL short (e.g. 5-15 min); refresh token TTL long (e.g. 7-30 days), rotated on use.
- **Alternative: OAuth 2.0 / OIDC redirect flow** (chosen at analysis time, not both):
  - App redirects to an Identity Provider (Auth0, Cognito, Okta, Entra ID, Google).
  - IdP returns to a callback route; backend (or library, e.g. `oidc-client-ts`) exchanges the code (PKCE) for tokens and establishes the session.
  - Same `useAuth()` / `RequireAuth` surface below applies; only the login/logout steps differ (delegate to IdP).
- Pick **one** model per project and delete the other from the project copy.

| Concept | Meaning |
|---|---|
| Access token | Short-lived credential sent with each API request |
| Refresh token | Long-lived credential used only to obtain new access tokens |
| `me` / current user | Authoritative identity + roles, fetched from the backend |
| Session | Client-side reflection of "who is logged in" (store + `me` query) |

## Token storage

- **Preferred (most secure): httpOnly + Secure + SameSite cookie** set by the backend.
  - Tokens never touch JS → immune to XSS token theft.
  - Browser attaches the cookie automatically → API client needs `credentials: 'include'`.
  - Requires CSRF protection (SameSite=Lax/Strict, or double-submit / CSRF token header).
- **Fallback (when backend can't set cookies): in-memory access token + refresh via cookie.**
  - Access token held in a module variable / store (never persisted) and injected via request interceptor.
  - Refresh token kept in an httpOnly cookie; access token re-minted on load and on 401.
  - Lost on full page reload → bootstrap re-fetches via the refresh cookie.
- **Never store tokens in `localStorage` or `sessionStorage`** — any XSS can read them and exfiltrate the session. Avoid non-httpOnly cookies for tokens too.

| Storage | XSS-safe | Survives reload | CSRF concern | Use when |
|---|---|---|---|---|
| httpOnly cookie | Yes | Yes | Yes (mitigate) | **Default** — backend can set cookies |
| In-memory access token + refresh cookie | Yes (access in memory) | Re-minted via cookie | Yes (refresh) | Backend can't issue access cookie |
| `localStorage` / `sessionStorage` | **No** | Yes | No | **Never for tokens** |
| Non-httpOnly cookie | **No** | Yes | Yes | Avoid for tokens |

## Session handling

- Session = pluggable **client-state store** (Zustand/Redux/context) holding lightweight session flags + an optional in-memory access token, **plus** the React Query `me` query holding the authoritative user object.
- `me` query is the source of truth for identity/roles; the store mirrors derived state (`status`, `accessToken?`) for synchronous reads in interceptors/guards.

```ts
// src/auth/store.ts — pluggable client-state store (Zustand shown)
type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated';
interface AuthState {
  status: AuthStatus;
  accessToken?: string;          // in-memory only; omit in pure-cookie mode
  setToken: (t?: string) => void;
  setStatus: (s: AuthStatus) => void;
  reset: () => void;
}
```

```ts
// src/auth/useAuth.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useAuthStore } from './store';

export const meQueryKey = ['me'] as const;

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: () => api.auth.me(),     // typed client under src/api/
    staleTime: 5 * 60_000,
    retry: false,                     // a 401 must not retry-loop
  });
}

export function useAuth() {
  const status = useAuthStore((s) => s.status);
  const { data: user, isLoading, isError } = useMe();
  return {
    user,
    roles: user?.roles ?? [],
    isLoading: status === 'authenticating' || isLoading,
    isAuthenticated: !!user && !isError,
  };
}
```

- **Bootstrap on app load:** before rendering routes, attempt to restore the session.

```ts
// src/auth/bootstrap.ts — run once at startup
export async function bootstrapAuth(queryClient) {
  try {
    await api.auth.refresh();                  // mint access token via refresh cookie (no-op in pure-cookie mode)
    await queryClient.prefetchQuery({ queryKey: meQueryKey, queryFn: () => api.auth.me() });
  } catch {
    useAuthStore.getState().setStatus('unauthenticated'); // not logged in — proceed to guarded routes
  }
}
```

```tsx
// src/main.tsx — gate first render on bootstrap so guards don't flash /login
await bootstrapAuth(queryClient);
root.render(<App />);
```

## Route protection

- `<RequireAuth>` — wraps protected routes; redirects unauthenticated users to `/login`, preserving the attempted location.
- `<RequireRole roles={[...]}>` — nests inside `RequireAuth`; redirects authorized-but-wrong-role users to a `/403` (or back).

```tsx
// src/auth/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
```

```tsx
// src/auth/RequireRole.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';

export function RequireRole({ roles }: { roles: string[] }) {
  const { roles: userRoles, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  const ok = roles.some((r) => userRoles.includes(r));
  return ok ? <Outlet /> : <Navigate to="/403" replace />;
}
```

```tsx
// src/router.tsx — react-router-dom v7
const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/403', element: <ForbiddenPage /> },
  {
    element: <RequireAuth />,                 // everything below requires auth
    children: [
      { path: '/', element: <Dashboard /> },
      {
        element: <RequireRole roles={['admin']} />,
        children: [{ path: '/admin', element: <AdminPage /> }],
      },
    ],
  },
]);
```

## Login/logout flow

**Login**

1. User submits credentials on `/login` (or is redirected to the IdP in OAuth/OIDC mode).
2. `api.auth.login(creds)` → backend sets httpOnly cookie(s) and/or returns an access token.
3. In fallback mode, store the access token in memory (`setToken`); in cookie mode, do nothing.
4. Set status `authenticated`; **invalidate/refetch** the `me` query so `useAuth()` reflects the new user.
5. Redirect to `location.state?.from?.pathname ?? '/'` (the originally requested page).

```ts
async function login(creds) {
  useAuthStore.getState().setStatus('authenticating');
  const res = await api.auth.login(creds);          // sets cookie and/or returns token
  if (res.accessToken) useAuthStore.getState().setToken(res.accessToken);
  useAuthStore.getState().setStatus('authenticated');
  await queryClient.invalidateQueries({ queryKey: meQueryKey });
}
```

**Logout**

1. `api.auth.logout()` → backend clears cookies / revokes the refresh token.
2. Clear in-memory token + reset store (`reset()`); set status `unauthenticated`.
3. **`queryClient.clear()`** — wipe all cached data so no other user's data leaks across sessions.
4. Redirect to `/login`.

```ts
async function logout() {
  try { await api.auth.logout(); } finally {
    useAuthStore.getState().reset();
    queryClient.clear();                              // drop every cache, not just `me`
    router.navigate('/login', { replace: true });
  }
}
```

## Refresh & expiry

- A single **response interceptor** in the typed API client handles `401` by attempting one refresh, then retrying the original request.
- **De-dupe concurrent refreshes**: share one in-flight refresh promise so parallel 401s trigger a single refresh.
- If refresh fails → treat as logged out: reset store, `queryClient.clear()`, redirect to `/login`.

```ts
// src/api/client.ts — refresh-on-401 (de-duped)
let refreshing: Promise<void> | null = null;

async function doRefresh() {
  refreshing ??= api.auth.refresh()                  // cookie-based; mints new access token
    .then((r) => { if (r.accessToken) useAuthStore.getState().setToken(r.accessToken); })
    .finally(() => { refreshing = null; });
  return refreshing;
}

http.interceptors.response.use(undefined, async (error) => {
  const req = error.config;
  if (error.response?.status === 401 && !req._retried) {
    req._retried = true;
    try { await doRefresh(); return http(req); }     // retry once
    catch {
      useAuthStore.getState().reset();
      queryClient.clear();
      router.navigate('/login', { replace: true });
    }
  }
  throw error;
});
```

- **Request side (fallback mode only):** request interceptor injects `Authorization: Bearer <accessToken>` from the store. In pure-cookie mode, omit this and set `credentials: 'include'`.
- **Refresh-token rotation:** if the backend rotates refresh tokens, each refresh issues a new one; reuse of an old token should be rejected (replay detection) → forces logout.
- **Proactive refresh (optional):** schedule a refresh shortly before access-token expiry to avoid user-facing 401s.

| Event | Action |
|---|---|
| Access token expired (401) | Interceptor refreshes once, retries request |
| Refresh token expired/invalid | Reset store, `queryClient.clear()`, redirect `/login` |
| Multiple concurrent 401s | Single shared refresh promise, all retry after it resolves |
| Tab regains focus | React Query refetches `me` (revalidates session) |

## Roles & permissions

- Roles/permissions come **only** from the backend (`me.roles`, `me.permissions`) — never trusted from the token client-side for authorization decisions.
- Client-side checks are **UX only** (hide/disable UI). The backend must re-authorize every request; the client cannot be the security boundary.

```ts
// src/auth/permissions.ts
export function useCan(perm: string) {
  const { user } = useAuth();
  return !!user?.permissions?.includes(perm);
}
```

```tsx
// Conditional UI
const canEdit = useCan('invoice:edit');
{canEdit && <EditButton />}
```

| Layer | Enforces | Trust level |
|---|---|---|
| `RequireAuth` / `RequireRole` | Route access (navigation) | UX only |
| `useCan` / conditional render | Element visibility | UX only |
| Backend authorization | Actual access to data/actions | **Authoritative** |
