import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector(mockStore),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (s: () => unknown) => s,
}));

vi.mock("../Rail", () => ({
  Rail: () => <div data-testid="rail">Rail</div>,
}));

vi.mock("../Sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock("../Main", () => ({
  Main: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main">{children}</div>
  ),
}));

const mockStore = {
  sidebarCollapsed: false,
  globalSyncStatus: false,
  getSubscribes: vi.fn(),
  updateSettingDialogStatus: vi.fn(),
};

import { AppLayout } from "../AppLayout";

describe("F1: AppLayout", () => {
  it("renders all three columns: Rail, Sidebar, Main", () => {
    render(
      <AppLayout>
        <div data-testid="outlet-content">Content</div>
      </AppLayout>,
    );

    expect(screen.getByTestId("rail")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("main")).toBeInTheDocument();
  });

  it("renders children inside Main", () => {
    render(
      <AppLayout>
        <div data-testid="outlet-content">Content</div>
      </AppLayout>,
    );

    expect(screen.getByTestId("outlet-content")).toBeInTheDocument();
  });

  it("wraps everything in a flex row container", () => {
    const { container } = render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("flex");
    expect(wrapper?.className).toContain("flex-row");
  });
});
