import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "../Sidebar";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      getSubscribes: vi.fn(),
      globalSyncStatus: false,
      topics: [],
      followingTopicIds: new Set(),
      filterMode: "all",
      setFilterMode: vi.fn(),
    }),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

vi.mock("../SidebarToday", () => ({
  SidebarToday: () => <div data-testid="sidebar-today">Today Sidebar</div>,
}));

vi.mock("../SidebarTopics", () => ({
  SidebarTopics: () => <div data-testid="sidebar-topics">Topics Sidebar</div>,
}));

vi.mock("../SidebarFeeds", () => ({
  SidebarFeeds: () => <div data-testid="sidebar-feeds">Feeds Sidebar</div>,
}));

vi.mock("@/components/AddFeed", () => ({
  AddFeedChannel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/AddFolder", () => ({
  AddFolder: ({ trigger }: { trigger: React.ReactNode }) => <div>{trigger}</div>,
}));

vi.mock("@/hooks/useRefresh", () => ({
  useRefresh: () => ({ startRefresh: vi.fn() }),
}));

vi.mock("react-dnd", () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("react-dnd-html5-backend", () => ({
  HTML5Backend: {},
}));

vi.mock("@/components/Subscribes", () => ({
  ChannelList: () => <div data-testid="channel-list">Channels</div>,
}));

vi.mock("@radix-ui/themes", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IconButton: ({
    children,
    onClick,
    ...rest
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => <button onClick={onClick}>{children}</button>,
}));

describe("Sidebar context switching", () => {
  it("should render SidebarToday when context is 'today'", () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} context="today" />);
    expect(screen.getByTestId("sidebar-today")).toBeInTheDocument();
  });

  it("should render SidebarTopics when context is 'topics'", () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} context="topics" />);
    expect(screen.getByTestId("sidebar-topics")).toBeInTheDocument();
  });

  it("should render SidebarFeeds when context is 'feeds'", () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} context="feeds" />);
    expect(screen.getByTestId("sidebar-feeds")).toBeInTheDocument();
  });

  it("should return null when collapsed", () => {
    const { container } = render(
      <Sidebar collapsed={true} onToggle={vi.fn()} context="today" />,
    );
    expect(container.innerHTML).toBe("");
  });
});
