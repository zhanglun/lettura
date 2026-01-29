import { describe, it, expect, beforeEach } from "vitest";
import { create } from "zustand";
import { createFeedSlice, FeedSlice } from "../createFeedSlice";
import { FeedResItem } from "@/db";

const createTestStore = () =>
  create<FeedSlice>((set, get, ...args) =>
    createFeedSlice(set, get as any, ...args),
  );

describe("createFeedSlice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe("initial state", () => {
    it("should initialize with default values", () => {
      const state = store.getState();

      expect(state.viewMeta).toEqual({
        title: "",
        unread: 0,
        isToday: false,
        isAll: false,
      });
      expect(state.unreadCount).toEqual({});
      expect(state.collectionMeta).toEqual({
        total: { unread: 0 },
        today: { unread: 0 },
      });
      expect(state.feed).toBeNull();
      expect(state.subscribes).toEqual([]);
      expect(state.feedContextMenuTarget).toBeNull();
      expect(state.feedContextMenuStatus).toBe(false);
      expect(state.globalSyncStatus).toBe(false);
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
      const feed: FeedResItem = {
        uuid: "feed-uuid",
        title: "Test Feed",
        link: "https://example.com",
        feed_url: "https://example.com/feed",
        description: "Test description",
        item_type: "feed",
        children: [],
        health_status: 1,
        failure_reason: "",
        unread: 5,
      };

      store.getState().setFeed(feed);

      expect(store.getState().feed).toEqual(feed);
    });

    it("should set feed to null", () => {
      store.getState().setFeed(null);

      expect(store.getState().feed).toBeNull();
    });

    it("should update viewMeta when feed is set", () => {
      const feed: FeedResItem = {
        uuid: "feed-uuid",
        title: "Test Feed",
        link: "https://example.com",
        feed_url: "https://example.com/feed",
        description: "Test description",
        item_type: "feed",
        children: [],
        health_status: 1,
        failure_reason: "",
        unread: 5,
      };

      store.getState().setFeed(feed);

      expect(store.getState().viewMeta).toEqual({
        title: "Test Feed",
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

  describe("setSubscribes", () => {
    it("should set subscribes list", () => {
      const subscribes: FeedResItem[] = [
        {
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
        },
        {
          uuid: "feed-2",
          title: "Feed 2",
          link: "https://example.com",
          feed_url: "https://example.com/feed2",
          description: "Description 2",
          item_type: "feed",
          children: [],
          health_status: 1,
          failure_reason: "",
          unread: 10,
        },
      ];

      store.getState().setSubscribes(subscribes);

      expect(store.getState().subscribes).toEqual(subscribes);
      expect(store.getState().subscribes).toHaveLength(2);
    });

    it("should handle empty array", () => {
      store.getState().setSubscribes([]);

      expect(store.getState().subscribes).toEqual([]);
      expect(store.getState().subscribes).toHaveLength(0);
    });

    it("should replace entire subscribes list", () => {
      const subscribes1: FeedResItem[] = [
        {
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
        },
      ];

      const subscribes2: FeedResItem[] = [
        {
          uuid: "feed-2",
          title: "Feed 2",
          link: "https://example.com",
          feed_url: "https://example.com/feed2",
          description: "Description 2",
          item_type: "feed",
          children: [],
          health_status: 1,
          failure_reason: "",
          unread: 10,
        },
      ];

      store.getState().setSubscribes(subscribes1);
      expect(store.getState().subscribes).toHaveLength(1);

      store.getState().setSubscribes(subscribes2);
      expect(store.getState().subscribes).toHaveLength(1);
      expect(store.getState().subscribes[0].uuid).toBe("feed-2");
    });
  });

  describe("updateFeed", () => {
    it("should update feed by uuid", () => {
      const subscribes: FeedResItem[] = [
        {
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
        },
        {
          uuid: "feed-2",
          title: "Feed 2",
          link: "https://example.com",
          feed_url: "https://example.com/feed2",
          description: "Description 2",
          item_type: "feed",
          children: [],
          health_status: 1,
          failure_reason: "",
          unread: 10,
        },
      ];

      store.getState().setSubscribes(subscribes);

      store.getState().updateFeed("feed-1", {
        title: "Updated Feed 1",
        unread: 15,
      });

      expect(store.getState().subscribes[0].title).toBe("Updated Feed 1");
      expect(store.getState().subscribes[0].unread).toBe(15);
      expect(store.getState().subscribes[1].title).toBe("Feed 2");
    });

    it("should not update other feeds", () => {
      const subscribes: FeedResItem[] = [
        {
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
        },
      ];

      store.getState().setSubscribes(subscribes);

      store.getState().updateFeed("non-existent", {
        title: "Updated",
      });

      expect(store.getState().subscribes[0].title).toBe("Feed 1");
    });
  });

  describe("getSubscribesFromStore", () => {
    it("should return subscribes from store", () => {
      const subscribes: FeedResItem[] = [
        {
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
        },
      ];

      store.getState().setSubscribes(subscribes);

      const result = store.getState().getSubscribesFromStore();

      expect(result).toEqual(subscribes);
    });

    it("should return empty array when no subscribes", () => {
      const result = store.getState().getSubscribesFromStore();

      expect(result).toEqual([]);
    });
  });

  describe("setFeedContextMenuTarget", () => {
    it("should set context menu target", () => {
      const feed: FeedResItem = {
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
      };

      store.getState().setFeedContextMenuTarget(feed);

      expect(store.getState().feedContextMenuTarget).toEqual(feed);
    });

    it("should set target to null", () => {
      store.getState().setFeedContextMenuTarget(null);

      expect(store.getState().feedContextMenuTarget).toBeNull();
    });
  });

  describe("setFeedContextMenuStatus", () => {
    it("should set context menu status to true", () => {
      store.getState().setFeedContextMenuStatus(true);

      expect(store.getState().feedContextMenuStatus).toBe(true);
    });

    it("should set context menu status to false", () => {
      store.getState().setFeedContextMenuStatus(true);
      expect(store.getState().feedContextMenuStatus).toBe(true);

      store.getState().setFeedContextMenuStatus(false);
      expect(store.getState().feedContextMenuStatus).toBe(false);
    });
  });

  describe("openFolder", () => {
    it("should open folder by uuid", () => {
      const subscribes: FeedResItem[] = [
        {
          uuid: "folder-1",
          title: "Folder 1",
          link: "",
          feed_url: "",
          description: "",
          item_type: "folder",
          children: [],
          health_status: 0,
          failure_reason: "",
          unread: 0,
        },
        {
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
        },
      ];

      store.getState().setSubscribes(subscribes);
      store.getState().openFolder("folder-1");

      expect(store.getState().subscribes[0].is_expanded).toBe(true);
      expect(store.getState().subscribes[1].is_expanded).toBe(undefined);
    });
  });

  describe("closeFolder", () => {
    it("should close folder by uuid", () => {
      const subscribes: FeedResItem[] = [
        {
          uuid: "folder-1",
          title: "Folder 1",
          link: "",
          feed_url: "",
          description: "",
          item_type: "folder",
          children: [],
          health_status: 0,
          failure_reason: "",
          unread: 0,
        },
      ];

      store.getState().setSubscribes(subscribes);
      store.getState().openFolder("folder-1");
      expect(store.getState().subscribes[0].is_expanded).toBe(true);

      store.getState().closeFolder("folder-1");
      expect(store.getState().subscribes[0].is_expanded).toBe(false);
    });
  });

  describe("addNewFeed", () => {
    it("should add new feed to the beginning of subscribes", () => {
      const existingSubscribes: FeedResItem[] = [
        {
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
        },
      ];

      store.getState().setSubscribes(existingSubscribes);

      const newFeed: FeedResItem = {
        uuid: "feed-2",
        title: "Feed 2",
        link: "https://example.com",
        feed_url: "https://example.com/feed2",
        description: "Description 2",
        item_type: "feed",
        children: [],
        health_status: 1,
        failure_reason: "",
        unread: 10,
      };

      store.getState().addNewFeed(newFeed);

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

  describe("updateUnreadCount", () => {
    it("should increase unread count for feed", () => {
      const subscribes: FeedResItem[] = [
        {
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
        },
      ];

      store.getState().setSubscribes(subscribes);

      store.getState().updateUnreadCount("feed-1", "increase", 3);

      expect(store.getState().subscribes[0].unread).toBe(8);
    });

    it("should decrease unread count for feed", () => {
      const subscribes: FeedResItem[] = [
        {
          uuid: "feed-1",
          title: "Feed 1",
          link: "https://example.com",
          feed_url: "https://example.com/feed1",
          description: "Description 1",
          item_type: "feed",
          children: [],
          health_status: 1,
          failure_reason: "",
          unread: 10,
        },
      ];

      store.getState().setSubscribes(subscribes);

      store.getState().updateUnreadCount("feed-1", "decrease", 3);

      expect(store.getState().subscribes[0].unread).toBe(7);
    });

    it("should not allow negative unread count", () => {
      const subscribes: FeedResItem[] = [
        {
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
        },
      ];

      store.getState().setSubscribes(subscribes);

      store.getState().updateUnreadCount("feed-1", "decrease", 10);

      expect(store.getState().subscribes[0].unread).toBe(0);
    });
  });

  describe("state immutability", () => {
    it("should not mutate original subscribes array", () => {
      const subscribes: FeedResItem[] = [
        {
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
        },
      ];

      const original = [...subscribes];
      store.getState().setSubscribes(subscribes);

      expect(subscribes).toEqual(original);
    });

    it("should not mutate original feed object", () => {
      const feed: FeedResItem = {
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
      };

      const original = { ...feed };
      store.getState().setFeed(feed);

      expect(feed).toEqual(original);
    });
  });
});
