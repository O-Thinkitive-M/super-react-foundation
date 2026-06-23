# Error Handling

> Generic foundation guidance. Stack: React 19, react-router-dom v7, TanStack React Query, MUI. Keep additions as bullets/tables, not prose.

## Error taxonomy

| Type | Source | Where handled | User sees |
|------|--------|---------------|-----------|
| Network / offline | fetch/axios transport failure | React Query `onError` + retry; normalized to `ApiError(kind: 'network')` | Snackbar: "Connection problem. Check your network and retry." |
| Timeout | Aborted/slow request | Query client default + `AbortController` | Snackbar: "This is taking too long. Please try again." |
| Auth (401) | API response | Global response interceptor → redirect to login / refresh token | Redirect + snackbar: "Your session expired. Please sign in." |
| Forbidden (403) | API response | Route guard / inline | Inline or full-page: "You don't have access to this." |
| Not found (404) | API response or route | Route `errorElement` / inline | Full-page 404 |
| Validation (400/422) | API response | Form layer → field-level mapping | Inline field errors |
| Conflict (409) | API response | Mutation `onError` | Snackbar / inline: "This was already updated. Refresh and retry." |
| Rate limit (429) | API response | Query retry w/ backoff | Snackbar: "Too many requests. Please wait a moment." |
| Server (5xx) | API response | React Query `isError` + boundary | Inline error panel with Retry |
| Client/render bug | Thrown in render | Nearest `<ErrorBoundary>` / route `errorElement` | Fallback UI with Reset |
| Loader/action throw | react-router loader/action | Route `errorElement` | Route-level error page |
| Unknown/unexpected | Anything uncaught | Top-level boundary + logger → monitoring | Generic full-page fallback |

## API / error normalization

- All HTTP errors are normalized into one typed shape before reaching UI/query layers. Components never read raw `AxiosError`/`Response`.
- Single source of truth: `src/lib/api/errors.ts`.

```ts
// src/lib/api/errors.ts
export type ApiErrorKind =
  | 'network' | 'timeout' | 'auth' | 'forbidden' | 'notFound'
  | 'validation' | 'conflict' | 'rateLimit' | 'server' | 'unknown';

export interface FieldErrors { [field: string]: string[]; }

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  code?: string;              // backend machine code, e.g. "USER_EXISTS"
  fields?: FieldErrors;       // for validation
  requestId?: string;         // correlation id for logs/support
  cause?: unknown;
  constructor(init: Partial<ApiError> & { kind: ApiErrorKind; message: string }) {
    super(init.message);
    this.name = 'ApiError';
    Object.assign(this, init);
  }
}

export function normalizeError(err: unknown): ApiError {
  // Axios-style
  const status = (err as any)?.response?.status as number | undefined;
  const data = (err as any)?.response?.data;
  const requestId = (err as any)?.response?.headers?.['x-request-id'];

  if ((err as any)?.code === 'ECONNABORTED') return new ApiError({ kind: 'timeout', message: 'Request timed out', cause: err });
  if (status === undefined && (err as any)?.isAxiosError) return new ApiError({ kind: 'network', message: 'Network error', cause: err });

  const map: Record<number, ApiErrorKind> = {
    400: 'validation', 401: 'auth', 403: 'forbidden', 404: 'notFound',
    409: 'conflict', 422: 'validation', 429: 'rateLimit',
  };
  const kind: ApiErrorKind =
    status && map[status] ? map[status] :
    status && status >= 500 ? 'server' :
    status ? 'unknown' : 'unknown';

  return new ApiError({
    kind, status, requestId,
    code: data?.code,
    fields: data?.errors ?? data?.fields,
    message: data?.message ?? err instanceof Error ? (err as Error).message : 'Unexpected error',
    cause: err,
  });
}
```

- Wire normalization once at the transport layer (interceptor) so everything downstream receives `ApiError`:

```ts
// src/lib/api/client.ts
api.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(normalizeError(error)),
);
```

## Error boundaries

