# 11 — Accessibility & Keyboard (WCAG 2.1 AA)

Harmony EMR is keyboard-first and screen-reader safe. All UI text comes from the i18n registry (no hardcoded strings). Colors come from theme tokens only (brand primary `#2D5F8D`).

## 13 Mandatory UX Standards

| # | Standard | Rule |
|---|----------|------|
| 1 | Tab navigation | Every interactive element reachable via `Tab`; logical DOM order |
| 2 | Arrow-key lists | `↑/↓` move within lists/menus/grids (roving tabindex) |
| 3 | Enter advances/submits | `Enter` moves to next field or submits form |
| 4 | Esc closes overlays | `Esc` closes modal/drawer/menu/popover, restores focus |
| 5 | Theme tokens only | No hardcoded colors; use `theme.palette.*` |
| 6 | Loading spinners | Async actions show spinner/skeleton, never blank |
| 7 | Success toasts | Mutations confirm via toast (`aria-live=polite`) |
| 8 | Confirm before delete | Destructive actions require confirm dialog |
| 9 | Required red asterisk | Required fields show `*` + `aria-required` |
| 10 | Errors below field | Inline error under field, `aria-describedby` linked |
| 11 | 30-min idle timeout | Auto-logout with warning at 28 min |
| 12 | Icon tooltips | Icon-only buttons have tooltip + `aria-label` |
| 13 | Responsive | Usable 320px → 1920px; no horizontal scroll traps |

## ARIA Patterns

| Component | role / attributes |
|-----------|-------------------|
| Primary nav | `<nav aria-label>`, `aria-current="page"` |
| Main region | `<main id="main-content">` (skip-link target) |
| Listbox/select | `role="listbox"`, options `role="option" aria-selected` |
| Data grid | `role="grid"`, `role="row"`, `role="gridcell"`, `aria-colindex` |
| Tabs | `role="tablist"` / `tab` / `tabpanel`, `aria-selected`, `aria-controls` |
| Dialog | `role="dialog" aria-modal="true" aria-labelledby aria-describedby` |
| Live region | `aria-live="polite"` (status) / `assertive` (errors) |
| Icon button | `<button aria-label>` + `<svg aria-hidden="true">` |

## Focus Management

| Concern | Rule |
|---------|------|
| Focus trap | Modals/drawers trap focus inside until closed |
| Focus restore | On close, return focus to the trigger element |
| Visible focus | Never remove outline; use `:focus-visible` ring (token) |
| Skip-to-content | First Tab reveals "Skip to main content" → `#main-content` |
| Roving tabindex | Lists/toolbars: one `tabindex=0`, rest `-1`; arrows move it |

## Keyboard Hooks

`src/shared/a11y/useShortcut.ts`
```ts
export function useShortcut(combo: string, handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (matchCombo(combo, e)) { e.preventDefault(); handler(e); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [combo, handler]);
}
```

`src/shared/a11y/useKeyboardList.ts` — roving tabindex for lists/menus
```ts
export function useKeyboardList(count: number) {
  const [active, setActive] = useState(0);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') setActive(i => Math.min(i + 1, count - 1));
    if (e.key === 'ArrowUp')   setActive(i => Math.max(i - 1, 0));
    if (e.key === 'Home') setActive(0);
    if (e.key === 'End')  setActive(count - 1);
  };
  return { active, onKeyDown, getTabIndex: (i: number) => (i === active ? 0 : -1) };
}
```

`src/shared/a11y/useFocusTrap.ts` — uses `tabbable`
```ts
import { tabbable } from 'tabbable';
export function useFocusTrap(ref: RefObject<HTMLElement>, active: boolean) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const prev = document.activeElement as HTMLElement;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const nodes = tabbable(ref.current!);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    };
    ref.current.addEventListener('keydown', onKey);
    return () => { ref.current?.removeEventListener('keydown', onKey); prev?.focus(); };
  }, [active, ref]);
}
```

`src/shared/a11y/useAriaAnnounce.ts` — programmatic SR announcements
```ts
export function useAriaAnnounce() {
  return useCallback((msg: string, level: 'polite' | 'assertive' = 'polite') => {
    const el = document.getElementById(`sr-${level}`);
    if (el) { el.textContent = ''; requestAnimationFrame(() => (el.textContent = msg)); }
  }, []);
}
// Mount once in root layout:
// <div id="sr-polite" aria-live="polite" className="sr-only" />
// <div id="sr-assertive" aria-live="assertive" className="sr-only" />
```

## Centralized Shortcut Registry

`src/shared/a11y/shortcuts.ts`
```ts
export const SHORTCUTS = {
  commandPalette: { combo: 'mod+k', i18n: 'shortcut.commandPalette' },
  help:           { combo: 'shift+?', i18n: 'shortcut.help' },
  save:           { combo: 'mod+s', i18n: 'shortcut.save' },
  search:         { combo: '/',      i18n: 'shortcut.search' },
  newPatient:     { combo: 'mod+n', i18n: 'shortcut.newPatient' },
} as const;
```

| Feature | Trigger | Behavior |
|---------|---------|----------|
| Command Palette | `Ctrl/Cmd + K` | Fuzzy action/route search, full keyboard nav |
| Shortcut Help modal | `Shift + ?` | Lists all `SHORTCUTS` (labels from i18n) |
| Global search | `/` | Focus search input |

- `mod` = `Cmd` on macOS, `Ctrl` elsewhere (normalize in `matchCombo`).
- All shortcut labels rendered from i18n keys — never literal strings.

## Pre-Merge A11y Checklist

- [ ] Full keyboard pass: reach + operate every control, no traps
- [ ] `Esc` closes all overlays; focus restored to trigger
- [ ] Focus visible on every interactive element
- [ ] Skip-to-content link works
- [ ] All icon buttons have `aria-label` + tooltip
- [ ] Required fields: asterisk + `aria-required`; errors via `aria-describedby`
- [ ] Live regions announce loading/success/error
- [ ] `jest-axe` passes (0 violations) on changed components
- [ ] Color contrast ≥ 4.5:1 (text), 3:1 (UI/large); tokens only
- [ ] Responsive 320 → 1920px verified
- [ ] No hardcoded UI text (i18n registry)
