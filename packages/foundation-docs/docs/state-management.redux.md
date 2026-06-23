# State Management — Redux Toolkit

> This project uses **Redux Toolkit** (`@reduxjs/toolkit` + `react-redux`) for client/UI
> state. Server state stays in TanStack Query. Keep this doc as bullets and tables.

## Library choice

| Concern | Tool | Why |
| --- | --- | --- |
| Server/remote state | `@tanstack/react-query` | Caching, refetch, dedup, mutations |
| Client/UI state | `@reduxjs/toolkit` + `react-redux` | Predictable, devtools, slice pattern |
| Local component state | `useState` / `useReducer` | Anything not shared across the tree |

## What goes where

| Kind of state | Lives in | Example |
| --- | --- | --- |
| Data from the API | React Query | user profile, lists, entities |
| Cross-page UI state | Redux slice | auth session, theme, feature flags |
| One-screen UI state | local `useState` | form fields, open/closed dialogs |
| Derived values | selectors / `useMemo` | totals, filtered lists |

Rule of thumb: **do not put server data in Redux.** If it comes from an API, it belongs in React Query. Redux holds app-owned client state only.

## Store layout (`src/store/`)

```
src/store/
  index.ts          # configureStore + RootState/AppDispatch types
  hooks.ts          # typed useAppDispatch / useAppSelector
  slices/
    auth.slice.ts   # one slice per domain
    ui.slice.ts
```

- `configureStore({ reducer: { auth, ui } })` — RTK enables Immer + devtools by default.
- Export `RootState = ReturnType<typeof store.getState>` and `AppDispatch = typeof store.dispatch`.
- `hooks.ts` exports `useAppSelector: TypedUseSelectorHook<RootState>` and `useAppDispatch`. **Always** import these, never the raw `react-redux` hooks.

## Slice pattern

- One slice per domain via `createSlice`. Reducers mutate `state` directly (Immer handles immutability).
- Async work: `createAsyncThunk` only for client-side flows that aren't server cache (prefer React Query for server data).
- Co-locate selectors with the slice and export them; components never reach into `state.x.y` inline.

## Provider wiring

`main.tsx` wraps the app: `<Provider store={store}>` outside `<QueryClientProvider>`.

## Caching rules

| Layer | Rule |
| --- | --- |
| React Query | `staleTime` per query; invalidate on mutation success |
| Redux | persist only what must survive reload (auth token) via explicit middleware, not the whole store |

## Common mistakes

- Mirroring API responses into Redux → two sources of truth. Use React Query.
- Importing raw `useSelector`/`useDispatch` instead of the typed hooks.
- One giant slice — split by domain.
