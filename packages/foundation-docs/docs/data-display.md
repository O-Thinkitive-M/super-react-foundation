# Data Display System

> Generic foundation doc. Copied verbatim into every project's `project-setup/data-display.md`.
> The config-driven `DataTable` + supporting primitives. Dense, repetitive list screens are built from ONE change-safe table + a `ColumnDef<T>[]`. **Extend via config, never fork.**

## Change-safe contract

- Stable, typed prop API; new needs = new **optional** props/config, never breaking signatures.
- All header/label/empty text comes from **i18n** (`tableHeaders.*`, `labels.*` — see `i18n.md`).
- Mutually-exclusive modes: pagination **OR** infinite scroll; selection on/off; virtualization on/off — defaults safe.

## File map

| Path | Export |
|---|---|
| `src/components/data/DataTable/DataTable.tsx` | `DataTable<T>` |
| `src/components/data/DataTable/types.ts` | `ColumnDef<T>`, `DataTableProps<T>` |
| `src/components/data/DataTable/useInfiniteList.ts` | `useInfiniteList` |
| `src/components/data/TruncatedText.tsx` | `TruncatedText` |
| `src/components/data/StatusChip.tsx` | `StatusChip` |
| `src/components/data/FilterBar/FilterBar.tsx` | `FilterBar` |
| `src/components/data/KpiCard.tsx` | `KpiCard` |
| `src/config/status.ts` | status registry (see `config-registries.md`) |

## `ColumnDef<T>`

```tsx
export interface ColumnDef<T> {
  key: string;                       // row accessor / stable id
  headerKey: string;                 // i18n key — never a literal
  width?: number; minWidth?: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  sticky?: "left" | "right";         // frozen column (e.g. name, actions)
  cellLink?: (row: T) => string;     // makes the cell a router link
  render?: (row: T) => React.ReactNode; // custom cell (chips, sub-text)
}
```

## `DataTableProps<T>`

| Prop | Notes |
|---|---|
| `data` | current page / accumulated rows |
| `columns` | the `ColumnDef<T>[]` config |
| `loading` | shows skeleton rows |
| `getRowId` | required for selection/virtual keys |
| `selection` | `{ selected, onChange }` → checkbox col + select-all |
| `bulkActions` | toolbar actions when ≥1 selected |
| `rowActions` | `{ inline?, kebab? }` inline buttons + overflow menu |
| `pagination` | server paging (`"1–15 of 212"`) |
| `infinite` | `useInfiniteList` result — mutually exclusive with `pagination` |
| `virtualized` | `@tanstack/react-virtual` |
| `onSort` | `(key, dir) => void` server-sort callback |
| `emptyState` | `{ titleKey, descKey, action? }` i18n keys |

```tsx
const columns: ColumnDef<User>[] = [
  { key: "name", headerKey: "tableHeaders.name", sticky: "left",
    cellLink: (u) => `/users/${u.id}`,
    render: (u) => <TruncatedText text={u.name} /> },
  { key: "status", headerKey: "tableHeaders.status",
    render: (u) => <StatusChip status={u.status} /> },
];

<DataTable
  data={rows} columns={columns} getRowId={(u) => u.id}
  pagination={pagination}
  onSort={(key, dir) => setSort({ key, dir })}
  emptyState={{ titleKey: "titles.noUsers", descKey: "descriptions.noUsers" }}
/>
```

- Page/pageSize and sort live in **URL query-state** (see `routing.md`) so reloads and back/forward work; server returns `{ items, total }`.

## `useInfiniteList` — bulletproof infinite scroll

TanStack `useInfiniteQuery` + ONE `IntersectionObserver` sentinel. Correct under fast scroll, filter change, refetch, empty, and error.

```tsx
export function useInfiniteList<T>(opts: {
  queryKey: unknown[];
  fetchPage: (cursor?: string) => Promise<{ items: T[]; nextCursor?: string }>;
}) {
  const q = useInfiniteQuery({
    queryKey: opts.queryKey,                  // filter values INSIDE the key → refetch on change
    queryFn: ({ pageParam }) => opts.fetchPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor, // undefined ends pagination
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage();
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [q.hasNextPage, q.isFetchingNextPage, q.fetchNextPage]);

  const rows = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { rows, sentinelRef, ...q };
}
```

| Risk | Guard |
|---|---|
| Duplicate rows | cursor-based `getNextPageParam`; never re-fetch a cursor |
| Missed rows | `rootMargin: "200px"` prefetch + `nextCursor` is source of truth |
| Double fire (fast scroll) | `!isFetchingNextPage` gate inside the observer |
| Filter change | filter values in `queryKey` → cache reset, sentinel re-observes |
| Empty / error | `rows.length === 0 && !isLoading` → empty state; `q.isError` → inline retry |

## `StatusChip` (reads the status registry)

```tsx
import { STATUS_REGISTRY, type StatusKey } from "@/config/status";

export function StatusChip({ status }: { status: StatusKey }) {
  const cfg = STATUS_REGISTRY[status];
  return <Chip size="small" color={cfg.color} variant={cfg.variant} label={t(cfg.labelKey)} />;
}
```

- New status = one registry entry + one i18n key. Zero component edits.

## `TruncatedText`

Ellipsis on overflow + a tooltip with the full text. Used in cells and any width-constrained area (pairs with the `minWidth: 0` rule in `responsive-system.md`).

## `FilterBar` (config-driven → URL query-state)

| Filter kind | Config |
|---|---|
| `search` | debounced text → `q` param |
| `select` | options from i18n; single/multi |
| `dateRange` | from/to (via `datetime-timezone.md` helpers) |

- Reads/writes `useSearchParams`. Pagination, sort, and filters share URL state → shareable, back-safe, and the infinite `queryKey` derives from it.

## `KpiCard` (dashboard count cards)

```tsx
<KpiCard titleKey="titles.openItems" value={212} delta={+8} icon="users" onClick={() => navigate("/items")} />
```

`value` formatted via `Intl.NumberFormat`; `delta` optional colored trend; `icon` from the icon registry.

## Do / Don't

- ✅ New column type → add an optional `ColumnDef` field + handle it in the renderer.
- ✅ All text via `t()`; status via the registry.
- ❌ Never inline literal headers, never fork `DataTable` per screen, never mix `pagination` + `infinite`.

## Adapt per project (from UI/SRS/MOM)

- Define each list screen's `ColumnDef<T>[]` and `FilterBar` config under `features/<feature>/config/`.
- The `DataTable` primitive itself is fixed; only the configs change.
