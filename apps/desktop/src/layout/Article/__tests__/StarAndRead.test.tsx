import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { StarAndRead } from "../StarAndRead";
import { ArticleReadLaterStatus, ArticleReadStatus, ArticleStarStatus } from "@/typing";
import type { ArticleResItem } from "@/db";

vi.mock("@/helpers/dataAgent", () => ({
  updateArticleReadLaterStatus: vi.fn().mockResolvedValue({}),
  updateArticleStarStatus: vi.fn().mockResolvedValue({}),
  updateArticleReadStatus: vi.fn().mockResolvedValue({}),
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
    uuid: "test-article-uuid",
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

describe("StarAndRead Read Later button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls updateArticleReadLaterStatus with uuid and SAVED when clicking bookmark on unsaved article", async () => {
    const article = makeArticle({ is_read_later: ArticleReadLaterStatus.UNSAVED });
    renderWithTheme(<StarAndRead article={article} />);

    const bookmarkButtons = screen.getAllByRole("button");
    const bookmarkButton = bookmarkButtons.find(
      (btn) => btn.querySelector("svg.lucide-bookmark") !== null,
    );
    expect(bookmarkButton).toBeTruthy();
    fireEvent.click(bookmarkButton!);

    await waitFor(() => {
      expect(dataAgent.updateArticleReadLaterStatus).toHaveBeenCalledWith(
        "test-article-uuid",
        ArticleReadLaterStatus.SAVED,
      );
    });
  });

  it("calls updateArticleReadLaterStatus with UNSAVED when clicking bookmark on saved article", async () => {
    const article = makeArticle({ is_read_later: ArticleReadLaterStatus.SAVED });
    renderWithTheme(<StarAndRead article={article} />);

    const bookmarkButtons = screen.getAllByRole("button");
    const bookmarkButton = bookmarkButtons.find(
      (btn) => btn.querySelector("svg.lucide-bookmark") !== null,
    );
    expect(bookmarkButton).toBeTruthy();
    fireEvent.click(bookmarkButton!);

    await waitFor(() => {
      expect(dataAgent.updateArticleReadLaterStatus).toHaveBeenCalledWith(
        "test-article-uuid",
        ArticleReadLaterStatus.UNSAVED,
      );
    });
  });

  it("does not call updateArticleReadLaterStatus when clicking star button", async () => {
    const article = makeArticle({ is_read_later: ArticleReadLaterStatus.UNSAVED });
    renderWithTheme(<StarAndRead article={article} />);

    const starButtons = screen.getAllByRole("button");
    const starButton = starButtons.find(
      (btn) => btn.querySelector("svg.lucide-star") !== null,
    );
    expect(starButton).toBeTruthy();
    fireEvent.click(starButton!);

    expect(dataAgent.updateArticleReadLaterStatus).not.toHaveBeenCalled();
    expect(dataAgent.updateArticleStarStatus).toHaveBeenCalledWith(
      "test-article-uuid",
      ArticleStarStatus.STARRED,
    );
  });

  it("does not call updateArticleReadLaterStatus when clicking read status button", async () => {
    const article = makeArticle({
      is_read_later: ArticleReadLaterStatus.UNSAVED,
      read_status: ArticleReadStatus.UNREAD,
    });
    renderWithTheme(<StarAndRead article={article} />);

    const eyeButtons = screen.getAllByRole("button");
    const eyeButton = eyeButtons.find(
      (btn) => btn.querySelector("svg.lucide-eye") !== null,
    );
    expect(eyeButton).toBeTruthy();
    fireEvent.click(eyeButton!);

    expect(dataAgent.updateArticleReadLaterStatus).not.toHaveBeenCalled();
    expect(dataAgent.updateArticleReadStatus).toHaveBeenCalledWith(
      "test-article-uuid",
      ArticleReadStatus.READ,
    );
  });
});
