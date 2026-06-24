# Cross-Browser Compatibility

> Generic foundation doc. Copied verbatim into every project's `project-setup/cross-browser.md`.
> The UI must render and behave identically across the support matrix. Tables, scrolling, forms, modals, and upload are the high-risk areas.

## Support matrix

| OS | Browsers (last 2 versions) |
|---|---|
| macOS | Chrome, Edge, Safari, Firefox |
| Windows | Chrome, Edge, Firefox |
| Linux | Chrome, Edge, Firefox |
| iOS (iPad/iPhone) | Safari iOS (last 2) |
| Android | Chrome Android (last 2) |

Also required: Retina/HiDPI (2×, 3×) crispness; responsive 320px → large desktop; browser zoom 80–200%; keyboard + screen-reader baseline (focus visible everywhere — see `accessibility.md`).

## `browserslist` + build targets

```jsonc
// package.json
{
  "browserslist": [
    "last 2 Chrome versions",
    "last 2 Edge versions",
    "last 2 Safari versions",
    "last 2 Firefox versions",
    "last 2 iOS versions",
    "last 2 ChromeAndroid versions",
    "not dead"
  ]
}
```

- Vite reads `browserslist` for transpile + autoprefixer targets — no separate target list needed.
- Sanity-check coverage with `npx browserslist`.

## Scroll & overflow robustness (highest-risk)

```css
/* Cross-browser custom scrollbars */
.scroll-area::-webkit-scrollbar { width: 10px; height: 10px; }       /* WebKit */
.scroll-area::-webkit-scrollbar-thumb { background: #b7c3cf; border-radius: 8px; }
.scroll-area { scrollbar-width: thin; scrollbar-color: #b7c3cf transparent; } /* Firefox */

/* Sticky table headers — Safari needs an OPAQUE background or rows show through */
.table thead th { position: sticky; top: 0; z-index: 2; background: #fff; }

/* iOS momentum + no scroll-chaining */
.scroll-area { -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
```

- Virtualized lists: give the scroll container an **explicit height** (not `auto`), pin row height, and use `overscroll-behavior: contain` to stop scroll-chaining on Safari/Firefox.

## Layout robustness

| Issue | Guard |
|---|---|
| Focus ring | use `:focus-visible` (not `:focus`) so mouse clicks don't show rings but keyboard does |
| iOS `100vh` overshoot | `height: 100vh; height: 100dvh;` (dvh with vh fallback) |
| Zoom 80–200% | use `rem`/theme spacing, avoid fixed `px` heights on text containers |
| HiDPI crispness | SVG icons over PNG |

```css
:where(button, a, [tabindex]):focus-visible { outline: 2px solid; outline-offset: 2px; }
.app-shell { height: 100vh; height: 100dvh; }
```

## Date / number / `Intl` consistency

- **Never** rely on engine date-string parsing (`new Date("YYYY-MM-DD")` differs across engines; Safari is strict). Construct from explicit parts or a tested date lib — see `datetime-timezone.md`.
- Format with `Intl.DateTimeFormat` / `Intl.NumberFormat` (uniform across engines).

```ts
new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
```

## Polyfill policy

| Need | Decision |
|---|---|
| Broad polyfills (core-js) | **No** — matrix is evergreen (last-2); Vite targets cover it |
| `crypto.randomUUID`, `ResizeObserver`, `IntersectionObserver` | native in matrix; no polyfill |
| Targeted feature gap | add a single scoped polyfill only with a documented reason |

> Keep the bundle lean. Every polyfill must justify itself against the matrix.

## Per-release smoke-test matrix

Run before each release; note defects with browser + OS + version.

| Browser / OS | Tables (sort/sticky/scroll) | Scroll (bar, momentum) | Forms (validation, focus) | Modals (focus trap, overlay) | Upload (drag+drop, progress) |
|---|---|---|---|---|---|
| Chrome / Win | | | | | |
| Edge / Win | | | | | |
| Firefox / Win | | | | | |
| Safari / macOS | | | | | |
| Safari / iOS | | | | | |
| Chrome / Android | | | | | |

**Per-flow watch-items:** sticky header stays on scroll; no X-scroll at 320px; `:focus-visible` ring; iOS keyboard doesn't cover the focused field; modal focus trapped + Esc closes + background not scrollable; drag-and-drop works on Safari.

**Viewport / zoom passes:** 320 / 768 / 1440 / large; zoom 80 / 100 / 150 / 200%; HiDPI on at least one Retina device.

## Golden rules

- Evergreen matrix → no blanket polyfills; targeted only, with a reason.
- Sticky headers need an opaque background + a sized scroll container (Safari).
- Always `100dvh` with `100vh` fallback; `:focus-visible` everywhere.
- Use `Intl` for all dates/numbers; never rely on engine date-string parsing.
- The smoke-test matrix is mandatory per release — Safari/iOS is the usual failure point.

## Adapt per project (from SRS/MOM)

- Trim or extend the support matrix to the project's actual audience (e.g. drop Firefox, add an older browser) and update `browserslist` to match.
