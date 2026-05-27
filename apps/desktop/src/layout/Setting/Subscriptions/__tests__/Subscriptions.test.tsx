import { render, screen } from "@testing-library/react";
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
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
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

vi.mock("@/layout/Feeds/FeedContextMenu", () => ({
  FeedContextMenu: () => null,
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
      contextMenuPosition: null,
      setContextMenuPosition: mocks.setContextMenuPosition,
      feedContextMenuTarget: null,
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
  });

  it("uses the dedicated settings subscriptions layout from the mockup", () => {
    const { container } = render(<Subscriptions />);

    expect(screen.getByTestId("settings-subscriptions-shell")).toBeInTheDocument();
    expect(container.querySelector(".settings-subscriptions-toolbar")).toBeInTheDocument();
    expect(container.querySelector(".settings-subscriptions-kpi")).toBeInTheDocument();
    expect(container.querySelector(".settings-subscriptions-folder")).toBeInTheDocument();
    expect(container.querySelector(".settings-subscriptions-row")).toBeInTheDocument();
    expect(container.querySelector(".feeds-toolbar")).not.toBeInTheDocument();
  });
});
