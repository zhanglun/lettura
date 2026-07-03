import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppLayout } from "../AppLayout";

vi.mock("../Rail", () => ({
  Rail: () => <div data-testid="rail" />,
}));

vi.mock("../Sidebar", () => ({
  Sidebar: ({ context }: { context: string }) => (
    <div data-testid="sidebar-context">{context}</div>
  ),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    Outlet: () => <main data-testid="outlet" />,
  };
});

describe("AppLayout", () => {
  it("uses the reading feeds sidebar on the base feeds route", () => {
    render(
      <MemoryRouter initialEntries={["/local/feeds"]}>
        <AppLayout />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("sidebar-context").textContent).toBe("feeds");
  });
});
