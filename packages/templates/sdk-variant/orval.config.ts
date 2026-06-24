// Orval pipeline: OpenAPI spec -> typed models + @tanstack/react-query hooks,
// all routed through the single axios mutator (src/api/axios-instance.ts).
//
// DEMO SPEC: until your backend publishes its OpenAPI URL, this points at the
// public Swagger Petstore so `npm run generate-sdk` works out of the box and you
// can see a real generated client under src/sdk/. Replace it by either:
//   - setting OPENAPI_SPEC_URL (env / CI secret), or
//   - editing the fallback URL below to your spec (or a local ./openapi/*.json).
// See project-setup/api-strategy.md.
import { defineConfig } from "orval";

export default defineConfig({
  app: {
    input: {
      target:
        process.env.OPENAPI_SPEC_URL ??
        "https://petstore3.swagger.io/api/v3/openapi.json", // DEMO — replace
      override: { transformer: "./orval-transformer.cjs" },
    },
    output: {
      mode: "tags-split", // one folder per OpenAPI tag
      target: "./src/sdk",
      schemas: "./src/sdk/model",
      client: "react-query",
      httpClient: "axios", // fixes axios-vs-fetch header type mismatch
      clean: true, // wipe stale generated files each run
      prettier: true,
      override: {
        mutator: { path: "./src/api/axios-instance.ts", name: "customAxios" },
        query: { useQuery: true, useInfinite: true, signal: true },
      },
    },
  },
});
