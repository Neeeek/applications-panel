import { LOAD_MODES } from "./constants";
import type { ToolbarProps } from "./types";

export function Toolbar({
  filterColumn,
  searchValue,
  onSearchChange,
  filterValue,
  onFilterChange,
  loadMode,
  onLoadModeChange,
}: ToolbarProps) {
  return (
    <div className="flex gap-3 mb-4 items-center">
      <input
        type="text"
        placeholder="Szukaj..."
        aria-label="Szukaj"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      {filterColumn?.options && (
        <select
          aria-label="Status"
          value={filterValue}
          onChange={(event) => onFilterChange(event.target.value)}
        >
          <option value="">Wszystkie statusy</option>
          {filterColumn.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-1">
        {LOAD_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={loadMode === mode}
            className={loadMode === mode ? "font-bold underline" : undefined}
            onClick={() => onLoadModeChange(mode)}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}
