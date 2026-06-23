# components/

**Shared, reusable** presentational components used across more than one feature. Feature-only components live in `pages/<feature>/components/`.

Organized by role:

| Folder | Contains |
| --- | --- |
| `ui/` | Primitives: buttons, chips, badges, `TruncatedText`. |
| `layout/` | Structure: `AppShell`, `Nav`, `SplitPane`, `MasterDetail`, `NestedTabPage`. |
| `forms/` | Form building blocks: `SchemaForm`, `FormSection`, `AsyncAutocomplete`. |
| `data/` | Data display: `DataTable`, `FilterBar`, `KpiCard`. |
| `feedback/` | State/overlays: `ErrorBoundary`, `QueryState`, `Drawer`, `Modal`, toasts. |

PascalCase file + component name. One component per file. Co-locate `*.test.tsx`.
