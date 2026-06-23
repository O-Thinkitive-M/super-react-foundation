# theme/

MUI theme + design tokens. Single source of truth for visual style — **no hardcoded colors, spacing, or fonts in components.**

| File | Purpose |
| --- | --- |
| `index.ts` | `createTheme(...)` export consumed by `<ThemeProvider>` in `main.tsx`. |
| `palette.ts` | Color tokens (primary, secondary, error, semantic, neutrals). |
| `typography.ts` | Font family, scale, weights. |
| `spacing.ts` | Spacing scale / `theme.spacing` overrides. |
| `shadows.ts` | Elevation tokens. |
| `breakpoints.ts` | Responsive breakpoints. |
| `radii.ts` | Border-radius tokens. |
| `components.ts` | MUI component default props + style overrides. |

Split tokens into the files above as the theme grows; re-export them all from `index.ts`.
