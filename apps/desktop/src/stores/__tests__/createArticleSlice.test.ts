import { describe, it, expect, beforeEach, vi } from "vitest";
import { create } from "zustand";
import { createArticleSlice, ArticleSlice } from "../createArticleSlice";
import { createFeedSlice, FeedSlice } from "../createFeedSlice";
import { ArticleResItem } from "@/db";

const createTestStore = () =>
  create<ArticleSlice & FeedSlice>((set, get, ...args) => ({
    ...createFeedSlice(set, get as any, ...args),
    ...createArticleSlice(set, get as any, ...args),
  }));

describe("createArticleSlice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe("initial state", () => {
    it("should initialize with default values", () => {
      const state = store.getState();

      expect(state.article).toBeNull();
      expect(state.articleList).toEqual([]);
      expect(state.cursor).toBe(1);
      expect(state.hasMorePrev).toBe(false);
      expect(state.hasMoreNext).toBe(true);
      expect(state.articleDialogViewStatus).toBe(false);
      expect(state.currentFilter).toEqual({
        id: 1,
        title: "Unread",
      });
    });
  });

  describe("setArticle", () => {
    it("should set the current article", () => {
      const article: ArticleResItem = {
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
      };

      store.getState().setArticle(article);

      expect(store.getState().article).toEqual(article);
    });

    it("should set article to null", () => {
      store.getState().setArticle(null);

      expect(store.getState().article).toBeNull();
    });

    it("should not mutate original article object", () => {
      const article: ArticleResItem = {
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
      };

      const original = { ...article };
      store.getState().setArticle(article);

      expect(article).toEqual(original);
    });
  });

  describe("setArticleList", () => {
    it("should set the article list", () => {
      const articles: ArticleResItem[] = [
        {
          uuid: "article-1",
          feed_uuid: "feed-uuid",
          feed_title: "Test Feed",
          feed_url: "https://example.com",
          title: "Article 1",
          link: "https://example.com/article1",
          image: "https://example.com/image1.jpg",
          description: "Description 1",
          author: "Author 1",
          create_date: "2024-01-01",
          read_status: 0,
          starred: 0,
          media_object: "",
        },
        {
          uuid: "article-2",
          feed_uuid: "feed-uuid",
          feed_title: "Test Feed",
          feed_url: "https://example.com",
          title: "Article 2",
          link: "https://example.com/article2",
          image: "https://example.com/image2.jpg",
          description: "Description 2",
          author: "Author 2",
          create_date: "2024-01-02",
          read_status: 0,
          starred: 0,
          media_object: "",
        },
      ];

      store.getState().setArticleList(articles);

      expect(store.getState().articleList).toEqual(articles);
      expect(store.getState().articleList).toHaveLength(2);
    });

    it("should handle empty array", () => {
      store.getState().setArticleList([]);

      expect(store.getState().articleList).toEqual([]);
      expect(store.getState().articleList).toHaveLength(0);
    });

    it("should replace entire list (not append)", () => {
      const articles1: ArticleResItem[] = [
        {
          uuid: "article-1",
          feed_uuid: "feed-uuid",
          feed_title: "Test Feed",
          feed_url: "https://example.com",
          title: "Article 1",
          link: "https://example.com/article1",
          image: "https://example.com/image1.jpg",
          description: "Description 1",
          author: "Author 1",
          create_date: "2024-01-01",
          read_status: 0,
          starred: 0,
          media_object: "",
        },
      ];

      const articles2: ArticleResItem[] = [
        {
          uuid: "article-2",
          feed_uuid: "feed-uuid",
          feed_title: "Test Feed",
          feed_url: "https://example.com",
          title: "Article 2",
          link: "https://example.com/article2",
          image: "https://example.com/image2.jpg",
          description: "Description 2",
          author: "Author 2",
          create_date: "2024-01-02",
          read_status: 0,
          starred: 0,
          media_object: "",
        },
      ];

      store.getState().setArticleList(articles1);
      expect(store.getState().articleList).toHaveLength(1);

      store.getState().setArticleList(articles2);
      expect(store.getState().articleList).toHaveLength(1);
      expect(store.getState().articleList[0].uuid).toBe("article-2");
    });

    it("should not mutate original array", () => {
      const articles: ArticleResItem[] = [
        {
          uuid: "article-1",
          feed_uuid: "feed-uuid",
          feed_title: "Test Feed",
          feed_url: "https://example.com",
          title: "Article 1",
          link: "https://example.com/article1",
          image: "https://example.com/image1.jpg",
          description: "Description 1",
          author: "Author 1",
          create_date: "2024-01-01",
          read_status: 0,
          starred: 0,
          media_object: "",
        },
      ];

      const originalLength = articles.length;
      store.getState().setArticleList(articles);

      expect(articles).toHaveLength(originalLength);
    });
  });

  describe("setCursor", () => {
    it("should set the cursor value", () => {
      store.getState().setCursor(5);

      expect(store.getState().cursor).toBe(5);
    });

    it("should return the cursor value", () => {
      const result = store.getState().setCursor(10);

      expect(result).toBe(10);
      expect(store.getState().cursor).toBe(10);
    });

    it("should handle zero cursor", () => {
      store.getState().setCursor(0);

      expect(store.getState().cursor).toBe(0);
    });

    it("should handle negative cursor (edge case)", () => {
      store.getState().setCursor(-1);

      expect(store.getState().cursor).toBe(-1);
    });
  });

  describe("setHasMorePrev", () => {
    it("should set hasMorePrev to true", () => {
      store.getState().setHasMorePrev(true);

      expect(store.getState().hasMorePrev).toBe(true);
    });

    it("should set hasMorePrev to false", () => {
      store.getState().setHasMorePrev(true);
      expect(store.getState().hasMorePrev).toBe(true);

      store.getState().setHasMorePrev(false);
      expect(store.getState().hasMorePrev).toBe(false);
    });
  });

  describe("setHasMoreNext", () => {
    it("should set hasMoreNext to true", () => {
      store.getState().setHasMoreNext(false);
      store.getState().setHasMoreNext(true);

      expect(store.getState().hasMoreNext).toBe(true);
    });

    it("should set hasMoreNext to false", () => {
      store.getState().setHasMoreNext(false);

      expect(store.getState().hasMoreNext).toBe(false);
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

    it("should handle custom filter", () => {
      const customFilter = { id: 99, title: "Custom Filter" };

      store.getState().setFilter(customFilter);

      expect(store.getState().currentFilter).toEqual(customFilter);
    });
  });

  describe("state immutability", () => {
    it("should not allow direct mutation of article", () => {
      const state = store.getState();

      expect(() => {
        state.article = {} as ArticleResItem;
      }).not.toThrow();

      const article: ArticleResItem = {
        uuid: "test",
        feed_uuid: "feed",
        feed_title: "Feed",
        feed_url: "https://example.com",
        title: "Title",
        link: "https://example.com",
        image: "https://example.com/image.jpg",
        description: "Desc",
        author: "Author",
        create_date: "2024-01-01",
        read_status: 0,
        starred: 0,
        media_object: "",
      };

      store.getState().setArticle(article);
      expect(store.getState().article).toEqual(article);
    });

    it("should not allow direct mutation of articleList", () => {
      const state = store.getState();

      expect(() => {
        state.articleList.push({} as ArticleResItem);
      }).not.toThrow();

      const articles: ArticleResItem[] = [];
      store.getState().setArticleList(articles);
      expect(store.getState().articleList).toEqual(articles);
    });
  });

  describe("updateArticleAndIdx", () => {
    it("should update article", () => {
      const article: ArticleResItem = {
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
      };

      store.getState().updateArticleAndIdx(article);

      expect(store.getState().article).toEqual(article);
    });

    it("should accept optional idx parameter", () => {
      const article: ArticleResItem = {
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
      };

      store.getState().updateArticleAndIdx(article, 5);

      expect(store.getState().article).toEqual(article);
    });
  });
});
