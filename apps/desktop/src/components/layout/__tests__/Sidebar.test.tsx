import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
  NavLink: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className: string | ((args: { isActive: boolean }) => string);
  }) => (
    <a href="#" className={typeof className === "function" ? className({ isActive: false }) : className}>
      {children}
    </a>
  ),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("react-dnd", () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dnd-provider">{children}</div>
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
    <div data-testid="add-feed-channel">{children}</div>
  ),
}));

vi.mock("@/components/AddFolder", () => ({
  AddFolder: ({ trigger }: { trigger: React.ReactNode }) => (
    <div data-testid="add-folder">{trigger}</div>
  ),
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

const mockStore: Record<string, unknown> = {
  sidebarCollapsed: false,
  globalSyncStatus: false,
  getSubscribes: vi.fn(),
};

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector(mockStore),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (s: () => unknown) => s,
}));

import { Sidebar } from "../Sidebar";

describe("F4: Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.sidebarCollapsed = false;
  });

  it("has width w-60 when expanded", () => {
    mockStore.sidebarCollapsed = false;

    const { container } = render(<Sidebar />);
    const sidebar = container.firstElementChild;

    expect(sidebar?.className).toContain("w-60");
    expect(sidebar?.className).not.toContain("w-0");
  });

  it("has width w-0 when collapsed", () => {
    mockStore.sidebarCollapsed = true;

    const { container } = render(<Sidebar />);
    const sidebar = container.firstElementChild;

    expect(sidebar?.className).toContain("w-0");
    expect(sidebar?.className).not.toContain("w-60");
  });

  it("renders ChannelList", () => {
    render(<Sidebar />);

    expect(screen.getByTestId("channel-list")).toBeInTheDocument();
  });

  it("renders action buttons: Search, Add Subscribe, Add Folder, Refresh", () => {
    render(<Sidebar />);

    expect(screen.getByTestId("add-feed-channel")).toBeInTheDocument();
    expect(screen.getByTestId("add-folder")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
  });
});
