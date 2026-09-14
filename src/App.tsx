import { useEffect, useState } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { fetchApplications, type ApplicationsPayload } from "./api/applicationsAdapter";
import type { ApplicationRow, LoadMode } from "./types";
import { ApplicationsTable } from "./components/ApplicationsTable";
import { Toolbar } from "./components/Toolbar";

type RequestState =
  | { status: "loading" }
  | { status: "success"; data: ApplicationsPayload }
  | { status: "error"; message: string };

export function App() {
  const [loadMode, setLoadMode] = useState<LoadMode>("success");
  const [requestState, setRequestState] = useState<RequestState>({ status: "loading" });
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("");

  useEffect(() => {
    let cancelled = false;
    setRequestState({ status: "loading" });
    fetchApplications(loadMode)
      .then((data) => {
        if (!cancelled) setRequestState({ status: "success", data });
      })
      .catch((error: Error) => {
        if (!cancelled) setRequestState({ status: "error", message: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, [loadMode]);

  function handleAction(actionName: string, row: ApplicationRow) {
    window.alert(`Akcja "${actionName}" dla wniosku ${row.loanId} (nieobsłużona w tym MVP)`);
  }

  const filterColumn =
    requestState.status === "success"
      ? requestState.data.columns.find((c) => c.filterable && c.options)
      : undefined;

  const columnFilters: ColumnFiltersState =
    filterColumn && filterValue ? [{ id: filterColumn.key, value: filterValue }] : [];

  return (
    <main>
      <h1>Panel wniosków</h1>
      <Toolbar
        filterColumn={filterColumn}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        loadMode={loadMode}
        onLoadModeChange={setLoadMode}
      />
      {requestState.status === "loading" && <p role="status">Ładowanie…</p>}
      {requestState.status === "error" && <p role="alert">Błąd: {requestState.message}</p>}
      {requestState.status === "success" && requestState.data.rows.length === 0 && (
        <p>Brak wniosków do wyświetlenia.</p>
      )}
      {requestState.status === "success" && requestState.data.rows.length > 0 && (
        <ApplicationsTable
          columns={requestState.data.columns}
          rows={requestState.data.rows}
          globalFilter={searchValue}
          columnFilters={columnFilters}
          onAction={handleAction}
        />
      )}
    </main>
  );
}
