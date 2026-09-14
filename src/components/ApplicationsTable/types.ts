import type { ColumnFiltersState } from "@tanstack/react-table";
import type { ApplicationRow, ColumnMeta } from "../../types";

export interface ApplicationsTableProps {
  columns: ColumnMeta[];
  rows: ApplicationRow[];
  globalFilter: string;
  columnFilters: ColumnFiltersState;
  onAction: (actionName: string, row: ApplicationRow) => void;
}
