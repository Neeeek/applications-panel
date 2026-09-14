# Applications Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a metadata-driven applications table (React + TypeScript + Vite) whose columns, value rendering, sorting, filtering, and row-action availability all derive from `data/columns.json` and `data/rows.json`.

**Architecture:** A pure-logic core (`types.ts`, `sorting.ts`, `actionAvailability.ts`, `columns.ts`, `cellRenderers.tsx`) maps column metadata to TanStack Table's `ColumnDef`s and resolves per-row action availability generically. `ApplicationsTable` renders via `@tanstack/react-table`; `App.tsx` owns request state (loading/success/empty/error) via a mock adapter with a deterministic dev control to force each state.

**Tech Stack:** Vite, React 18, TypeScript, @tanstack/react-table v8, Vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event.

**Spec:** `docs/superpowers/specs/2026-09-14-applications-panel-design.md`

## Global Constraints

- Project scaffolds at the repo root — `package.json` lives next to `data/`.
- Stack is fixed: React + TypeScript + Vite. No CSS framework or component kit.
- Table logic uses `@tanstack/react-table` (headless) — no other data-grid library.
- `data/columns.json` and `data/rows.json` are read-only fixtures — import them, never edit them.
- `npm install && npm run dev` must work with no extra steps.
- Required npm scripts: `dev`, `typecheck`, `test` — all must exit 0 when the app is correct.
- `action`-type columns resolve availability via `row.permissions[column.key]` (documented data-shape convention from the spec).
- Missing values (`null`/`undefined`) always sort last, in both ascending and descending order.
- Minimum 2 automated tests are required by the spec; this plan includes more because they're cheap once the infrastructure exists — do not add further tests beyond what's listed per task.

---

### Task 1: Project scaffold + test toolchain

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts` (via scaffold command)
- Create: `src/setupTests.ts`
- Create: `src/smoke.test.tsx`
- Delete (after scaffold, demo cruft): `src/App.css`, `src/assets/react.svg`

**Interfaces:**
- Produces: working `npm run dev`, `npm run typecheck`, `npm run test` scripts; jsdom test environment; RTL wired via `src/setupTests.ts`.

- [ ] **Step 1: Scaffold the Vite React-TS template into the repo root**

```bash
npm create vite@latest . -- --template react-ts --force
npm install
```

- [ ] **Step 2: Install runtime and test dependencies**

```bash
npm install @tanstack/react-table
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Remove template demo cruft**

```bash
rm -f src/App.css src/assets/react.svg
```

- [ ] **Step 4: Write the toolchain smoke test (before jsdom is configured, so it fails first)**

```tsx
// src/smoke.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function Hello() {
  return <p>hello vitest</p>;
}

describe("toolchain smoke test", () => {
  it("renders a component with React Testing Library", () => {
    render(<Hello />);
    expect(screen.getByText("hello vitest")).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Add the `test` script and run it to confirm it fails**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

Run: `npm run test`
Expected: FAIL — `document is not defined` (default Vitest environment is `node`, and jest-dom matchers aren't loaded yet).

- [ ] **Step 6: Configure jsdom + RTL setup**

```ts
// vite.config.ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    globals: true,
  },
});
```

```ts
// src/setupTests.ts
import "@testing-library/jest-dom/vitest";
```

In `tsconfig.app.json`, add to `compilerOptions`:

```json
"resolveJsonModule": true,
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

- [ ] **Step 7: Run the smoke test again to confirm it passes**

Run: `npm run test`
Expected: PASS — 1 test passed.

- [ ] **Step 8: Add and verify the remaining scripts**

In `package.json` `"scripts"`, ensure:

```json
"dev": "vite",
"typecheck": "tsc -b",
"test": "vitest run"
```

Run: `npm run typecheck`
Expected: exits 0, no errors.

