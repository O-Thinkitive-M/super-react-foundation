# 17 — API SDK Pipeline (Orval + axios + React Query)

Harmony EMR (HUPC) Provider. The API layer is an **Orval-generated, fully-typed SDK**:
OpenAPI spec → typed models + **@tanstack/react-query v5** hooks → routed through one **axios** mutator.
This **replaces hand-written `services/*.ts`**. No fetch calls, no manual hooks.

> **Greenfield posture: wire everything now, generate later.**
> `src/sdk/**` does not exist yet. `orval.config.ts` `input.target` is an **env placeholder** until the backend OpenAPI URL is published. Everything else (axios instance, config, transformer, Node guards) is committed today so `npm run generate-sdk` "just works" the moment the spec exists.

---

## Files in this pipeline

| File | Role |
|---|---|
| `src/api/axios-instance.ts` | `customAxios<T>` mutator — the one instance the SDK uses |
| `orval.config.ts` | Orval pipeline config (react-query + axios + tags-split) |
| `orval-transformer.cjs` | Repairs spec defects before generation |
| `.nvmrc` / `.node-version` | Pin Node 22 |
| `package.json` `engines` + `preinstall` | Block wrong Node |
| `scripts/check-node.cjs` | ES5 guard with a friendly message |
| `src/sdk/**` | **Generated** output — never edit by hand |
| `src/features/**/api/*.ts` | Thin feature hooks wrapping SDK hooks |

---

## 1. `src/api/axios-instance.ts` — the `customAxios` mutator
```ts
import Axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request: attach Bearer token (today from store; future: httpOnly cookie → withCredentials)
AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: audit-log + PHI-safe logging + 401 handling
AXIOS_INSTANCE.interceptors.response.use(
  (res) => {
    audit({ method: res.config.method, url: res.config.url, status: res.status }); // no bodies
    return res;
  },
  (error: AxiosError) => {
    logPhiSafe(error);                       // strip request/response bodies before logging
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.assign('/login');      // future: silent refresh first
    }
    return Promise.reject(error);
  },
);

// Orval mutator: generic, returns .data so hooks get typed payloads directly
export const customAxios = <T>(config: AxiosRequestConfig): Promise<T> =>
  AXIOS_INSTANCE({ ...config }).then(({ data }) => data);

export default customAxios;

function audit(_e: unknown) {/* POST to audit sink or buffer */}
function logPhiSafe(_e: unknown) {/* console/Sentry with bodies removed */}
```
> The mutator returns `T` (already `.data`) — that's why `httpClient: 'axios'` matters (below).

---

## 2. `orval.config.ts`
```ts
import { defineConfig } from 'orval';

export default defineConfig({
  harmony: {
    input: {
      // Placeholder until backend OpenAPI URL exists — set via env, no hardcoded URL.
      target: process.env.OPENAPI_SPEC_URL ?? './openapi/placeholder.json',
      override: { transformer: './orval-transformer.cjs' },
    },
    output: {
      mode: 'tags-split',          // one folder per OpenAPI tag
      target: './src/sdk',
      client: 'react-query',
      httpClient: 'axios',         // fixes axios-vs-fetch header type mismatch
      schemas: './src/sdk/model',
      clean: true,                 // wipe stale generated files each run
      prettier: true,
      override: {
        mutator: { path: './src/api/axios-instance.ts', name: 'customAxios' },
        query: { useQuery: true, useInfinite: true, signal: true },
      },
    },
  },
});
```

---

## 3. `orval-transformer.cjs` — spec defect repair
Backends ship imperfect specs. Repair them at generation time (never edit generated output).
```js
// CommonJS — Orval loads transformers via require()
module.exports = (spec) => {
  // 1) Strip illegal properties off security schemes (some generators emit invalid keys)
  const schemes = spec.components?.securitySchemes ?? {};
  for (const s of Object.values(schemes)) {
    delete s.name; delete s.in;              // illegal on http/bearer schemes
  }
  // 2) Inject path params declared in the URL but missing from `parameters`
  for (const [path, item] of Object.entries(spec.paths ?? {})) {
    const inUrl = [...path.matchAll(/{(\w+)}/g)].map((m) => m[1]);
    for (const op of Object.values(item)) {
      if (typeof op !== 'object' || !op.responses) continue;
      op.parameters ??= [];
      const declared = new Set(op.parameters.map((p) => p.name));
      for (const name of inUrl) {
        if (!declared.has(name))
          op.parameters.push({ name, in: 'path', required: true, schema: { type: 'string' } });
      }
    }
  }
  return spec;
};
```
> Keep each repair small and commented with **why** — these document real spec bugs.

