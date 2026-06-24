# How It Works — The Default App, Step by Step

> Copied into every project's `project-setup/how-it-works.md`. Read this first.
> It explains **what the scaffold gives you, how the pieces connect, and how each
> demo placeholder is replaced as you add features** — no prior knowledge needed.

The foundation ships a small but **fully working** app: it boots, routes, renders a
screen, and pulls every label from the i18n registry. Nothing is a stub you have to
wire up before it runs. The only "demo" parts are clearly marked and safe to delete.

---

## 1. What you get after setup

```
src/
  main.tsx                 # entry: providers (theme, react-query, i18n) + <App/>
  App.tsx                  # mounts the router
  router/                  # config-driven routing (the demo route lives here)
  i18n/                    # ALL user-facing text (no hardcoded strings)
  api/                     # HTTP layer (typed client OR generated SDK)
  lib/auth.ts              # demo auth stub (returns a signed-in user)
  features/_demo/          # the deletable demo page
  features/_template/      # copy-me skeleton for a new feature
  theme/ config/ hooks/ components/ store/ types/ utils/ lib/   # documented folders
```

Run it:

```
npm install
npm run dev        # open the URL — you land on /dashboard (the demo page)
npm run build      # tsc -b && vite build — must pass before you ship
npm run lint
```

---

## 2. The boot path (who calls whom)

1. **`main.tsx`** creates the React root and wraps the app in three providers:
   MUI `ThemeProvider`, React Query `QueryClientProvider` (using
   `@/api/query-client`), and it imports `@/i18n` for its side-effect (initializes
   translations). Then it renders **`<App/>`**.
2. **`App.tsx`** renders `<RouterProvider router={router}/>` — that's it.
3. **`router/router.tsx`** is the route tree. `/` redirects to `/dashboard`.
   `/dashboard` lazy-loads the demo page. Unknown URLs render `RouteError` (404).
4. **`features/_demo/pages/DashboardPage.tsx`** is the screen you see. Every string
   on it comes from `t('…')` — open `src/i18n/en/` to see the keys.

> Mental model: **URL → router → a lazy page module → React Query hooks → the typed
> API layer.** Text always comes from i18n. State you want to survive refresh lives
> in the URL.

---

## 3. Routing — and how the demo route is replaced

The router is **config-driven** (see `routing.md`). You don't hand-build pages; you
add a path constant and a route entry.

- `router/paths.ts` — typed URL constants. **Never** write route strings inline.
- `router/router.tsx` — the tree. Pages are v7 **lazy route modules** that export a
  `Component`.
- `router/guards.tsx` — `RequireAuth` / `RequireRole`. They read `@/lib/auth`.
- `router/RootLayout.tsx` / `AppLayout.tsx` — shared chrome; `AppLayout` holds the
  `<Suspense>` boundary.
- `router/RouteError.tsx` — shared error + 404.

**Replace the demo with a real feature:**

1. Copy `features/_template/` to `features/<your-feature>/`.
2. Add its page module (export `Component`).
3. Add a path to `paths.ts` and a child route in `router.tsx`:
   `{ path: "patients", lazy: () => import("@/features/patients/pages/PatientsPage") }`.
4. Point `/dashboard` at your page (or add new routes), then **delete
   `features/_demo/`**. Nothing else references it.

---

## 4. Auth — the demo stub

`src/lib/auth.ts` exports `useAuth()` which **returns a signed-in admin** so the app
renders end-to-end out of the box. The guards already call it. When real auth
exists, replace the body of `useAuth` (read your token/store). The route tree does
not change — guards start enforcing automatically. See `authentication.md`.

---

## 5. i18n — every label comes from here

No component contains literal user-facing text. Strings live in `src/i18n/en/`,
grouped by category (`buttons.ts`, `titles.ts`, `labels.ts`, `descriptions.ts`) and
assembled in `en/index.ts`. `index.ts` initializes i18next; `react-i18next.d.ts`
makes `t()` **typed** so a typo is a compile error.

Use it anywhere:

```tsx
import { useTranslation } from "@/i18n";
const { t } = useTranslation();
<Button>{t("buttons.getStarted")}</Button>
```

The shipped keys back the demo screen — **delete/replace them** as you build, but
keep the structure. Add locales by mirroring `en/` and switching to the lazy loader
(see `i18n.md`).

---

## 6. API — typed client by default, SDK if chosen

The API layer is decided at setup time:

- **Default (typed HTTP client):** `src/api/client.ts` (one `get/post/…` client with
  auth + refresh-on-401 + typed `ApiError`), plus `errors.ts`, `query-keys.ts`,
  `query-client.ts`. Add a domain under `src/api/<domain>/` with `requests.ts` +
  `hooks.ts`; **components import only the hooks.**
- **SDK option (set up with `--sdk`):** the hand-rolled `client.ts` is replaced by an
  **Orval-generated** client routed through one axios mutator
  (`src/api/axios-instance.ts`). Run `npm run generate-sdk` to produce `src/sdk/**`.
  The demo spec URL is the public Swagger Petstore — replace it via
  `OPENAPI_SPEC_URL` or by editing `orval.config.ts` (use the spec URL recorded in
  `api-strategy.md` if you have one). **Never hand-edit `src/sdk/**`.**

Either way, the React Query hooks/keys layer above the transport is the same. See
`api-strategy.md`.

---

## 7. Deep-linkable state (refresh-safe)

The demo page stores its counter in the URL (`?count=N`) via `useSearchParams` so a
refresh restores it and links are shareable. Do the same for filters, pagination,
active tabs: **read from the URL, write to the URL.** Keep identity in path params,
view state in query params. See `routing.md`.

---

## 8. The "delete me" checklist

When your first real feature is in, remove the demo scaffolding:

- [ ] `src/features/_demo/` (the demo page)
- [ ] Replace `src/lib/auth.ts` stub with real auth
- [ ] Swap the demo i18n keys for your own (keep the category structure)
- [ ] (SDK) point `orval.config.ts` at your real OpenAPI spec and regenerate

Everything else (router shell, i18n setup, api layer, theme, folder structure) is
production foundation — keep it.
