import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Example test suite", () => {
  it("should pass a simple assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("should render a simple React component", () => {
    const TestComponent = () => <div>Hello, World!</div>;
    render(<TestComponent />);
    expect(screen.getByText("Hello, World!")).toBeInTheDocument();
  });
});
