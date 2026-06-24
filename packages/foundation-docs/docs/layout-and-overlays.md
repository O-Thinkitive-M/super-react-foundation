# Layout & Overlays

> Generic foundation doc. Copied verbatim into every project's `project-setup/layout-and-overlays.md`.
> App shells, split-pane, overlays (drawer/modal/toast), and document viewing. Config-driven, change-safe. All text from **i18n**.

## How this maps to the seeded router

The scaffold already ships `RootLayout` and `AppLayout` in `src/router/` (see `routing.md`). This doc extends that with the richer layout/overlay primitives you add as features grow.

| Path | Export | Role |
|---|---|---|
| `src/router/RootLayout.tsx` | `RootLayout` | root chrome + `<Outlet/>` (seeded) |
| `src/router/AppLayout.tsx` | `AppLayout` | authed shell + `<Suspense>` boundary (seeded) |
| `src/components/layout/SplitPane.tsx` | `SplitPane`, `MasterDetail` | list + detail on one screen |
| `src/components/overlays/Drawer.tsx` | `Drawer` | side form panel |
| `src/components/overlays/Modal.tsx` | `Modal`, `ConfirmDialog` | generic dialog + destructive-action gate |
| `src/components/overlays/Toast.tsx` | `toast` | transient feedback |
| `src/components/docs/DocumentViewer.tsx` | `DocumentViewer` | any-file-type preview |

## Layouts

| Layout | Composition | When |
|---|---|---|
| `RootLayout` | app-wide chrome + `errorElement` host | at `/`, once |
| `AppLayout` | sidebar + topbar + `<Outlet/>` + `<Suspense>` | authed routes (under `RequireAuth`) |
| auth layout | centered card, no nav | login / OTP / reset (add when auth UI exists) |

```tsx
export default function AppLayout() {
  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <Sidebar items={NAV_MENU} />               {/* add when features exist */}
      <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
        <TopBar />
        <Suspense fallback={<PageSkeleton />}><Outlet /></Suspense>
      </Box>
    </Box>
  );
}
```

## `SplitPane` / `MasterDetail`

List pane + detail pane with a "select an item" empty state.

```tsx
<MasterDetail
  list={<DataTable data={rows} columns={cols} onRowClick={(r) => setId(r.id)} selectedId={id} />}
  detail={id ? <ItemDetail id={id} /> : <EmptyState titleKey="titles.selectItem" descKey="descriptions.selectItem" />}
  ratio={[0.4, 0.6]}   // resizable; collapses to stacked on mobile
/>
```

## `Drawer` (side form panel)

```tsx
<Drawer open={open} onClose={close} titleKey="titles.editItem" widthPx={480}>
  <ItemForm onDone={close} />
</Drawer>
```

- Anchor right, **focus-trapped** (`tabbable`), Esc to close, scrim-click guarded when the form is dirty (→ `ConfirmDialog`). See `accessibility.md`.

## `Modal` / `ConfirmDialog`

```tsx
<ConfirmDialog
  open={open} onClose={close} onConfirm={archive}
  titleKey="titles.confirmArchive" messageKey="descriptions.archiveWarning"
  confirmLabelKey="buttons.archive" tone="danger"
/>
```

- `Modal` = generic centered dialog; `ConfirmDialog` = destructive-action gate (delete/archive/discard); `tone="danger"` styles the confirm button error-color.

## `Toast` (success/error from i18n)

Imperative, store-backed; messages are i18n keys.

```tsx
toast.success("messages.success.saved");
toast.error("messages.error.saveFailed", { name });
```

- The toast provider mounts in the root; the stack is top-right, auto-dismiss, WCAG `role="status"`/`role="alert"`.

## `DocumentViewer`

Any-file-type preview, progressive load, graceful fallback — chosen by MIME:

| MIME | Renderer |
|---|---|
| `application/pdf` | PDF canvas pager |
| `image/*` | zoom/pan image |
| other | fallback: download + "preview unavailable" |

- Thumbnails cached; large lists virtualized (see `performance.md`); broken files show an inline retry — never a blank screen.

## When to use which overlay

| Need | Use |
|---|---|
| Side form / detail edit | `Drawer` |
| Confirm destructive action | `ConfirmDialog` |
| Focused task / generic dialog | `Modal` |
| Transient feedback | `Toast` |
| List + detail on one screen | `MasterDetail` |

## Do / Don't

- ✅ All titles/labels/messages via i18n keys; focus-trap + Esc on every overlay.
- ✅ `DocumentViewer` always degrades gracefully.
- ❌ No literal text, no nested modals, no per-screen drawer/dialog forks.

## Adapt per project (from UI/SRS/MOM)

- Build the real `Sidebar`/`TopBar` chrome inside `AppLayout` from `NAV_MENU`.
- Add only the overlay/layout primitives the project's screens actually need; keep the contracts above.
