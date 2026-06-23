# API Strategy

> Generic foundation doc. Copied verbatim into every project's `project-setup/api-strategy.md`. Identical across projects.

## Stack & layout

- **Server state / data-fetching:** TanStack React Query
- **Transport:** single typed HTTP client under `src/api/`
- **Imports:** always via the `@/` alias (e.g. `@/api/client`)
- **Rule:** components never call `fetch`/`axios` directly and never call React Query primitives directly — they consume **per-domain hooks**

```
src/api/
  client.ts            # single base HTTP client (fetch/axios wrapper)
  errors.ts            # ApiError + normalization
  query-keys.ts        # centralized key factory
  query-client.ts      # QueryClient defaults
  <domain>/            # one folder per domain (users, orders, ...)
    types.ts           # request/response types (hand-rolled or re-exported from SDK)
    requests.ts        # thin functions calling client.ts
    hooks.ts           # useXxx() React Query hooks  <-- components import only this
```

| Concern | Owner |
|---|---|
| URL, headers, auth, JSON, errors | `client.ts` |
| Cache, dedupe, retries, staleness | React Query (`query-client.ts`) |
| Domain shape & endpoints | `src/api/<domain>/` |
| Rendering | components (consume hooks only) |

## HTTP client

- Single base client in `src/api/client.ts`.
- `baseURL` from env: `import.meta.env.VITE_API_URL` (Vite) / `process.env.NEXT_PUBLIC_API_URL` (Next) — never hardcoded.
- Responsibilities: auth header injection, JSON serialize/deserialize, typed responses, throws typed `ApiError`.
- Exposes a tiny typed surface: `get/post/put/patch/del`.

```ts
// src/api/client.ts
import { ApiError, normalizeError } from '@/api/errors';
import { getToken, refreshToken } from '@/auth/token';

const baseURL = import.meta.env.VITE_API_URL as string;

type Json = Record<string, unknown> | unknown[];

async function request<T>(
  path: string,
  init: RequestInit & { json?: Json } = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`); // auth injection

  let body = init.body;
  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.json);
  }

  const res = await fetch(`${baseURL}${path}`, { ...init, headers, body });

  // refresh-on-401 once
  if (res.status === 401 && retry && (await refreshToken())) {
    return request<T>(path, init, false);
  }

  if (!res.ok) throw await normalizeError(res); // typed ApiError

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T; // typed response
}

export const client = {
  get:  <T>(p: string, init?: RequestInit) => request<T>(p, { ...init, method: 'GET' }),
  post: <T>(p: string, json?: Json, init?: RequestInit) => request<T>(p, { ...init, method: 'POST', json }),
  put:  <T>(p: string, json?: Json, init?: RequestInit) => request<T>(p, { ...init, method: 'PUT', json }),
  patch:<T>(p: string, json?: Json, init?: RequestInit) => request<T>(p, { ...init, method: 'PATCH', json }),
  del:  <T>(p: string, init?: RequestInit) => request<T>(p, { ...init, method: 'DELETE' }),
};
```

> Axios variant: same surface — set `baseURL` + interceptors instead of the manual `fetch` wrapper. The hook/key layers above do not change.

## Error/interceptor strategy

| Interceptor | Behavior |
|---|---|
| **Attach auth** | Inject `Authorization: Bearer <token>` on every request |
| **Refresh-on-401** | On first `401`, call `refreshToken()` once; retry original request; if refresh fails, surface `ApiError` and trigger logout |
| **Normalize errors** | Convert any non-2xx / network failure into a single typed `ApiError` |

- Refresh happens **once** per request (the `retry` flag guards infinite loops).
- Concurrent 401s should share one in-flight refresh promise (single-flight) — implement in `@/auth/token`.

```ts
// src/api/errors.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,        // machine-readable, e.g. 'VALIDATION'
    message: string,
    public details?: unknown,   // field errors, trace id, etc.
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function normalizeError(res: Response): Promise<ApiError> {
  let payload: any = null;
  try { payload = await res.json(); } catch { /* non-JSON body */ }
  return new ApiError(
    res.status,
    payload?.code ?? `HTTP_${res.status}`,
    payload?.message ?? res.statusText ?? 'Request failed',
    payload?.details,
  );
}
```

- Components/hooks always catch a known shape: `error instanceof ApiError`.
- Axios variant: do the same in a `response` error interceptor returning `Promise.reject(new ApiError(...))`.

## Typed SDK

Two ways to get typed requests/responses. **The choice is made at analysis time** during project setup ("do you want an SDK or not"). The React Query usage above the transport is **identical** either way — hooks, keys, invalidation, and components do not change.

| | (a) Hand-rolled client | (b) Generated SDK |
|---|---|---|
| Source of types | written by hand in `<domain>/types.ts` | generated from OpenAPI/GraphQL schema |
| Maintenance | manual, edit on API change | regenerate on schema change |
| Best when | no spec, small/unstable surface, full control | a maintained spec exists, large surface |
| Transport | `client.ts` | generated client (or generated types + `client.ts`) |
| Hooks / keys / cache | **same** | **same** |

### (a) Hand-rolled typed client (default)

```ts
// src/api/users/types.ts
export interface User { id: string; name: string; email: string }
export interface CreateUser { name: string; email: string }

