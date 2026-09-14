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
