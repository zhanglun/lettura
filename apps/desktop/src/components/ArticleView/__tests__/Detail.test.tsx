import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { ArticleDetail } from "../Detail";
import type { ArticleResItem } from "@/db";
import { ArticleReadStatus, ArticleStarStatus, ArticleReadLaterStatus } from "@/typing";

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
}));

vi.mock("@/helpers/dataAgent", () => ({
  getArticleDetail: vi.fn(),
}));

import * as dataAgent from "@/helpers/dataAgent";

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
  return render(<Theme>{ui}</Theme>);
}

describe("ArticleDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("成功加载时渲染文章内容", async () => {
    (dataAgent.getArticleDetail as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { content: "<p>Hello world</p>", description: "", media_object: "[]" },
    });

    const article = makeArticle();
    renderWithTheme(<ArticleDetail article={article} />);

    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });
  });

  it("加载失败时显示错误提示", async () => {
    (dataAgent.getArticleDetail as ReturnType<typeof vi.fn>).mockRejectedValue(
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
    (dataAgent.getArticleDetail as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error"),
    );

    const article = makeArticle({ link: "https://example.com/article" });
    renderWithTheme(<ArticleDetail article={article} />);

    await waitFor(() => {
      expect(screen.getByText("Open in browser")).toBeInTheDocument();
    });
  });

  it("AbortError 不触发错误态", async () => {
    const abortErr = new Error("Aborted");
    abortErr.name = "AbortError";
    (dataAgent.getArticleDetail as ReturnType<typeof vi.fn>).mockRejectedValue(abortErr);

    const article = makeArticle();
    renderWithTheme(<ArticleDetail article={article} />);

    // 等待异步完成后不应出现错误文案
    await new Promise((r) => setTimeout(r, 50));
    expect(
      screen.queryByText("Failed to load article content"),
    ).not.toBeInTheDocument();
  });

  it("article 为 null 时不崩溃且不发请求", () => {
    renderWithTheme(<ArticleDetail article={null} />);
    expect(dataAgent.getArticleDetail).not.toHaveBeenCalled();
  });
});
