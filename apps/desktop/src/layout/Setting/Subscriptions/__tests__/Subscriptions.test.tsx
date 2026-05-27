import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Subscriptions } from "../index";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getSubscribes: vi.fn(),
  setFeedsSearchQuery: vi.fn(),
  setContextMenuPosition: vi.fn(),
  setFeedContextMenuTarget: vi.fn(),
  syncArticles: vi.fn(() => Promise.resolve()),
  syncAllArticles: vi.fn(),
  setFeed: vi.fn(),
  markAllRead: vi.fn(() => Promise.resolve()),
  moveChannelIntoFolder: vi.fn(() => Promise.resolve()),
  updateIcon: vi.fn(() => Promise.resolve()),
  copyText: vi.fn(() => Promise.resolve()),
  openExternal: vi.fn(),
  storeState: {
    contextMenuPosition: null as { x: number; y: number } | null,
    feedContextMenuTarget: null as Record<string, unknown> | null,
  },
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

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

vi.mock("@/components/AddFeed", () => ({
  AddFeedChannel: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

vi.mock("sonner", () => ({
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
  updateIcon: mocks.updateIcon,
  importOpml: vi.fn(),
  exportOpml: vi.fn(),
}));

vi.mock("@/helpers/copyText", () => ({
  copyText: mocks.copyText,
}));

vi.mock("@tauri-apps/plugin-shell", () => ({
  open: mocks.openExternal,
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
      folderFilter: null,
      globalSyncStatus: false,
      contextMenuPosition: mocks.storeState.contextMenuPosition,
      setContextMenuPosition: mocks.setContextMenuPosition,
      feedContextMenuTarget: mocks.storeState.feedContextMenuTarget,
      setFeedContextMenuTarget: mocks.setFeedContextMenuTarget,
      syncArticles: mocks.syncArticles,
      syncAllArticles: mocks.syncAllArticles,
      getSubscribes: mocks.getSubscribes,
      setFeed: mocks.setFeed,
    }),
}));

describe("Subscriptions settings panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.storeState.contextMenuPosition = null;
    mocks.storeState.feedContextMenuTarget = null;
  });

  it("uses the dedicated settings subscriptions layout from the mockup", () => {
    const { container } = render(<Subscriptions />);

    expect(screen.getByTestId("settings-subscriptions-shell")).toBeInTheDocument();
    expect(screen.getByTestId("settings-subscriptions-admin")).toBeInTheDocument();
    expect(container.querySelector(".settings-subscriptions-toolbar")).toBeInTheDocument();
    expect(container.querySelector(".settings-subscriptions-filterbar")).toBeInTheDocument();
    expect(container.querySelector(".settings-subscriptions-kpi")).toBeInTheDocument();
    expect(container.querySelector(".settings-subscriptions-folder")).toBeInTheDocument();
    expect(container.querySelector(".settings-subscriptions-row")).toBeInTheDocument();
    expect(container.querySelector(".settings-subscriptions-detail")).toBeInTheDocument();
    expect(container.querySelector(".feeds-toolbar")).not.toBeInTheDocument();
  });

  it("shows the selected feed in the detail panel and updates selection from the list", () => {
    render(<Subscriptions />);

    expect(screen.getAllByText("Vercel Blog").length).toBeGreaterThan(0);
    expect(screen.getByText("https://vercel.com/feed")).toBeInTheDocument();

    fireEvent.click(screen.getByText("The Information"));

    expect(screen.getByText("https://rsshub.app/theinformation")).toBeInTheDocument();
    expect(screen.getAllByText("settings.sources.health_broken").length).toBeGreaterThan(0);
  });

  it("filters the management list by broken feeds", () => {
    render(<Subscriptions />);

    fireEvent.click(screen.getByRole("button", { name: "settings.subscriptions.filter_broken 1" }));

    expect(screen.getAllByText("The Information").length).toBeGreaterThan(0);
    expect(screen.queryByText("Vercel Blog")).not.toBeInTheDocument();
    expect(screen.getByText("https://rsshub.app/theinformation")).toBeInTheDocument();
  });

  it("moves the selected feed to another folder", async () => {
    render(<Subscriptions />);

    const moveButton = screen
      .getAllByRole("button", { name: "feeds.ctx.move_to_folder" })
      .find((button) => button.textContent === "feeds.ctx.move_to_folder");
    expect(moveButton).toBeDefined();
    fireEvent.click(moveButton!);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "folder-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mocks.moveChannelIntoFolder).toHaveBeenCalledWith("feed-1", "folder-1", 0);
    });
  });

  it("wires context menu actions to real handlers", () => {
    mocks.storeState.contextMenuPosition = { x: 10, y: 20 };
    mocks.storeState.feedContextMenuTarget = {
      uuid: "feed-1",
      item_type: "channel",
      title: "Vercel Blog",
      link: "https://vercel.com/blog",
      feed_url: "https://vercel.com/feed",
      unread: 5,
      health_status: 0,
      last_sync_date: "2026-05-26T09:56:00Z",
      logo: "",
    };

    render(<Subscriptions />);

    const menuCopyButton = screen
      .getAllByRole("button", { name: "Copy feed URL" })
      .find((button) => button.classList.contains("settings-subscriptions-menu-item"));
    expect(menuCopyButton).toBeDefined();
    fireEvent.click(menuCopyButton!);
    expect(mocks.copyText).toHaveBeenCalledWith("https://vercel.com/feed");
    expect(mocks.setContextMenuPosition).toHaveBeenCalledWith(null);
    expect(mocks.setFeedContextMenuTarget).toHaveBeenCalledWith(null);
  });
});
