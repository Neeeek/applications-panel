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
