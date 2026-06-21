# 05 — Responsive System (Mobile-First)

> **Max-priority rule:** the UI must **never break** at any width 320px → 4K, at any DPR (1×–3×), at any browser zoom 80–200%. Mobile-first; enhance up. All sizing from theme tokens — no raw px in screens.

---

## Breakpoint Tokens

| Token | Range | MUI key | Layout intent |
|---|---|---|---|
| Mobile | 320–767 | `xs` | single column, tables → cards, drawer nav |
| Tablet | 768–1023 | `sm`/`md` | 2-col, collapsible sidebar |
| Desktop | 1024–1439 | `lg` | full sidebar + content |
| Large | 1440+ | `xl` | content capped at **1280px**, gutters grow |

```ts
// theme breakpoints (createTheme)
breakpoints: { values: { xs: 0, sm: 768, md: 1024, lg: 1280, xl: 1440 } }
```
> Note: MUI defaults are remapped to product breakpoints above. Use the **named** keys everywhere; never compare raw widths in JSX.

---

## Grid Usage (MUI v7 `Grid`, `size` prop)
```tsx
import Grid from '@mui/material/Grid';
<Grid container spacing={{ xs: 2, md: 3 }}>
  <Grid size={{ xs: 12, md: 6, lg: 4 }}><KpiCard … /></Grid>
  <Grid size={{ xs: 12, md: 6, lg: 4 }}><KpiCard … /></Grid>
  <Grid size={{ xs: 12, lg: 4 }}><KpiCard … /></Grid>
</Grid>
```
- v7 uses `size={{…}}` (NOT `xs={} md={}`). `container`/`item` merged — every Grid is both.
- Spacing always `theme.spacing` multiples (8px base): `spacing={2}` = 16px.

## `useMediaQuery` Pattern
```ts
import { useTheme, useMediaQuery } from '@mui/material';
export const useBreakpoint = () => {
  const t = useTheme();
  return {
    isMobile: useMediaQuery(t.breakpoints.down('sm')),   // <768
    isTablet: useMediaQuery(t.breakpoints.between('sm','md')),
    isDesktop: useMediaQuery(t.breakpoints.up('md')),    // ≥1024
  };
};
```
> Use for **structural** swaps (table↔card, drawer↔sidebar). For pure styling prefer responsive `sx` arrays — avoids JS re-render on resize.

---

## Table → Card Collapse (mobile)
> Rule: any `DataTable` **must** render as stacked cards below `sm`. Built into the primitive — screens get it free.
```tsx
const { isMobile } = useBreakpoint();
return isMobile
  ? <CardList rows={rows} columns={columns} primaryKey="name" />  // label:value stacked
  : <DataTable rows={rows} columns={columns} />;
```
- Card shows: primary field as title, `StatusChip`, then top N `column.labelKey: value` pairs.
- Row actions → overflow `⋮` menu (never a horizontal scroll of buttons).

## Fluid Typography
```ts
// theme.typography — clamp scales with viewport, no media-query steps
h1: { fontSize: 'clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem)' },
body1: { fontSize: 'clamp(1rem, 0.95rem + 0.2vw, 1.0625rem)' }, // min 16px (never <16)
```
- Font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- Never set body below 16px (iOS zoom-on-focus + AA legibility).

## Content Container (1280 cap)
```tsx
<Box sx={{ maxWidth: 1280, mx: 'auto', width: '100%', px: { xs: 2, sm: 3, lg: 4 } }}>
```
- Above 1440 the page centers; gutters absorb extra width. Content never stretches edge-to-edge.

## Full-height + Safe-Area (iOS)
```ts
// app shell root
minHeight: '100dvh',                              // dvh, not vh (mobile URL bar)
paddingTop: 'env(safe-area-inset-top)',
paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
```
- Sticky headers/`ActionDock` add safe-area insets so notch/home-bar never overlap.

---

## No-Break Rules (the load-bearing ones)

| Rule | How |
|---|---|
| Flex/grid children **must** allow shrink | add `minWidth: 0` on flex items holding text |
| Long text never expands layout | `TruncatedText` → `text-overflow: ellipsis`, `overflow: hidden` |
| Wide tables | horizontal scroll **inside** table wrapper only (`overflow-x:auto`), page never scrolls X |
| Images/media | `maxWidth: '100%'`, `height: auto` |
| Fixed pixel widths | banned in screens; use `%`, `fr`, `minmax()`, tokens |
| Word-break for emails/IDs | `overflowWrap: 'anywhere'` on PHI/identifier cells |
| Touch targets | min 44×44px on mobile (AA) |
| Grids reflow, never overflow | `repeat(auto-fill, minmax(280px, 1fr))` for card grids |

```tsx
// canonical no-overflow text cell
<Box sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
```

---

## Device / Zoom Test Matrix

| Class | Targets | DPR | Check |
|---|---|---|---|
| Phone | 320, 360, 390, 414px | 2×–3× | table→card, drawer nav, no X-scroll, tap targets |
| Tablet | 768, 820, 1024px | 2× | sidebar collapse, 2-col grids |
| Laptop | 1280, 1366, 1440px | 1×–2× | content cap, full sidebar |
| Mac/Retina | 1440–1728px | 2×–3× | crisp text, no blur, cap honored |
| Large/4K | 1920, 2560, 3840px | 1×–2× | content centered, gutters grow |
| Zoom | 80 / 100 / 125 / 150 / 200% | — | reflow not clip; AA reflow @400% no 2-D scroll |

---

## Responsive Checklist (Definition of Done)
- [ ] 320px: no horizontal page scroll, no clipped content.
- [ ] Every table collapses to cards below `sm`.
- [ ] All flex text containers have `minWidth: 0`.
- [ ] Long values truncate or wrap — never push layout.
- [ ] Typography fluid; body never <16px.
- [ ] Content capped at 1280px; centered above 1440.
- [ ] `100dvh` + safe-area insets applied to shell + sticky bars.
- [ ] Touch targets ≥44px on mobile.
- [ ] Verified on Mac/Retina at DPR 2×–3×.
- [ ] Browser zoom 80–200% reflows without clipping (AA reflow).
- [ ] No raw px / hex in screens — tokens only.
- [ ] Chrome/Edge/Safari/Firefox (last-2) + iOS/Android pass.