- **Top-level boundary**: wraps the whole app; catches any render/runtime error not caught lower; logs to monitoring; shows generic full-page fallback with Reset.
- **Per-route `errorElement`**: react-router v7 renders it when a route's element, loader, or action throws; scopes the error to that route while the shell (nav/header) stays interactive.
- Use [`react-error-boundary`](https://github.com/bvaughn/react-error-boundary) for ergonomic resets, or a class component. Boundaries catch render-phase errors only — async/event errors flow through React Query / try-catch instead.

```tsx
// src/app/ErrorBoundary.tsx
import { ErrorBoundary as REB, FallbackProps } from 'react-error-boundary';
import { logger } from '@/lib/logger';
import { ErrorFallback } from './ErrorFallback';

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <REB
      FallbackComponent={ErrorFallback}
      onError={(error, info) => logger.error('Unhandled UI error', { error, componentStack: info.componentStack })}
      onReset={() => { /* clear bad state / refetch if needed */ }}
    >
      {children}
    </REB>
  );
}
```

```tsx
// src/app/ErrorFallback.tsx
import { Alert, AlertTitle, Box, Button } from '@mui/material';
import type { FallbackProps } from 'react-error-boundary';
import { toUserMessage } from '@/lib/api/messages';

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Box role="alert" sx={{ display: 'grid', placeItems: 'center', minHeight: '50vh', p: 3 }}>
      <Alert severity="error" sx={{ maxWidth: 480 }}>
        <AlertTitle>Something went wrong</AlertTitle>
        {toUserMessage(error)}
        <Box mt={2}><Button onClick={resetErrorBoundary} variant="contained">Try again</Button></Box>
      </Alert>
    </Box>
  );
}
```

```tsx
// src/app/router.tsx — per-route errorElement
import { RouteErrorElement } from './RouteErrorElement';

const router = createBrowserRouter([
  { path: '/', element: <RootLayout />, errorElement: <RouteErrorElement />, children: [
    { path: 'orders', element: <Orders />, errorElement: <RouteErrorElement /> },
  ]},
]);
```

```tsx
// src/app/RouteErrorElement.tsx
import { isRouteErrorResponse, useRouteError, useNavigate } from 'react-router-dom';
import { toUserMessage } from '@/lib/api/messages';
import { logger } from '@/lib/logger';

export function RouteErrorElement() {
  const error = useRouteError();
  const navigate = useNavigate();
  if (!isRouteErrorResponse(error)) logger.error('Route error', { error });
  const status = isRouteErrorResponse(error) ? error.status : undefined;
  return (
    <FullPageError
      status={status}
      message={toUserMessage(error)}
      onReset={() => navigate(0)}  /* re-run loaders */
    />
  );
}
```

- App composition: `<AppErrorBoundary><RouterProvider/></AppErrorBoundary>`.

## Async / loading states

- Standard React Query state machine: `isPending` (loading) → `isError` → success (`data`). Always handle all three; never render `data` without a guard.
- Loading: MUI `<Skeleton>` matching final layout (not a bare spinner) to avoid layout shift.
- Errors: inline `<Alert>` + Retry for content regions; let render-thrown errors bubble to a boundary.
- `Suspense` boundaries for code-split routes and `useSuspenseQuery`; pair with `<ErrorBoundary>` (suspense errors throw to the nearest boundary).

```tsx
function OrdersList() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  });

  if (isPending) return <OrdersSkeleton />;
  if (isError) return (
    <Alert severity="error" action={<Button onClick={() => refetch()}>Retry</Button>}>
      {toUserMessage(error)}
    </Alert>
  );
  return <>{data.map(o => <OrderRow key={o.id} order={o} />)}</>;
}

function OrdersSkeleton() {
  return <Stack spacing={1}>{Array.from({ length: 6 }).map((_, i) =>
    <Skeleton key={i} variant="rounded" height={56} />)}</Stack>;
}
```

```tsx
// Suspense + boundary for code-split / useSuspenseQuery
<AppErrorBoundary>
  <Suspense fallback={<OrdersSkeleton />}>
    <LazyOrdersPage />
  </Suspense>
</AppErrorBoundary>
```

- Query client defaults (retry sensibly; don't retry non-retryable errors):

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, err) => {
        const kind = (err as ApiError)?.kind;
        if (['auth', 'forbidden', 'notFound', 'validation'].includes(kind)) return false;
        return count < 2;
      },
      staleTime: 30_000,
    },
    mutations: { retry: 0 },
  },
});
```

## User-facing errors

- **Never** show raw stack traces, error objects, or backend internals to users. Map `ApiError` → friendly copy via `toUserMessage`.
- Choose the surface by error scope:

| Surface | When | Mechanism |
|---------|------|-----------|
| Snackbar / Toast | Transient & recoverable (network, timeout, rate limit, mutation failure) | MUI `<Snackbar>` + `<Alert>` (e.g. `notistack`) |
| Inline | Form validation, field-scoped errors | Map `error.fields` → MUI `helperText` / `error` props |
| Full-page | Route-level / boundary failures (404, 403, 5xx, render crash) | `errorElement` / boundary fallback |

```ts
// src/lib/api/messages.ts
import { ApiError } from './errors';

