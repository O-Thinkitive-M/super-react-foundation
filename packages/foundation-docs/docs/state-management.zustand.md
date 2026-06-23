# State Management — Zustand

> This project uses **Zustand** for client/UI state. Server state stays in
> TanStack Query. Keep this doc as bullets and tables.

## Library choice

| Concern | Tool | Why |
| --- | --- | --- |
| Server/remote state | `@tanstack/react-query` | Caching, refetch, dedup, mutations |
| Client/UI state | `zustand` | Tiny, hook-based, no boilerplate |
| Local component state | `useState` / `useReducer` | Anything not shared across the tree |

## What goes where

| Kind of state | Lives in | Example |
| --- | --- | --- |
| Data from the API | React Query | user profile, lists, entities |
| Cross-page UI state | Zustand store | auth session, theme, feature flags |
| One-screen UI state | local `useState` | form fields, open/closed dialogs |
| Derived values | selectors / `useMemo` | totals, filtered lists |

Rule of thumb: **do not put server data in Zustand.** If it comes from an API, it belongs in React Query. Zustand holds app-owned client state only.

## Store layout (`src/store/`)

```
src/store/
  index.ts            # re-exports stores
  auth.store.ts       # one store per domain
  ui.store.ts
```

- One store per domain via `create<State>()(...)`. Keep stores small and focused.
- Co-locate the state shape, actions, and selectors in the same file.
- Select with a slice function to avoid needless re-renders: `useAuthStore((s) => s.user)` — never select the whole store.

## Store pattern

```ts
export const useUiStore = create<UiState>()((set) => ({
  theme: "light",
  toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
}));
```

- Actions live inside the store, not in components.
- For cross-cutting concerns use middleware (`persist`, `devtools`) explicitly.

## Provider wiring

Zustand needs no provider. Stores are imported directly where used. React Query keeps its `<QueryClientProvider>` in `main.tsx`.

## Caching rules

| Layer | Rule |
| --- | --- |
| React Query | `staleTime` per query; invalidate on mutation success |
| Zustand | `persist` middleware only for what must survive reload (auth token) |

## Common mistakes

- Mirroring API responses into a store → two sources of truth. Use React Query.
- Selecting the whole store (`useStore()`) → re-renders on every change. Select a slice.
- One mega-store — split by domain.