// src/api/users/requests.ts
import { client } from '@/api/client';
import type { User, CreateUser } from './types';

export const usersApi = {
  list:   () => client.get<User[]>('/users'),
  get:    (id: string) => client.get<User>(`/users/${id}`),
  create: (input: CreateUser) => client.post<User>('/users', input),
  update: (id: string, input: Partial<CreateUser>) => client.patch<User>(`/users/${id}`, input),
  remove: (id: string) => client.del<void>(`/users/${id}`),
};
```

## Data fetching pattern

- All data access goes through **per-domain hooks** in `src/api/<domain>/hooks.ts`.
- Hooks wrap React Query `useQuery` / `useMutation`; components import only hooks.
- Defaults live in `query-client.ts` (single source of truth for `staleTime`/`retry`).

```ts
// src/api/query-client.ts
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,          // 1 min: avoid refetch storms
      gcTime: 5 * 60_000,
      retry: (count, err) =>
        err instanceof ApiError && err.status >= 500 ? count < 2 : false, // don't retry 4xx
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
```

```ts
// src/api/users/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keys } from '@/api/query-keys';
import { usersApi } from './requests';
import type { User } from './types';

export function useUsers() {
  return useQuery({ queryKey: keys.users.list(), queryFn: usersApi.list });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: keys.users.detail(id),
    queryFn: () => usersApi.get(id),
    enabled: !!id,
  });
}
```

```tsx
// component — consumes the hook only, no fetch/React Query here
function UserName({ id }: { id: string }) {
  const { data, isPending, error } = useUser(id);
  if (isPending) return <Spinner />;
  if (error) return <ErrorBanner error={error} />;
  return <span>{data.name}</span>;
}
```

## Query key conventions

- Keys are **structured arrays**, broad → narrow: `['users']`, `['users', 'list']`, `['users', 'detail', id]`.
- Centralized **key factory** in `src/api/query-keys.ts` — never inline literal arrays in hooks.
- Stable, serializable values only (ids, normalized filter objects). No functions/class instances.
- Variables (id, filters) are the **last** segments so prefixes invalidate groups.

```ts
// src/api/query-keys.ts
export const keys = {
  users: {
    all:    () => ['users'] as const,
    list:   (filters?: Record<string, unknown>) =>
              filters ? (['users', 'list', filters] as const) : (['users', 'list'] as const),
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  // ...one entry per domain
};
```

| Need | Key |
|---|---|
| Single entity | `keys.users.detail(id)` |
| Collection | `keys.users.list(filters)` |
| Invalidate whole domain | `keys.users.all()` (prefix match) |

## Mutations & cache invalidation

- Mutations live in domain `hooks.ts` as `useMutation`.
- **On success: invalidate** affected query keys (don't manually refetch in components).
- Invalidate the **narrowest** key that covers the change; use the domain prefix to catch lists + details.

```ts
// src/api/users/hooks.ts
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.users.all() }), // refresh lists
  });
}
```

### Optimistic updates pattern

`onMutate` → snapshot → write → `onError` rollback → `onSettled` invalidate.

```ts
export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<User>) => usersApi.update(id, input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: keys.users.detail(id) });
      const prev = qc.getQueryData<User>(keys.users.detail(id));
      qc.setQueryData<User>(keys.users.detail(id), (u) => u && { ...u, ...input });
      return { prev };                                   // context for rollback
    },
    onError: (_e, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.users.detail(id), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.users.detail(id) }),
  });
}
```

| Step | Purpose |
|---|---|
| `cancelQueries` | stop in-flight fetches overwriting the optimistic value |
| `getQueryData` | snapshot for rollback |
| `setQueryData` | apply optimistic change |
| `onError` rollback | restore snapshot on failure |
| `onSettled` invalidate | reconcile with server truth |

## Optional generated SDK

- Chosen at analysis time if a maintained **OpenAPI** (or GraphQL) spec exists.
- Generates typed client + types; React Query hooks/keys/invalidation are **unchanged** — only `requests.ts`/`types.ts` source differs.

| Tool | Output |
|---|---|
| `openapi-typescript` | types only — keep `client.ts`, import generated types in `types.ts` |
| `@hey-api/openapi-ts` / `orval` | full typed client + optional React Query hooks |
| `openapi-fetch` | typed fetch bound to the spec |

```jsonc
// package.json
"scripts": {
  "api:gen": "openapi-typescript ./openapi.json -o ./src/api/generated/schema.ts"
}
```

```ts
// src/api/users/requests.ts (SDK-backed) — hooks above stay identical
import { client } from '@/api/client';
import type { components } from '@/api/generated/schema';
export type User = components['schemas']['User'];

export const usersApi = {
  list: () => client.get<User[]>('/users'),
  get:  (id: string) => client.get<User>(`/users/${id}`),
};
```

- **Rules:** generated code is committed but never hand-edited; regenerate via `api:gen` on spec change; keep generated output under `src/api/generated/`.
- **Decision record:** capture SDK vs hand-rolled in `project-setup` so the whole team uses one approach.
