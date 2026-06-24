# Performance & Scalability

> Generic foundation doc. Copied verbatim into every project's `project-setup/performance.md`.
> Goal: **fast load, no broken pages.** Small initial bundle, lazy everything non-critical, virtualize large lists, cache smart.

## Route-level code splitting

Each feature route is a lazy module; layouts wrap a `<Suspense>` boundary with a skeleton fallback (matching final layout → no layout shift). See `routing.md`.

```tsx
{ path: "users", lazy: () => import("@/features/users/pages/UsersPage") }
```

- Each `import("@/features/<name>/...")` becomes its own bundle chunk automatically.
- Fallbacks are **skeletons**, never blank screens.

## Bundle budget

| Asset | Budget (gzip) |
|---|---|
| Initial JS | ≤ 200 KB |
| Per-route chunk | ≤ 120 KB |
| Vendor shared chunk | ≤ 180 KB |
| CSS (initial) | ≤ 40 KB |

- Inspect with `rollup-plugin-visualizer`; treat a budget breach as a CI failure.
- Import MUI/icons per-component (named imports) so tree-shaking works.

## Prefetch on intent

```ts
function prefetchUser(id: string) {
  import("@/features/users/pages/UserDetailPage");          // code
  queryClient.prefetchQuery({ queryKey: keys.example.detail(id), queryFn: () => fetchUser(id) }); // data
}
// <Link onMouseEnter={() => prefetchUser(id)} onFocus={() => prefetchUser(id)} />
```

- Use `IntersectionObserver` for visible-in-viewport prefetch of list rows.

## Memoization rules

| Tool | Use for |
|---|---|
| `React.memo` | list/table **row** components |
| `useMemo` | derived/filtered/sorted data, expensive computes |
| `useCallback` | handlers passed to memoized children |

- Never create inline objects/arrays/functions as props to memoized children.
- Select narrow slices from the client-state store; avoid selecting the whole store.

## Virtualization

`@tanstack/react-virtual` for any list > ~50–100 rows.

| Surface | Virtualize |
|---|---|
| Data tables (long lists) | ✅ row virtualizer |
| Document/thumbnail grids | ✅ grid virtualizer |
| Long dropdowns/comboboxes | ✅ |

```tsx
const v = useVirtualizer({ count: rows.length, getScrollElement: () => parentRef.current,
  estimateSize: () => 48, overscan: 8 });
```

## React Query strategy

| Concern | Approach |
|---|---|
| Caching | `staleTime` 30–60s for lists; `gcTime` ~5 min (defaults in `api/query-client.ts`) |
| Dedup | same `queryKey` shares one in-flight request |
| Optimistic updates | `onMutate` patch cache → rollback `onError` → `invalidate` `onSettled` |
| Pagination / scroll | `useInfiniteQuery` with `getNextPageParam` (see `data-display.md`) |
| Prefetch | `prefetchQuery` on intent |

```ts
useMutation({
  mutationFn: archiveItem,
  onMutate: async (id) => {
    await qc.cancelQueries({ queryKey: keys.example.list() });
    const prev = qc.getQueryData(keys.example.list());
    qc.setQueryData(keys.example.list(), (o) => removeById(o, id));
    return { prev };
  },
  onError: (_e, _v, ctx) => qc.setQueryData(keys.example.list(), ctx?.prev),
  onSettled: () => qc.invalidateQueries({ queryKey: keys.example.list() }),
});
```

## Image / media

- `<img loading="lazy" decoding="async" width height>` (reserve space → no CLS).
- Thumbnails load on viewport entry with a skeleton placeholder.

## Render-cost rules (dense tables)

- Stable keys (entity id, never index).
- No inline objects/functions in cell render props; column defs defined once (module scope or `useMemo`).
- Isolate editable-cell state so the whole table doesn't re-render on one edit.
- Debounce filter/search input (~250–300ms) before refetch.

## Performance targets

| Metric | Target |
|---|---|
| TTI (mid-tier laptop) | < 2.5 s |
| FCP | < 1.5 s |
| Initial bundle (gzip) | ≤ 200 KB |
| CLS | < 0.1 |
| List scroll | 60 fps (virtualized) |
| List render after data | < 100 ms |

## Adapt per project (from SRS/MOM)

- Set real budgets/targets for the project's device class and tighten/loosen the table above.
- Decide which surfaces actually need virtualization based on expected data volumes.
