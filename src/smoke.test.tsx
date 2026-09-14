import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function Hello() {
  return <p>hello vitest</p>;
}

describe("toolchain smoke test", () => {
  it("renders a component with React Testing Library", () => {
    render(<Hello />);
    expect(screen.getByText("hello vitest")).toBeInTheDocument();
  });
});
