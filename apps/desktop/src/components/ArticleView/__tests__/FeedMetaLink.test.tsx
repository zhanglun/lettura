import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ArticleResItem } from "@/db";
import { useAppStore } from "@/stores";
import { FeedMetaLink } from "../FeedMetaLink";

vi.mock("@/helpers/podcastDB", () => ({
  db: { podcasts: { where: vi.fn() } },
}));

const article = {
  feed_uuid: "feed-1",
  feed_title: "内核恐慌",
} as unknown as ArticleResItem;

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <FeedMetaLink article={article} />
    </MemoryRouter>,
  );
}

describe("FeedMetaLink", () => {
  afterEach(() => {
    cleanup();
    useAppStore.setState({ expandedArticleUuid: null });
  });

  it("已在源队列帧路由：点击收起内嵌详情（同 URL 导航是 no-op，露出 feed 页）", () => {
    useAppStore.setState({ expandedArticleUuid: "art-1" });
    renderAt("/local/feeds/feed-1");

    fireEvent.click(screen.getByText("内核恐慌"));

    expect(useAppStore.getState().expandedArticleUuid).toBeNull();
  });

  it("在文章路由（详情由路由承载）：保持 Link 导航语义，不清展开态", () => {
    useAppStore.setState({ expandedArticleUuid: "art-1" });
    renderAt("/local/feeds/feed-1/articles/art-1");

    const link = screen.getByText("内核恐慌");
    expect(link.getAttribute("href")).toBe("/local/feeds/feed-1");

    fireEvent.click(link);
    expect(useAppStore.getState().expandedArticleUuid).toBe("art-1");
  });
});
