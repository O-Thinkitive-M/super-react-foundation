# config/

App-wide, **non-secret** configuration and registries. Pure data, no React.

- Navigation tree (sidebar/menu items).
- Status registries (status -> label/color/icon).
- Table / filter defaults (page size, default sort).
- Feature flags (static), enums, route constants.

Keep secrets in env (`import.meta.env.VITE_*`), never here.
