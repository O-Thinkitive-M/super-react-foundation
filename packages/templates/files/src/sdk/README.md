# sdk/

**Generated API client (Orval / OpenAPI).** This folder is only used when the
project chose the **SDK option** (foundation set up with `--sdk`). By default the
app uses the hand-rolled client in `src/api/` instead, and this folder stays empty.

If the SDK option is selected, scaffold also seeds (at the project root):
`orval.config.ts`, `orval-transformer.cjs`, `scripts/check-node.cjs`, plus
`src/api/axios-instance.ts` (the `customAxios` mutator). Then:

- `npm run generate-sdk` reads the OpenAPI spec → writes typed react-query hooks here.
- **Never hand-edit `src/sdk/**`** — it is overwritten on regeneration.
- The demo spec URL is the public Swagger Petstore; replace it via `OPENAPI_SPEC_URL`
  or by editing `orval.config.ts` (use the spec URL recorded in
  `project-setup/api-strategy.md` if present).

See `project-setup/api-strategy.md`.
