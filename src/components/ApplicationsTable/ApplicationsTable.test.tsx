import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApplicationsTable } from "./ApplicationsTable";
import type { ApplicationRow, ColumnMeta } from "../../types";

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

  it("keeps a null-bearing row last on both ascending and descending clicks", async () => {
    const numericColumns: ColumnMeta[] = [
      { key: "customerName", label: "Klient", type: "text", sortable: true, filterable: true },
      { key: "monthlyRate", label: "Rata", type: "currency", sortable: true, filterable: false },
    ];
    const numericRows: ApplicationRow[] = [
      {
        loanId: "LN-1",
        customerName: "Zoe",
        status: "new",
        market: "PL",
        monthlyRate: 100,
        updatedAt: "2024-01-01T00:00:00Z",
        permissions: {},
      },
      {
        loanId: "LN-2",
        customerName: "Anna",
        status: "new",
        market: "PL",
        monthlyRate: null,
        updatedAt: "2024-01-02T00:00:00Z",
        permissions: {},
      },
      {
        loanId: "LN-3",
        customerName: "Marek",
        status: "new",
        market: "PL",
        monthlyRate: 50,
        updatedAt: "2024-01-03T00:00:00Z",
        permissions: {},
      },
    ];

    render(
      <ApplicationsTable
        columns={numericColumns}
        rows={numericRows}
        globalFilter=""
        columnFilters={[]}
        onAction={vi.fn()}
      />
    );
    const user = userEvent.setup();
    const header = screen.getByRole("button", { name: /rata/i });

    await user.click(header);
    let dataRows = screen.getAllByRole("row").slice(1);
    expect(within(dataRows[dataRows.length - 1]).getByText("Anna")).toBeInTheDocument();

    await user.click(header);
    dataRows = screen.getAllByRole("row").slice(1);
    expect(within(dataRows[dataRows.length - 1]).getByText("Anna")).toBeInTheDocument();
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