Run: `npm run dev` briefly (Ctrl+C after confirming it serves), or `npm run build` if a quick non-interactive check is preferred.
Expected: starts without error.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Scaffold Vite React-TS app with Vitest/RTL toolchain"
```

---

### Task 2: Types and mock data adapter

**Files:**
- Create: `src/types.ts`
- Create: `src/api/applicationsAdapter.ts`
- Test: `src/api/applicationsAdapter.test.ts`

**Interfaces:**
- Consumes: `data/columns.json`, `data/rows.json` (repo-root fixtures).
- Produces:
  - `type ColumnType = "text" | "badge" | "currency" | "date" | "action"`
  - `interface ColumnMeta { key: string; label: string; type: ColumnType; sortable: boolean; filterable: boolean; options?: string[]; action?: string; visible?: boolean; order?: number; }`
  - `interface ApplicationRow { loanId: string; customerName: string; status: string; market: string; monthlyRate: number | null; updatedAt: string | null; permissions: Record<string, boolean>; }`
  - `type LoadMode = "success" | "empty" | "error"`
  - `interface ApplicationsPayload { columns: ColumnMeta[]; rows: ApplicationRow[]; }`
  - `function fetchApplications(mode: LoadMode): Promise<ApplicationsPayload>`

- [ ] **Step 1: Write the failing test**

```ts
// src/api/applicationsAdapter.test.ts
import { describe, expect, it } from "vitest";
import { fetchApplications } from "./applicationsAdapter";

