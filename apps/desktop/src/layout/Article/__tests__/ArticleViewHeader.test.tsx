import { render, screen } from "@testing-library/react";
import { forwardRef } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArticleView } from "../ArticleView";
import { ArticleReadStatus } from "@/typing";

const mocks = vi.hoisted(() => ({
  setArticle: vi.fn(),
  setArticleDialogViewStatus: vi.fn(),
  setExpandedArticleUuid: vi.fn(),
  setFilter: vi.fn(),
  syncAllArticles: vi.fn(),
  syncArticles: vi.fn(),
  markArticleListAsRead: vi.fn(),
  mutate: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) =>
      typeof options?.count === "number" ? `${key}:${options.count}` : key,
  }),
}));

vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-shell", () => ({
  open: vi.fn(),
}));

vi.mock("@/helpers/parseXML", () => ({
  useQuery: () => [undefined, "channel", "feed-1"],
}));

vi.mock("@/hooks/useArticle", () => ({
  useArticle: () => ({
    articles: [
      { uuid: "a1", read_status: ArticleReadStatus.UNREAD },
      { uuid: "a2", read_status: ArticleReadStatus.UNREAD },
    ],
    isLoading: false,
    size: 1,
    setSize: vi.fn(),
    isEmpty: false,
    isReachingEnd: false,
    mutate: mocks.mutate,
    isToday: false,
    isAll: false,
    carrierCounts: { text: 3, audio: 1, video: 0, email: 0 },
    refreshCarrierCounts: vi.fn(),
  }),
}));

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      article: null,
      setArticle: mocks.setArticle,
      articleDialogViewStatus: false,
      setArticleDialogViewStatus: mocks.setArticleDialogViewStatus,
      tracks: [],
      podcastPlayingStatus: false,
      viewMeta: {
        title: "Feed One",
        unread: 42,
        isToday: false,
        isAll: false,
      },
      collectionMeta: {
        today: { unread: 7 },
        total: { unread: 99 },
      },
      expandedArticleUuid: null,
      setExpandedArticleUuid: mocks.setExpandedArticleUuid,
      currentFilter: { id: ArticleReadStatus.UNREAD, title: "Unread" },
      setFilter: mocks.setFilter,
      updateArticleStatus: vi.fn(),
      setHasMorePrev: vi.fn(),
      setHasMoreNext: vi.fn(),
      subscribes: [{ uuid: "feed-1", item_type: "channel", children: [] }],
      userConfig: {},
      globalSyncStatus: false,
      syncAllArticles: mocks.syncAllArticles,
      syncArticles: mocks.syncArticles,
      markArticleListAsRead: mocks.markArticleListAsRead,
    }),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

vi.mock("@/components/ArticleListVirtual", () => ({
  ArticleListVirtual: forwardRef<HTMLDivElement, { sectionLabel?: string }>(
    (props, ref) => (
      <div
        ref={ref}
        data-testid="article-list"
        data-section-label={props.sectionLabel}
      />
    ),
  ),
}));

vi.mock("@/components/ArticleView/DialogView", () => ({
  ArticleDialogView: () => null,
}));

vi.mock("@/components/LPodcast", () => ({
  LPodcast: () => null,
}));

describe("ArticleView header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the source queue header with the feed name and unread count", () => {
    render(
      <MemoryRouter
        initialEntries={["/local/feeds/feed-1?feedUuid=feed-1&type=channel"]}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <Routes>
          <Route path="/local/feeds/:uuid" element={<ArticleView />} />
        </Routes>
      </MemoryRouter>,
    );

    // 源头栏：返回浏览 + 源名；过滤条：未读 tab 带 viewMeta 未读数
    expect(screen.getByText("Feed One")).toBeInTheDocument();
    expect(screen.getByText("fusion.nav.subscriptions")).toBeInTheDocument();
    expect(screen.getByText("fusion.nav.unread")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.queryByText("article.list_unread_count:42")).not.toBeInTheDocument();
  });

  it("shows queue actions and the unread/all filter strip", () => {
    render(
      <MemoryRouter
        initialEntries={["/local/feeds/feed-1?feedUuid=feed-1&type=channel"]}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <Routes>
          <Route path="/local/feeds/:uuid" element={<ArticleView />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("fusion.filter.all")).toBeInTheDocument();
    expect(
      screen.getByLabelText("feeds.ctx.mark_all_read"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("feeds.ctx.sync")).toBeInTheDocument();
    expect(screen.getByLabelText("fusion.queue.manage")).toBeInTheDocument();
  });
});
