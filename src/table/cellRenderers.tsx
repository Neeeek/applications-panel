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
