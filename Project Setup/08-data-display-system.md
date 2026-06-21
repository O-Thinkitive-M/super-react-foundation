# 08 — Data Display System (Centerpiece)

> The config-driven `DataTable` + supporting primitives. The 35 screens are dense, repetitive tables; we build ONE change-safe table and assemble each screen from a `ColumnDef<T>[]` + props. **Extend via config, never fork.**

## Change-safe contract
- Stable typed prop API; new needs = new optional props/config, never breaking signatures.
- All header/label/empty text comes from **i18n** (`tableHeaders.*`, `labels.*`) — see `19-i18n-and-text-registry.md`.
- Controlled variants: pagination **OR** infinite (mutually exclusive), selection on/off, virtualization on/off — defaults safe.

## File map
| Path | Export |
|------|--------|
| `src/components/data/DataTable/DataTable.tsx` | `DataTable<T>` |
| `src/components/data/DataTable/types.ts` | `ColumnDef<T>`, `DataTableProps<T>` |
| `src/components/data/DataTable/useInfiniteList.ts` | `useInfiniteList` |
| `src/components/data/TruncatedText.tsx` | `TruncatedText` |
| `src/components/data/StatusChip.tsx` | `StatusChip` |
| `src/components/data/FilterBar/FilterBar.tsx` | `FilterBar` |
| `src/components/data/KpiCard.tsx` | `KpiCard` |
| `src/config/status.ts` | status registry |

## `ColumnDef<T>`
| Field | Type | Purpose |
|-------|------|---------|
| `key` | `keyof T \| string` | row accessor / stable id |
| `headerKey` | `string` | i18n key (`tableHeaders.patientName`) — **never literal** |
| `width` / `minWidth` | `number` | column sizing |
| `align` | `'left'\|'center'\|'right'` | cell + header align |
| `sortable` | `boolean` | enables sort affordance |
| `sticky` | `'left'\|'right'` | frozen column (e.g. name, actions) |
| `mask` | `boolean` | PHI masking (SSN/DOB) until reveal |
| `cellLink` | `(row:T)=>string` | makes cell a router link (clickable cell) |
| `render` | `(row:T)=>ReactNode` | custom cell (chips, sub-text, MRN) |

```tsx
export interface ColumnDef<T> {
  key: string;
  headerKey: string;
  width?: number; minWidth?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sticky?: 'left' | 'right';
  mask?: boolean;
  cellLink?: (row: T) => string;
  render?: (row: T) => React.ReactNode;
}
```

## `DataTableProps<T>`
| Prop | Type | Notes |
|------|------|-------|
| `data` | `T[]` | current page / accumulated rows |
| `columns` | `ColumnDef<T>[]` | the config |
| `loading` | `boolean` | shows skeleton rows |
| `getRowId` | `(row:T)=>string` | required for selection/virtual keys |
| `selection` | `{ selected; onChange }` | enables checkbox col + header select-all |
| `bulkActions` | `BulkAction[]` | render in toolbar when ≥1 selected |
| `rowActions` | `{ inline?; kebab? }` | inline buttons + overflow menu |
| `pagination` | `PaginationProps` | server paging (`"1-15 of 212"`) |
| `infinite` | `UseInfiniteListResult` | mutually exclusive w/ `pagination` |
| `virtualized` | `boolean` | @tanstack/react-virtual |
| `onSort` | `(key, dir)=>void` | server sort callback |
| `emptyState` | `{ titleKey; descKey; action? }` | i18n keys |

```tsx
const columns: ColumnDef<Patient>[] = [
  { key: 'name', headerKey: 'tableHeaders.patientName', sticky: 'left',
    cellLink: (p) => `/patients/${p.id}`,
    render: (p) => (
      <Stack>
        <TruncatedText text={p.name} />
        <Typography variant="caption" color="text.secondary">
          {t('labels.mrn', { mrn: p.mrn })}
        </Typography>
      </Stack>) },
  { key: 'ssn', headerKey: 'tableHeaders.ssn', mask: true },
  { key: 'status', headerKey: 'tableHeaders.status',
    render: (p) => <StatusChip status={p.status} /> },
];

<DataTable
  data={rows} columns={columns} getRowId={(p) => p.id}
  selection={{ selected, onChange: setSelected }}
  bulkActions={[{ key: 'export', labelKey: 'buttons.export', onRun: exportRows }]}
  rowActions={{
    inline: [{ key: 'view', icon: Eye, onRun: openPatient }],
    kebab:  [{ key: 'archive', labelKey: 'buttons.archive', onRun: archive }],
  }}
  pagination={pagination}
  onSort={(key, dir) => setSort({ key, dir })}
  emptyState={{ titleKey: 'titles.noPatients', descKey: 'descriptions.noPatients' }}
/>
```

## Server pagination
- Drives `"1-15 of 212"` footer; page/pageSize live in **URL query-state** (see FilterBar) so reloads/back work.
- `onSort` + sort state also URL-synced; server returns `{ items, total }`.

