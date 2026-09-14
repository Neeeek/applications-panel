import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { fetchApplications } from "./api/applicationsAdapter";

vi.mock("./api/applicationsAdapter");

const mockedFetchApplications = vi.mocked(fetchApplications);

describe("App", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows an error message when loading fails", async () => {
    mockedFetchApplications.mockRejectedValueOnce(new Error("network down"));
    render(<App />);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("network down"));
  });

  it("shows an empty message when there are no rows", async () => {
    mockedFetchApplications.mockResolvedValueOnce({ columns: [], rows: [] });
    render(<App />);
    await waitFor(() => expect(screen.getByText(/brak wniosków/i)).toBeInTheDocument());
  });
});
