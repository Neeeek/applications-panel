import type { ApplicationRow } from "../types";

export function isActionAvailable(row: ApplicationRow, columnKey: string): boolean {
  return row.permissions?.[columnKey] === true;
}
