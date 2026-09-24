import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { FeedsPage, FeedsBrowse } from "../index";

const mocks = vi.hoisted(() => ({
  articleView: vi.fn((_props: Record<string, unknown>) => (
    <div data-testid="article-view" />
  )),
  getSubscribes: vi.fn(),
  navigate: vi.fn(),
  setFeed: vi.fn(),
  setFilter: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useParams: () => ({ uuid: "feed-1" }),
  useNavigate: () => mocks.navigate,
}));

vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn(),
}));

vi.mock("@/layout/Article/ArticleView", () => ({
  ArticleView: mocks.articleView,
}));

const SUBSCRIBES = [
  {
    uuid: "feed-1",
    item_type: "channel",
    title: "Feed One",
    unread: 3,
    children: [],
    feed_url: "https://feed-one.example.com/rss",
    link: "https://feed-one.example.com",
  },
  {
    uuid: "feed-2",
    item_type: "channel",
    title: "Feed Two",
    unread: 0,
    children: [],
    feed_url: "https://feed-two.example.com/rss",
  },
];

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      subscribes: SUBSCRIBES,
      getSubscribes: mocks.getSubscribes,
      setFeed: mocks.setFeed,
      setFilter: mocks.setFilter,
    }),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

describe("FeedsPage", () => {
  beforeEach(() => {
    mocks.articleView.mockClear();
    mocks.getSubscribes.mockClear();
    mocks.navigate.mockClear();
  });

  it("uses the queue article layout for a selected feed", () => {
    render(<FeedsPage />);

    expect(screen.getByTestId("article-view")).toBeInTheDocument();
    expect(mocks.articleView).toHaveBeenCalled();
    const props = mocks.articleView.mock.calls[0][0];
    expect(props).not.toHaveProperty("feed");
    expect(props).not.toHaveProperty("onBack");
  });
});

describe("FeedsBrowse", () => {
  beforeEach(() => {
    mocks.getSubscribes.mockClear();
    mocks.navigate.mockClear();
    mocks.setFeed.mockClear();
  });

  it("renders ungrouped sources with unread counts and fetches subscribes", () => {
    render(<FeedsBrowse />);

    expect(mocks.getSubscribes).toHaveBeenCalled();
    expect(screen.getByText("Feed One")).toBeInTheDocument();
    expect(screen.getByText("Feed Two")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("opens the feed queue on row click", () => {
    render(<FeedsBrowse />);

    screen.getByText("Feed One").closest("button")!.click();

    expect(mocks.setFeed).toHaveBeenCalledWith(
      expect.objectContaining({ uuid: "feed-1" }),
    );
    expect(mocks.navigate).toHaveBeenCalledWith(
      expect.stringContaining("/local/feeds/feed-1"),
    );
  });
});
