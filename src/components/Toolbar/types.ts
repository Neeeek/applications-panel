import type { ColumnMeta, LoadMode } from "../../types";

export interface ToolbarProps {
  filterColumn?: ColumnMeta;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterValue: string;
  onFilterChange: (value: string) => void;
  loadMode: LoadMode;
  onLoadModeChange: (mode: LoadMode) => void;
}