---

## 4. Node pinning + guard (Orval 8 needs Node >= 22.18)

`.nvmrc`
```
22
```
`.node-version`
```
22
```
`package.json` (excerpt)
```json
{
  "engines": { "node": ">=22.18.0" },
  "scripts": {
    "preinstall": "node scripts/check-node.cjs",
    "generate-sdk": "orval --config ./orval.config.ts"
  }
}
```
`scripts/check-node.cjs` — **ES5 only** (must parse on ancient Node before it errors):
```js
var MIN = [22, 18, 0];
var cur = process.versions.node.split('.').map(Number);
var ok = cur[0] > MIN[0] || (cur[0] === MIN[0] && cur[1] >= MIN[1]);
if (!ok) {
  console.error('\n[Harmony EMR] Node ' + MIN.join('.') + '+ required (Orval 8). You have ' +
    process.versions.node + '. Run: nvm use\n');
  process.exit(1);
}
```

---

## 5. `npm run generate-sdk` workflow

```
1. Backend publishes / updates OpenAPI spec
2. Set OPENAPI_SPEC_URL (env or CI secret)
3. npm run generate-sdk        # orval reads spec → transformer → writes src/sdk/**
4. Commit the regenerated src/sdk/** (review the diff)
5. Feature hooks import the new/changed SDK hooks
```
Generated per tag, e.g. `src/sdk/patients/patients.ts` exporting `useGetPatients`, `useCreatePatient`, etc., all routed through `customAxios`.

### Feature hooks thinly wrap SDK hooks (`src/features/patients/api/usePatient.ts`)
```ts
import { useGetPatientById } from '@/sdk/patients/patients';
export const usePatient = (id: string) =>
  useGetPatientById(id, { query: { enabled: !!id, staleTime: 5 * 60_000 } });
```
> Components import **feature hooks**, not raw SDK hooks — one place to set query options / i18n error mapping.

---

## 6. Problems solved

| Problem | Symptom | Fix |
|---|---|---|
| Missing `@tanstack/react-query` | Orval react-query output won't compile | Add `@tanstack/react-query` v5 dependency |
| axios vs fetch header types | TS error on `HeadersInit` / response body type | `httpClient: 'axios'` + mutator returns `.data` |
| Invalid security scheme keys | Orval generation throws on spec | Transformer strips illegal `name`/`in` |
| Missing path params | Generated hook lacks required arg | Transformer injects from URL `{param}` |
| Wrong Node version | Cryptic Orval 8 crash | `.nvmrc`/`.node-version` + `preinstall` guard |
| No spec yet (greenfield) | Can't generate | Placeholder `input.target` via env; wire now, generate later |

---

## 7. Future-proof security

| Concern | Approach |
|---|---|
| 401 | Today: logout + redirect. Next: **silent refresh**, retry once, then redirect |
| Token storage | localStorage now → **httpOnly cookie** later: swap request interceptor to `withCredentials: true`, drop Bearer attach. Centralized in one file |
| Secrets | **Never** in the spec or generated SDK; `VITE_API_URL` only, no keys in client |
| PHI-safe logging | Response error interceptor strips bodies before any log/Sentry |
| Source of truth | The **OpenAPI spec** — types/hooks regenerate from it; manual drift impossible |

---

## Golden rules
- **Never edit `src/sdk/**`** — regenerate from the spec.
- One axios instance (`customAxios`) — all auth, audit, PHI, 401 logic lives there.
- Spec defects are fixed in `orval-transformer.cjs`, not by hand-patching output.
- Components use **feature hooks**, which wrap SDK hooks.
- The **spec is the single source of truth**; commit regenerated SDK with reviewed diffs.
- Pin Node 22; the `preinstall` guard fails loudly on the wrong version.
