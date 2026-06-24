# api/

The HTTP layer. Components **never** call `fetch`/axios directly and never call
React Query primitives directly — they consume **per-domain hooks**. See
`project-setup/api-strategy.md`.

## What ships by default (hand-rolled client)

| File | Role |
| --- | --- |
| `client.ts` | The single typed HTTP client (`get/post/put/patch/del`): baseURL, auth header, refresh-on-401, typed errors. |
| `errors.ts` | `ApiError` + `normalizeError` — one error shape app-wide. |
| `query-keys.ts` | Centralized React Query key factory (consistent invalidation). |
| `query-client.ts` | React Query defaults (`staleTime`/`retry`/focus). Used by `main.tsx`. |

`baseURL` comes from `import.meta.env.VITE_API_URL`. Token access is stubbed in
`@/auth/token` — wire it to real auth.

## Add a domain

Create `src/api/<domain>/` with `types.ts`, `requests.ts` (thin `client` calls),
and `hooks.ts` (the `useXxx()` React Query hooks). Components import **only the
hooks**.

## Generated SDK alternative

If the project chose the SDK option (setup with `--sdk`), this hand-rolled client
is **replaced** by an Orval-generated client wired through one axios mutator
(`axios-instance.ts`) — see `src/sdk/README.md`. The hooks/keys layer above is the
same either way.
