# 18 — Cross-Browser Compatibility (MAX PRIORITY)

Harmony EMR (HUPC) Provider. **React 19 + Vite 8 + MUI v7.** Providers use mixed
desktops, laptops, and tablets. The UI must render and behave identically across the
official matrix below — tables, scrolling, forms, modals, and upload are the high-risk areas.

---

## 1. Official support matrix

| OS | Browsers (last 2 versions) |
|---|---|
| macOS | Chrome, Edge, Safari, Firefox |
| Windows | Chrome, Edge, Firefox (Safari N/A) |
| Linux | Chrome, Edge, Firefox |
| iOS (iPad/iPhone) | **Safari iOS** (last 2) |
| Android | **Chrome Android** (last 2) |

**Also required:**
- Retina / HiDPI (2x, 3x) — crisp icons, no blurry borders
- Responsive **320px → large desktop**
- Browser zoom **80% – 200%** without layout break
- Keyboard + screen-reader baseline (focus visible everywhere)

---

## 2. `browserslist` + build targets

`package.json`
```json
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
- **Vite 8** reads `browserslist` for esbuild transpile + autoprefixer (PostCSS) targets — no separate target list needed.
- Confirm autoprefixer runs: `postcss.config.cjs` → `plugins: { autoprefixer: {} }` (Vite applies browserslist automatically).
- Sanity-check coverage: `npx browserslist`.

---

## 3. Scroll & overflow robustness (highest-risk area)

### Cross-browser custom scrollbars
```css
/* WebKit (Chrome/Edge/Safari) */
.scroll-area::-webkit-scrollbar { width: 10px; height: 10px; }
.scroll-area::-webkit-scrollbar-thumb { background: #B7C3CF; border-radius: 8px; }
.scroll-area::-webkit-scrollbar-track { background: transparent; }
/* Firefox */
.scroll-area { scrollbar-width: thin; scrollbar-color: #B7C3CF transparent; }
```

### Sticky table headers
```css
.table thead th { position: sticky; top: 0; z-index: 2; background: #fff; }
```
> Sticky needs a scroll container with a fixed/`max-height` and `overflow: auto`. Safari requires the header `background` to be opaque or rows show through.

### iOS momentum scroll
```css
.scroll-area { -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
```

### Virtualized lists that don't jump
- Give the scroll container an explicit height (`100%` of a sized parent), not `auto`.
- Use `overscroll-behavior: contain` to stop scroll-chaining to the page on Safari/Firefox.
- Pin row height for the virtualizer; measure dynamic rows once to avoid Safari reflow jumps.

---

## 4. Layout robustness

| Issue | Guard |
|---|---|
| flex/grid `gap` | Supported in all matrix browsers; for safe margins on very old Safari fallbacks, prefer MUI `<Stack spacing>` (renders margins) |
| Focus ring | Use `:focus-visible` (not `:focus`) so mouse clicks don't show rings but keyboard does |
| iOS `100vh` overshoot | Use `100dvh` with `100vh` fallback: `height: 100vh; height: 100dvh;` |
| Zoom 80–200% | Use `rem`/MUI spacing units, avoid fixed `px` heights on text containers |
| HiDPI crispness | SVG icons over PNG; `image-rendering: -webkit-optimize-contrast` only where needed |

```css
:where(button, a, [tabindex]):focus-visible { outline: 2px solid #2D5F8D; outline-offset: 2px; }
.app-shell { height: 100vh; height: 100dvh; }
```

---

## 5. Date / number / `Intl` consistency

- **Never** use `new Date('YYYY-MM-DD')` parsing differences — pass ISO with explicit timezone handling.
- Format with `Intl.DateTimeFormat` / `Intl.NumberFormat` (consistent across engines) — surfaced via `src/i18n/`.
- Safari is stricter on date string parsing than Chrome — always construct from explicit parts or a tested date lib.

```ts
new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date); // uniform across browsers
```

---

## 6. Image rendering
- Logos/icons: **SVG**; provide `@2x`/`@3x` for raster only when SVG is impossible.
- Avoid `width`/`height` mismatch with intrinsic size (blur on Retina).
- Lazy-load below-the-fold images: `loading="lazy"` (supported across matrix).

---

## 7. Polyfill policy

| Need | Decision |
|---|---|
| Core-js / broad polyfills | **No** — matrix is evergreen (last-2), Vite targets cover it |
| `crypto.randomUUID` | Available in all matrix browsers; no polyfill |
| `ResizeObserver` / `IntersectionObserver` | Native in matrix; no polyfill |
| Targeted feature gap | Add a **single** scoped polyfill only with a documented reason |

> Keep the bundle lean. Every polyfill must justify itself against the support matrix.

---

## 8. Per-browser manual smoke-test matrix

Run before each release. ✓ = pass, note defects with browser+OS+version.

| Browser / OS | Tables (sort/sticky/scroll) | Scroll (custom bar, momentum) | Forms (validation, focus) | Modals (focus trap, overlay) | Upload (drag+drop, progress) |
|---|---|---|---|---|---|
| Chrome / Win | | | | | |
| Edge / Win | | | | | |
| Firefox / Win | | | | | |
| Chrome / macOS | | | | | |
| Safari / macOS | | | | | |
| Firefox / macOS | | | | | |
| Chrome / Linux | | | | | |
| Firefox / Linux | | | | | |
| **Safari / iOS** | | | | | |
| **Chrome / Android** | | | | | |

**Per-flow watch-items:**
- Tables: sticky header stays on scroll; horizontal scroll on 320px; sort arrows render.
- Scroll: custom scrollbar visible (WebKit + Firefox); iOS momentum smooth; no page scroll-chaining.
- Forms: zod errors show; `:focus-visible` ring; iOS keyboard doesn't cover the field.
- Modals: focus trapped; ESC closes; background not scrollable (overlay).
- Upload: drag-and-drop works on Safari; progress bar updates; large-file/timeout handled (see `20`).

**Viewport / zoom passes:** 320px, 768px, 1440px, large; zoom 80% / 100% / 150% / 200%; HiDPI on at least one Retina device.

---

## Golden rules
- Evergreen matrix → no blanket polyfills; targeted only, with a reason.
- Sticky headers need an opaque background + a sized scroll container (Safari).
- Always `100dvh` with `100vh` fallback; `:focus-visible` everywhere.
- Use `Intl` for all dates/numbers; never rely on engine date-string parsing.
- The smoke-test matrix is mandatory per release — Safari/iOS is the usual failure point.
