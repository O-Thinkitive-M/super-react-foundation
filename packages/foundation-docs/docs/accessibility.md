# Accessibility & Keyboard (WCAG 2.1 AA)

> Generic foundation doc. Copied verbatim into every project's `project-setup/accessibility.md`.
> Keyboard-first and screen-reader safe. All UI text comes from the i18n registry; all colors from theme tokens.

## Mandatory UX standards

| # | Standard | Rule |
|---|---|---|
| 1 | Tab navigation | every interactive element reachable via `Tab`; logical DOM order |
| 2 | Arrow-key lists | `↑/↓` move within lists/menus/grids (roving tabindex) |
| 3 | Enter advances/submits | `Enter` moves to next field or submits |
| 4 | Esc closes overlays | `Esc` closes modal/drawer/menu/popover, restores focus |
| 5 | Theme tokens only | no hardcoded colors; use `theme.palette.*` |
| 6 | Loading states | async actions show spinner/skeleton, never blank |
| 7 | Success toasts | mutations confirm via toast (`aria-live="polite"`) |
| 8 | Confirm before delete | destructive actions require a confirm dialog |
| 9 | Required asterisk | required fields show `*` + `aria-required` |
| 10 | Errors below field | inline error under field, `aria-describedby` linked |
| 11 | Idle timeout | auto-logout with warning (see `security.md`) |
| 12 | Icon tooltips | icon-only buttons have a tooltip + `aria-label` |
| 13 | Responsive | usable 320 → 1920px, no horizontal scroll traps |

## ARIA patterns

| Component | role / attributes |
|---|---|
| Primary nav | `<nav aria-label>`, `aria-current="page"` |
| Main region | `<main id="main-content">` (skip-link target) |
| Listbox/select | `role="listbox"`, options `role="option" aria-selected` |
| Data grid | `role="grid"`/`row`/`gridcell`, `aria-colindex` |
| Tabs | `role="tablist"`/`tab`/`tabpanel`, `aria-selected`, `aria-controls` |
| Dialog | `role="dialog" aria-modal="true" aria-labelledby aria-describedby` |
| Live region | `aria-live="polite"` (status) / `assertive` (errors) |
| Icon button | `<button aria-label>` + `<svg aria-hidden="true">` |

## Focus management

| Concern | Rule |
|---|---|
| Focus trap | modals/drawers trap focus until closed |
| Focus restore | on close, return focus to the trigger |
| Visible focus | never remove the outline; use a `:focus-visible` ring token |
| Skip-to-content | first Tab reveals "Skip to main content" → `#main-content` |
| Roving tabindex | lists/toolbars: one `tabindex=0`, rest `-1`; arrows move it |

## Keyboard hooks (`src/lib/a11y/`)

```ts
// useFocusTrap.ts — uses `tabbable`
import { tabbable } from "tabbable";
export function useFocusTrap(ref: RefObject<HTMLElement>, active: boolean) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const prev = document.activeElement as HTMLElement;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = tabbable(ref.current!);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    };
    ref.current.addEventListener("keydown", onKey);
    return () => { ref.current?.removeEventListener("keydown", onKey); prev?.focus(); };
  }, [active, ref]);
}
```

- `useShortcut(combo, handler)` — global hotkeys; `mod` = Cmd on macOS, Ctrl elsewhere.
- `useKeyboardList(count)` — roving tabindex for lists/menus.
- `useAriaAnnounce()` — writes to a mounted `aria-live` region for programmatic SR announcements.

```html
<!-- mount once in the root layout -->
<div id="sr-polite" aria-live="polite" class="sr-only"></div>
<div id="sr-assertive" aria-live="assertive" class="sr-only"></div>
```

## Optional power-user features

| Feature | Trigger | Behavior |
|---|---|---|
| Command palette | `Ctrl/Cmd + K` | fuzzy action/route search, full keyboard nav |
| Shortcut help | `Shift + ?` | lists all shortcuts (labels from i18n) |

- Shortcut labels come from `config/shortcuts.ts` (i18n keys) — never literal strings.

## Pre-merge a11y checklist

- [ ] Full keyboard pass: reach + operate every control, no traps.
- [ ] `Esc` closes all overlays; focus restored to trigger.
- [ ] Focus visible on every interactive element.
- [ ] Skip-to-content link works.
- [ ] Icon buttons have `aria-label` + tooltip.
- [ ] Required fields: asterisk + `aria-required`; errors via `aria-describedby`.
- [ ] Live regions announce loading/success/error.
- [ ] `jest-axe` passes (0 violations) on changed components.
- [ ] Color contrast ≥ 4.5:1 (text), 3:1 (UI/large) — tokens only.
- [ ] No hardcoded UI text (i18n registry).

## Adapt per project (from SRS/MOM)

- Confirm the target conformance level (AA is the default) and any added requirements.
- Decide whether the command palette / shortcut help features are in scope.
