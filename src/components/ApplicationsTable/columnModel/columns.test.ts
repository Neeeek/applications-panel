import { describe, expect, it } from "vitest";
import { visibleColumnsInOrder } from "./columns";
import type { ColumnMeta } from "../../../types";

const base: Omit<ColumnMeta, "key" | "label"> = {
  type: "text",
  sortable: true,
  filterable: true,
};

describe("visibleColumnsInOrder", () => {
  it("preserves array order when no explicit order is given", () => {
    const columns: ColumnMeta[] = [
      { ...base, key: "a", label: "A" },
      { ...base, key: "b", label: "B" },
    ];
    expect(visibleColumnsInOrder(columns).map((c) => c.key)).toEqual(["a", "b"]);
  });

  it("respects an explicit order field over array position", () => {
    const columns: ColumnMeta[] = [
      { ...base, key: "a", label: "A", order: 2 },
      { ...base, key: "b", label: "B", order: 1 },
    ];
    expect(visibleColumnsInOrder(columns).map((c) => c.key)).toEqual(["b", "a"]);
  });

  it("excludes columns marked visible: false", () => {
    const columns: ColumnMeta[] = [
      { ...base, key: "a", label: "A" },
      { ...base, key: "b", label: "B", visible: false },
    ];
    expect(visibleColumnsInOrder(columns).map((c) => c.key)).toEqual(["a"]);
  });
});
