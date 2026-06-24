# Security

> Generic foundation doc. Copied verbatim into every project's `project-setup/security.md`.
> The **baseline** applies to every project. The **compliance overlay** at the end applies only to regulated apps (HIPAA/PHI, PCI, etc.) — enable it when the project handles sensitive data.

## Baseline (every project)

### Token storage — migration path

| Phase | Storage | Notes |
|---|---|---|
| Interim | in-memory / `localStorage` | simple; XSS-exposed — short-term only |
| Target | **httpOnly + Secure + SameSite=Strict cookie** | set by backend; JS can't read it; pair with a CSRF token |

Migration: backend issues the cookie on login → the HTTP client sends `withCredentials: true` → drop the `Authorization` header injection and any token reads. Centralized in one place (`src/api/client.ts` or `axios-instance.ts` — see `api-strategy.md`).

### Idle timeout

```ts
// src/lib/security/useIdleTimeout.ts — warn before, force logout + clear token on timeout
const IDLE_MS = 30 * 60_000, WARN_MS = 28 * 60_000; // tune per SRS
```

- Reset on `mousedown`/`keydown`/`scroll`/`touchstart`; warn (modal) before logout.

### XSS / CSRF / CSP

| Threat | Mitigation |
|---|---|
| XSS | React auto-escaping; **no `dangerouslySetInnerHTML` on user input**; `DOMPurify.sanitize()` for any required HTML |
| CSRF | `X-CSRF-Token` header paired with cookie auth; `SameSite=Strict` |
| Clickjacking | `X-Frame-Options: DENY` |
| CSP | `default-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self' <api-origins>` (tighten per project) |

### Secrets & env

- **Never commit `.env`** (gitignored). `.env.example` documents keys only.
- Only `VITE_*` vars reach the client — never put secrets there. Server secrets live in a secrets manager, injected at runtime.
- Grep the production bundle for accidental secret leakage before release.

### Transport & build

- HTTPS enforced + HSTS. Hide source maps in production (or upload privately to the error tracker).
- `npm audit` clean of high/critical CVEs (CI gate — see `quality-gates.md`).

### Payment data (if applicable)

- Card data never touches your servers/state — use the provider's tokenization (e.g. Stripe Elements → token id only); store the token id, never the PAN/CVV.

### Baseline checklist

- [ ] Token storage path documented (and migrated to httpOnly cookie when possible).
- [ ] Idle timeout logs out after the configured period.
- [ ] No `dangerouslySetInnerHTML` on user input; DOMPurify where HTML is required.
- [ ] CSP / HSTS / `X-Frame-Options` headers set at the edge.
- [ ] No secrets in the client bundle; `.env` gitignored.
- [ ] `npm audit` clean; HTTPS enforced.

---

## Compliance overlay — HIPAA / PHI (enable only for regulated apps)

> Turn this on when the app handles Protected Health Information or similarly regulated data. It layers on top of the baseline.

### Audit-log every sensitive access

Wire an interceptor in the one HTTP client so every sensitive endpoint logs an entry.

```ts
const SENSITIVE = [/\/patients/, /\/encounters/, /\/medications/]; // tune to the API
client.interceptors.response.use((res) => {
  if (SENSITIVE.some((r) => r.test(res.config.url ?? ""))) {
    void postAuditLog({
      action: res.config.method?.toUpperCase(),
      endpoint: res.config.url,
      userId: auth.userId, role: auth.role,
      timestamp: new Date().toISOString(),
      // IP captured server-side — do not trust the client
    });
  }
  return res;
});
```

### Field masking + permission gating

```tsx
// reveal sensitive fields only to permitted roles (uses can() from config/permissions.ts)
export function CanAccess({ permission, fallback = null, children }: Props) {
  return usePermissions().has(permission) ? <>{children}</> : <>{fallback}</>;
}
// masks: SSN -> •••-••-1234, DOB -> ••/••/••••, etc., until reveal
```

| Data | Visible to | Otherwise |
|---|---|---|
| Clinical scores | clinician/provider | masked badge |
| SSN | billing/admin | `•••-••-1234` |
| DOB | care team | masked |

### Other HIPAA controls

- **Soft-delete only** — UI sets `isArchived=true` + an audit entry; no hard `DELETE`. Lists filter `?isArchived=false`.
- Display sensitive timestamps in the clinic timezone with the tz abbreviation where ambiguity matters (see `datetime-timezone.md`).
- Session/idle timeout and httpOnly-cookie auth are **required**, not optional, in this overlay.

### Compliance checklist (in addition to baseline)

- [ ] Audit-log writes for all sensitive routes confirmed.
- [ ] Field masking + `CanAccess` gating verified per role.
- [ ] Soft-delete only; no hard-delete paths in the UI.
- [ ] Idle timeout enforced; auth on httpOnly cookie.

## Adapt per project (from SRS/MOM)

- Decide whether the compliance overlay applies; if so, list which fields/routes are sensitive and the role matrix that may reveal them.
- Set the CSP `connect-src`/`frame-src` to the project's real API and third-party origins.
- Set the idle-timeout duration and token-storage target.
