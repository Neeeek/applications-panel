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
