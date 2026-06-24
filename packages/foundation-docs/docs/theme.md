# Theme System

> Foundation doc — copied into every project's `project-setup/theme.md`.
> **The architecture is fixed; the token values change per project.** `src/theme/` holds all design tokens — every color/spacing/type value lives here, zero hardcoded hex/px in components. One token change propagates app-wide.
> This is a **project-variable** doc: the brand palette, typography, and component overrides are filled in from the project's **UI / brand / design (Figma) spec** during analyze/plan. The token *structure* stays the same.

## What the scaffold seeds

A minimal working theme at `src/theme/index.ts` (a `createTheme` with a placeholder primary color and the system font stack) wired into `main.tsx` via `ThemeProvider` + `CssBaseline`. The app renders themed out of the box; you grow it into the token-file structure below.

## Target token structure

| File | Responsibility |
|---|---|
| `src/theme/palette.ts` | brand + semantic colors |
| `src/theme/typography.ts` | font stack, sizes, weights |
| `src/theme/spacing.ts` | 8px base scale |
| `src/theme/radii.ts` | border radii |
| `src/theme/shadows.ts` | elevation tokens |
| `src/theme/breakpoints.ts` | mobile → large (see `responsive-system.md`) |
| `src/theme/components.ts` | MUI component overrides |
| `src/theme/index.ts` | `createTheme()` assembly |

## `palette.ts`

```ts
export const palette = {
  primary: { main: "#2D5F8D", contrastText: "#FFFFFF" }, // ← replace with the project brand
  success: { main: "#22C55E" },
  warning: { main: "#F59E0B" },
  error:   { main: "#EF4444" },
  info:    { main: "#3B82F6" },
  text: { primary: "#1A2A3A", secondary: "#4A5568" },
  background: { default: "#FFFFFF", paper: "#FFFFFF" },
} as const;
```

> Custom palette keys (e.g. a `cta` accent) are added to MUI's palette via module augmentation in `src/types/`.

## `typography.ts`

```ts
const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
export const typography = {
  fontFamily,
  fontWeightRegular: 400, fontWeightMedium: 500, fontWeightSemiBold: 600,
  h1: { fontSize: "clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem)", fontWeight: 600, lineHeight: 1.2 },
  body1: { fontSize: "1rem", lineHeight: 1.6 },  // never below 16px
} as const;
```

- **Min body size 16px** (accessibility / mobile zoom). Fluid sizing pairs with `responsive-system.md`.

## `spacing.ts`, `radii.ts`, `breakpoints.ts`

```ts
export const spacingUnit = 8;                                  // theme.spacing(n) => n*8px
export const radii = { sm: 8, md: 12, lg: 16 } as const;
export const breakpoints = { values: { xs: 0, sm: 768, md: 1024, lg: 1280, xl: 1440 } } as const;
```

## `index.ts` — assembly

```ts
import { createTheme } from "@mui/material/styles";
import { palette } from "./palette";
import { typography } from "./typography";
import { spacingUnit } from "./spacing";
import { radii } from "./radii";
import { breakpoints } from "./breakpoints";
import { components } from "./components";

export const theme = createTheme({
  palette, typography,
  spacing: spacingUnit,
  shape: { borderRadius: radii.md },
  breakpoints, components,
});
export type AppTheme = typeof theme;
```

## Token propagation & dark-mode-ready

- **Single source:** components read `theme.palette.primary.main`, `theme.spacing(2)`, etc. — never literals.
- **Change once:** edit `palette.ts` `primary.main` → every button, chip, link, focus ring updates instantly.
- **Dark-mode-ready:** group tokens semantically so a `dark` color scheme can be added later (`createTheme({ colorSchemes: { light, dark } })`) without touching components.

## Adapt per project (from UI / brand / Figma / MOM)

- **Brand palette** — set `primary` (and any accent/CTA keys) from the brand guideline / Figma styles.
- **Typography** — set the font family, sizes, and weights from the design (keep body ≥ 16px).
- **Radii / shadows / spacing** — match the design system's tokens.
- **Component overrides** — fill `components.ts` from the design's button/input/chip styles.
- The **file structure and token-driven rule stay fixed**; only values change. Never reintroduce hardcoded hex/px in components.
