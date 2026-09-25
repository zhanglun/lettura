import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act, fireEvent } from "@testing-library/react";
import { AddFeedChannel } from "..";

/** 面板只经 dataAgent 与后端说话；Tauri IPC 在 jsdom 里不存在，所以这里全替掉 */
const fetchFeed = vi.fn<[url: string, origin?: string, carrier?: string], Promise<unknown>>();
const subscribeFeed = vi.fn<[url: string, origin?: string, carrier?: string], Promise<unknown>>();
const moveChannelIntoFolder = vi.fn<
  [uuid: string, folder: string, sort: number],
  Promise<number>
>(() => Promise.resolve(1));
const createFolder = vi.fn<[name: string], Promise<number>>(() => Promise.resolve(1));
const navigate = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("@/helpers/dataAgent", () => ({
  fetchFeed: (url: string, origin?: string, carrier?: string) =>
    fetchFeed(url, origin, carrier),
  subscribeFeed: (url: string, origin?: string, carrier?: string) =>
    subscribeFeed(url, origin, carrier),
  moveChannelIntoFolder: (uuid: string, folder: string, sort: number) =>
    moveChannelIntoFolder(uuid, folder, sort),
  createFolder: (name: string) => createFolder(name),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

vi.mock("react-hotkeys-hook", () => ({ useHotkeys: vi.fn() }));

vi.mock("@/helpers/toast", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    message: vi.fn(),
  },
}));

vi.mock("@/helpers/errorHandler", () => ({ showErrorToast: vi.fn() }));

const storeState = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock("@/stores", () => ({
  useBearStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) => selector(storeState.value),
    { getState: () => storeState.value },
  ),
}));

vi.mock("zustand/react/shallow", () => ({ useShallow: (s: unknown) => s }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, v?: Record<string, unknown>) => (v ? `${k}:${JSON.stringify(v)}` : k), i18n: { language: "zh" } }),
}));

const FEED = { title: "少数派", description: "高效工作，品质生活", logo: "", feed_url: "https://sspai.com/feed" };
const ENTRIES = [
  { title: "派评 | 近期值得关注的 App", link: "https://sspai.com/post/1", pub_date: "2026-09-24T08:00:00Z", duration: null },
  { title: "本周看什么", link: "https://sspai.com/post/2", pub_date: "2026-09-23T08:00:00Z", duration: null },
];

const renderPanel = () =>
  render(<AddFeedChannel open onOpenChange={() => {}} />);

const typeInto = (input: HTMLElement, value: string) => {
  fireEvent.change(input, { target: { value } });
};

