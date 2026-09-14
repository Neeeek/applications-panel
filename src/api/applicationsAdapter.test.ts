import { describe, expect, it } from "vitest";
import { fetchApplications } from "./applicationsAdapter";

describe("fetchApplications", () => {
  it("resolves rows and columns in success mode", async () => {
    const result = await fetchApplications("success");
    expect(result.columns.length).toBeGreaterThan(0);
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("resolves an empty row list in empty mode", async () => {
    const result = await fetchApplications("empty");
    expect(result.rows).toEqual([]);
    expect(result.columns.length).toBeGreaterThan(0);
  });

  it("rejects in error mode", async () => {
    await expect(fetchApplications("error")).rejects.toThrow("Failed to load applications");
  });
});
