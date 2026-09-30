import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleResItem } from "@/db";
import {
  ArticleReadLaterStatus,
  ArticleReadStatus,
  ArticleStarStatus,
} from "@/typing";
import { ArticleDetail } from "../Detail";

vi.mock("@tauri-apps/plugin-shell", () => ({ open: vi.fn() }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("@/helpers/articleContent", () => ({
  pickArticleContent: (content: string) => content,
  processArticleHtml: (raw: string) => raw,
  estimateReadMinutes: () => 0,
}));

vi.mock("@/helpers/http", () => ({
  apiGet: vi.fn(),
}));

import { apiGet } from "@/helpers/http";

function makeArticle(overrides: Partial<ArticleResItem> = {}): ArticleResItem {
  return {
    uuid: "art-1",
    title: "Test Article",
    link: "https://example.com/article",
    feed_uuid: "feed-1",
    feed_title: "Test Feed",
    feed_url: "https://example.com/feed",
    feed_logo: "",
    read_status: ArticleReadStatus.UNREAD,
    starred: ArticleStarStatus.UNSTAR,
    is_read_later: ArticleReadLaterStatus.UNSAVED,
    author: "",
    image: "",
    media_object: "[]",
    description: "Hello world",
    content: "<p>Hello world</p>",
    pub_date: "2026-01-01T00:00:00Z",
    create_date: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function renderWithTheme(ui: React.ReactElement) {
  return render(<>{ui}</>);
}

describe("ArticleDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("成功加载时渲染文章内容", async () => {
    (apiGet as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: "<p>Hello world</p>",
      description: "",
      media_object: "[]",
    });

    const article = makeArticle();
    renderWithTheme(<ArticleDetail article={article} />);

    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });
  });

  it("加载失败时显示错误提示", async () => {
    (apiGet as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error"),
    );

    const article = makeArticle();
    renderWithTheme(<ArticleDetail article={article} />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load article content"),
      ).toBeInTheDocument();
    });
  });

  it("加载失败时渲染「在浏览器中打开」链接（有 link 时）", async () => {
    (apiGet as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error"),
    );

    const article = makeArticle({ link: "https://example.com/article" });
    renderWithTheme(<ArticleDetail article={article} />);

    await waitFor(() => {
      expect(screen.getByText("Open in browser")).toBeInTheDocument();
    });
  });

  it("切文章后过期的失败不再置错误态（invoke 无法中断，靠 cancelled 标志位）", async () => {
    let rejectFirst!: (e: Error) => void;
    (apiGet as ReturnType<typeof vi.fn>)
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectFirst = reject;
          }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          content: "<p>new</p>",
          description: "",
          media_object: "[]",
        }),
      );

    const { rerender } = renderWithTheme(
      <ArticleDetail article={makeArticle({ uuid: "art-1" })} />,
    );
    // 换 uuid → 旧请求 cleanup（cancelled = true），随后它的失败不应污染新视图
    rerender(<ArticleDetail article={makeArticle({ uuid: "art-2" })} />);
    rejectFirst(new Error("late failure"));
    await new Promise((r) => setTimeout(r, 50));

    expect(
      screen.queryByText("Failed to load article content"),
    ).not.toBeInTheDocument();
  });

  it("article 为 null 时不崩溃且不发请求", () => {
    renderWithTheme(<ArticleDetail article={null} />);
    expect(apiGet).not.toHaveBeenCalled();
  });
});
