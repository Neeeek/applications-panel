import { describe, expect, it } from "vitest";
import { compareDate, compareNumber, compareText } from "./sorting";

describe("compareNumber", () => {
  it("sorts ascending numerically", () => {
    expect(compareNumber(1, 2)).toBeLessThan(0);
  });

  it("always sorts missing values last, regardless of comparison direction", () => {
    const values = [5, null, 1, undefined, 3];
    const sorted = [...values].sort(compareNumber);
    expect(sorted).toEqual([1, 3, 5, null, undefined]);
  });
});

describe("compareText", () => {
  it("sorts missing values last", () => {
    const values = ["banana", null, "apple"];
    const sorted = [...values].sort(compareText);
    expect(sorted).toEqual(["apple", "banana", null]);
  });
});

describe("compareDate", () => {
  it("sorts missing values last", () => {
    const values = ["2024-02-01", null, "2024-01-01"];
    const sorted = [...values].sort(compareDate);
    expect(sorted).toEqual(["2024-01-01", "2024-02-01", null]);
  });
});
