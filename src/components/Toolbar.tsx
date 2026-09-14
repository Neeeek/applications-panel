import type { ColumnMeta, LoadMode } from "../types";

export interface ToolbarProps {
  statusColumn?: ColumnMeta;
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
  loadMode: LoadMode;
  onLoadModeChange: (mode: LoadMode) => void;
}

const LOAD_MODES: LoadMode[] = ["success", "empty", "error"];

export function Toolbar({
  statusColumn,
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  loadMode,
  onLoadModeChange,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <input
        type="text"
        placeholder="Szukaj..."
        aria-label="Szukaj"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      {statusColumn?.options && (
        <select
          aria-label="Status"
          value={statusValue}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="">Wszystkie statusy</option>
          {statusColumn.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
      <div className="load-mode-control">
        {LOAD_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={loadMode === mode}
            onClick={() => onLoadModeChange(mode)}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}
