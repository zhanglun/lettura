import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddFeedChannel } from "..";

/** 面板经 Tauri invoke 与后端说话；IPC 在 jsdom 里不存在，所以这里全替掉 */
const fetchFeed = vi.fn<
  [url: string, origin?: string, carrier?: string],
  Promise<unknown>
>();
const subscribeFeed = vi.fn<
  [url: string, origin?: string, carrier?: string],
  Promise<unknown>
>();
const createFolder = vi.fn<[name: string], Promise<number>>(() =>
  Promise.resolve(1),
);
const navigate = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn((command: string, args: any) => {
    if (command === "fetch_feed") {
      return fetchFeed(args.url, args.origin, args.carrier);
    }
    if (command === "add_feed") {
      return subscribeFeed(args.url, args.origin, args.carrier);
    }
    if (command === "create_folder") return createFolder(args.name);
    return Promise.resolve([]);
  }),
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
  useAppStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector(storeState.value),
    { getState: () => storeState.value },
  ),
}));

vi.mock("zustand/react/shallow", () => ({ useShallow: (s: unknown) => s }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, v?: Record<string, unknown>) =>
      v ? `${k}:${JSON.stringify(v)}` : k,
    i18n: { language: "zh" },
  }),
}));

const FEED = {
  title: "少数派",
  description: "高效工作，品质生活",
  logo: "",
  feed_url: "https://sspai.com/feed",
};
const ENTRIES = [
  {
    title: "派评 | 近期值得关注的 App",
    link: "https://sspai.com/post/1",
    pub_date: "2026-09-24T08:00:00Z",
    duration: null,
  },
  {
    title: "本周看什么",
    link: "https://sspai.com/post/2",
    pub_date: "2026-09-23T08:00:00Z",
    duration: null,
  },
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
      userConfig: {},
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

    expect(fetchFeed).toHaveBeenCalledWith(
      "https://sspai.com",
      undefined,
      undefined,
    );
    expect(document.querySelector(".fusion-card .c-t")?.textContent).toBe(
      "少数派",
    );
    expect(document.querySelector(".fusion-card .c-h")?.textContent).toContain(
      "recent",
    );
    expect(
      Array.from(document.querySelectorAll(".fusion-card .c-row .rt")).map(
        (e) => e.textContent,
      ),
    ).toEqual(["派评 | 近期值得关注的 App", "本周看什么"]);
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
    expect(chips[0].getAttribute("aria-pressed")).toBe("true");
    expect(chips[0].getAttribute("aria-label")).toContain("sspai.com/feed");
  });

  it("站点自带 feed 的生成器（Newsletter）：先走发现，发现不到才回落到生成的 feed 地址", async () => {
    fetchFeed
      .mockResolvedValueOnce({
        feed: null,
        message: "No feed found on that page",
      })
      .mockResolvedValueOnce({
        feed: { ...FEED, title: "某 Newsletter" },
        resolved_url: "https://foo.substack.com/feed",
        candidates: [],
        entries: [],
        message: "",
      });

    renderPanel();
    typeInto(screen.getByRole("textbox"), "https://foo.substack.com");
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    await act(async () => {
      await Promise.resolve();
    });

    // 第一次必须是原始主页（它自己声明了 feed），不是生成地址
    expect(fetchFeed).toHaveBeenNthCalledWith(
      1,
      "https://foo.substack.com",
      undefined,
      undefined,
    );
    expect(fetchFeed).toHaveBeenNthCalledWith(
      2,
      "https://foo.substack.com/feed",
      "generator:newsletter",
      "email",
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
      {
        uuid: "feed-uuid-1",
        title: "少数派",
        feed_url: "https://sspai.com/feed",
      },
      12,
      "",
    ]);

    renderPanel();
    typeInto(screen.getByRole("textbox"), "https://sspai.com/feed");
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    });

    expect(subscribeFeed).toHaveBeenCalledWith(
      "https://sspai.com/feed",
      undefined,
      undefined,
    );
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
    subscribeFeed.mockResolvedValue([
      null,
      0,
      "The content you are trying to subscribe already exists.",
    ]);

    renderPanel();
    typeInto(screen.getByRole("textbox"), "https://sspai.com/feed");
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    });

    expect(toastError).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(document.querySelector(".fusion-aerr")).toBeTruthy();
  });
});
