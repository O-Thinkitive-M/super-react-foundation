# 12 — Security & HIPAA

Harmony EMR handles PHI. Every PHI access is audit-logged, masked per role, soft-deleted only, and served over HTTPS.

## Token Storage — Migration Path

| Phase | Storage | Notes |
|-------|---------|-------|
| Now | `localStorage` (`auth_token`) | Simple; XSS-exposed — interim only |
| Target | **httpOnly + Secure + SameSite=Strict cookie** | Set by backend; JS can't read it; CSRF token paired |

Migration: backend issues cookie on login → `customAxios` sends `withCredentials: true` → remove localStorage reads → drop `Authorization` header injection.

## 30-Minute Idle Timeout

`src/shared/security/useIdleTimeout.ts`
```ts
const IDLE_MS = 30 * 60_000, WARN_MS = 28 * 60_000;
export function useIdleTimeout(onTimeout: () => void, onWarn: () => void) {
  const timers = useRef<{ warn?: number; out?: number }>({});
  const reset = useCallback(() => {
    clearTimeout(timers.current.warn); clearTimeout(timers.current.out);
    timers.current.warn = window.setTimeout(onWarn, WARN_MS);
    timers.current.out  = window.setTimeout(onTimeout, IDLE_MS);
  }, [onTimeout, onWarn]);
  useEffect(() => {
    const evts = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    evts.forEach(e => window.addEventListener(e, reset));
    reset();
    return () => evts.forEach(e => window.removeEventListener(e, reset));
  }, [reset]);
}
```
- Warn at 28 min (modal), force logout + token clear at 30 min.

## Audit-Log Interceptor

Every PHI endpoint logs an entry. Wired in `customAxios` (`src/api/customAxios.ts`):
```ts
const PHI_ROUTES = [/\/patients/, /\/encounters/, /\/assessments/, /\/medications/];
customAxios.interceptors.response.use((res) => {
  if (PHI_ROUTES.some(r => r.test(res.config.url ?? ''))) {
    void postAuditLog({
      action: res.config.method?.toUpperCase(),   // GET/POST/PUT/DELETE
      endpoint: res.config.url,
      userId: auth.userId, role: auth.role,
      timestamp: new Date().toISOString(),
      // IP captured server-side from request (X-Forwarded-For)
    });
  }
  return res;
});
```

| Field | Source |
|-------|--------|
| action | HTTP method |
| endpoint | request URL |
| userId / role | auth store |
| timestamp | ISO 8601 |
| IP | server-side (do not trust client) |

## PHI Field Masking + Permission Gating

`src/shared/security/mask.ts`
```ts
export const maskSSN = (s: string) => s.replace(/\d(?=\d{4})/g, '•');
export const maskDOB = () => '••/••/••••';
export const maskField = (v: string, type: 'ssn' | 'dob' | 'phone') => /* ... */;
```

`<CanAccess>` guard — `src/shared/security/CanAccess.tsx`
```tsx
export function CanAccess({ permission, fallback = null, children }: Props) {
  const can = usePermissions().has(permission);
  return can ? <>{children}</> : <>{fallback}</>;
}
// Usage — PHQ-9 visible to providers only:
<CanAccess permission="assessment.phq9.view" fallback={<MaskedBadge />}>
  <Phq9Score value={score} />
</CanAccess>
```

| Data | Visible to | Otherwise |
|------|-----------|-----------|
| PHQ-9 / clinical scores | provider, clinician | masked badge |
| SSN | billing, admin | `•••-••-1234` |
| DOB | care team | masked |

## Soft Delete Only

```ts
// PATCH /patients/:id { isArchived: true } + audit entry
await archivePatient(id);          // NEVER DELETE
// Lists filter: ?isArchived=false
```
- No hard `DELETE` from UI. Archive sets `isArchived=true` + writes audit log.

## Stripe Tokenization

- Card data never touches our servers/state. Stripe Elements → `cardToken` only.
```ts
const { token } = await stripe.createToken(cardElement);
await savePaymentMethod({ cardToken: token.id }); // store token id, no PAN/CVV
```

## XSS / CSRF / CSP

| Threat | Mitigation |
|--------|-----------|
| XSS | React auto-escaping; **no `dangerouslySetInnerHTML` on user input**; `DOMPurify.sanitize()` for any required HTML |
| CSRF | `X-CSRF-Token` header (paired with cookie auth); `SameSite=Strict` |
| Clickjacking | `X-Frame-Options: DENY` |
| CSP | `default-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self' api.stripe.com; frame-src js.stripe.com` |

## Env Secrets

- **Never commit `.env`** (gitignored). `.env.example` documents keys only.
- Only `VITE_*` vars reach the client — never put secrets there.
- Server secrets in **AWS Secrets Manager**, injected at runtime.

## Production-Readiness Scorecard

| Area | Status | Notes |
|------|--------|-------|
| Dependencies | ✅ | `npm audit` clean, pinned |
| Code quality | ✅ | ESLint `--max-warnings=0`, tsc strict |
| Auth | ⚠️ | localStorage → httpOnly cookie pending |
| Secrets | ✅ | AWS Secrets Manager; no `.env` committed |
| HTTPS | ✅ | enforced + HSTS |
| Build | ✅ | source maps hidden in prod |
| XSS | ✅ | no `dangerouslySetInnerHTML`; DOMPurify |
| CSRF | ⚠️ | enabled with cookie auth migration |
| CSP | ✅ | header set at edge |
| Monitoring | ⚠️ | error + audit log alerting WIP |

## Pre-Deployment Checklist

- [ ] `npm run security:audit` clean
- [ ] No secrets in bundle (`grep` VITE output)
- [ ] HTTPS + HSTS + CSP headers verified
- [ ] Audit log writes for all PHI routes confirmed
- [ ] PHI masking verified per role
- [ ] Soft-delete only; no hard delete paths
- [ ] Idle timeout logs out at 30 min
- [ ] Stripe: only `cardToken` leaves client
- [ ] Token storage path documented/migrated
