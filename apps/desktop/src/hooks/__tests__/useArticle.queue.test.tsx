import { act, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useShallow } from "zustand/react/shallow";
import { useArticle } from "@/hooks/useArticle";
import { useBearStore } from "@/stores";

// 队列骨架复现：切筛选（查询键变化）的同步渲染帧必须报 loading，
// 不允许 isEmpty 误真闪空态。apiGet 用可控 promise 模拟网络在途。

type Resolver = {
  path: string;
  params: Record<string, unknown>;
  resolve: (v: any) => void;
};
const pending: Resolver[] = [];

function makeApiGet() {
  return vi.fn(
    (path: string, params?: Record<string, unknown>) =>
      new Promise<any>((resolve) => {
        pending.push({ path, params: params ?? {}, resolve });
      }),
  );
}

const apiGetMock = makeApiGet();

vi.mock("@/helpers/http", () => ({
  apiGet: (path: string, params?: Record<string, unknown>) =>
    apiGetMock(path, params),
  apiPost: vi.fn(),
}));

vi.mock("@/stores", () => ({
  useBearStore: (selector: any) =>
    selector(
      useShallow(() => ({
        currentFilter: { id: 1, title: "Unread" },
      }))({} as any),
    ),
}));

function page(uuid: string, n: number) {
  return {
    list: Array.from({ length: n }, (_, i) => ({
      uuid: `${uuid}-${i}`,
      read_status: 1,
    })),
    total: n,
  };
}

const frameLog: string[] = [];

function Harness({
  readStatus,
  sourceUuid,
  queue = true,
}: {
  readStatus: number | null;
  sourceUuid?: string;
  queue?: boolean;
}) {
  const { isLoading, isEmpty } = useArticle({
    feedUuid: queue
      ? `feed-${expect.getState().currentTestName?.length ?? 0}`
      : undefined,
    readStatus,
    sourceUuid,
  });
  const state = isLoading ? "LOADING" : isEmpty ? "EMPTY" : "READY";
  // 记录每一次提交的帧：播种间隙的一帧 EMPTY 也会被留下证据
  frameLog.push(state);
  return <div data-testid="state">{state}</div>;
}

function wrap(ui: ReactElement) {
  return <MemoryRouter initialEntries={["/"]}>{ui}</MemoryRouter>;
}

function renderHarness(readStatus: number | null) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Harness readStatus={readStatus} />
    </MemoryRouter>,
  );
}

/** 等到指定路径的请求出现并放行（精确匹配，防止串味） */
async function flush(
  path: string,
  respond: (params: Record<string, unknown>) => any,
) {
  await act(async () => {
    for (let i = pending.length - 1; i >= 0; i--) {
      if (pending[i].path === path) {
        const { params, resolve } = pending.splice(i, 1)[0];
        resolve(respond(params));
      }
    }
  });
  await act(async () => {});
}

describe("useArticle 队列通道（订阅详情）", () => {
  beforeEach(() => {
    pending.length = 0;
    frameLog.length = 0;
    apiGetMock.mockClear();
  });

  it("首次进入：无缓存页即报 loading（骨架），不闪空态", async () => {
    renderHarness(1);
    // 同步首帧：fetch 在途 → LOADING
    expect(screen.getByTestId("state").textContent).toBe("LOADING");

    await flush("/articles", () => page("a", 2));
    expect(screen.getByTestId("state").textContent).toBe("READY");
  });

  it("切筛选（新查询键、无缓存）：切换帧必须 LOADING，绝不 EMPTY", async () => {
    const { rerender } = renderHarness(1);
    await flush("/articles", () => page("a", 2));
    expect(screen.getByTestId("state").textContent).toBe("READY");

    // 切到「全部」（readStatus null → 新键，缓存未命中，请求在途）
    rerender(
      <MemoryRouter initialEntries={["/"]}>
        <Harness readStatus={null} />
      </MemoryRouter>,
    );
    // 同步帧断言：修复前这里是 EMPTY（闪空态的复现点）
    expect(screen.getByTestId("state").textContent).toBe("LOADING");

    await flush("/articles", () => page("b", 3));
    expect(screen.getByTestId("state").textContent).toBe("READY");
  });

  it("合法空结果：fetch 完成后才允许 EMPTY（不误伤空态语义）", async () => {
    renderHarness(1);
    expect(screen.getByTestId("state").textContent).toBe("LOADING");
    await flush("/articles", () => page("empty", 0));
    expect(screen.getByTestId("state").textContent).toBe("EMPTY");
  });

  it("未读页源棱镜选源（sourceUuid 变化）：全程无 EMPTY 帧（含播种间隙）", async () => {
    frameLog.length = 0;
    const view = render(wrap(<Harness queue={false} readStatus={1} />));
    // 非队列走 initial-sections 一次性首屏
    await flush("/articles/initial-sections", () => [
      { bucket: "today", list: page("a", 2).list, total: 2 },
    ]);
    expect(screen.getByTestId("state").textContent).toBe("READY");

    // 选源 → sourceUuid 进查询 → 新键 initial-sections 在途；
    // 同步切换帧必须 LOADING（currentLoading 派生），绝不 EMPTY
    view.rerender(
      wrap(<Harness queue={false} readStatus={1} sourceUuid="src-1" />),
    );
    expect(screen.getByTestId("state").textContent).toBe("LOADING");

    await flush("/articles/initial-sections", () => [
      { bucket: "today", list: page("s", 1).list, total: 1 },
    ]);
    expect(screen.getByTestId("state").textContent).toBe("READY");
    // 播种间隙回归位：initial-sections 落地到桶通道吃进种子之间有一帧
    // initial.loading=false 且桶页为空——修复前该帧 isEmpty 误真闪 EMPTY
    expect(frameLog).not.toContain("EMPTY");
    expect(frameLog[0]).toBe("LOADING");
  });
});
