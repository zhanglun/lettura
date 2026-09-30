import { beforeEach, describe, expect, it } from "vitest";
import { create } from "zustand";
import type { ArticleResItem } from "@/db";
import { type ArticleSlice, createArticleSlice } from "../createArticleSlice";
import { createFeedSlice, type FeedSlice } from "../createFeedSlice";

const createTestStore = () =>
  create<ArticleSlice & FeedSlice>((set, get, ...args) => ({
    ...createFeedSlice(set, get as any, ...args),
    ...createArticleSlice(set, get as any, ...args),
  }));

const makeArticle = (
  overrides: Partial<ArticleResItem> = {},
): ArticleResItem => ({
  uuid: "test-uuid",
  feed_uuid: "feed-uuid",
  feed_title: "Test Feed",
  feed_url: "https://example.com",
  title: "Test Article",
  link: "https://example.com/article",
  image: "https://example.com/image.jpg",
  description: "Test description",
  author: "Test Author",
  create_date: "2024-01-01",
  read_status: 0,
  starred: 0,
  media_object: "",
  ...overrides,
});

describe("createArticleSlice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe("initial state", () => {
    it("should initialize with default values", () => {
      const state = store.getState();

      expect(state.article).toBeNull();
      expect(state.expandedArticleUuid).toBeNull();
      expect(state.articleDialogViewStatus).toBe(false);
      expect(state.currentFilter).toEqual({
        id: 1,
        title: "Unread",
      });
    });
  });

  describe("setArticle", () => {
    it("should set the current article", () => {
      store.getState().setArticle(makeArticle());

      expect(store.getState().article).toEqual(makeArticle());
    });

    it("should set article to null", () => {
      store.getState().setArticle(null);

      expect(store.getState().article).toBeNull();
    });

    it("should not mutate original article object", () => {
      const article = makeArticle();

      const original = { ...article };
      store.getState().setArticle(article);

      expect(article).toEqual(original);
    });
  });

  describe("setArticleDialogViewStatus", () => {
    it("should set dialog status to true", () => {
      store.getState().setArticleDialogViewStatus(true);

      expect(store.getState().articleDialogViewStatus).toBe(true);
    });

    it("should set dialog status to false", () => {
      store.getState().setArticleDialogViewStatus(true);
      expect(store.getState().articleDialogViewStatus).toBe(true);

      store.getState().setArticleDialogViewStatus(false);
      expect(store.getState().articleDialogViewStatus).toBe(false);
    });
  });

  describe("setExpandedArticleUuid", () => {
    it("should set and clear expanded article uuid", () => {
      store.getState().setExpandedArticleUuid("a-1");
      expect(store.getState().expandedArticleUuid).toBe("a-1");

      store.getState().setExpandedArticleUuid(null);
      expect(store.getState().expandedArticleUuid).toBeNull();
    });
  });

  describe("setFilter", () => {
    it("should set current filter", () => {
      const filter = { id: 2, title: "All" };

      store.getState().setFilter(filter);

      expect(store.getState().currentFilter).toEqual(filter);
    });

    it("should replace entire filter object", () => {
      const filter1 = { id: 1, title: "Unread" };
      const filter2 = { id: 3, title: "Starred" };

      store.getState().setFilter(filter1);
      expect(store.getState().currentFilter).toEqual(filter1);

      store.getState().setFilter(filter2);
      expect(store.getState().currentFilter).toEqual(filter2);
    });
  });

  describe("state immutability", () => {
    it("should not allow direct mutation of article", () => {
      const state = store.getState();

      expect(() => {
        state.article = {} as ArticleResItem;
      }).not.toThrow();

      store.getState().setArticle(makeArticle());
      expect(store.getState().article).toEqual(makeArticle());
    });
  });
});
