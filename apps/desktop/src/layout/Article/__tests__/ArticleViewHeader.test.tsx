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

  it("shows the selected category unread count instead of the loaded article count", () => {
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

    expect(screen.getByText("Feed One")).toBeInTheDocument();
    expect(screen.getByText("article.list_unread_count:42")).toBeInTheDocument();
    expect(screen.queryByText("article.list_unread_count:2")).not.toBeInTheDocument();
  });

  it("shows loaded article and active filter metadata in the unified header", () => {
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

    expect(screen.getByText("article.list_loaded_count:2")).toBeInTheDocument();
    expect(screen.getByText("article.current_filter")).toBeInTheDocument();
    expect(screen.getAllByText("Unread").length).toBeGreaterThan(0);
  });

  it("passes a sticky section label reflecting the active filter to the list", () => {
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

    const list = screen.getByTestId("article-list");
    expect(list.getAttribute("data-section-label")).toBe("article.section_label:2");
  });
});
