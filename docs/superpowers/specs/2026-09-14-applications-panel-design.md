# Applications Panel — metadata-driven table

**Date:** 2026-09-14
**Status:** Approved for planning

## Problem

Build a small panel that lists loan applications ("wnioski"). The table's
columns, value types, sort/filter behavior, and row-action availability must
all be derived from metadata (`data/columns.json`) and row data
(`data/rows.json`) — never hardcoded to specific column names. This is a
timeboxed (3h) take-home assignment; scope is deliberately minimal.

## Inputs

- `data/columns.json` — 7 column definitions: `key`, `label`, `type`
  (`text | badge | currency | date | action`), `sortable`, `filterable`,
  optional `options` (enum values, e.g. status), optional `action` (action
  name, e.g. `edit`).
- `data/rows.json` — 1200 application records. Fields observed: `loanId`,
  `customerName`, `status`, `market`, `monthlyRate`, `updatedAt`,
  `permissions: { canEdit }`. No missing values in the current fixture, but
  the design must not assume that stays true.

**Data-shape note:** `columns.json` declares a `canEdit` column of
`type: "action"`, but the row payload nests it under `row.permissions.canEdit`
rather than a top-level `canEdit` field. Convention: for `action`-type
columns, availability is resolved via `row.permissions[column.key]`. This is
documented here so it reads as an intentional mapping, not a special case
hardcoded to one column name.

## Stack

- Vite + React + TypeScript, scaffolded at the repo root (`package.json`
  alongside `data/`).
- **TanStack Table v8** (headless) for column model, sorting, filtering.
- **Vitest + React Testing Library** for tests (native Vite pairing).
- No CSS framework / component kit — plain CSS, proportional to scope.

## Architecture

### Data flow

`src/api/applicationsAdapter.ts` imports the two JSON fixtures directly
(`../../data/columns.json`, `../../data/rows.json`) and exposes:

```ts
type LoadMode = "success" | "empty" | "error";
function fetchApplications(mode: LoadMode): Promise<{ columns: ColumnMeta[]; rows: ApplicationRow[] }>
```

with an artificial delay to make the `loading` state observable. `mode` is
driven by a toolbar control (Success / Empty / Error), so all four UI states
(loading/success/empty/error) are reachable on demand and deterministically
testable — no random/flaky failure injection.

### Metadata → table mapping

- Column order = array order in `columns.json`. An optional `order` field
  and an optional `visible` field (defaulting to `true`) are supported by the
  type even though not present in today's fixture, so visibility/order stay
  metadata-driven if the fixture grows those fields later.
- A `type → cell renderer` registry (`src/table/cellRenderers.tsx`) covers
  `text | badge | currency | date | action`. Adding a new `type` means
  adding one registry entry, not touching table logic.
- Sort comparators (`src/table/sorting.ts`) are missing-value-aware: `null`/
  `undefined` always sort last, regardless of direction.
- Text search scans all `filterable` `text`-type columns (currently `loanId`,
  `customerName`, `market`) by substring match — not hardcoded to one field.
- The status filter is a `<select>` populated from the `status` column's
  `options` metadata, not a hardcoded enum.

### Row actions

The `action`-type cell renders an enabled button when
`row.permissions[column.key]` is `true`; otherwise a visually muted,
non-interactive element — never a disabled-looking-but-clickable button.
Clicking is a stubbed handler (inline toast/log). A real edit flow is out of
scope; noted under "what's next" in the README.

### Project layout

```
src/
  types.ts                    # ColumnMeta, ApplicationRow, LoadMode
  api/applicationsAdapter.ts
  table/columns.ts             # metadata -> TanStack ColumnDef[]
  table/cellRenderers.tsx      # type -> renderer registry
  table/sorting.ts             # missing-value-aware comparators
  components/ApplicationsTable.tsx
  components/Toolbar.tsx       # search + status filter + simulate-state control
  App.tsx / main.tsx
```

## Testing

Minimum 2 automated tests, per the acceptance criteria:

1. Pure-logic unit test — sort comparator handles missing values correctly,
   and/or the action-availability resolver reads `permissions[key]`.
2. Component test — render the table with fixture rows; assert clicking a
   sortable column header re-sorts rows, and a row with `canEdit: false`
   renders its action as non-interactive.

## Explicitly out of scope

- Real backend / persistence.
- A real edit flow behind the `edit` action (stubbed only).
- Pagination, column resize/reorder UI, multi-column sort.
- Any UI kit or CSS framework.

## Deliverables (per task_description.pdf)

- Source code, runnable via `npm install && npm run dev`.
- `npm run dev`, `npm run typecheck`, `npm run test` scripts.
- `README.md`: how to run, assumptions, technical decisions, named
  programming principles with 1-2 code examples, and a "what I'd do next
  with 60-90 more minutes" section.
