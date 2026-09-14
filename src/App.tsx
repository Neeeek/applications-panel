import { useState } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import type { ApplicationRow, LoadMode } from "./types";
import { ApplicationsTable } from "./components/ApplicationsTable";
import { Toolbar } from "./components/Toolbar";
import { useApplications } from "./hooks/useApplications";
import { useDebouncedValue } from "./hooks/useDebouncedValue";

const SEARCH_DEBOUNCE_MS = 300;

export function App() {
  const [loadMode, setLoadMode] = useState<LoadMode>("success");
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const requestState = useApplications(loadMode);
  const debouncedSearchValue = useDebouncedValue(searchValue, SEARCH_DEBOUNCE_MS);

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
    <main className="p-8 font-sans text-gray-900">
      <h1 className="text-2xl font-bold mb-4">Panel wniosków</h1>
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
          globalFilter={debouncedSearchValue}
          columnFilters={columnFilters}
          onAction={handleAction}
        />
      )}
    </main>
  );
}
