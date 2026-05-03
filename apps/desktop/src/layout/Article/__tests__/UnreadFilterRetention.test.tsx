import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { ArticleReadStatus, ArticleStarStatus, ArticleReadLaterStatus } from "@/typing";
import type { ArticleResItem } from "@/db";
import { retainArticleAfterRead } from "../ArticleCol";

const mockUpdateArticleStatus = vi.fn();
const mockSetArticle = vi.fn();
const mockOnRead = vi.fn();

vi.mock("@/stores", () => ({
  useBearStore: () => ({
    article: null,
    setArticle: mockSetArticle,
    updateArticleStatus: mockUpdateArticleStatus,
  }),
}));

vi.mock("@/helpers/dataAgent", () => ({
  updateArticleReadStatus: vi.fn().mockResolvedValue({}),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("react-router-dom", () => ({
  useMatch: () => null,
}));

vi.mock("date-fns", () => ({
  formatDistanceToNow: vi.fn(() => "2 days ago"),
}));

import { ArticleItem } from "@/components/ArticleItem";

function makeArticle(overrides: Partial<ArticleResItem> = {}): ArticleResItem {
  return {
    uuid: "art-unread-1",
    title: "Unread Article",
    link: "https://example.com/1",
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

describe("ArticleItem: unread filter delayed removal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls mark-read API when clicking an unread article", () => {
    const article = makeArticle();
    render(
      <Theme>
        <ArticleItem article={article} onRead={mockOnRead} />
      </Theme>,
    );

    fireEvent.click(screen.getByText("Unread Article"));

    expect(mockUpdateArticleStatus).toHaveBeenCalledWith(
      expect.objectContaining({ uuid: "art-unread-1" }),
      ArticleReadStatus.READ,
    );
  });

  it("passes updated article (with read_status=READ) to onRead callback", () => {
    const article = makeArticle();
    render(
      <Theme>
        <ArticleItem article={article} onRead={mockOnRead} />
      </Theme>,
    );

    fireEvent.click(screen.getByText("Unread Article"));

    expect(mockOnRead).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: "art-unread-1",
        read_status: ArticleReadStatus.READ,
      }),
    );
  });

  it("does NOT pass a removal/filter instruction — article stays in list", () => {
    const article = makeArticle();
    render(
      <Theme>
        <ArticleItem article={article} onRead={mockOnRead} />
      </Theme>,
    );

    fireEvent.click(screen.getByText("Unread Article"));

    const calledWith = mockOnRead.mock.calls[0][0] as ArticleResItem;
    expect(calledWith.read_status).toBe(ArticleReadStatus.READ);
    expect(calledWith.uuid).toBe("art-unread-1");
  });

  it("does not call onRead when clicking an already-read article", () => {
    const article = makeArticle({ read_status: ArticleReadStatus.READ });
    render(
      <Theme>
        <ArticleItem article={article} onRead={mockOnRead} />
      </Theme>,
    );

    fireEvent.click(screen.getByText("Unread Article"));

    expect(mockOnRead).not.toHaveBeenCalled();
  });

  it("still calls updateArticleStatus for already-read articles", () => {
    const article = makeArticle({ read_status: ArticleReadStatus.READ });
    render(
      <Theme>
        <ArticleItem article={article} onRead={mockOnRead} />
      </Theme>,
    );

    fireEvent.click(screen.getByText("Unread Article"));

    expect(mockUpdateArticleStatus).toHaveBeenCalled();
    expect(mockOnRead).not.toHaveBeenCalled();
  });
});

describe("retainArticleAfterRead: SWR pages transformation", () => {
  const artA = makeArticle({ uuid: "art-a", title: "Article A" });
  const artB = makeArticle({ uuid: "art-b", title: "Article B" });
  const artC = makeArticle({ uuid: "art-c", title: "Article C" });

  it("keeps all articles in list after marking one as read", () => {
    const pages = [{ list: [artA, artB, artC] }];
    const result = retainArticleAfterRead(pages, {
      ...artB,
      read_status: ArticleReadStatus.READ,
    });

    expect(result![0].list).toHaveLength(3);
  });

  it("retains the target article with read_status=READ", () => {
    const pages = [{ list: [artA, artB, artC] }];
    const result = retainArticleAfterRead(pages, {
      ...artB,
      read_status: ArticleReadStatus.READ,
    });

    const target = result![0].list.find((a) => a.uuid === "art-b");
    expect(target).toBeDefined();
    expect(target!.read_status).toBe(ArticleReadStatus.READ);
  });

  it("does not modify other articles", () => {
    const pages = [{ list: [artA, artB, artC] }];
    const result = retainArticleAfterRead(pages, {
      ...artB,
      read_status: ArticleReadStatus.READ,
    });

    const others = result![0].list.filter((a) => a.uuid !== "art-b");
    expect(others).toEqual([artA, artC]);
  });

  it("works across multiple pages", () => {
    const pages = [{ list: [artA] }, { list: [artB] }, { list: [artC] }];
    const result = retainArticleAfterRead(pages, {
      ...artB,
      read_status: ArticleReadStatus.READ,
    });

    expect(result![0].list).toHaveLength(1);
    expect(result![1].list).toHaveLength(1);
    expect(result![2].list).toHaveLength(1);
    expect(result![1].list[0].read_status).toBe(ArticleReadStatus.READ);
  });

  it("returns undefined when pages is undefined", () => {
    const result = retainArticleAfterRead(undefined, {
      ...artA,
      read_status: ArticleReadStatus.READ,
    });
    expect(result).toBeUndefined();
  });
});