describe("fetchApplications", () => {
  it("resolves rows and columns in success mode", async () => {
    const result = await fetchApplications("success");
    expect(result.columns.length).toBeGreaterThan(0);
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("resolves an empty row list in empty mode", async () => {
    const result = await fetchApplications("empty");
    expect(result.rows).toEqual([]);
    expect(result.columns.length).toBeGreaterThan(0);
  });

  it("rejects in error mode", async () => {
    await expect(fetchApplications("error")).rejects.toThrow("Failed to load applications");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/api/applicationsAdapter.test.ts`
Expected: FAIL with "Cannot find module './applicationsAdapter'" (file doesn't exist yet).

- [ ] **Step 3: Write the types**

```ts
// src/types.ts
export type ColumnType = "text" | "badge" | "currency" | "date" | "action";

export interface ColumnMeta {
  key: string;
  label: string;
  type: ColumnType;
  sortable: boolean;
  filterable: boolean;
  options?: string[];
  action?: string;
  visible?: boolean;
  order?: number;
}

export interface ApplicationRow {
  loanId: string;
  customerName: string;
  status: string;
  market: string;
  monthlyRate: number | null;
  updatedAt: string | null;
  permissions: Record<string, boolean>;
}

export type LoadMode = "success" | "empty" | "error";
```

- [ ] **Step 4: Write the adapter**

```ts
// src/api/applicationsAdapter.ts
import columnsData from "../../data/columns.json";
import rowsData from "../../data/rows.json";
import type { ApplicationRow, ColumnMeta, LoadMode } from "../types";

const SIMULATED_DELAY_MS = 300;

export interface ApplicationsPayload {
  columns: ColumnMeta[];
  rows: ApplicationRow[];
}

export function fetchApplications(mode: LoadMode): Promise<ApplicationsPayload> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (mode === "error") {
        reject(new Error("Failed to load applications"));
        return;
      }
      if (mode === "empty") {
        resolve({ columns: columnsData as ColumnMeta[], rows: [] });
        return;
      }
      resolve({ columns: columnsData as ColumnMeta[], rows: rowsData as ApplicationRow[] });
    }, SIMULATED_DELAY_MS);
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- src/api/applicationsAdapter.test.ts`
Expected: PASS — 3 tests passed.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/api/applicationsAdapter.ts src/api/applicationsAdapter.test.ts
git commit -m "Add domain types and mock applications adapter"
```

---

### Task 3: Missing-value-aware sort comparators

**Files:**
- Create: `src/table/sorting.ts`
- Test: `src/table/sorting.test.ts`

**Interfaces:**
- Consumes: nothing (pure functions).
- Produces:
  - `function compareText(a: string | null | undefined, b: string | null | undefined): number`
  - `function compareNumber(a: number | null | undefined, b: number | null | undefined): number`
  - `function compareDate(a: string | null | undefined, b: string | null | undefined): number`

- [ ] **Step 1: Write the failing test**

```ts
// src/table/sorting.test.ts
import { describe, expect, it } from "vitest";
import { compareDate, compareNumber, compareText } from "./sorting";

describe("compareNumber", () => {
  it("sorts ascending numerically", () => {
    expect(compareNumber(1, 2)).toBeLessThan(0);
  });

  it("always sorts missing values last, regardless of comparison direction", () => {
    const values = [5, null, 1, undefined, 3];
    const sorted = [...values].sort(compareNumber);
    expect(sorted).toEqual([1, 3, 5, null, undefined]);
  });
});

describe("compareText", () => {
  it("sorts missing values last", () => {
    const values = ["banana", null, "apple"];
    const sorted = [...values].sort(compareText);
    expect(sorted).toEqual(["apple", "banana", null]);
  });
});

describe("compareDate", () => {
  it("sorts missing values last", () => {
    const values = ["2024-02-01", null, "2024-01-01"];
    const sorted = [...values].sort(compareDate);
    expect(sorted).toEqual(["2024-01-01", "2024-02-01", null]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/table/sorting.test.ts`
Expected: FAIL with "Cannot find module './sorting'".

- [ ] **Step 3: Write the implementation**

```ts
// src/table/sorting.ts
function compareWithNullsLast<T>(
  a: T | null | undefined,
  b: T | null | undefined,
  compare: (a: T, b: T) => number
): number {
  const aMissing = a === null || a === undefined;
  const bMissing = b === null || b === undefined;
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return compare(a, b);
}

export function compareText(a: string | null | undefined, b: string | null | undefined): number {
  return compareWithNullsLast(a, b, (x, y) => x.localeCompare(y));
}

export function compareNumber(a: number | null | undefined, b: number | null | undefined): number {
  return compareWithNullsLast(a, b, (x, y) => x - y);
}

export function compareDate(a: string | null | undefined, b: string | null | undefined): number {
  return compareWithNullsLast(a, b, (x, y) => new Date(x).getTime() - new Date(y).getTime());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/table/sorting.test.ts`
Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/table/sorting.ts src/table/sorting.test.ts
git commit -m "Add missing-value-aware sort comparators"
```

---

### Task 4: Action availability resolver + cell renderer registry

**Files:**
- Create: `src/table/actionAvailability.ts`
- Create: `src/table/cellRenderers.tsx`
- Test: `src/table/actionAvailability.test.ts`

**Interfaces:**
- Consumes: `ApplicationRow`, `ColumnMeta` from `../types`.
- Produces:
  - `function isActionAvailable(row: ApplicationRow, columnKey: string): boolean`
  - `interface CellRendererProps { row: ApplicationRow; column: ColumnMeta; onAction?: (actionName: string, row: ApplicationRow) => void; }`
  - `function renderCell(props: CellRendererProps): ReactNode`

- [ ] **Step 1: Write the failing test**

```ts
// src/table/actionAvailability.test.ts
import { describe, expect, it } from "vitest";
import { isActionAvailable } from "./actionAvailability";
import type { ApplicationRow } from "../types";

const baseRow: ApplicationRow = {
  loanId: "LN-1",
  customerName: "Test",
  status: "new",
  market: "PL",
  monthlyRate: 100,
  updatedAt: "2024-01-01T00:00:00Z",
  permissions: { canEdit: true },
};

describe("isActionAvailable", () => {
  it("returns true when the permission flag is true", () => {
    expect(isActionAvailable(baseRow, "canEdit")).toBe(true);
  });

  it("returns false when the permission flag is false", () => {
    expect(isActionAvailable({ ...baseRow, permissions: { canEdit: false } }, "canEdit")).toBe(false);
  });

  it("returns false when the permission key is missing", () => {
    expect(isActionAvailable({ ...baseRow, permissions: {} }, "canEdit")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/table/actionAvailability.test.ts`
Expected: FAIL with "Cannot find module './actionAvailability'".

- [ ] **Step 3: Write the action availability resolver**

```ts
// src/table/actionAvailability.ts
import type { ApplicationRow } from "../types";

export function isActionAvailable(row: ApplicationRow, columnKey: string): boolean {
  return row.permissions?.[columnKey] === true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/table/actionAvailability.test.ts`
Expected: PASS — 3 tests passed.

- [ ] **Step 5: Write the cell renderer registry (no dedicated test — exercised via Task 6's component tests)**

```tsx
// src/table/cellRenderers.tsx
import type { ReactNode } from "react";
import type { ApplicationRow, ColumnMeta } from "../types";
import { isActionAvailable } from "./actionAvailability";

const dateFormatter = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" });
const currencyFormatter = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" });

export interface CellRendererProps {
  row: ApplicationRow;
  column: ColumnMeta;
  onAction?: (actionName: string, row: ApplicationRow) => void;
}

function renderText(row: ApplicationRow, column: ColumnMeta): ReactNode {
  const value = row[column.key as keyof ApplicationRow];
  return value === null || value === undefined ? "—" : String(value);
}

function renderDate(row: ApplicationRow, column: ColumnMeta): ReactNode {
  const value = row[column.key as keyof ApplicationRow] as string | null;
  return value ? dateFormatter.format(new Date(value)) : "—";
}

function renderCurrency(row: ApplicationRow, column: ColumnMeta): ReactNode {
  const value = row[column.key as keyof ApplicationRow] as number | null;
  return value === null || value === undefined ? "—" : currencyFormatter.format(value);
}

function renderBadge(row: ApplicationRow, column: ColumnMeta): ReactNode {
  const value = String(row[column.key as keyof ApplicationRow] ?? "");
  return <span className={`badge badge-${value}`}>{value}</span>;
}

function renderAction({ row, column, onAction }: CellRendererProps): ReactNode {
  const available = isActionAvailable(row, column.key);
  if (!available) {
    return <span className="action action-disabled">—</span>;
  }
  const actionName = column.action ?? column.key;
  return (
    <button type="button" className="action action-enabled" onClick={() => onAction?.(actionName, row)}>
      {actionName}
    </button>
  );
}

export function renderCell(props: CellRendererProps): ReactNode {
  const { row, column } = props;
  switch (column.type) {
    case "date":
      return renderDate(row, column);
    case "currency":
      return renderCurrency(row, column);
    case "badge":
      return renderBadge(row, column);
    case "action":
      return renderAction(props);
    case "text":
    default:
      return renderText(row, column);
  }
}
```

- [ ] **Step 6: Run the typecheck to confirm the new file compiles**

Run: `npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 7: Commit**

```bash
git add src/table/actionAvailability.ts src/table/actionAvailability.test.ts src/table/cellRenderers.tsx
git commit -m "Add action availability resolver and cell renderer registry"
```

---

### Task 5: Metadata-to-columns mapping

**Files:**
- Create: `src/table/columns.ts`
- Test: `src/table/columns.test.ts`

**Interfaces:**
- Consumes: `ColumnMeta`, `ApplicationRow` from `../types`; `compareText`, `compareNumber`, `compareDate` from `./sorting`; `renderCell` from `./cellRenderers`.
- Produces:
  - `function visibleColumnsInOrder(columns: ColumnMeta[]): ColumnMeta[]`
  - `function buildColumnDefs(columns: ColumnMeta[], onAction: (actionName: string, row: ApplicationRow) => void): ColumnDef<ApplicationRow>[]`

- [ ] **Step 1: Write the failing test**

```ts
// src/table/columns.test.ts
import { describe, expect, it } from "vitest";
import { visibleColumnsInOrder } from "./columns";
import type { ColumnMeta } from "../types";

const base: Omit<ColumnMeta, "key" | "label"> = {
  type: "text",
  sortable: true,
  filterable: true,
};

describe("visibleColumnsInOrder", () => {
  it("preserves array order when no explicit order is given", () => {
    const columns: ColumnMeta[] = [
      { ...base, key: "a", label: "A" },
      { ...base, key: "b", label: "B" },
    ];
    expect(visibleColumnsInOrder(columns).map((c) => c.key)).toEqual(["a", "b"]);
  });

  it("respects an explicit order field over array position", () => {
    const columns: ColumnMeta[] = [
      { ...base, key: "a", label: "A", order: 2 },
      { ...base, key: "b", label: "B", order: 1 },
    ];
    expect(visibleColumnsInOrder(columns).map((c) => c.key)).toEqual(["b", "a"]);
  });

  it("excludes columns marked visible: false", () => {
    const columns: ColumnMeta[] = [
      { ...base, key: "a", label: "A" },
      { ...base, key: "b", label: "B", visible: false },
    ];
    expect(visibleColumnsInOrder(columns).map((c) => c.key)).toEqual(["a"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/table/columns.test.ts`
Expected: FAIL with "Cannot find module './columns'".

- [ ] **Step 3: Write the implementation**

```ts
// src/table/columns.ts
import type { CellContext, ColumnDef } from "@tanstack/react-table";
import type { ApplicationRow, ColumnMeta } from "../types";
import { compareDate, compareNumber, compareText } from "./sorting";
import { renderCell } from "./cellRenderers";

function sortingFnFor(type: ColumnMeta["type"]) {
  if (type === "currency") {
    return (rowA: { getValue: (id: string) => unknown }, rowB: { getValue: (id: string) => unknown }, columnId: string) =>
      compareNumber(rowA.getValue(columnId) as number | null, rowB.getValue(columnId) as number | null);
  }
  if (type === "date") {
    return (rowA: { getValue: (id: string) => unknown }, rowB: { getValue: (id: string) => unknown }, columnId: string) =>
      compareDate(rowA.getValue(columnId) as string | null, rowB.getValue(columnId) as string | null);
  }
  return (rowA: { getValue: (id: string) => unknown }, rowB: { getValue: (id: string) => unknown }, columnId: string) =>
    compareText(String(rowA.getValue(columnId) ?? ""), String(rowB.getValue(columnId) ?? ""));
}

function filterFnFor(column: ColumnMeta) {
  if (!column.options) return undefined;
  return (row: { getValue: (id: string) => unknown }, columnId: string, filterValue: string) =>
    !filterValue || row.getValue(columnId) === filterValue;
}

export function visibleColumnsInOrder(columns: ColumnMeta[]): ColumnMeta[] {
  return columns
    .filter((column) => column.visible !== false)
    .map((column, index) => ({ ...column, order: column.order ?? index }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function buildColumnDefs(
  columns: ColumnMeta[],
  onAction: (actionName: string, row: ApplicationRow) => void
): ColumnDef<ApplicationRow>[] {
  return visibleColumnsInOrder(columns).map((column) => ({
    id: column.key,
    accessorKey: column.key,
    header: column.label,
    enableSorting: column.sortable,
    enableColumnFilter: column.filterable,
    sortingFn: sortingFnFor(column.type) as never,
    filterFn: filterFnFor(column) as never,
    cell: (context: CellContext<ApplicationRow, unknown>) =>
      renderCell({ row: context.row.original, column, onAction }),
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/table/columns.test.ts`
Expected: PASS — 3 tests passed.

- [ ] **Step 5: Run the typecheck**

Run: `npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/table/columns.ts src/table/columns.test.ts
git commit -m "Map column metadata to TanStack Table ColumnDefs"
```

---

### Task 6: ApplicationsTable component

**Files:**
- Create: `src/components/ApplicationsTable.tsx`
- Test: `src/components/ApplicationsTable.test.tsx`

**Interfaces:**
- Consumes: `ApplicationRow`, `ColumnMeta` from `../types`; `buildColumnDefs` from `../table/columns`.
- Produces:
  - `interface ApplicationsTableProps { columns: ColumnMeta[]; rows: ApplicationRow[]; globalFilter: string; columnFilters: ColumnFiltersState; onAction: (actionName: string, row: ApplicationRow) => void; }`
  - `function ApplicationsTable(props: ApplicationsTableProps): JSX.Element`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ApplicationsTable.test.tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApplicationsTable } from "./ApplicationsTable";
import type { ApplicationRow, ColumnMeta } from "../types";

const columns: ColumnMeta[] = [
  { key: "customerName", label: "Klient", type: "text", sortable: true, filterable: true },
  { key: "canEdit", label: "Edycja", type: "action", action: "edit", sortable: false, filterable: false },
];

const rows: ApplicationRow[] = [
  {
    loanId: "LN-1",
    customerName: "Zoe",
    status: "new",
    market: "PL",
    monthlyRate: 100,
    updatedAt: "2024-01-01T00:00:00Z",
    permissions: { canEdit: false },
  },
  {
    loanId: "LN-2",
    customerName: "Anna",
    status: "new",
    market: "PL",
    monthlyRate: 200,
    updatedAt: "2024-01-02T00:00:00Z",
    permissions: { canEdit: true },
  },
];

function renderTable() {
  return render(
    <ApplicationsTable columns={columns} rows={rows} globalFilter="" columnFilters={[]} onAction={vi.fn()} />
  );
}

describe("ApplicationsTable", () => {
  it("sorts rows ascending when a sortable header is clicked", async () => {
    renderTable();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /klient/i }));
    const dataRows = screen.getAllByRole("row").slice(1);
    expect(within(dataRows[0]).getByText("Anna")).toBeInTheDocument();
  });

  it("renders a disabled action as non-interactive for a row without permission", () => {
    renderTable();
    const dataRows = screen.getAllByRole("row").slice(1);
    const zoeRow = dataRows[0];
    const annaRow = dataRows[1];
    expect(within(zoeRow).getByText("—")).toBeInTheDocument();
    expect(within(zoeRow).queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(within(annaRow).getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/components/ApplicationsTable.test.tsx`
Expected: FAIL with "Cannot find module './ApplicationsTable'".

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/ApplicationsTable.tsx
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import type { ApplicationRow, ColumnMeta } from "../types";
import { buildColumnDefs } from "../table/columns";

export interface ApplicationsTableProps {
  columns: ColumnMeta[];
  rows: ApplicationRow[];
  globalFilter: string;
  columnFilters: ColumnFiltersState;
  onAction: (actionName: string, row: ApplicationRow) => void;
}

export function ApplicationsTable({ columns, rows, globalFilter, columnFilters, onAction }: ApplicationsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const columnDefs = buildColumnDefs(columns, onAction);
  const searchableKeys = columns.filter((c) => c.filterable && c.type === "text").map((c) => c.key);

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue: string) => {
      if (!filterValue) return true;
      const needle = filterValue.toLowerCase();
      return searchableKeys.some((key) =>
        String(row.original[key as keyof ApplicationRow] ?? "").toLowerCase().includes(needle)
      );
    },
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {header.column.getCanSort() ? (
                  <button type="button" onClick={header.column.getToggleSortingHandler()}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" && " ▲"}
                    {header.column.getIsSorted() === "desc" && " ▼"}
                  </button>
                ) : (
                  flexRender(header.column.columnDef.header, header.getContext())
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/components/ApplicationsTable.test.tsx`
Expected: PASS — 2 tests passed.

- [ ] **Step 5: Run the typecheck**

Run: `npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ApplicationsTable.tsx src/components/ApplicationsTable.test.tsx
git commit -m "Add ApplicationsTable component with sorting and filtering"
```

---

### Task 7: Toolbar, App wiring, and request states

**Files:**
- Create: `src/components/Toolbar.tsx`
- Modify: `src/App.tsx` (replace template contents entirely)
- Test: `src/App.test.tsx`
- Delete: `src/smoke.test.tsx` (superseded by `App.test.tsx`, which exercises the same RTL/jsdom toolchain guarantee)

**Interfaces:**
- Consumes: `LoadMode`, `ApplicationRow`, `ColumnMeta` from `./types`; `fetchApplications`, `ApplicationsPayload` from `./api/applicationsAdapter`; `ApplicationsTable` from `./components/ApplicationsTable`.
- Produces:
  - `interface ToolbarProps { statusColumn?: ColumnMeta; searchValue: string; onSearchChange: (v: string) => void; statusValue: string; onStatusChange: (v: string) => void; loadMode: LoadMode; onLoadModeChange: (m: LoadMode) => void; }`
  - `function Toolbar(props: ToolbarProps): JSX.Element`
  - `function App(): JSX.Element`

- [ ] **Step 1: Write the failing test**

```tsx
// src/App.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import * as adapter from "./api/applicationsAdapter";

describe("App", () => {
  it("shows an error message when loading fails", async () => {
    vi.spyOn(adapter, "fetchApplications").mockRejectedValueOnce(new Error("network down"));
    render(<App />);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("network down"));
  });

  it("shows an empty message when there are no rows", async () => {
    vi.spyOn(adapter, "fetchApplications").mockResolvedValueOnce({ columns: [], rows: [] });
    render(<App />);
    await waitFor(() => expect(screen.getByText(/brak wniosków/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/App.test.tsx`
Expected: FAIL — the template's default `App` renders the Vite counter demo, not an alert or "brak wniosków" text.

- [ ] **Step 3: Write the Toolbar component**

```tsx
// src/components/Toolbar.tsx
import type { ColumnMeta, LoadMode } from "../types";

export interface ToolbarProps {
  statusColumn?: ColumnMeta;
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
  loadMode: LoadMode;
  onLoadModeChange: (mode: LoadMode) => void;
}

const LOAD_MODES: LoadMode[] = ["success", "empty", "error"];

export function Toolbar({
  statusColumn,
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  loadMode,
  onLoadModeChange,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <input
        type="text"
        placeholder="Szukaj..."
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      {statusColumn?.options && (
        <select value={statusValue} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="">Wszystkie statusy</option>
          {statusColumn.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
      <div className="load-mode-control">
        {LOAD_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={loadMode === mode}
            onClick={() => onLoadModeChange(mode)}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Replace App.tsx entirely**

```tsx
// src/App.tsx
import { useEffect, useState } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { fetchApplications, type ApplicationsPayload } from "./api/applicationsAdapter";
import type { ApplicationRow, LoadMode } from "./types";
import { ApplicationsTable } from "./components/ApplicationsTable";
import { Toolbar } from "./components/Toolbar";

type RequestState =
  | { status: "loading" }
  | { status: "success"; data: ApplicationsPayload }
  | { status: "error"; message: string };

export function App() {
  const [loadMode, setLoadMode] = useState<LoadMode>("success");
  const [requestState, setRequestState] = useState<RequestState>({ status: "loading" });
  const [searchValue, setSearchValue] = useState("");
  const [statusValue, setStatusValue] = useState("");

  useEffect(() => {
    let cancelled = false;
    setRequestState({ status: "loading" });
    fetchApplications(loadMode)
      .then((data) => {
        if (!cancelled) setRequestState({ status: "success", data });
      })
      .catch((error: Error) => {
        if (!cancelled) setRequestState({ status: "error", message: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, [loadMode]);

  function handleAction(actionName: string, row: ApplicationRow) {
    window.alert(`Akcja "${actionName}" dla wniosku ${row.loanId} (nieobsłużona w tym MVP)`);
  }

  const statusColumn =
    requestState.status === "success" ? requestState.data.columns.find((c) => c.key === "status") : undefined;

  const columnFilters: ColumnFiltersState =
    statusColumn && statusValue ? [{ id: statusColumn.key, value: statusValue }] : [];

  return (
    <main>
      <h1>Panel wniosków</h1>
      <Toolbar
        statusColumn={statusColumn}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusValue={statusValue}
        onStatusChange={setStatusValue}
        loadMode={loadMode}
        onLoadModeChange={setLoadMode}
      />
      {requestState.status === "loading" && <p role="status">Ładowanie…</p>}
      {requestState.status === "error" && <p role="alert">Błąd: {requestState.message}</p>}
      {requestState.status === "success" && requestState.data.rows.length === 0 && (
        <p>Brak wniosków do wyświetlenia.</p>
      )}
      {requestState.status === "success" && requestState.data.rows.length > 0 && (
        <ApplicationsTable
          columns={requestState.data.columns}
          rows={requestState.data.rows}
          globalFilter={searchValue}
          columnFilters={columnFilters}
          onAction={handleAction}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 5: Update main.tsx to use the named `App` export**

```tsx
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 6: Delete the superseded smoke test**

```bash
rm -f src/smoke.test.tsx
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test`
Expected: PASS — all tests across all files pass.

- [ ] **Step 8: Run the typecheck**

Run: `npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Wire Toolbar and App to adapter with loading/empty/error states"
```

---

### Task 8: Styling pass

**Files:**
- Modify: `src/index.css` (replace template contents entirely)

**Interfaces:**
- Consumes: class names already emitted by `ApplicationsTable`, `Toolbar`, `cellRenderers` (`action-enabled`, `action-disabled`, `badge`, `badge-<status>`, `toolbar`, `load-mode-control`).
- Produces: nothing new — purely visual.

- [ ] **Step 1: Replace index.css with minimal, proportional styling**

```css
/* src/index.css */
body {
  font-family: system-ui, sans-serif;
  margin: 2rem;
  color: #1a1a1a;
}

table {
  border-collapse: collapse;
  width: 100%;
}

th,
td {
  border: 1px solid #ddd;
  padding: 0.5rem 0.75rem;
  text-align: left;
}

th button {
  background: none;
  border: none;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.toolbar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  align-items: center;
}

.badge {
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.85rem;
  text-transform: capitalize;
}

.badge-new {
  background: #e0e7ff;
  color: #3730a3;
}

.badge-in_review {
  background: #fef3c7;
  color: #92400e;
}

.badge-approved {
  background: #dcfce7;
  color: #166534;
}

.badge-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.action-enabled {
  cursor: pointer;
}

.action-disabled {
  color: #9ca3af;
}

.load-mode-control button[aria-pressed="true"] {
  font-weight: 700;
  text-decoration: underline;
}
```

- [ ] **Step 2: Manually verify in the browser**

Run: `npm run dev`
Open the served URL and confirm: status badges are colored, disabled actions look muted (not clickable-looking), and the load-mode buttons visually indicate the active mode.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "Style table, badges, and toolbar controls"
```

---

### Task 9: README and final verification

**Files:**
- Create: `README.md` (project root — replace the existing template `README.md` describing `ai-boilerplate`, since the repo now hosts the actual application)

**Interfaces:**
- Consumes: nothing (documentation only).
- Produces: nothing (documentation only).

- [ ] **Step 1: Write README.md**

```markdown
# Panel wniosków — tabela sterowana metadanymi

## Uruchomienie

\`\`\`bash
npm install
npm run dev
\`\`\`

Skrypty:
- `npm run dev` — serwer deweloperski
- `npm run typecheck` — sprawdzenie typów (`tsc -b`)
- `npm run test` — testy jednostkowe i komponentowe (Vitest + React Testing Library)

## Model metadanych

Kolumny (`data/columns.json`) opisują `key`, `label`, `type`
(`text | badge | currency | date | action`), `sortable`, `filterable`,
opcjonalnie `options` (np. lista statusów) i `action` (nazwa akcji wiersza).
Kolejność w tablicy JSON wyznacza kolejność kolumn; opcjonalne pola `order`
i `visible` (domyślnie `true`) pozwalają nadpisać kolejność/widoczność bez
zmiany kodu, gdyby metadane w przyszłości je zawierały.

**Założenie dot. kształtu danych:** kolumna `canEdit` ma `type: "action"`,
ale wiersze przechowują tę flagę zagnieżdżoną w `row.permissions.canEdit`,
a nie na najwyższym poziomie. Przyjęta konwencja: dla kolumn typu `action`
dostępność akcji jest odczytywana z `row.permissions[column.key]` — patrz
`src/table/actionAvailability.ts`.

## Decyzje techniczne

- **TanStack Table (headless)** do modelu kolumn/sortowania/filtrowania —
  biblioteka bez narzuconego UI, więc cała warstwa wizualna pozostaje
  w naszej gestii i proporcjonalna do zakresu zadania.
- Brak frameworka CSS — zwykły CSS, bo zakres wizualny jest mały.
- Brak realnego backendu — `src/api/applicationsAdapter.ts` symuluje
  żądanie (opóźnienie + tryb `success | empty | error` sterowany
  przełącznikiem w toolbarze), żeby stany `loading/success/empty/error`
  były deterministyczne i łatwe do przetestowania.

## Zasady programowania

- **Open/Closed Principle** — dodanie nowego typu wartości kolumny wymaga
  tylko nowego wpisu w rejestrze `src/table/cellRenderers.tsx`, bez zmian
  w `ApplicationsTable` czy `columns.ts`:

  \`\`\`ts
  switch (column.type) {
    case "date":
      return renderDate(row, column);
    // nowy typ -> nowy case, reszta bez zmian
  }
  \`\`\`

- **Obrona przed brakującymi danymi (defensive design)** — komparatory
  sortowania (`src/table/sorting.ts`) zawsze umieszczają `null`/`undefined`
  na końcu, niezależnie od kierunku sortowania, mimo że bieżące dane
  (`data/rows.json`) nie zawierają braków — bo metadane, nie stan
  bieżących danych, są źródłem prawdy o kontrakcie:

  \`\`\`ts
  function compareWithNullsLast<T>(a: T | null | undefined, b: T | null | undefined, compare: (a: T, b: T) => number) {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    return compare(a, b);
  }
  \`\`\`

## Co zrobił(a)bym dalej przy dodatkowych 60-90 minutach

- Prawdziwy formularz edycji za akcją `edit` (obecnie zaślepka `window.alert`).
- Paginacja lub wirtualizacja wierszy — obecnie renderujemy wszystkie 1200
  wierszy naraz, co działa, ale nie skaluje się do dziesiątek tysięcy.
- Debounce pola wyszukiwania tekstowego.
- Test integracyjny E2E (np. Playwright) pokrywający pełny przepływ
  filtrowania + sortowania + akcji na żywej stronie.
- Więcej testów brzegowych dla `columns.ts` (np. kolumna bez `options`
  przy próbie filtrowania).
```

- [ ] **Step 2: Run the full verification suite**

Run: `npm run typecheck`
Expected: exits 0, no errors.

Run: `npm run test`
Expected: all tests pass.

Run: `npm run dev`, open the app, and manually confirm: table renders from metadata, sorting works on text/date/currency columns, status filter and text search work, disabled actions are non-interactive, and each of the Success/Empty/Error toolbar buttons shows the corresponding UI state.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Write README with run instructions, assumptions, and decisions"
```
