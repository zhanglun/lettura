import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
  NavLink: ({
    children,
  }: {
    children: React.ReactNode;
    className: string | ((args: { isActive: boolean }) => string);
  }) => <a href="#">{children}</a>,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

const mockStore = {
  sidebarCollapsed: false,
  globalSyncStatus: false,
  getSubscribes: vi.fn(),
  updateSettingDialogStatus: vi.fn(),
};

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

vi.mock("react-dnd", () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("react-dnd-html5-backend", () => ({
  HTML5Backend: {},
}));

vi.mock("../../Subscribes", () => ({
  ChannelList: () => <div data-testid="channel-list" />,
}));

vi.mock("@/components/AddFeed", () => ({
  AddFeedChannel: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/components/AddFolder", () => ({
  AddFolder: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));

vi.mock("@/hooks/useRefresh", () => ({
  useRefresh: () => ({ startRefresh: vi.fn() }),
}));

vi.mock("@/config", () => ({
  RouteConfig: {
    SEARCH: "/search",
  },
}));

vi.mock("@radix-ui/themes", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  IconButton: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

import { AppLayout } from "../AppLayout";

describe("F7: Integration — layout renders children without crashing", () => {
  it("renders AppLayout with mock children without errors", () => {
    render(
      <AppLayout>
        <div data-testid="child-content">Child Content</div>
      </AppLayout>,
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("renders AppLayout structure with all columns", () => {
    const { container } = render(
      <AppLayout>
        <span>Test</span>
      </AppLayout>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("flex");
  });
});
