import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import type { ApplicationRow } from "../../types";
import { buildColumnDefs, visibleColumnsInOrder } from "./columnModel";
import type { ApplicationsTableProps } from "./types";

export function ApplicationsTable({ columns, rows, globalFilter, columnFilters, onAction }: ApplicationsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const columnDefs = buildColumnDefs(columns, onAction);
  const searchableKeys = visibleColumnsInOrder(columns)
    .filter((c) => c.filterable && c.type === "text")
    .map((c) => c.key);

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
    <table className="w-full border-collapse">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id} className="border border-gray-300 p-2 text-left">
                {header.column.getCanSort() ? (
                  <button type="button" className="font-semibold cursor-pointer" onClick={header.column.getToggleSortingHandler()}>
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
              <td key={cell.id} className="border border-gray-300 p-2 text-left">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
