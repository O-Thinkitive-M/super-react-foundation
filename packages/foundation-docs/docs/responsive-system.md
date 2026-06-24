# Responsive System (Mobile-First)

> Generic foundation doc. Copied verbatim into every project's `project-setup/responsive-system.md`.
> **The UI must never break** at any width 320px → 4K, any device-pixel-ratio (1×–3×), or any browser zoom 80–200%. Mobile-first; enhance up. All sizing from theme tokens — no raw px in screens.

## Breakpoint tokens

| Token | Range | MUI key | Layout intent |
|---|---|---|---|
| Mobile | 320–767 | `xs` | single column, tables → cards, drawer nav |
| Tablet | 768–1023 | `sm` | 2-col, collapsible sidebar |
| Desktop | 1024–1439 | `md`/`lg` | full sidebar + content |
| Large | 1440+ | `xl` | content capped (~1280px), gutters grow |

```ts
// theme breakpoints (see theme.md) — use the NAMED keys everywhere, never compare raw widths in JSX.
breakpoints: { values: { xs: 0, sm: 768, md: 1024, lg: 1280, xl: 1440 } }
```

## Grid usage (MUI Grid `size` prop)

```tsx
import Grid from "@mui/material/Grid";

<Grid container spacing={{ xs: 2, md: 3 }}>
  <Grid size={{ xs: 12, md: 6, lg: 4 }}>{/* card */}</Grid>
  <Grid size={{ xs: 12, md: 6, lg: 4 }}>{/* card */}</Grid>
</Grid>
```

- Spacing is always theme-spacing multiples (8px base): `spacing={2}` = 16px.

## `useBreakpoint` (structural swaps only)

```ts
import { useTheme, useMediaQuery } from "@mui/material";

export function useBreakpoint() {
  const t = useTheme();
  return {
    isMobile: useMediaQuery(t.breakpoints.down("sm")),
    isTablet: useMediaQuery(t.breakpoints.between("sm", "md")),
    isDesktop: useMediaQuery(t.breakpoints.up("md")),
  };
}
```

> Use for **structural** swaps (table ↔ card, drawer ↔ sidebar). For pure styling prefer responsive `sx` arrays — no JS re-render on resize.

## Table → card collapse (mobile)

- Any data table **must** render as stacked cards below `sm`. Build it into the primitive so screens get it free (see `data-display.md`).
- Card shows the primary field as title, a `StatusChip`, then the top N `label: value` pairs. Row actions go to an overflow `⋮` menu — never a horizontal row of buttons.

## Fluid typography

```ts
// theme.typography — clamp scales with viewport, no media-query steps
h1: { fontSize: "clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem)" },
body1: { fontSize: "clamp(1rem, 0.95rem + 0.2vw, 1.0625rem)" }, // never below 16px
```

- Never set body below **16px** (iOS zoom-on-focus + AA legibility).

## Content container + full-height + safe area

```tsx
// content cap: page centers above ~1440, gutters absorb extra width
<Box sx={{ maxWidth: 1280, mx: "auto", width: "100%", px: { xs: 2, sm: 3, lg: 4 } }} />
```
```ts
// app shell root
minHeight: "100dvh",                                  // dvh, not vh (mobile URL bar)
paddingTop: "env(safe-area-inset-top)",
paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
```

## No-break rules (load-bearing)

| Rule | How |
|---|---|
| Flex/grid children must allow shrink | `minWidth: 0` on flex items holding text |
| Long text never expands layout | truncate (`text-overflow: ellipsis`) or wrap |
| Wide tables | horizontal scroll **inside** the table wrapper only; page never scrolls X |
| Images/media | `maxWidth: 100%`, `height: auto` |
| Fixed pixel widths | banned in screens; use `%`, `fr`, `minmax()`, tokens |
| Word-break for emails/IDs | `overflowWrap: "anywhere"` on long identifier cells |
| Touch targets | min 44×44px on mobile (AA) |
| Card grids reflow | `repeat(auto-fill, minmax(280px, 1fr))` |

```tsx
// canonical no-overflow text cell
<Box sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} />
```

## Device / zoom test matrix

| Class | Targets | DPR | Check |
|---|---|---|---|
| Phone | 320, 360, 390, 414px | 2×–3× | table→card, drawer nav, no X-scroll, tap targets |
| Tablet | 768, 820, 1024px | 2× | sidebar collapse, 2-col grids |
| Laptop | 1280, 1366, 1440px | 1×–2× | content cap, full sidebar |
| Retina | 1440–1728px | 2×–3× | crisp text, no blur, cap honored |
| Large/4K | 1920, 2560, 3840px | 1×–2× | content centered, gutters grow |
| Zoom | 80 / 100 / 125 / 150 / 200% | — | reflow not clip |

## Definition of done

- [ ] 320px: no horizontal page scroll, no clipped content.
- [ ] Every table collapses to cards below `sm`.
- [ ] All flex text containers have `minWidth: 0`.
- [ ] Long values truncate or wrap — never push layout.
- [ ] Typography fluid; body never < 16px.
- [ ] Content capped and centered on large screens.
- [ ] `100dvh` + safe-area insets applied to shell + sticky bars.
- [ ] Touch targets ≥ 44px on mobile.
- [ ] Zoom 80–200% reflows without clipping.
- [ ] No raw px / hex in screens — tokens only (see `theme.md`, `cross-browser.md`).
