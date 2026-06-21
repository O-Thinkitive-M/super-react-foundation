# 21 — Global Date/Time & Timezone

> ONE small, centralized, reusable module for **all** portals (Admin / Provider / Patient / Website Widget).
> No raw `new Date()`, no inline format strings, no `toLocaleString` scattered in components — everything
> goes through `src/utils/datetime.ts` + format constants. Keep it simple: store UTC, display in a timezone,
> format from a fixed set of tokens.

## Golden rules
- **Store/transport = UTC (ISO 8601).** The API always sends/receives UTC ISO strings.
- **Display = a timezone** (clinic/location TZ by default; user TZ optional). Convert only at the display edge.
- **Never** hand-write a format string in a component — use a `DATE_FORMATS.*` constant.
- **Never** use `new Date(str)` for parsing/formatting — use the helpers (DST- and TZ-safe).
- DST is handled automatically by the timezone plugin — never add/subtract fixed hour offsets.

## Stack
- **dayjs** (already in the stack) + plugins: `utc`, `timezone`, `advancedFormat`, `customParseFormat`,
  `relativeTime`, `localizedFormat`. Configured **once** at app bootstrap.

| Path | Purpose |
|------|---------|
| `src/utils/datetime.ts` | All date/time helpers (the only place that imports dayjs) |
| `src/config/datetime.config.ts` | `DATE_FORMATS`, default timezone, locale |
| `src/utils/datetime.bootstrap.ts` | `dayjs.extend(...)` calls — imported once in `main.tsx` |

## Config — `src/config/datetime.config.ts`
```ts
export const APP_TIMEZONE = import.meta.env.VITE_DEFAULT_TZ ?? 'America/New_York'; // HUPC = Florida; multi-location overrides per clinic
export const APP_LOCALE = 'en';

// The ONLY allowed display formats. Add here, never inline in a component.
export const DATE_FORMATS = {
  DATE:        'MM/DD/YYYY',          // 06/21/2026
  DATE_MED:    'MMM D, YYYY',         // Jun 21, 2026
  DATE_LONG:   'MMMM D, YYYY',        // June 21, 2026
  TIME:        'hh:mm A',             // 10:37 AM
  DATETIME:    'MM/DD/YYYY hh:mm A',  // 06/21/2026 10:37 AM
  DATETIME_MED:'MMM D, YYYY hh:mm A', // Jun 16, 2026 05:56 AM  (audit log)
  MONTH_YEAR:  'MMMM YYYY',           // February 2026 (calendar)
  WEEKDAY:     'ddd',                 // Mon
  ISO_DATE:    'YYYY-MM-DD',          // form/query values
} as const;
export type DateFormatKey = keyof typeof DATE_FORMATS;
```
> Formats chosen to match the real screens (MM/DD/YYYY, hh:mm AM/PM, "Jun 16, 2026 05:56 AM"). The mockups
> were inconsistent (`28-10-2022`, `06-21-2026`) — this set is the single standard.

## Bootstrap — `src/utils/datetime.bootstrap.ts`
```ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { APP_TIMEZONE } from '@/config/datetime.config';

dayjs.extend(utc); dayjs.extend(timezone); dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat); dayjs.extend(relativeTime); dayjs.extend(localizedFormat);
dayjs.tz.setDefault(APP_TIMEZONE);
```
Import once at the top of `main.tsx` (before `<App/>`).

## Helpers — `src/utils/datetime.ts` (the public API)
```ts
import dayjs, { type Dayjs } from 'dayjs';
import { DATE_FORMATS, APP_TIMEZONE, type DateFormatKey } from '@/config/datetime.config';

type Input = string | number | Date | Dayjs | null | undefined;

const inTz = (v: Input, tz = APP_TIMEZONE) => dayjs.utc(v).tz(tz);

/** Format a UTC value for display in a timezone using a named format. */
export const formatDate = (v: Input, fmt: DateFormatKey = 'DATE', tz?: string) =>
  v == null ? '' : inTz(v, tz).format(DATE_FORMATS[fmt]);

export const formatDateTime = (v: Input, tz?: string) => formatDate(v, 'DATETIME', tz);
export const formatTime     = (v: Input, tz?: string) => formatDate(v, 'TIME', tz);

/** "3 minutes ago" / "in 4 days" — locale-aware. */
export const formatRelative = (v: Input) => (v == null ? '' : dayjs.utc(v).fromNow());

/** Local user input (display tz) -> UTC ISO for the API. */
export const toUTC = (v: Input, tz = APP_TIMEZONE) => dayjs.tz(v as string, tz).utc().toISOString();

/** Parse a display-format string (e.g. from a text date field) safely. */
export const parseInput = (s: string, fmt: DateFormatKey = 'DATE', tz = APP_TIMEZONE) =>
  dayjs.tz(s, DATE_FORMATS[fmt], tz);

export const nowInTz   = (tz = APP_TIMEZONE) => dayjs().tz(tz);
export const isPast     = (v: Input) => dayjs.utc(v).isBefore(dayjs.utc());
export const isSameDay  = (a: Input, b: Input, tz = APP_TIMEZONE) => inTz(a, tz).isSame(inTz(b, tz), 'day');
```

## Usage (everywhere)
```tsx
formatDateTime(row.createdAt)                 // "06/21/2026 10:37 AM" in clinic TZ
formatDate(appt.date, 'DATE_MED')             // "Jun 21, 2026"
formatRelative(log.timestamp)                 // "3 minutes ago"
payload.dob = toUTC(form.dob, 'ISO_DATE')     // form value -> UTC for API
```
- DataTable date columns call `formatDate`/`formatDateTime` in their `render`; no inline formats.
- Date inputs (react-hook-form) store display value, convert with `toUTC` on submit; zod validates.

## Timezone strategy (multi-location HUPC)
- Default `APP_TIMEZONE` from env (`America/New_York`).
- **Per-clinic/location override**: pass the location's IANA tz to the `tz` arg (e.g. scheduling grids,
  availability, working hours/closures shown in the location's local time — matches Website-Widget SRS).
- Optional **"show times in my timezone"** user preference (stored in `uiStore`) → pass user tz to helpers.
- Audit logs and clinical timestamps display in clinic tz with the tz abbreviation where ambiguity matters.

## i18n note
- Month/weekday names + relative time come from the dayjs locale; keep it in sync with `src/i18n` locale.
- The literal format *tokens* live in `DATE_FORMATS` (config), not in UI text — so they are exempt from the
  `no-literal-string` rule, but **components still must not inline them**.

## Acceptance criteria
- [ ] dayjs extended once at bootstrap; `APP_TIMEZONE` from env with per-location override supported.
- [ ] No component imports dayjs directly or uses `new Date()`/`toLocaleString` for display.
- [ ] All displayed dates/times use a `DATE_FORMATS` key via the helpers; all API values are UTC ISO.
- [ ] DST-correct across `America/New_York` (and any other location tz) — verified around a DST boundary.
- [ ] Same helpers/config reused identically across Admin, Provider, Patient, Website Widget.
