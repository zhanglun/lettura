import { beforeEach, describe, expect, it } from "vitest";
import { create } from "zustand";
import type { FeedResItem } from "@/db";
import { createFeedSlice, type FeedSlice } from "../createFeedSlice";

const createTestStore = () =>
  create<FeedSlice>((set, get, ...args) =>
    createFeedSlice(set, get as any, ...args),
  );

const makeFeed = (overrides: Partial<FeedResItem> = {}): FeedResItem => ({
  uuid: "feed-1",
  title: "Feed 1",
  link: "https://example.com",
  feed_url: "https://example.com/feed1",
  description: "Description 1",
  item_type: "feed",
  children: [],
  health_status: 1,
  failure_reason: "",
  unread: 5,
  ...overrides,
});

describe("createFeedSlice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe("initial state", () => {
    it("should initialize with default values", () => {
      const state = store.getState();

      expect(state.viewMeta).toEqual({
        uuid: null,
        title: "",
        unread: 0,
        isToday: false,
        isAll: false,
      });
      expect(state.collectionMeta).toEqual({
        total: { unread: 0 },
        today: { unread: 0 },
      });
      expect(state.feed).toBeNull();
      expect(state.subscribes).toEqual([]);
      expect(state.subscribesLoaded).toBe(false);
      expect(state.globalSyncStatus).toBe(false);
      expect(state.addFeedModalOpen).toBe(false);
    });
  });

  describe("setViewMeta", () => {
    it("should set view meta", () => {
      const meta = {
        title: "Test Feed",
        unread: 10,
        isToday: true,
        isAll: false,
      };

      store.getState().setViewMeta(meta);

      expect(store.getState().viewMeta).toEqual(meta);
    });

    it("should replace entire viewMeta", () => {
      const meta1 = {
        title: "Feed 1",
        unread: 5,
        isToday: false,
        isAll: false,
      };

      const meta2 = {
        title: "Feed 2",
        unread: 20,
        isToday: true,
        isAll: true,
      };

      store.getState().setViewMeta(meta1);
      expect(store.getState().viewMeta).toEqual(meta1);

      store.getState().setViewMeta(meta2);
      expect(store.getState().viewMeta).toEqual(meta2);
    });
  });

  describe("updateCollectionMeta", () => {
    it("should update collection meta", () => {
      store.getState().updateCollectionMeta(5, 10);

      expect(store.getState().collectionMeta.today.unread).toBe(5);
      expect(store.getState().collectionMeta.total.unread).toBe(10);
    });

    it("should increment values", () => {
      store.getState().updateCollectionMeta(1, 1);

      expect(store.getState().collectionMeta.today.unread).toBe(1);
      expect(store.getState().collectionMeta.total.unread).toBe(1);

      store.getState().updateCollectionMeta(2, 3);

      expect(store.getState().collectionMeta.today.unread).toBe(3);
      expect(store.getState().collectionMeta.total.unread).toBe(4);
    });

    it("should handle negative values", () => {
      store.getState().updateCollectionMeta(10, 20);
      store.getState().updateCollectionMeta(-5, -10);

      expect(store.getState().collectionMeta.today.unread).toBe(5);
      expect(store.getState().collectionMeta.total.unread).toBe(10);
    });
  });

  describe("setFeed", () => {
    it("should set current feed", () => {
      const feed = makeFeed({ uuid: "feed-uuid", title: "Test Feed" });

      store.getState().setFeed(feed);

      expect(store.getState().feed).toEqual(feed);
    });

    it("should set feed to null", () => {
      store.getState().setFeed(null);

      expect(store.getState().feed).toBeNull();
    });

    it("should update viewMeta when feed is set", () => {
      store.getState().setFeed(makeFeed({ uuid: "feed-uuid", unread: 5 }));

      expect(store.getState().viewMeta).toEqual({
        uuid: "feed-uuid",
        title: "Feed 1",
        unread: 5,
        isToday: false,
        isAll: false,
      });
    });

    it("should not update viewMeta when feed is null", () => {
      const originalViewMeta = store.getState().viewMeta;

      store.getState().setFeed(null);

      expect(store.getState().viewMeta).toEqual(originalViewMeta);
    });
  });

  describe("updateUnreadCount", () => {
    it("should increase unread count for feed", () => {
      store.setState({ subscribes: [makeFeed({ unread: 5 })] });

      store.getState().updateUnreadCount("feed-1", "increase", 3);

      expect(store.getState().subscribes[0].unread).toBe(8);
    });

    it("should decrease unread count for feed", () => {
      store.setState({ subscribes: [makeFeed({ unread: 10 })] });

      store.getState().updateUnreadCount("feed-1", "decrease", 3);

      expect(store.getState().subscribes[0].unread).toBe(7);
    });

    it("should not allow negative unread count", () => {
      store.setState({ subscribes: [makeFeed({ unread: 5 })] });

      store.getState().updateUnreadCount("feed-1", "decrease", 10);

      expect(store.getState().subscribes[0].unread).toBe(0);
    });

    it("should bump parent folder unread when a child matches", () => {
      const child = makeFeed({ uuid: "child-1", unread: 2 });
      const folder = makeFeed({
        uuid: "folder-1",
        item_type: "folder",
        unread: 2,
        children: [child],
      });
      store.setState({ subscribes: [folder] });

      store.getState().updateUnreadCount("child-1", "increase", 4);

      expect(store.getState().subscribes[0].unread).toBe(6);
      expect(store.getState().subscribes[0].children?.[0].unread).toBe(6);
    });
  });

  describe("addNewFeed", () => {
    it("should add new feed to the beginning of subscribes", () => {
      store.setState({ subscribes: [makeFeed()] });

      store.getState().addNewFeed(makeFeed({ uuid: "feed-2", unread: 10 }));

      expect(store.getState().subscribes).toHaveLength(2);
      expect(store.getState().subscribes[0].uuid).toBe("feed-2");
      expect(store.getState().subscribes[1].uuid).toBe("feed-1");
    });
  });

  describe("setGlobalSyncStatus", () => {
    it("should set global sync status to true", () => {
      store.getState().setGlobalSyncStatus(true);

      expect(store.getState().globalSyncStatus).toBe(true);
    });

    it("should set global sync status to false", () => {
      store.getState().setGlobalSyncStatus(true);
      expect(store.getState().globalSyncStatus).toBe(true);

      store.getState().setGlobalSyncStatus(false);
      expect(store.getState().globalSyncStatus).toBe(false);
    });
  });

  describe("state immutability", () => {
    it("should not mutate original feed object", () => {
      const feed = makeFeed();

      const original = { ...feed };
      store.getState().setFeed(feed);

      expect(feed).toEqual(original);
    });
  });
});

describe("updateViewUnread", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it("uuid 匹配时递减/递增当前视图未读数（单篇已读链路）", () => {
    store.getState().setFeed(makeFeed({ uuid: "feed-uuid", unread: 3 }));

    store.getState().updateViewUnread("feed-uuid", -1);
    expect(store.getState().viewMeta.unread).toBe(2);
    expect(store.getState().viewMeta.unread).toBeGreaterThanOrEqual(0);

    store.getState().updateViewUnread("feed-uuid", 1);
    expect(store.getState().viewMeta.unread).toBe(3);
  });

  it("uuid 不匹配（today/all 视图）时不动", () => {
    const before = store.getState().viewMeta;
    store.getState().updateViewUnread("other-feed", -1);
    expect(store.getState().viewMeta).toBe(before);
  });
});
