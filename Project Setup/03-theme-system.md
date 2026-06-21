# 03 — Theme System

> `src/theme/` holds all design tokens. **Every** color/spacing/type value lives here — zero hardcoded hex/px in components. One token change propagates app-wide.
> Identical structure across portals; only token *values* may differ.

---

## `src/theme/` Files

| File | Responsibility |
|---|---|
| `palette.ts` | Brand + semantic colors |
| `typography.ts` | SF font stack, sizes, weights |
| `spacing.ts` | 8px base scale |
| `radii.ts` | Border radii 8–16 |
| `shadows.ts` | Elevation tokens |
| `breakpoints.ts` | Mobile→Large |
| `components.ts` | MUI component overrides |
| `index.ts` | `createTheme()` assembly |

---

## `palette.ts`

```ts
export const palette = {
  primary: { main: "#2D5F8D", dark: "#1A3A5A", contrastText: "#FFFFFF" }, // Harmony / Deep Blue
  cta: { main: "#F6C344", contrastText: "#1A3A5A" },                      // Sunlight Yellow
  accent: {
    sereneMint: "#8BCEC3",
    healingSage: "#94A684",
    gentleLavender: "#B5C7D3",
    softSunshine: "#F6E05E",
  },
  success: { main: "#22C55E" }, // positive
  warning: { main: "#F59E0B" }, // warning
  error:   { main: "#EF4444" }, // negative
  info:    { main: "#3B82F6" }, // info
  text: { primary: "#1A3A5A", secondary: "#4A5568" },
  background: { default: "#FFFFFF", paper: "#FFFFFF" },
} as const;
```
> `cta` and `accent` are added to MUI's palette via module augmentation in `types/`.

---

## `typography.ts`

```ts
const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const typography = {
  fontFamily,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightSemiBold: 600,
  h1: { fontFamily, fontSize: "48px", lineHeight: 1.2, fontWeight: 300 },
  h2: { fontFamily, fontSize: "36px", lineHeight: 1.3, fontWeight: 400 },
  h3: { fontFamily, fontSize: "24px", lineHeight: 1.4, fontWeight: 500 },
  h4: { fontFamily, fontSize: "20px", lineHeight: 1.5, fontWeight: 500 },
  bodyLarge: { fontFamily, fontSize: "18px", lineHeight: 1.6, fontWeight: 400 },
  body1: { fontFamily, fontSize: "16px", lineHeight: 1.6, fontWeight: 400 }, // min body 16px
} as const;
```
- **Min body size 16px** (accessibility / mobile zoom).
- `bodyLarge` registered as a custom variant via module augmentation.

---

## `spacing.ts`, `radii.ts`, `breakpoints.ts`

```ts
// spacing.ts — 8px base
export const spacingUnit = 8; // theme.spacing(n) => n*8px
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64, xxxxl: 96 } as const;

// radii.ts — 8–16px
export const radii = { sm: 8, md: 12, lg: 16 } as const;

// breakpoints.ts
export const breakpoints = {
  values: { xs: 320, sm: 768, md: 1024, lg: 1440, xl: 1920 },
  // Mobile 320–767 | Tablet 768–1023 | Desktop 1024–1439 | Large 1440+
} as const;
```

---

## `index.ts` — `createTheme()` Assembly

```ts
import { createTheme } from "@mui/material/styles";
import { palette } from "./palette";
import { typography } from "./typography";
import { spacingUnit } from "./spacing";
import { radii } from "./radii";
import { breakpoints } from "./breakpoints";
import { shadows } from "./shadows";
import { components } from "./components";

export const theme = createTheme({
  palette,
  typography,
  spacing: spacingUnit,        // 8px base
  shape: { borderRadius: radii.md },
  breakpoints,
  shadows,
  components,                   // MUI component overrides (buttons, chips, inputs)
});

export type AppTheme = typeof theme;
```

---

## Provider at `main.tsx`

```tsx
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/theme";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);
```

---

## Token Propagation & Dark-Mode-Ready
- **Single source:** components read `theme.palette.primary.main`, `theme.spacing(2)`, etc. — never literals.
- **Change once:** edit `palette.ts` `primary.main` → updates every button, chip, link, focus ring instantly.
- **Dark-mode-ready:** structure supports `createTheme({ colorSchemes: { light, dark } })`; today ship light only, but tokens are grouped semantically (`text`, `background`, semantic colors) so a `dark` scheme can be added without touching components.
- **Per-portal:** Admin/Provider/Patient/Widget share this file set; only token values (if any) vary — components stay untouched.
