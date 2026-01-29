import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

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
