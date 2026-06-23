# Deployment

> React + Vite SPA. Single immutable build artifact (`dist/`); environment differences come from `VITE_`-prefixed env vars injected at build time. Node version pinned via `.nvmrc`.

## Environments

| Environment | Branch | Mode (`--mode`) | Base URL | Purpose |
|---|---|---|---|---|
| local | feature/* | `development` | `http://localhost:5173` | Local dev (Vite dev server) |
| dev | `develop` | `development` | `https://dev.example.com` | Integration / shared dev |
| staging | `staging` | `staging` | `https://staging.example.com` | Pre-prod QA / UAT |
| production | `main` | `production` | `https://app.example.com` | Live users |

- Replace `example.com` with the real domain per project.
- One branch maps to one environment; CI deploys on push to that branch.

## Build per env

- One build command, one artifact: `dist/` (static HTML/CSS/JS).
- No per-env code branches — only `VITE_*` values differ.
- Vite injects env vars at **build time**, baked into the bundle. Rebuild to change them.

```bash
# uses .env.production (default for vite build)
tsc -b && vite build

# explicit mode -> loads .env.[mode] + .env.[mode].local
vite build --mode staging
vite build --mode development
```

- Mode controls which `.env.[mode]` file Vite loads and sets `import.meta.env.MODE`.
- Env file precedence (highest first): `.env.[mode].local` > `.env.[mode]` > `.env.local` > `.env`.
- `vite build` defaults to `--mode production`; `vite dev` defaults to `--mode development`.
- Pin Node before building: `nvm use` (reads `.nvmrc`).
- Output is fully static — host on any static/CDN host (see Hosting options).

## Env vars

- **Only `VITE_`-prefixed vars are exposed to the client.** Everything else stays server-side and is unavailable via `import.meta.env`.
- Access in code: `import.meta.env.VITE_API_BASE_URL`.
- Values are **baked into the public bundle at build time** — anyone can read them in the browser.

> WARNING: NEVER put secrets (API keys, tokens, DB creds, signing keys) in `VITE_*` vars. They ship to every user in plaintext. Secrets belong on a backend/proxy, in CI secret stores, or server-only env — never in client env.

| Var | Example | Required | Notes |
|---|---|---|---|
| `VITE_API_BASE_URL` | `https://api.example.com` | yes | Backend API root |
| `VITE_ENV` | `production` | yes | Logical env name (`development`/`staging`/`production`) |
| `VITE_APP_VERSION` | `1.4.0` | no | Surfaced in UI / error reports |
| `VITE_SENTRY_DSN` | `https://...@sentry.io/123` | no | Public DSN (safe to expose) |
| `VITE_FEATURE_FLAGS` | `betaSearch,newNav` | no | Comma-separated toggles |

- Built-ins (no need to define): `import.meta.env.MODE`, `.DEV`, `.PROD`, `.BASE_URL`.
- Keep a committed `.env.example` documenting every var; real `.env.*` files are gitignored.

## Hosting options

SPA = static assets, so any static host works. All require an **SPA fallback** (see Caching & SPA routing).

| Host | Deploy | SPA fallback |
|---|---|---|
| Netlify | `dist/` as publish dir | `_redirects`: `/*  /index.html  200` (or `netlify.toml`) |
| Vercel | auto-detects Vite | `vercel.json` rewrite all -> `/index.html` |
| AWS S3 + CloudFront | sync `dist/` to bucket | CloudFront custom error: 403/404 -> `/index.html` (200) |
| Nginx | serve `dist/` | `try_files $uri $uri/ /index.html;` |
| GitHub Pages / Cloudflare Pages | push `dist/` | 404 -> `index.html` / Pages SPA setting |

```nginx
# Nginx SPA + caching
location / {
  try_files $uri $uri/ /index.html;
}
location /assets/ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}
location = /index.html {
  add_header Cache-Control "no-cache";
}
```

## CI/CD pipeline

Pipeline runs on every push/PR; deploy step is gated by branch.

| Stage | Command |
|---|---|
| install | `npm ci` (Node from `.nvmrc`) |
| typecheck | `tsc -b --noEmit` |
| lint | `npm run lint` |
| test | `npm test` |
| build | `npm run build` (`tsc -b && vite build --mode <env>`) |
| deploy | upload `dist/` to host for the matched branch |

- Per-branch mapping: `develop` -> dev, `staging` -> staging, `main` -> production.
- Build artifact is environment-specific (vars baked in) — build once **per** target env, don't promote a dev build to prod.
- Fail fast: any stage failure blocks deploy.

```yaml
# GitHub Actions sketch
on:
  push:
    branches: [develop, staging, main]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: '.nvmrc', cache: 'npm' }
      - run: npm ci
      - run: tsc -b --noEmit
      - run: npm run lint
      - run: npm test
      - run: npm run build -- --mode ${{ env.DEPLOY_ENV }}
      - run: ./deploy.sh dist/   # host-specific
```

- Store secrets (deploy tokens, CDN keys) in CI secret store, not in repo.

## Caching & SPA routing

- Vite emits **content-hashed** asset filenames (`app.4f3a1b.js`) — cache them forever.
- `index.html` is the entry/manifest and must **never** be cached, so users always fetch the latest hashed asset references.

| Path | Cache-Control |
|---|---|
| `/assets/*` (hashed JS/CSS/img) | `public, max-age=31536000, immutable` |
| `/index.html` | `no-cache` (or `max-age=0, must-revalidate`) |
| other root files (`favicon`, `robots.txt`) | short TTL, e.g. `max-age=3600` |

- SPA routing: server has no file for `/some/route`, so **rewrite all unknown routes to `/index.html`** and let the client router (e.g. React Router) handle them. Missing fallback = 404 on refresh/deep-link.
- Keep API paths (`/api/*`) excluded from the SPA fallback if proxied through the same host.

## Release steps

1. Merge to the target branch (`develop` / `staging` / `main`).
2. CI runs install -> typecheck -> lint -> test -> build (`--mode <env>`).
3. Verify correct `VITE_*` values for the env (check `.env.[mode]` / CI vars).
4. CI uploads `dist/` to the host; CDN invalidation if needed (e.g. CloudFront invalidate `/index.html`).
5. Smoke-test base URL: app loads, deep-link refresh works (SPA fallback), API calls hit the right `VITE_API_BASE_URL`.
6. Tag the release (e.g. `git tag vX.Y.Z`) and confirm `VITE_APP_VERSION`.
7. Rollback: redeploy the previous artifact/tag (builds are immutable, so re-deploy is deterministic).