const COPY: Record<string, string> = {
  network: 'Connection problem. Check your network and try again.',
  timeout: 'This is taking too long. Please try again.',
  auth: 'Your session expired. Please sign in again.',
  forbidden: "You don't have permission to do that.",
  notFound: "We couldn't find what you were looking for.",
  conflict: 'This item was just updated. Refresh and try again.',
  rateLimit: 'Too many requests. Please wait a moment.',
  server: 'Something went wrong on our end. Please try again.',
  unknown: 'Something went wrong. Please try again.',
};

export function toUserMessage(err: unknown): string {
  if (err instanceof ApiError) return COPY[err.kind] ?? COPY.unknown;
  return COPY.unknown;
}
```

```tsx
// Form field mapping (validation)
catch (err) {
  const e = err as ApiError;
  if (e.kind === 'validation' && e.fields) {
    Object.entries(e.fields).forEach(([field, msgs]) =>
      setError(field as any, { message: msgs[0] }));
  } else {
    enqueueSnackbar(toUserMessage(e), { variant: 'error' });
  }
}
```

- Include `requestId` discreetly in full-page fallbacks ("Reference: abc123") so support can correlate — it is not a stack trace.

## Logging

- Single logger abstraction so call sites never touch `console` or the monitoring SDK directly. Swap backends in one place.

```ts
// src/lib/logger.ts
import * as Sentry from '@sentry/react';

type Ctx = Record<string, unknown>;
const isProd = import.meta.env.PROD;

const PII = /(email|phone|ssn|password|token|authorization|firstName|lastName|dob|address)/i;
function redact(ctx?: Ctx): Ctx | undefined {
  if (!ctx) return ctx;
  return Object.fromEntries(
    Object.entries(ctx).map(([k, v]) => [k, PII.test(k) ? '[redacted]' : v]),
  );
}

export const logger = {
  debug: (msg: string, ctx?: Ctx) => { if (!isProd) console.debug(msg, redact(ctx)); },
  info:  (msg: string, ctx?: Ctx) => { if (!isProd) console.info(msg, redact(ctx)); },
  warn:  (msg: string, ctx?: Ctx) => {
    console.warn(msg, redact(ctx));
    Sentry.captureMessage(msg, { level: 'warning', extra: redact(ctx) });
  },
  error: (msg: string, ctx?: Ctx) => {
    console.error(msg, redact(ctx));
    const { error, ...rest } = (ctx ?? {}) as Ctx & { error?: unknown };
    Sentry.captureException(error ?? new Error(msg), { extra: redact(rest) });
  },
};
```

- **What to log**: unexpected errors (5xx, render crashes, uncaught) → monitoring. **What not to**: expected/handled flow (validation, 401 redirect, 404) — log at `info`/`warn` at most to avoid alert noise.
- **Context to attach**: `requestId`, route, user role (not user identity/PII), `error.kind`, `error.status`, `error.code`, `componentStack`.
- **Redaction**: never send PII (emails, names, phone, tokens, DOB, addresses) to monitoring; redact by key (above) and scrub request/response bodies. Configure Sentry `beforeSend` + `maskAllText`/`maskAllInputs` for session replay.
- **Init once** at app bootstrap:

```ts
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  beforeSend: (event) => { /* drop/scrub PII fields */ return event; },
});
```

- Hook boundaries to the logger (`onError` in `AppErrorBoundary`, `logger.error` in `RouteErrorElement`) and React Query's global cache callbacks for unhandled query/mutation errors:

```ts
new QueryClient({
  queryCache: new QueryCache({
    onError: (err) => { if ((err as ApiError)?.kind === 'unknown' || (err as ApiError)?.kind === 'server') logger.error('Query failed', { error: err }); },
  }),
});
```
