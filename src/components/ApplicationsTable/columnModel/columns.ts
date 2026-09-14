import type { CellContext, ColumnDef, FilterFn, SortingFn } from "@tanstack/react-table";
import type { ApplicationRow, ColumnMeta } from "../../../types";
import { compareDate, compareNumber, compareText } from "./sorting";
import { renderCell } from "./cellRenderers";

function sortingFnFor(type: ColumnMeta["type"]): SortingFn<ApplicationRow> {
  if (type === "currency") {
    return (rowA, rowB, columnId) =>
      compareNumber(rowA.getValue<number | null>(columnId), rowB.getValue<number | null>(columnId));
  }
  if (type === "date") {
    return (rowA, rowB, columnId) =>
      compareDate(rowA.getValue<string | null>(columnId), rowB.getValue<string | null>(columnId));
  }
  return (rowA, rowB, columnId) =>
    compareText(
      rowA.getValue<string | null | undefined>(columnId),
      rowB.getValue<string | null | undefined>(columnId)
    );
}

function filterFnFor(column: ColumnMeta): FilterFn<ApplicationRow> | undefined {
  if (!column.options) return undefined;
  return (row, columnId, filterValue: string) => !filterValue || row.getValue(columnId) === filterValue;
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
    accessorFn: (row) => row[column.key as keyof ApplicationRow] ?? undefined,
    header: column.label,
    enableSorting: column.sortable,
    enableColumnFilter: column.filterable,
    sortingFn: sortingFnFor(column.type),
    sortUndefined: "last" as const,
    sortDescFirst: false,
    filterFn: filterFnFor(column),
    cell: (context: CellContext<ApplicationRow, unknown>) =>
      renderCell({ row: context.row.original, column, onAction }),
  }));
}
