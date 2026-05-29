import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { ReaderControls } from "../index";
import { ArticleReadLaterStatus, ArticleReadStatus, ArticleStarStatus } from "@/typing";
import type { ArticleResItem } from "@/db";

vi.mock("@/helpers/dataAgent", () => ({
  updateArticleStarStatus: vi.fn().mockResolvedValue({}),
  updateArticleReadStatus: vi.fn().mockResolvedValue({}),
  updateArticleReadLaterStatus: vi.fn().mockResolvedValue({}),
}));

vi.mock("@tauri-apps/plugin-shell", () => ({
  open: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

import * as dataAgent from "@/helpers/dataAgent";

function makeArticle(overrides: Partial<ArticleResItem> = {}): ArticleResItem {
  return {
    uuid: "test-uuid",
    title: "Test Article",
    link: "https://example.com",
    feed_uuid: "feed-1",
    feed_title: "Test Feed",
    feed_url: "https://example.com/feed",
    feed_logo: "",
    read_status: ArticleReadStatus.UNREAD,
    starred: ArticleStarStatus.UNSTAR,
    is_read_later: ArticleReadLaterStatus.UNSAVED,
    author: "",
    image: "",
    media_object: "",
    description: "",
    content: "",
    create_date: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function renderWithTheme(ui: React.ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

describe("ReaderControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("收藏按钮", () => {
    it("点击后调用 updateArticleStarStatus(uuid, STARRED)", async () => {
      const article = makeArticle();
      renderWithTheme(<ReaderControls article={article} />);

      const btn = screen.getAllByRole("button").find(
        (b) => b.querySelector("svg.lucide-star") !== null,
      );
      fireEvent.click(btn!);

      await waitFor(() => {
        expect(dataAgent.updateArticleStarStatus).toHaveBeenCalledWith(
          "test-uuid",
          ArticleStarStatus.STARRED,
        );
      });
    });

    it("已收藏时点击调用 updateArticleStarStatus(uuid, UNSTAR)", async () => {
      const article = makeArticle({ starred: ArticleStarStatus.STARRED });
      renderWithTheme(<ReaderControls article={article} />);

      const btn = screen.getAllByRole("button").find(
        (b) => b.querySelector("svg.lucide-star") !== null,
      );
      fireEvent.click(btn!);

      await waitFor(() => {
        expect(dataAgent.updateArticleStarStatus).toHaveBeenCalledWith(
          "test-uuid",
          ArticleStarStatus.UNSTAR,
        );
      });
    });

    it("操作成功后触发 onStarChange 回调并携带更新后的 article", async () => {
      const article = makeArticle();
      const onStarChange = vi.fn();
      renderWithTheme(<ReaderControls article={article} onStarChange={onStarChange} />);

      const btn = screen.getAllByRole("button").find(
        (b) => b.querySelector("svg.lucide-star") !== null,
      );
      fireEvent.click(btn!);

      await waitFor(() => {
        expect(onStarChange).toHaveBeenCalledOnce();
        expect(onStarChange.mock.calls[0][0].starred).toBe(ArticleStarStatus.STARRED);
      });
    });
  });

  describe("已读按钮", () => {
    it("未读时点击调用 updateArticleReadStatus(uuid, READ)", async () => {
      const article = makeArticle({ read_status: ArticleReadStatus.UNREAD });
      renderWithTheme(<ReaderControls article={article} />);

      const btn = screen.getAllByRole("button").find(
        (b) => b.querySelector("svg.lucide-eye") !== null,
      );
      fireEvent.click(btn!);

      await waitFor(() => {
        expect(dataAgent.updateArticleReadStatus).toHaveBeenCalledWith(
          "test-uuid",
          ArticleReadStatus.READ,
        );
      });
    });

    it("操作成功后触发 onReadChange 回调并携带更新后的 article", async () => {
      const article = makeArticle({ read_status: ArticleReadStatus.UNREAD });
      const onReadChange = vi.fn();
      renderWithTheme(<ReaderControls article={article} onReadChange={onReadChange} />);

      const btn = screen.getAllByRole("button").find(
        (b) => b.querySelector("svg.lucide-eye") !== null,
      );
      fireEvent.click(btn!);

      await waitFor(() => {
        expect(onReadChange).toHaveBeenCalledOnce();
        expect(onReadChange.mock.calls[0][0].read_status).toBe(ArticleReadStatus.READ);
      });
    });
  });

  describe("showBrowser prop", () => {
    it("showBrowser=true 时渲染外链按钮", () => {
      const article = makeArticle();
      renderWithTheme(<ReaderControls article={article} showBrowser />);

      const btn = screen.getAllByRole("button").find(
        (b) => b.querySelector("svg.lucide-external-link") !== null,
      );
      expect(btn).toBeTruthy();
    });

    it("showBrowser=false 时不渲染外链按钮", () => {
      const article = makeArticle();
      renderWithTheme(<ReaderControls article={article} showBrowser={false} />);

      const btn = screen.getAllByRole("button").find(
        (b) => b.querySelector("svg.lucide-external-link") !== null,
      );
      expect(btn).toBeUndefined();
    });

    it("article.link 为空时外链按钮为 disabled", () => {
      const article = makeArticle({ link: "" });
      renderWithTheme(<ReaderControls article={article} showBrowser />);

      const btn = screen.getAllByRole("button").find(
        (b) => b.querySelector("svg.lucide-external-link") !== null,
      ) as HTMLButtonElement | undefined;
      expect(btn?.disabled).toBe(true);
    });
  });

  describe("showReadLater prop", () => {
    it("showReadLater=true 时渲染书签按钮", () => {
      const article = makeArticle();
      renderWithTheme(<ReaderControls article={article} showReadLater />);

      const btn = screen.getAllByRole("button").find(
        (b) => b.querySelector("svg.lucide-bookmark") !== null,
      );
      expect(btn).toBeTruthy();
    });

    it("showReadLater=false（默认）时不渲染书签按钮", () => {
      const article = makeArticle();
      renderWithTheme(<ReaderControls article={article} />);

      const btn = screen.getAllByRole("button").find(
        (b) => b.querySelector("svg.lucide-bookmark") !== null,
      );
      expect(btn).toBeUndefined();
    });
  });
});