describe("AddFeedChannel（2026-09-25 重梳理后的流程）", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    storeState.value = {
      subscribes: [],
      userConfig: { rsshub_instance: "https://rsshub.mine.dev", generator_routes: [] },
      addNewFeed: vi.fn(),
      getSubscribes: vi.fn(() => Promise.resolve()),
      initCollectionMetas: vi.fn(),
    };
    fetchFeed.mockReset();
    subscribeFeed.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
    navigate.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("粘站点首页 → 走后端发现 → 预览卡显示源信息与最近条目", async () => {
    fetchFeed.mockResolvedValue({
      feed: FEED,
      resolved_url: "https://sspai.com/feed",
      candidates: ["https://sspai.com/feed"],
      entries: ENTRIES,
      message: "",
    });

    renderPanel();
    typeInto(screen.getByRole("textbox"), "https://sspai.com");
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(fetchFeed).toHaveBeenCalledWith("https://sspai.com", undefined, undefined);
    expect(document.querySelector(".fusion-card .c-t")?.textContent).toBe("少数派");
    expect(document.querySelector(".fusion-card .c-h")?.textContent).toContain("recent");
    expect(Array.from(document.querySelectorAll(".fusion-card .c-row .rt")).map((e) => e.textContent)).toEqual([
      "派评 | 近期值得关注的 App",
      "本周看什么",
    ]);
  });

  it("多个候选：列出 chips 并标出当前生效的那个", async () => {
    fetchFeed.mockResolvedValue({
      feed: FEED,
      resolved_url: "https://sspai.com/feed",
      candidates: ["https://sspai.com/feed", "https://sspai.com/atom.xml"],
      entries: [],
      message: "",
    });

    renderPanel();
    typeInto(screen.getByRole("textbox"), "https://sspai.com");
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    const chips = Array.from(document.querySelectorAll(".fusion-cands button"));
    expect(chips).toHaveLength(2);
    expect(chips[0].className).toContain("on");
    expect(chips[0].textContent).toBe("sspai.com/feed");
  });

  it("已知平台主页走生成器快通道：只发一次请求（跳过整轮发现）并标 generator:<route>", async () => {
    fetchFeed.mockResolvedValue({
      feed: { ...FEED, title: "某 UP 主" },
      resolved_url: "https://rsshub.mine.dev/bilibili/user/2207410",
      candidates: [],
      entries: [],
      message: "",
    });

    renderPanel();
    typeInto(screen.getByRole("textbox"), "https://space.bilibili.com/2207410");
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    await act(async () => {
      await Promise.resolve();
    });

    // 关键：不再先探测主页（省掉 1 + N 个串行请求），直接按路由生成地址
    expect(fetchFeed).toHaveBeenCalledTimes(1);
    expect(fetchFeed).toHaveBeenCalledWith(
      "https://rsshub.mine.dev/bilibili/user/2207410",
      "generator:bilibili",
      "video",
    );
    expect(document.querySelector(".fusion-card .gen")?.textContent).toContain("bilibili/user/2207410");
  });

  it("生成地址被 403 拒绝 → 路由行给出「换实例」的可操作提示（不是笼统的没找到）", async () => {
    fetchFeed.mockResolvedValueOnce({
      feed: null,
      resolved_url: "",
      candidates: [],
      entries: [],
      message: "HTTP 403 Forbidden",
    });

    renderPanel();
    typeInto(screen.getByRole("textbox"), "https://space.bilibili.com/2207410");
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    await act(async () => {
      await Promise.resolve();
    });

    // 测试环境的 t() 回显 key：断"换实例"那句顶替了普通的实例提示
    const genRow = document.querySelector(".fusion-gen")?.textContent || "";
    expect(genRow).toContain("fusion.add.gen_refused");
    expect(genRow).not.toContain("fusion.add.gen_instance");
  });

  it("站点自带 feed 的平台（YouTube）：先走发现，发现不到才回落到生成器", async () => {
    fetchFeed
      .mockResolvedValueOnce({ feed: null, message: "No feed found on that page" })
      .mockResolvedValueOnce({
        feed: { ...FEED, title: "某频道" },
        resolved_url: "https://rsshub.mine.dev/youtube/channel/UCabc",
        candidates: [],
        entries: [],
        message: "",
      });

    renderPanel();
    typeInto(screen.getByRole("textbox"), "https://www.youtube.com/channel/UCabc");
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    await act(async () => {
      await Promise.resolve();
    });

    // 第一次必须是原始频道页（它自己声明了 feed），不是生成地址
    expect(fetchFeed).toHaveBeenNthCalledWith(1, "https://www.youtube.com/channel/UCabc", undefined, undefined);
    expect(fetchFeed).toHaveBeenNthCalledWith(
      2,
      "https://rsshub.mine.dev/youtube/channel/UCabc",
      "generator:youtube",
      "video",
    );
  });

  it("都不行 → 错误态带生成器行；手填路由后按实例预览（用户输入不可控的出口）", async () => {
    fetchFeed
      .mockResolvedValueOnce({ feed: null, message: "No feed found on that page" })
      .mockResolvedValueOnce({ feed: FEED, resolved_url: "https://rsshub.mine.dev/custom/route", candidates: [], entries: [], message: "" });

    renderPanel();
    typeInto(screen.getByRole("textbox"), "https://unknown.example.com/me");
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    const genInput = document.querySelector(".fusion-gen input") as HTMLInputElement;
    expect(genInput).toBeTruthy();
    expect(document.querySelector(".fusion-gen .hp")?.textContent).toContain("https://rsshub.mine.dev");

    typeInto(genInput, "custom/route => video");
    await act(async () => {
      fireEvent.click(screen.getByText("fusion.add.gen_apply"));
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchFeed).toHaveBeenLastCalledWith(
      "https://rsshub.mine.dev/custom/route",
      "generator:custom",
      "video",
    );
  });

  it("订阅成功 → 提交生效地址与类型、toast 报同步篇数、跳到该订阅的源队列", async () => {
    fetchFeed.mockResolvedValue({
      feed: FEED,
      resolved_url: "https://sspai.com/feed",
      candidates: [],
      entries: ENTRIES,
      message: "",
    });
    subscribeFeed.mockResolvedValue([
      { uuid: "feed-uuid-1", title: "少数派", feed_url: "https://sspai.com/feed" },
      12,
      "",
    ]);

    renderPanel();
    typeInto(screen.getByRole("textbox"), "https://sspai.com/feed");
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await act(async () => {
      fireEvent.click(document.querySelector(".fusion-btn-ink-sm") as HTMLElement);
    });

    expect(subscribeFeed).toHaveBeenCalledWith("https://sspai.com/feed", undefined, undefined);
    expect(toastSuccess).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(
      "/local/feeds/feed-uuid-1?feedUuid=feed-uuid-1&feedUrl=https%3A%2F%2Fsspai.com%2Ffeed&type=channel",
    );
    // 不再停在面板上（用户决策：不要"再加一个"循环）
    expect(storeState.value.addNewFeed).toHaveBeenCalled();
  });

  it("重复订阅：报错留在面板（给出口），不跳转", async () => {
    fetchFeed.mockResolvedValue({
      feed: FEED,
      resolved_url: "https://sspai.com/feed",
      candidates: [],
      entries: [],
      message: "",
    });
    subscribeFeed.mockResolvedValue([null, 0, "The content you are trying to subscribe already exists."]);

    renderPanel();
    typeInto(screen.getByRole("textbox"), "https://sspai.com/feed");
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    await act(async () => {
      fireEvent.click(document.querySelector(".fusion-btn-ink-sm") as HTMLElement);
    });

    expect(toastError).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(document.querySelector(".fusion-aerr")).toBeTruthy();
  });
});
