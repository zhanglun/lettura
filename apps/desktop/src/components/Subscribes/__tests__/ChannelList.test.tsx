import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ChannelList } from "../index";

const navigateMock = vi.fn();
const getSubscribesMock = vi.fn();
const setFeedContextMenuStatusMock = vi.fn();
const setFeedContextMenuTargetMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
  useMatch: () => null,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@radix-ui/themes", () => ({
  ContextMenu: {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Trigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Item: ({ children, onClick, onSelect }: any) => (
      <button type="button" onClick={onClick || onSelect}>
        {children}
      </button>
    ),
    Separator: () => <hr />,
  },
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock("@/helpers/busChannel", () => ({
  busChannel: {
    on: vi.fn(() => vi.fn()),
  },
}));

vi.mock("@/hooks/useScrollTop", () => ({
  useScrollTop: () => [0, {}],
}));

vi.mock("@/helpers/parseXML", () => ({
  useQuery: () => [undefined, undefined, undefined],
}));

vi.mock("../ListContainer", () => ({
  ListContainer: () => <div data-testid="feed-tree">Feed tree</div>,
}));

vi.mock("@/layout/Setting/Content/DialogUnsubscribeFeed", () => ({
  DialogUnsubscribeFeed: () => <div data-testid="unsubscribe-dialog" />,
}));

vi.mock("@/layout/Setting/Content/DialogDeleteFolder", () => ({
  DialogDeleteFolder: () => <div data-testid="delete-folder-dialog" />,
}));

vi.mock("@/layout/Setting/Content/DialogEditFeed", () => ({
  DialogEditFeed: () => <div data-testid="edit-feed-dialog" />,
}));

vi.mock("@/components/AddFolder", () => ({
  AddFolder: () => <div data-testid="edit-folder-dialog" />,
}));

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: any) => unknown) =>
    selector({
      feed: null,
      setFeed: vi.fn(),
      updateFeed: vi.fn(),
      feedContextMenuTarget: null,
      setFeedContextMenuTarget: setFeedContextMenuTargetMock,
      setFeedContextMenuStatus: setFeedContextMenuStatusMock,
      articleList: [],
      setArticleList: vi.fn(),
      syncArticles: vi.fn(),
      subscribes: [],
      getSubscribes: getSubscribesMock,
    }),
}));

describe("ChannelList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes feed management to Settings subscriptions", () => {
    render(<ChannelList />);

    fireEvent.click(screen.getByRole("button", { name: /layout\.sidebar\.manage/ }));

    expect(navigateMock).toHaveBeenCalledWith("/settings?tab=subscriptions");
  });

  it("does not render feed management dialogs in the reading sidebar", () => {
    render(<ChannelList />);

    expect(screen.getByTestId("feed-tree")).toBeInTheDocument();
    expect(screen.queryByTestId("unsubscribe-dialog")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-folder-dialog")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-feed-dialog")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-folder-dialog")).not.toBeInTheDocument();
  });
});
