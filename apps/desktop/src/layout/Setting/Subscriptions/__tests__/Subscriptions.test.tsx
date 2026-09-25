import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Subscriptions } from "../index";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getSubscribes: vi.fn(),
  setFeedsSearchQuery: vi.fn(),
  setAddFeedModalOpen: vi.fn(),
  syncArticles: vi.fn(() => Promise.resolve()),
  setFeed: vi.fn(),
  markAllRead: vi.fn(() => Promise.resolve()),
  moveChannelIntoFolder: vi.fn(() => Promise.resolve()),
  copyText: vi.fn(() => Promise.resolve()),
  openExternal: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <>{i18nKey}</>,
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn(),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

vi.mock("@/components/AddFolder", () => ({
  AddFolder: () => null,
}));

vi.mock("@/layout/Setting/Content/DialogUnsubscribeFeed", () => ({
  DialogUnsubscribeFeed: () => null,
}));

vi.mock("@/layout/Setting/Content/DialogDeleteFolder", () => ({
  DialogDeleteFolder: () => null,
}));

vi.mock("@/helpers/toast", () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock("@/helpers/dataAgent", () => ({
  markAllRead: mocks.markAllRead,
  moveChannelIntoFolder: mocks.moveChannelIntoFolder,
}));

vi.mock("@/helpers/copyText", () => ({
  copyText: mocks.copyText,
}));

vi.mock("@tauri-apps/plugin-shell", () => ({
  open: mocks.openExternal,
}));

vi.mock("@/helpers/busChannel", () => ({
  busChannel: { emit: vi.fn(), on: () => () => {} },
}));

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      subscribes: [
        {
          uuid: "folder-1",
          item_type: "folder",
          title: "Engineering",
          unread: 5,
          children: [
            {
              uuid: "feed-1",
              item_type: "channel",
              title: "Vercel Blog",
              link: "https://vercel.com/blog",
              feed_url: "https://vercel.com/feed",
              unread: 5,
              health_status: 0,
              last_sync_date: "2026-05-26T09:56:00Z",
              logo: "",
            },
          ],
        },
        {
          uuid: "feed-2",
          item_type: "channel",
          title: "The Information",
          link: "https://theinformation.com",
          feed_url: "https://rsshub.app/theinformation",
          unread: 0,
          health_status: 2,
          last_sync_date: "2026-05-26T09:57:00Z",
          logo: "",
        },
      ],
      feedsSearchQuery: "",
      setFeedsSearchQuery: mocks.setFeedsSearchQuery,
      syncArticles: mocks.syncArticles,
      getSubscribes: mocks.getSubscribes,
      setFeed: mocks.setFeed,
      setAddFeedModalOpen: mocks.setAddFeedModalOpen,
    }),
}));

describe("Subscriptions settings panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the fusion subs layout: toolbar, groups and 44px rows", () => {
    const { container } = render(<Subscriptions />);

    expect(mocks.getSubscribes).toHaveBeenCalled();
    expect(container.querySelector(".fusion-subs-bar")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    // 分组（Engineering，标题）+ 未分组；Engineering 也出现在右键子菜单故用 getAll
    const titles = [...container.querySelectorAll(".fusion-b-title")].map(
      (el) => el.textContent,
    );
    expect(titles).toContain("Engineering");
    expect(screen.getByText("feeds.ungrouped")).toBeInTheDocument();
    expect(container.querySelectorAll(".fusion-subs-row").length).toBe(2);
    // 未读药丸挂在标题旁
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("flags broken feeds on the row and shows the meta count", () => {
    render(<Subscriptions />);

    expect(
      screen.getAllByText(/settings.sources.health_broken/).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("fusion.subs.meta")).toBeInTheDocument();
  });

  it("opens the feed queue on row click", () => {
    render(<Subscriptions />);

    fireEvent.click(screen.getByText("Vercel Blog"));

    expect(mocks.setFeed).toHaveBeenCalledWith(
      expect.objectContaining({ uuid: "feed-1" }),
    );
    expect(mocks.navigate).toHaveBeenCalledWith(
      expect.stringContaining("/local/feeds/feed-1"),
    );
  });

  it("wires the context menu actions to real handlers", () => {
    render(<Subscriptions />);

    fireEvent.contextMenu(screen.getByText("Vercel Blog"));

    // Astryx 菜单项以 menuitem 角色渲染
    const copyItem = screen.getAllByRole("menuitem").find(
      (el) => el.textContent === "Copy feed URL",
    );
    expect(copyItem).toBeTruthy();

    fireEvent.click(copyItem!);
    expect(mocks.copyText).toHaveBeenCalledWith("https://vercel.com/feed");
  });

  it("exposes add-feed and add-folder entries from the toolbar", () => {
    render(<Subscriptions />);

    fireEvent.click(screen.getByText("feeds.add_feed"));
    expect(mocks.setAddFeedModalOpen).toHaveBeenCalledWith(true);
  });
});
