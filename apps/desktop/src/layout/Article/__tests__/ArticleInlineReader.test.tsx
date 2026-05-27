import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArticleInlineReader } from "../ArticleInlineReader";
import { ArticleReadStatus, ArticleStarStatus } from "@/typing";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/ArticleView/Detail", () => ({
  ArticleDetail: ({ article }: { article: { title: string } }) => (
    <article>{article.title}</article>
  ),
}));

vi.mock("@/helpers/dataAgent", () => ({
  updateArticleStarStatus: vi.fn(() => Promise.resolve(undefined)),
  updateArticleReadStatus: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock("@tauri-apps/plugin-shell", () => ({
  open: vi.fn(),
}));

describe("ArticleInlineReader", () => {
  it("disables navigation buttons when handlers are not available", () => {
    render(
      <ArticleInlineReader
        article={{
          uuid: "article-1",
          title: "Reader article",
          link: "https://example.com/article",
          read_status: ArticleReadStatus.UNREAD,
          starred: ArticleStarStatus.UNSTAR,
        } as any}
        onClose={vi.fn()}
        canPrev
        canNext
        index={0}
        total={3}
      />,
    );

    expect(screen.getByRole("button", { name: "article.view.prev" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "article.view.next" })).toBeDisabled();
  });
});
