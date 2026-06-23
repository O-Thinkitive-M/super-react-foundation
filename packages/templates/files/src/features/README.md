# features/

**Feature-first** area. Each feature is a self-contained folder `features/<feature>/` (e.g. `leads/`, `patients/`, `scheduling/`, `groups/`, `referrals/`). A feature owns everything it needs — its own api, components, route screens, hooks, and config.

Copy `_template/` to start a new feature. Each feature folder:

| Subfolder | Purpose |
| --- | --- |
| `api/` | Feature query/mutation wrappers over the generated `sdk/`. |
| `components/` | Components used only by this feature. |
| `pages/` | Route-level screen components for this feature. |
| `hooks/` | Feature-specific hooks. |
| `config/` | Column / filter / tab / form configs. |
| `index.ts` | Public barrel — the only surface other code imports. |

Promote something to a shared top-level folder (`components/`, `hooks/`, `api/`) only once a second feature needs it.
