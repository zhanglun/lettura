import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ArticleListVirtual } from "..";
import type { ArticleResItem } from "@/db";

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

/** 触底判定读的是元素度量：jsdom 里全为 0，按需伪造 */
const stubMetrics = (
  el: HTMLElement,
  m: { scrollTop: number; scrollHeight: number; clientHeight: number },
) => {
  for (const [k, v] of Object.entries(m)) {
    Object.defineProperty(el, k, { value: v, configurable: true });
  }
};

const List = (props: Partial<React.ComponentProps<typeof ArticleListVirtual>>) => (
  <MemoryRouter>
    <ArticleListVirtual
      articles={[article("a"), article("b")]}
      isEmpty={false}
      isLoading={false}
      isReachingEnd={false}
      size={0}
      setSize={vi.fn()}
      {...props}
      title={null}
    />
  </MemoryRouter>
);

const renderList = (props: Partial<React.ComponentProps<typeof ArticleListVirtual>> = {}) => {
  const setSize = vi.fn();
  const utils = render(<List {...props} setSize={setSize} />);
  const container = utils.container.querySelector(
    ".overflow-y-auto",
  ) as HTMLElement;
  return { ...utils, setSize, container };
};

describe("ArticleListVirtual 触底加载", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("滚到底请求下一页", () => {
    const { container, setSize } = renderList();
    stubMetrics(container, { scrollTop: 900, scrollHeight: 1000, clientHeight: 100 });

    fireEvent.scroll(container);

    expect(setSize).toHaveBeenCalledWith(1);
  });

  it("同一个 size 不重复请求（不靠时间冷却：不推进定时器也不该二次触发）", () => {
    const { container, setSize } = renderList();
    stubMetrics(container, { scrollTop: 900, scrollHeight: 1000, clientHeight: 100 });

    fireEvent.scroll(container);
    fireEvent.scroll(container);

    expect(setSize).toHaveBeenCalledTimes(1);
  });

  it("下一页到位（size 递增）后，立刻再滚到底就能续上——不需要等待冷却", () => {
    const { container, setSize, rerender } = renderList();
    stubMetrics(container, { scrollTop: 900, scrollHeight: 1000, clientHeight: 100 });
    fireEvent.scroll(container);
    expect(setSize).toHaveBeenCalledWith(1);

    // 父级把 size 推进到 1（新一页到位）
    rerender(<List size={1} setSize={setSize} />);
    stubMetrics(container, { scrollTop: 1900, scrollHeight: 2000, clientHeight: 100 });
    fireEvent.scroll(container);

    expect(setSize).toHaveBeenLastCalledWith(2);
  });

  it("让位空白不算内容：看到最后一行（尚未滚进空白）就该加载", () => {
    const { container, setSize, rerender } = renderList();
    // 容器挂了 102px 的让位空白（来自 AppLayout 的 --fusion-player-inset）
    container.style.setProperty("--fusion-player-inset", "102px");
    // effect 在挂载时已读过一次变量：借依赖变化让它重读（生产里由 AppLayout 在挂载前就写好）
    rerender(<List size={0} setSize={setSize} isLoading={true} />);
    rerender(<List size={0} setSize={setSize} isLoading={false} />);
    // 内容 1000（含末尾 102 空白）· 视口 100 → 「最后一行可见」= scrollTop 800
    stubMetrics(container, { scrollTop: 800, scrollHeight: 1000, clientHeight: 100 });

    fireEvent.scroll(container);

    // 旧公式 (800+100)/1000 = 0.9 不满足 > 0.9；扣掉空白后 900/898 才成立
    expect(setSize).toHaveBeenCalledWith(1);
  });
});
