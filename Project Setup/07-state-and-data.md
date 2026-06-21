# 07 — State & Data Layer

Harmony EMR (HUPC) Provider frontend. **React 19 + TS strict, Vite 8, MUI v7.**
Two state layers: **Zustand v5** (client/UI state) + **TanStack Query v5** (server state).
All API I/O flows through the single **`customAxios`** mutator used by the Orval SDK (see `17-api-sdk-orval.md`).

---

## 1. State boundaries (what goes where)

| Concern | Layer | Store / Tool |
|---|---|---|
| Auth token, user, role | Zustand | `authStore` |
| Sidebar, modals, toasts | Zustand | `uiStore` |
| Active patient context | Zustand | `patientStore` |
| Server data (patients, appts, encounters) | TanStack Query | query hooks (SDK) |
| Form state + validation | react-hook-form + zod | per-form |
| Table filter/sort/page | URL query params | `useTableQueryState` |

**Rule:** server data never lives in Zustand. Zustand holds only client truth.

---

## 2. Zustand stores (`src/store/`)

### `authStore.ts` — token, user, role, idle timeout
```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const IDLE_MS = 30 * 60 * 1000; // 30-min idle timeout (HIPAA)
let idleTimer: ReturnType<typeof setTimeout> | undefined;

interface AuthState {
  token: string | null;
  user: { id: string; name: string } | null;
  role: 'provider' | 'admin' | 'staff' | null;
  isAuthenticated: boolean;
  login: (p: { token: string; user: AuthState['user']; role: AuthState['role'] }) => void;
  logout: () => void;
  resetIdle: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null, user: null, role: null, isAuthenticated: false,
      login: ({ token, user, role }) => { set({ token, user, role, isAuthenticated: true }); get().resetIdle(); },
      logout: () => { clearTimeout(idleTimer); set({ token: null, user: null, role: null, isAuthenticated: false }); },
      resetIdle: () => {
        clearTimeout(idleTimer);
        if (get().isAuthenticated) idleTimer = setTimeout(() => get().logout(), IDLE_MS);
      },
    }),
    { name: 'harmony-auth', partialize: (s) => ({ token: s.token, user: s.user, role: s.role, isAuthenticated: s.isAuthenticated }) },
  ),
);
```
> Idle reset wired once in app root: `['mousemove','keydown','click'].forEach(e => window.addEventListener(e, useAuthStore.getState().resetIdle))` (debounced).
> Migration note: `token` in localStorage today → httpOnly cookie later (see `17`). Keep token access centralized here so the swap is one file.

### `uiStore.ts` — sidebar, modal, toast queue
```ts
interface Toast { id: string; severityKey: string; messageKey: string } // messageKey → i18n
interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  toasts: Toast[];
  toggleSidebar: () => void;
  openModal: (id: string) => void; closeModal: () => void;
  pushToast: (t: Omit<Toast, 'id'>) => void; dismissToast: (id: string) => void;
}
export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true, activeModal: null, toasts: [],
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openModal: (id) => set({ activeModal: id }), closeModal: () => set({ activeModal: null }),
  pushToast: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: crypto.randomUUID() }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));
```
> Toasts carry **i18n keys**, never literal strings (no hardcoded UI text).

### `patientStore.ts` — active patient context
```ts
interface PatientState {
  activePatientId: string | null;
  setActivePatient: (id: string | null) => void;
  clear: () => void;
}
export const usePatientStore = create<PatientState>((set) => ({
  activePatientId: null,
  setActivePatient: (id) => set({ activePatientId: id }),
  clear: () => set({ activePatientId: null }),
}));
```
> Holds only the **id**; the patient record itself is fetched via a shared query keyed by that id.

---