## `useInfiniteList` — bulletproof infinite scroll
TanStack `useInfiniteQuery` + **ONE** IntersectionObserver sentinel. Correct under fast scroll, filter change, refetch, empty, error.

```tsx
export function useInfiniteList<T>(opts: {
  queryKey: unknown[];
  fetchPage: (cursor?: string) => Promise<{ items: T[]; nextCursor?: string }>;
}) {
  const q = useInfiniteQuery({
    queryKey: opts.queryKey,                 // filter values INSIDE key → refetch on change
    queryFn: ({ pageParam }) => opts.fetchPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor, // undefined ends pagination → no missed/dupe
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      // guard: in view AND more AND not already loading → exactly one trigger
      if (e.isIntersecting && q.hasNextPage && !q.isFetchingNextPage) {
        q.fetchNextPage();
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();            // single observer, cleaned every deps change
  }, [q.hasNextPage, q.isFetchingNextPage, q.fetchNextPage]);

  const rows = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { rows, sentinelRef, ...q };
}
```

**Correctness rules**
| Risk | Guard |
|------|-------|
| Duplicate rows | cursor-based `getNextPageParam`; never re-fetch same cursor |
| Missed rows | `rootMargin: '200px'` prefetch + `nextCursor` is source of truth |
| Double fire (fast scroll) | `!isFetchingNextPage` gate inside observer |
| Filter change | filter values in `queryKey` → cache reset, sentinel re-observes |
| Refetch | TanStack replaces pages atomically; `rows` recomputed via memo |
| Empty | `rows.length === 0 && !isLoading` → render `emptyState` |
| Error | `q.isError` → inline retry row using `error.*` i18n |

## Virtualization (@tanstack/react-virtual)
```tsx
const v = useVirtualizer({ count: rows.length, getScrollElement: () => scrollRef.current,
  estimateSize: () => 52, overscan: 8 });
// render only v.getVirtualItems(); sentinel rendered after last virtual row
```
- Use when `rows.length > ~100` (long infinite lists). Pagination pages (15–50 rows) skip it.

## `TruncatedText`
Ellipsis on overflow + theme-styled MUI `Tooltip` with full text. Used in cells and any width-constrained area.
```tsx
export function TruncatedText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => { const el = ref.current;
    if (el) setOverflow(el.scrollWidth > el.clientWidth); }, [text]);
  const span = <Box component="span" ref={ref}
    sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
    {text}</Box>;
  return overflow
    ? <Tooltip title={text} arrow>{span}</Tooltip>
    : span;
}
```

## `StatusChip` + `status.ts` registry
```ts
// src/config/status.ts — status → { labelKey (i18n enums.*), color, variant }
export const STATUS_REGISTRY = {
  active:   { labelKey: 'enums.status.active',   color: 'success', variant: 'soft' },
  pending:  { labelKey: 'enums.status.pending',  color: 'warning', variant: 'soft' },
  inactive: { labelKey: 'enums.status.inactive', color: 'default', variant: 'outlined' },
} as const;
export type StatusKey = keyof typeof STATUS_REGISTRY;
```
```tsx
export function StatusChip({ status }: { status: StatusKey }) {
  const cfg = STATUS_REGISTRY[status];
  return <Chip size="small" color={cfg.color} variant={cfg.variant} label={t(cfg.labelKey)} />;
}
```
- New status = one registry entry + one i18n key. Zero component edits.

## `FilterBar` (config-driven → URL query-state)
| Filter kind | Config |
|-------------|--------|
| `search` | debounced text → `q` param |
| `select` | options from i18n; single/multi |
| `dateRange` | dayjs from/to |
| `advanced` | collapsible panel for rare filters |

```tsx
<FilterBar
  filters={[
    { kind: 'search', key: 'q', placeholderKey: 'labels.searchPatients' },
    { kind: 'select', key: 'status', labelKey: 'labels.status', options: STATUS_OPTIONS },
    { kind: 'dateRange', key: 'dob', labelKey: 'labels.dob' },
  ]}
  onReset={resetParams} onApply={applyParams}   // buttons: buttons.reset / buttons.apply
/>
```
- Reads/writes `useSearchParams` (router v7). Pagination, sort, filters all share URL state → shareable, back-button-safe, infinite `queryKey` derived from it.

## `KpiCard` (dashboard count cards)
```tsx
<KpiCard titleKey="titles.openReferrals" value={212} delta={+8}
  icon={FileText} onClick={() => navigate('/referrals')} />
```
| Prop | Use |
|------|-----|
| `titleKey` | i18n title |
| `value` | count (formatted via Intl) |
| `delta` | optional trend (+/- colored) |
| `icon` | lucide-react |
| `onClick` | drill-through |

## Do / Don't
- ✅ New column type → add `ColumnDef` field (optional) + handle in renderer.
- ✅ All text via `t()`; PHI columns set `mask`.
- ❌ Never inline literal headers, never fork `DataTable` per screen, never mix `pagination` + `infinite`.
