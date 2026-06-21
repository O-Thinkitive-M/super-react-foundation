# 20 — Error Handling

Harmony EMR (HUPC) Provider. **Every error scenario handled — simply.**
The whole strategy is **three primitives**: one `ErrorBoundary`, one response interceptor,
one `<QueryState>`. Not a framework. All messages come from `src/i18n/`.

---

## 1. The three primitives

| Primitive | Catches | Where |
|---|---|---|
| `ErrorBoundary` | Render/JS crashes | App root + per route |
| `customAxios` response interceptor | All API errors → `AppError` | `src/api/axios-instance.ts` |
| `<QueryState>` | Per-query loading / empty / error | Wraps any query render |

---

## 2. `ErrorBoundary` — no white screen (`src/components/ErrorBoundary.tsx`)
```tsx
import { Component, ReactNode } from 'react';
import { ErrorScreen } from './error-screens/ErrorScreen';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { logPhiSafe(error); } // no PHI in logs
  render() {
    if (this.state.hasError)
      return this.props.fallback ?? <ErrorScreen messageKey="error.unexpected" onRetry={() => this.setState({ hasError: false })} />;
    return this.props.children;
  }
}
```
**Placement:**
- **Top-level:** wraps `<RouterProvider>` → app never shows a blank screen.
- **Per-route:** each route element wrapped → a crash in one screen doesn't kill the shell (sidebar/nav survive); shows recover/retry UI scoped to that route.

---

## 3. API error mapping (in the `customAxios` interceptor)

Map every axios error to a typed `AppError`, then route to a **toast** (recoverable) or a **full error screen** (blocking).
```ts
export type AppErrorKind =
  | 'network' | 'timeout' | 'unauthorized' | 'forbidden'
  | 'notFound' | 'validation' | 'server' | 'unknown';

export interface AppError { kind: AppErrorKind; messageKey: string; status?: number }

export function toAppError(e: AxiosError): AppError {
  if (e.code === 'ERR_NETWORK')   return { kind: 'network', messageKey: 'error.network' };
  if (e.code === 'ECONNABORTED')  return { kind: 'timeout', messageKey: 'error.timeout' };
  const s = e.response?.status;
  switch (s) {
    case 401: return { kind: 'unauthorized', messageKey: 'error.session', status: s };
    case 403: return { kind: 'forbidden',    messageKey: 'error.forbidden', status: s };
    case 404: return { kind: 'notFound',     messageKey: 'error.notFound', status: s };
    case 422: return { kind: 'validation',   messageKey: 'error.validation', status: s };
    default:  return s && s >= 500
      ? { kind: 'server', messageKey: 'error.server', status: s }
      : { kind: 'unknown', messageKey: 'error.unexpected', status: s };
  }
}
```
Interceptor (excerpt — see `17`):
```ts
(error: AxiosError) => {
  logPhiSafe(error);
  const appErr = toAppError(error);
  if (appErr.kind === 'unauthorized') { useAuthStore.getState().logout(); window.location.assign('/login'); }
  return Promise.reject(appErr); // hooks receive AppError, not raw axios
}
```

**Toast vs screen:**
| Kind | Surface |
|---|---|
| validation, network (transient), timeout | **Toast** (retry inline) |
| forbidden, notFound, server, unauthorized | **Full error screen** / redirect |

---

## 4. Network / offline detection (`src/hooks/useOnlineStatus.ts`)
```ts
import { useSyncExternalStore } from 'react';
const sub = (cb: () => void) => {
  window.addEventListener('online', cb); window.addEventListener('offline', cb);
  return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb); };
};
export const useOnlineStatus = () => useSyncExternalStore(sub, () => navigator.onLine, () => true);
```
- Render a persistent **offline banner** (i18n `error.offline`) in the app shell when `!online`.
- React Query: rely on built-in `retry` + `onlineManager`; queries auto-resume on reconnect.
- Set query `retry` for 5xx/network only (see `07` §3) — never retry 4xx.

---

## 5. Timeout handling
```ts
export const AXIOS_INSTANCE = Axios.create({ baseURL: import.meta.env.VITE_API_URL, timeout: 30_000 });
```
- `ECONNABORTED` → `AppError.timeout` → toast with **Retry** (re-runs the query).
- Long ops (uploads, reports): per-request override `{ timeout: 120_000 }`.

---

## 6. Status-code screens (`src/components/error-screens/`)

| Status | Component | Behavior |
|---|---|---|
| 401 | (no screen) | Interceptor → `logout()` + redirect `/login` |
| 403 | `Forbidden.tsx` | "No access" + back-to-dashboard |
| 404 | `NotFound.tsx` | Route fallback (`path: '*'`) + missing-resource state |
| 500 | `ServerError.tsx` | "Something went wrong" + **Retry** + support ref |
| — | `ErrorScreen.tsx` | Generic shell used by boundary + the above |

All take a `messageKey` and optional `onRetry`; text from `src/i18n/`.

---

## 7. `<QueryState>` — one wrapper for every query (`src/components/QueryState.tsx`)

Standardizes loading (skeleton) / empty / error (retry) / success.
```tsx
interface QueryStateProps<T> {
  query: { isLoading: boolean; isError: boolean; data?: T; refetch: () => void };
  skeleton?: ReactNode;
  isEmpty?: (d: T) => boolean;
  emptyMessageKey?: string;
  children: (data: T) => ReactNode;
}
export function QueryState<T>({ query, skeleton, isEmpty, emptyMessageKey, children }: QueryStateProps<T>) {
  const { t } = useI18n();
  if (query.isLoading) return <>{skeleton ?? <DefaultSkeleton />}</>;
  if (query.isError)   return <InlineError messageKey="error.loadFailed" onRetry={query.refetch} />;
  if (!query.data)     return <EmptyState message={t(emptyMessageKey ?? 'common.empty')} />;
  if (isEmpty?.(query.data)) return <EmptyState message={t(emptyMessageKey ?? 'common.empty')} />;
  return <>{children(query.data)}</>;
}
```
Usage:
```tsx
const q = usePatient(id);
<QueryState query={q} isEmpty={(d) => !d} emptyMessageKey="patient.notFound">
  {(patient) => <PatientChart patient={patient} />}
</QueryState>
```

---

## 8. Error-type → handling → surface map

| Error type | Detected by | Handling | User-facing surface |
|---|---|---|---|
| Render/JS crash | `ErrorBoundary` | Catch, log PHI-safe, retry | Route/app recover screen |
| Offline | `navigator.onLine` | Banner; pause/resume queries | Persistent offline banner |
| Network fail | axios `ERR_NETWORK` | `AppError.network`, retry | Toast w/ retry |
| Timeout | `ECONNABORTED` | `AppError.timeout`, retry | Toast w/ retry |
| 401 | interceptor | logout + redirect | Login page |
| 403 | interceptor | `AppError.forbidden` | `Forbidden` screen |
| 404 | interceptor / router | `AppError.notFound` | `NotFound` screen |
| 422 validation | interceptor | map field errors to form | Inline form + toast |
| 5xx | interceptor | `AppError.server`, retry | `ServerError` screen / toast |
| Empty result | `<QueryState>` | empty state | Empty placeholder |
| Loading | `<QueryState>` | skeleton | Skeleton |

---

## Golden rules
- Keep it LEAN: **one** boundary, **one** interceptor, **one** `<QueryState>`.
- Hooks receive `AppError`, never raw axios errors.
- No white screens — top-level + per-route boundaries always.
- Retry 5xx/network only; never retry 4xx.
- Every message is an `src/i18n/` key; logs are PHI-safe (no bodies).
