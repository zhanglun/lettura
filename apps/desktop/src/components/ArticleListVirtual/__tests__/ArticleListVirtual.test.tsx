import { cleanup, fireEvent, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleResItem } from "@/db";
import { ArticleListVirtual } from "..";
import type { ListSection } from "@/hooks/useArticle";

const article = (uuid: string): ArticleResItem =>
  ({
    uuid,
    feed_uuid: "feed-1",
    feed_title: "内核恐慌",
    feed_url: "https://example.com/feed",
    title: `单集 ${uuid}`,
    link: "https://example.com/ep",
    image: "",
    description: "",
    author: "",
    create_date: "2026-09-24",
    read_status: 0,
    starred: 0,
    media_object: "",
  }) as ArticleResItem;

/** 滚动哨兵读的是元素度量：jsdom 里 innerHeight=768、rect.top=0——
 *  rect.top(0) < innerHeight+400 恒真，哨兵即触发（这正是要测的行为） */
const section = (over: Partial<ListSection> = {}): ListSection => ({
  bucket: "today",
  key: "today",
  rows: [article("a"), article("b")],
  loaded: 2,
  realCount: 2,
  hasMore: false,
  loading: false,
  loadMore: vi.fn(),
  ...over,
});

const List = (props: {
  sections?: ListSection[];
  onLoadMore?: (key: string) => void;
  collapsedBuckets?: Set<string>;
  onToggleBucket?: (bucket: string) => void;
  isEmpty?: boolean;
}) => (
  <MemoryRouter>
    <ArticleListVirtual
      sections={props.sections ?? [section()]}
      collapsedBuckets={props.collapsedBuckets ?? new Set()}
      onToggleBucket={props.onToggleBucket ?? vi.fn()}
      onLoadMore={props.onLoadMore ?? vi.fn()}
      isEmpty={props.isEmpty ?? false}
    />
  </MemoryRouter>
);

const renderList = (props: Parameters<typeof List>[0] = {}) => {
  const utils = render(<List {...props} />);
  const container = utils.container.querySelector(
    ".overflow-y-auto",
  ) as HTMLElement;
  return { ...utils, container };
};

describe("ArticleListVirtual 时间流 sections", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("渲染每个 section 的行与日期头", () => {
    const { container } = renderList({
      sections: [
        section({ key: "today", bucket: "today", realCount: 760 }),
        section({
          key: "yesterday",
          bucket: "yesterday",
          rows: [article("c")],
          loaded: 1,
          realCount: 3223,
        }),
      ],
    });

    const heads = [...container.querySelectorAll(".fusion-dayhead .lb")].map(
      (el) => el.textContent,
    );
    expect(heads).toEqual([
      "fusion.list.day_today",
      "fusion.list.day_yesterday",
    ]);
    expect(container.querySelectorAll(".fusion-row").length).toBe(3);
    // 真实总量流入桶尾对账：loaded 2 / realCount 760 → loaded_of（而非 loaded_all）
    const feet = [...container.querySelectorAll(".fusion-list-foot")].map(
      (el) => el.textContent,
    );
    expect(feet[0]).toContain("fusion.list.loaded_of");
  });

  it("展开且还有更多数据的桶：哨兵触发 onLoadMore", () => {
    const onLoadMore = vi.fn();
    renderList({
      sections: [section({ hasMore: true, loading: false })],
      onLoadMore,
    });

    expect(onLoadMore).toHaveBeenCalledWith("today");
  });

  it("本桶没有更多数据就不再请求（桶内 loop 结束即停）", () => {
    const onLoadMore = vi.fn();
    renderList({
      sections: [section({ hasMore: false })],
      onLoadMore,
    });

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("收起的桶不渲染行、不触发续载；点击头 = 展开", () => {
    const onLoadMore = vi.fn();
    const onToggleBucket = vi.fn();
    const { container } = renderList({
      sections: [section({ hasMore: true })],
      collapsedBuckets: new Set(["today"]),
      onToggleBucket,
      onLoadMore,
    });

    expect(container.querySelectorAll(".fusion-row").length).toBe(0);
    expect(onLoadMore).not.toHaveBeenCalled();

    fireEvent.click(container.querySelector(".fusion-dayhead")!);
    expect(onToggleBucket).toHaveBeenCalledWith("today");
  });

  it("展开一个还没有数据的空桶：自动首拉", () => {
    const onLoadMore = vi.fn();
    renderList({
      sections: [
        section({
          key: "yesterday",
          bucket: "yesterday",
          rows: [],
          loaded: 0,
          hasMore: true,
          loading: false,
        }),
      ],
      onLoadMore,
    });

    expect(onLoadMore).toHaveBeenCalledWith("yesterday");
  });
});
