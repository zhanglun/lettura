import { describe, it, expect, vi, beforeEach } from "vitest";
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

const mockUpdateSettingDialogStatus = vi.fn();

const mockStore = {
  updateSettingDialogStatus: mockUpdateSettingDialogStatus,
};

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector(mockStore),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (s: () => unknown) => s,
}));

vi.mock("@/config", () => ({
  RouteConfig: {
    LOCAL_TODAY: "/local/today",
    LOCAL_TOPICS: "/local/topics",
    LOCAL_ALL: "/local/all",
    SEARCH: "/search",
    LOCAL_STARRED: "/local/starred",
  },
}));

vi.mock("../RailItem", () => ({
  RailItem: ({
    label,
  }: {
    icon: unknown;
    label: string;
    to?: string;
    onClick?: () => void;
  }) => <div data-testid="rail-item" data-label={label} />,
}));

import { Rail } from "../Rail";

describe("F2: Rail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 6 navigation items", () => {
    render(<Rail />);

    const items = screen.getAllByTestId("rail-item");
    expect(items).toHaveLength(6);
  });

  it("renders correct labels for all navigation items", () => {
    render(<Rail />);

    const items = screen.getAllByTestId("rail-item");
    const labels = items.map((item) => item.getAttribute("data-label"));

    expect(labels).toEqual([
      "nav.today",
      "nav.topics",
      "nav.feeds",
      "nav.search",
      "nav.starred",
      "nav.settings",
    ]);
  });

  it("renders the app logo letter", () => {
    render(<Rail />);

    expect(screen.getByText("L")).toBeInTheDocument();
  });
});
