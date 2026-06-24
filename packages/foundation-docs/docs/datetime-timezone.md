# Date / Time & Timezone

> Generic foundation doc. Copied verbatim into every project's `project-setup/datetime-timezone.md`.
> ONE small centralized module. No raw `new Date()`, no inline format strings, no scattered `toLocaleString` — everything goes through `src/utils/datetime.ts` + format constants. Store UTC, display in a timezone, format from a fixed token set.

## Golden rules

- **Store / transport = UTC (ISO 8601).** The API always sends/receives UTC ISO strings.
- **Display = a timezone.** Convert only at the display edge.
- **Never** hand-write a format string in a component — use a `DATE_FORMATS.*` constant.
- **Never** use `new Date(str)` for parsing/formatting — use the helpers (DST- and TZ-safe). Engines disagree on date-string parsing (see `cross-browser.md`).
- DST is handled by the timezone plugin — never add/subtract fixed hour offsets.

## Stack

`dayjs` + plugins (`utc`, `timezone`, `advancedFormat`, `customParseFormat`, `relativeTime`, `localizedFormat`), configured **once** at app bootstrap.

| Path | Purpose |
|---|---|
| `src/config/datetime.config.ts` | `DATE_FORMATS`, default timezone, locale |
| `src/utils/datetime.bootstrap.ts` | `dayjs.extend(...)` — imported once in `main.tsx` |
| `src/utils/datetime.ts` | the only place that imports dayjs; all helpers |

## Config

```ts
// src/config/datetime.config.ts
export const APP_TIMEZONE = import.meta.env.VITE_DEFAULT_TZ ?? "UTC";
export const APP_LOCALE = "en";

// The ONLY allowed display formats. Add here, never inline in a component.
export const DATE_FORMATS = {
  DATE:         "MM/DD/YYYY",          // 06/21/2026
  DATE_MED:     "MMM D, YYYY",         // Jun 21, 2026
  TIME:         "hh:mm A",             // 10:37 AM
  DATETIME:     "MM/DD/YYYY hh:mm A",  // 06/21/2026 10:37 AM
  DATETIME_MED: "MMM D, YYYY hh:mm A", // Jun 21, 2026 10:37 AM (audit log)
  MONTH_YEAR:   "MMMM YYYY",
  ISO_DATE:     "YYYY-MM-DD",          // form/query values
} as const;
export type DateFormatKey = keyof typeof DATE_FORMATS;
```

## Bootstrap

```ts
// src/utils/datetime.bootstrap.ts — imported once at the top of main.tsx, before <App/>
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { APP_TIMEZONE } from "@/config/datetime.config";

dayjs.extend(utc); dayjs.extend(timezone); dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat); dayjs.extend(relativeTime); dayjs.extend(localizedFormat);
dayjs.tz.setDefault(APP_TIMEZONE);
```

## Helpers (the public API)

```ts
// src/utils/datetime.ts
import dayjs, { type Dayjs } from "dayjs";
import { DATE_FORMATS, APP_TIMEZONE, type DateFormatKey } from "@/config/datetime.config";

type Input = string | number | Date | Dayjs | null | undefined;
const inTz = (v: Input, tz = APP_TIMEZONE) => dayjs.utc(v).tz(tz);

/** Format a UTC value for display in a timezone using a named format. */
export const formatDate = (v: Input, fmt: DateFormatKey = "DATE", tz?: string) =>
  v == null ? "" : inTz(v, tz).format(DATE_FORMATS[fmt]);
export const formatDateTime = (v: Input, tz?: string) => formatDate(v, "DATETIME", tz);
export const formatTime     = (v: Input, tz?: string) => formatDate(v, "TIME", tz);

/** "3 minutes ago" / "in 4 days" — locale-aware. */
export const formatRelative = (v: Input) => (v == null ? "" : dayjs.utc(v).fromNow());

/** Local user input (display tz) -> UTC ISO for the API. */
export const toUTC = (v: Input, tz = APP_TIMEZONE) => dayjs.tz(v as string, tz).utc().toISOString();

export const nowInTz   = (tz = APP_TIMEZONE) => dayjs().tz(tz);
export const isPast    = (v: Input) => dayjs.utc(v).isBefore(dayjs.utc());
export const isSameDay = (a: Input, b: Input, tz = APP_TIMEZONE) => inTz(a, tz).isSame(inTz(b, tz), "day");
```

## Usage (everywhere)

```tsx
formatDateTime(row.createdAt)          // in the app timezone
formatDate(item.date, "DATE_MED")      // "Jun 21, 2026"
formatRelative(log.timestamp)          // "3 minutes ago"
payload.dob = toUTC(form.dob, "ISO_DATE") // form value -> UTC for the API
```

- DataTable date columns call `formatDate`/`formatDateTime` in their `render` — no inline formats.
- Date inputs store the display value and convert with `toUTC` on submit; zod validates.

## i18n note

- Month/weekday names + relative time come from the dayjs locale; keep it in sync with the i18n locale (see `i18n.md`).
- Format **tokens** live in `DATE_FORMATS` (config), not in UI text — exempt from `no-literal-string`, but components still must not inline them.

## Acceptance criteria

- [ ] dayjs extended once at bootstrap; `APP_TIMEZONE` from env, per-location override supported via the `tz` arg.
- [ ] No component imports dayjs directly or uses `new Date()`/`toLocaleString` for display.
- [ ] All displayed dates/times use a `DATE_FORMATS` key via the helpers; all API values are UTC ISO.
- [ ] DST-correct — verified around a DST boundary.

## Adapt per project (from SRS/MOM)

- Set `VITE_DEFAULT_TZ` and the `DATE_FORMATS` to the project's locale conventions.
- If the app is multi-location, pass each location's IANA tz to the helpers' `tz` argument (scheduling, working hours, audit display).
