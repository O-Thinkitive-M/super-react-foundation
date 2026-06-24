# hooks/

**Shared** custom React hooks used by 2+ features. Feature-only hooks stay in `features/<feature>/hooks/`. camelCase, `use` prefix (`useDebounce.ts`). Co-locate `*.test.ts`.

Ships by default:
- `useUrlState.ts` — refresh-safe, deep-linkable URL/query state (filters, page, sort). See `project-setup/routing.md`.
