# 10 — Layout & Overlays

> App scaffolding (shells, split-pane), overlays (drawer/modal/toast), document viewer, calendar, and the persistent ActionDock. Config-driven, change-safe. All text from **i18n** (`19-i18n-and-text-registry.md`).

## File map
| Path | Export |
|------|--------|
| `src/layouts/AppShell.tsx` | `AppShell` |
| `src/layouts/MainLayout.tsx` | `MainLayout` |
| `src/layouts/AuthLayout.tsx` | `AuthLayout` |
| `src/components/layout/SplitPane.tsx` | `SplitPane`, `MasterDetail` |
| `src/components/overlays/Drawer.tsx` | `Drawer` |
| `src/components/overlays/Modal.tsx` | `Modal`, `ConfirmDialog` |
| `src/components/overlays/Toast.tsx` | `toast` (store + provider) |
| `src/components/docs/DocumentLibrary.tsx` | `DocumentLibrary` |
| `src/components/docs/DocumentViewer.tsx` | `DocumentViewer` |
| `src/components/calendar/Calendar.tsx` | `Calendar`, `TimeSlotGrid` |
| `src/components/layout/ActionDock.tsx` | `ActionDock` |

## Layouts
| Layout | Composition | When |
|--------|-------------|------|
| `AppShell` | theme + QueryClient + ToastProvider + ActionDock host | root wrapper, once |
| `MainLayout` | sticky `Navbar` + sidebar + `<Outlet/>` + `ActionDock` | all authed routes |
| `AuthLayout` | centered card on brand bg, no nav | login / OTP / reset |

```tsx
// router v7
{ element: <MainLayout />, children: [
  { path: 'patients', element: <PatientsPage /> },
  { path: 'referrals', element: <ReferralsPage /> },
]},
{ element: <AuthLayout />, children: [{ path: 'login', element: <LoginPage /> }] }
```
```tsx
export function MainLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box sx={{ flex: 1 }}>
        <Navbar sx={{ position: 'sticky', top: 0, zIndex: 1100 }} />
        <Box component="main" sx={{ p: 3, pb: 10 /* room for dock */ }}><Outlet /></Box>
        <ActionDock />
      </Box>
    </Box>
  );
}
```

## `SplitPane` / `MasterDetail` (Referrals, Fax)
List pane + detail pane; "select an item" empty state when nothing selected.
```tsx
<MasterDetail
  list={<DataTable data={referrals} columns={cols}
          onRowClick={(r) => setSelectedId(r.id)} selectedId={selectedId} />}
  detail={selectedId
    ? <ReferralDetail id={selectedId} />
    : <EmptyState titleKey="titles.selectReferral" descKey="descriptions.selectReferral" />}
  ratio={[0.4, 0.6]}    // resizable; collapses to stacked on mobile
/>
```
| Prop | Use |
|------|-----|
| `list` / `detail` | nodes for each pane |
| `ratio` | `[left, right]` widths; user-resizable |
| `selectedId` | drives detail + empty state |

## `Drawer` (right-side form panel)
```tsx
<Drawer open={open} onClose={close} titleKey="titles.editReferral" widthPx={480}>
  <ReferralForm onDone={close} />
</Drawer>
```
- Anchor right, focus-trapped (`tabbable`), Esc to close, scrim click guarded when form dirty (→ `ConfirmDialog`).

## `Modal` / `ConfirmDialog`
```tsx
<ConfirmDialog
  open={open} onClose={close} onConfirm={archive}
  titleKey="titles.confirmArchive"
  messageKey="descriptions.archiveWarning"
  confirmLabelKey="buttons.archive" tone="danger"   // red destructive CTA
/>
```
- `Modal` = generic centered dialog; `ConfirmDialog` = destructive-action gate (delete/archive/discard). `tone="danger"` styles confirm button error-color.

## `Toast` (success/error from i18n)
Imperative store-backed (zustand v5); messages are i18n keys.
```tsx
toast.success('messages.success.patientCreated');
toast.error('messages.error.saveFailed', { name: patient.name });
```
- `ToastProvider` in `AppShell` renders the stack (top-right, auto-dismiss, WCAG `role="status"`/`role="alert"`).

## Document Library + `DocumentViewer`
Flexible any-file-type (PDF / image / doc), progressive load, cached thumbnails, virtualized list, zoom/paging, graceful fallback.
```tsx
<DocumentLibrary
  documents={docs}                 // {id, name, mime, url, thumbUrl?}
  virtualized                      // @tanstack/react-virtual thumbnail grid
  onOpen={(d) => setViewerDoc(d)}
/>
<DocumentViewer
  doc={viewerDoc}
  // renderer chosen by mime:
  //   application/pdf → PDF canvas pager
  //   image/*         → zoom/pan image
  //   other           → fallback (download + "preview unavailable")
  onClose={() => setViewerDoc(null)}
/>
```
| Capability | Detail |
|------------|--------|
| Thumbnails | cached (`thumbUrl` or generated once, memo/Query-cached) |
| Lazy/progressive | render page/thumb on intersection; PDF pages stream per-page |
| Virtualized list | only visible thumbnails mounted |
| Zoom / paging | toolbar: zoom in/out/fit, prev/next page (labels i18n) |
| Fallback | unsupported mime → icon + `descriptions.previewUnavailable` + download |
| Errors | broken file → inline retry, never blank/crash |

## `Calendar` / `TimeSlotGrid` (scheduling)
```tsx
<Calendar value={date} onChange={setDate} highlightedDays={availableDays} />
<TimeSlotGrid
  slots={slots}                    // {start, end, status:'open'|'booked'|'blocked'}
  onSelect={book}
  granularityMin={15}
/>
```
- dayjs-based; slot statuses styled via `status.ts` colors. Keyboard-navigable (arrow keys), AA contrast.

## `ActionDock` (persistent bottom dock)
Config-driven quick actions; e.g. `"2 New Triage Requests"`.
```tsx
<ActionDock
  items={[
    { key: 'triage', labelKey: 'labels.newTriageRequests',
      count: 2, icon: AlertCircle, onRun: openTriage, tone: 'cta' },  // #F6C344
    { key: 'addPatient', labelKey: 'buttons.addPatient', icon: UserPlus, onRun: openAddPatient },
  ]}
/>
```
| Prop | Use |
|------|-----|
| `labelKey` | i18n label |
| `count` | badge (live counts) |
| `tone` | `cta` (yellow) / `default` |
| `onRun` | handler (opens drawer/modal/route) |
- Fixed `bottom: 0`, full-width, above content (`MainLayout` pads `pb` for it). New dock action = one config item.

## When to use which overlay
| Need | Use |
|------|-----|
| Side form / detail edit | `Drawer` |
| Confirm destructive action | `ConfirmDialog` |
| Focused task / generic dialog | `Modal` |
| Transient feedback | `Toast` |
| List + detail on one screen | `MasterDetail` |
| Persistent global quick actions | `ActionDock` |

## Do / Don't
- ✅ All titles/labels/messages via i18n keys; focus-trap + Esc on every overlay.
- ✅ DocumentViewer always degrades gracefully; never blank screen on bad file.
- ❌ No literal text, no nested modals, no per-screen drawer/dialog forks.
