import { describe, expect, it } from "vitest";
import { isActionAvailable } from "./actionAvailability";
import type { ApplicationRow } from "../../../types";

const baseRow: ApplicationRow = {
  loanId: "LN-1",
  customerName: "Test",
  status: "new",
  market: "PL",
  monthlyRate: 100,
  updatedAt: "2024-01-01T00:00:00Z",
  permissions: { canEdit: true },
};

describe("isActionAvailable", () => {
  it("returns true when the permission flag is true", () => {
    expect(isActionAvailable(baseRow, "canEdit")).toBe(true);
  });

  it("returns false when the permission flag is false", () => {
    expect(isActionAvailable({ ...baseRow, permissions: { canEdit: false } }, "canEdit")).toBe(false);
  });

  it("returns false when the permission key is missing", () => {
    expect(isActionAvailable({ ...baseRow, permissions: {} }, "canEdit")).toBe(false);
  });
});
