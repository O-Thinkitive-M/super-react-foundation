# 14 — Performance & Scalability

Goal: **fast load, no broken pages.** Small initial bundle, lazy everything non-critical, virtualize large lists, cache smart.

## Route-Level Code Splitting

Each feature is lazy-loaded; routes wrap in `Suspense` with skeletons.
```tsx
const PatientList = lazy(() => import('@/features/patients/PatientList'));
const Encounter   = lazy(() => import('@/features/encounters/Encounter'));

<Suspense fallback={<TableSkeleton rows={10} />}>
  <Routes>
    <Route path="/patients" element={<PatientList />} />
    <Route path="/encounters/:id" element={<Encounter />} />
  </Routes>
</Suspense>
```
- Fallbacks are **skeletons** matching final layout (no blank/CLS).

## Bundle Budget

| Asset | Budget |
|-------|--------|
| Initial JS (gzip) | ≤ 200 KB |
| Per-route chunk (gzip) | ≤ 120 KB |
| Vendor shared chunk | ≤ 180 KB |
| CSS (initial) | ≤ 40 KB |

- Enforce via `vite build` + `rollup-plugin-visualizer`; fail CI if over budget.
- MUI: import per-component; tree-shake icons via `lucide-react` named imports.

## Prefetch on Intent

```ts
// Prefetch route chunk + data on hover/focus or when link enters viewport
function prefetchPatient(id: string) {
  import('@/features/patients/PatientDetail');           // code
  queryClient.prefetchQuery(patientQuery(id));           // data
}
<Link onMouseEnter={() => prefetchPatient(id)} onFocus={() => prefetchPatient(id)} />
```
- Use `IntersectionObserver` for visible-in-viewport prefetch of list rows.

## Memoization Rules

| Tool | Use for |
|------|---------|
| `React.memo` | List/table **row** components |
| `useMemo` | Derived/filtered/sorted data, expensive computes |
| `useCallback` | Handlers passed to memoized children |

- Never create inline objects/arrays/functions as props to memoized children.
- Stable selectors from zustand; avoid selecting whole store.

## Virtualization

`@tanstack/react-virtual` for any list > ~50 rows.

| Surface | Virtualize |
|---------|-----------|
| DataTable (patients/encounters) | ✅ row virtualizer |
| Document library | ✅ grid/list virtualizer |
| Long dropdowns/comboboxes | ✅ |

```tsx
const rv = useVirtualizer({ count: rows.length, getScrollElement: () => parentRef.current,
  estimateSize: () => 48, overscan: 8 });
```

## TanStack Query Strategy

| Concern | Approach |
|---------|----------|
| Caching | `staleTime` 30–60s for lists; `gcTime` 5 min |
| Dedup | Same `queryKey` shares one in-flight request |
| Optimistic updates | `onMutate` patch cache → rollback `onError` → `invalidate` `onSettled` |
| Pagination/scroll | `useInfiniteQuery` with `getNextPageParam` |
| Prefetch | `prefetchQuery` on intent |

```ts
useMutation({
  mutationFn: archivePatient,
  onMutate: async (id) => {
    await qc.cancelQueries({ queryKey: ['patients'] });
    const prev = qc.getQueryData(['patients']);
    qc.setQueryData(['patients'], (o) => removeById(o, id));
    return { prev };
  },
  onError: (_e, _v, ctx) => qc.setQueryData(['patients'], ctx?.prev),
  onSettled: () => qc.invalidateQueries({ queryKey: ['patients'] }),
});
```

## Image / Thumbnail Lazy-Load

- `<img loading="lazy" decoding="async" width height>` (reserve space → no CLS).
- Document thumbnails load on viewport entry; placeholder skeleton until loaded.

## Feature-Slice Scalability

- Folder-by-feature (`src/features/<name>/`): components, hooks, api, tests co-located.
- Shared primitives in `src/shared/`; no cross-feature imports except via shared.
- New feature = new lazy route + slice; zero impact on existing bundles.

## Render-Cost Rules (Dense Tables)

- **Stable keys** (entity id, never index).
- **No inline objects/functions** in cell render props.
- Column defs defined once (module scope or `useMemo`).
- Avoid full re-render on cell edit — isolate editable cell state.
- Debounce filter/search input (~250 ms) before refetch.

## Performance Targets

| Metric | Target |
|--------|--------|
| TTI (mid-tier laptop) | < 2.5 s |
| FCP | < 1.5 s |
| Initial bundle (gzip) | ≤ 200 KB |
| Route chunk (gzip) | ≤ 120 KB |
| CLS | < 0.1 |
| List scroll | 60 fps (virtualized) |
| API list response render | < 100 ms after data |
