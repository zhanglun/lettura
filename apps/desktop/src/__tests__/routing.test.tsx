import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { RouteConfig } from "@/config";

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe("C3: Default route", () => {
  it("should redirect / to /local/today", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Navigate to={RouteConfig.LOCAL_TODAY} replace />} />
          <Route path="/local/today" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/local/today");
    });
  });

  it("RouteConfig.LOCAL_TODAY should be /local/today", () => {
    expect(RouteConfig.LOCAL_TODAY).toBe("/local/today");
  });
});
