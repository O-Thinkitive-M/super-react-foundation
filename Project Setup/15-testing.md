# 15 — Testing

Every feature and every reusable primitive is tested **at the FE unit/component level**. Contract tests lock primitive prop APIs; negative/edge tests prove resilience.

> **Scope:** FE testing = unit + component + a11y + contract + negative/edge tests (Vitest + RTL + jest-axe).
> **End-to-end (E2E) testing is OUT of FE scope** — owned separately by the QA team (their own tooling/repo).
> Do not add Playwright/MSW e2e packages to the FE project.

## Test Types

| Type | Scope | Goal |
|------|-------|------|
| Per-feature | Feature flows (list/detail/forms) | Behavior correct |
| **Per-primitive contract** | Each reusable component | Lock prop API + variants so changes can't silently break consumers |
| **Negative / edge-case** | Invalid/empty/error states | Resilience |
| Infinite-scroll | Pagination correctness | No dup/missing rows |
| a11y | Keyboard + jest-axe | WCAG AA |
| Visual snapshot (optional) | Primitives | Catch unintended UI drift |

## Negative / Edge Cases (must cover)

- Invalid input (bad email, out-of-range, wrong type)
- Empty / error / timeout API responses
- Permission-denied (PHI masked, action hidden)
- Overflow text (long names truncate, no layout break)
- Offline / network failure
- Malformed/partial data from API

## Coverage Gates

| Target | Threshold |
|--------|-----------|
| Lines (global) | ≥ 80% |
| Branches (global) | ≥ 75% |
| Primitives (`src/shared/`) | **100%** lines |
| Utils (mask, format, validators) | **100%** lines |

`vitest.config.ts`
```ts
coverage: {
  thresholds: { lines: 80, branches: 75,
    'src/shared/**': { lines: 100 }, 'src/utils/**': { lines: 100 } },
}
```

## File Structure & Naming

```
src/features/patients/
  PatientList.tsx
  PatientList.test.tsx          // component
  __tests__/patients.flow.test.tsx
src/shared/DataTable/
  DataTable.tsx
  DataTable.contract.test.tsx   // primitive contract
test/
  setup.ts                      // jest-axe, RTL cleanup, test QueryClient
```
- Component tests: `*.test.tsx`; contract: `*.contract.test.tsx`.
- **Mock data** by stubbing the generated SDK hooks (`vi.mock('@/sdk/...')`) or wrapping in a test
  `QueryClient` with seeded cache — no network-layer mocking library needed (MSW is not used on FE).

## Example — DataTable Contract Test

`src/shared/DataTable/DataTable.contract.test.tsx`
```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { DataTable } from './DataTable';

const cols = [{ id: 'name', header: 'col.name', accessor: (r) => r.name }];
const rows = [{ id: '1', name: 'Ada' }, { id: '2', name: 'Lin' }];

it('renders rows + headers per column contract', () => {
  render(<DataTable columns={cols} data={rows} getRowId={(r) => r.id} />);
  expect(screen.getAllByRole('row')).toHaveLength(rows.length + 1); // +header
});

it('honors loading and empty variants', () => {
  const { rerender } = render(<DataTable columns={cols} data={[]} loading getRowId={(r)=>r.id} />);
  expect(screen.getByRole('status')).toBeInTheDocument();           // spinner
  rerender(<DataTable columns={cols} data={[]} getRowId={(r)=>r.id} />);
  expect(screen.getByText('table.empty')).toBeInTheDocument();      // empty state
});

it('supports keyboard row selection (Enter)', async () => {
  const onSelect = vi.fn();
  render(<DataTable columns={cols} data={rows} onRowSelect={onSelect} getRowId={(r)=>r.id} />);
  const firstRow = screen.getAllByRole('row')[1];
  firstRow.focus(); await userEvent.keyboard('{Enter}');
  expect(onSelect).toHaveBeenCalledWith(rows[0]);
});

it('has no a11y violations', async () => {
  const { container } = render(<DataTable columns={cols} data={rows} getRowId={(r)=>r.id} />);
  expect(await axe(container)).toHaveNoViolations();
});
```

## Example — Negative Form-Validation Test

`src/features/patients/PatientForm.test.tsx`
```tsx
it('shows zod errors below fields and blocks submit on invalid input', async () => {
  const onSubmit = vi.fn();
  render(<PatientForm onSubmit={onSubmit} />);
  await userEvent.type(screen.getByLabelText('field.email'), 'not-an-email');
  await userEvent.click(screen.getByRole('button', { name: 'action.save' }));

  const err = await screen.findByText('error.email.invalid');
  expect(err).toBeInTheDocument();
  expect(screen.getByLabelText('field.email'))
    .toHaveAttribute('aria-describedby', err.id);     // error linked
  expect(onSubmit).not.toHaveBeenCalled();            // submit blocked
});
```

## Infinite-Scroll Correctness

- Assert no duplicate row ids across pages.
- Assert `getNextPageParam` stops at end (no infinite fetch).
- Assert virtualized window renders only visible rows but total count correct.

## Commands

| Script | Command |
|--------|---------|
| Unit/component | `npm run test` (`vitest run`) |
| Watch | `vitest` |
| Coverage | `vitest run --coverage` |