## 3. TanStack Query setup (`src/lib/queryClient.ts`)

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,            // sane default
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,  // overridden per-query for calendar
      retry: (count, err: any) => (err?.status >= 500 ? count < 2 : false),
    },
  },
});
```

### Stale-time policy

| Data | staleTime | refetchOnWindowFocus | Rationale |
|---|---|---|---|
| Patient demographics / chart | **5 min** | false | Changes rarely within a session |
| Appointment slots | **30 s** | true | Booking races; must be fresh |
| Calendar view | 30 s | **true** (background) | Re-sync when provider returns to tab |
| Reference/lookups (code systems) | Infinity | false | Static within session |

Apply per-hook: `useAppointmentSlots(date, { staleTime: 30_000, refetchOnWindowFocus: true })`.

---

## 4. `customAxios` mutator (`src/api/axios-instance.ts`)

The **single** axios instance the generated SDK calls. Full contents in `17-api-sdk-orval.md`; summary of responsibilities:

| Interceptor | Action |
|---|---|
| Request | Attach `Authorization: Bearer <token>` from `authStore`; set `baseURL = import.meta.env.VITE_API_URL` |
| Response (success) | Emit **audit log** entry (route, method, status — no PHI body) |
| Response (error) | **PHI-safe logging** (strip request/response bodies), map to `AppError`, `401` → `authStore.logout()` + redirect |

> Never instantiate axios elsewhere. One instance = one place for auth, audit, and PHI rules.

---

## 5. URL-synced table query-state (`src/hooks/useTableQueryState.ts`)

Filter/sort/pagination live in the **URL** (shareable, back-button-safe, refresh-safe).
```ts
import { useSearchParams } from 'react-router-dom';

export function useTableQueryState(defaults?: { page?: number; size?: number; sort?: string }) {
  const [params, setParams] = useSearchParams();
  const state = {
    page: Number(params.get('page') ?? defaults?.page ?? 1),
    size: Number(params.get('size') ?? defaults?.size ?? 20),
    sort: params.get('sort') ?? defaults?.sort ?? '',
    q:    params.get('q') ?? '',
  };
  const patch = (next: Partial<typeof state>) =>
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      Object.entries(next).forEach(([k, v]) => (v === '' || v == null ? p.delete(k) : p.set(k, String(v))));
      return p;
    });
  return { ...state, patch };
}
```
> The same `state` object becomes the **query key** → URL change refetches automatically.

---

## 6. Request-efficiency rules (never duplicate / unnecessary calls)

| Rule | How |
|---|---|
| **Stable query keys** | `['patient', id]`, `['appointment-slots', isoDate]` — primitives only, no inline objects that change identity |
| **Automatic dedup** | Many components, one hook, same key → React Query fires **one** network request |
| **Shared queries** | `usePatient(id)` used across header, chart, sidebar → single fetch, shared cache |
| **Debounced search** | Debounce input ~300 ms, then feed into key: `['patient-search', debouncedQ]` |
| **`enabled` guards** | `useEncounter(id, { enabled: !!id })` — no fire on null id |
| **Pagination** | `placeholderData: keepPreviousData` to avoid flicker / refetch storms |
| **No manual cache writes for server data** | Invalidate keys after mutations instead of hand-syncing Zustand |

---

## 7. react-hook-form + zod — one schema, two jobs

A single zod schema validates **the form** and types **the API payload** (no drift).
```ts
import { z } from 'zod';
export const patientSchema = z.object({
  firstName: z.string().min(1, 'validation.required'),  // i18n key as message
  dob: z.string().date(),
  mrn: z.string().regex(/^\d{6,}$/, 'validation.mrn'),
});
export type PatientPayload = z.infer<typeof patientSchema>; // === SDK body type shape
```
```ts
const form = useForm<PatientPayload>({ resolver: zodResolver(patientSchema) });
const { mutate } = useCreatePatient(); // SDK hook, body typed as PatientPayload
form.handleSubmit((values) => mutate({ data: values }));
```
> zod messages are **i18n keys**, resolved at render — no hardcoded UI text.

---

## Golden rules
- Server data → TanStack Query; client truth → Zustand. Never mix.
- One axios instance (`customAxios`); token access only via `authStore`.
- Query keys are stable primitives → dedup + sharing for free.
- Table state in the URL. Forms + payloads share one zod schema.
- All user-facing strings come from `src/i18n/`.
