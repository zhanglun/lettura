import dayjs from "dayjs";
import type { StateCreator } from "zustand";
import type { ArticleResItem } from "@/db";
import { apiPost } from "@/helpers/http";
import { ArticleReadStatus } from "@/typing";
import type { FeedSlice } from "./createFeedSlice";

export interface ArticleSlice {
  article: ArticleResItem | null;
  setArticle: (nextArticle: ArticleResItem | null) => void;
  markArticleListAsRead: (isToday: boolean, isAll: boolean) => Promise<any>;

  updateArticleStatus: (
    article: ArticleResItem,
    status: ArticleReadStatus,
  ) => Promise<void>;

  articleDialogViewStatus: boolean;
  setArticleDialogViewStatus: (status: boolean) => void;

  currentFilter: { id: number; title: string };
  setFilter: any;

  expandedArticleUuid: string | null;
  setExpandedArticleUuid: (uuid: string | null) => void;
}

export const createArticleSlice: StateCreator<
  ArticleSlice & FeedSlice,
  [],
  [],
  ArticleSlice
> = (set, get) => ({
  article: null,
  setArticle: (nextArticle: ArticleResItem | null) => {
    set(() => ({
      article: nextArticle,
    }));
  },

  expandedArticleUuid: null,
  setExpandedArticleUuid: (uuid: string | null) => {
    set(() => ({ expandedArticleUuid: uuid }));
  },

  updateArticleStatus: async (
    article: ArticleResItem,
    status: ArticleReadStatus,
  ) => {
    if (article.read_status === status) {
      return;
    }

    const res = await apiPost<number>(`/articles/${article.uuid}/read`, {
      read_status: status,
    });

    if (res) {
      const isToday = dayjs(
        dayjs(article.create_date).format("YYYY-MM-DD"),
      ).isSame(dayjs().format("YYYY-MM-DD"));

      if (status === ArticleReadStatus.READ) {
        get().updateCollectionMeta(isToday ? -1 : 0, -1);
        get().updateUnreadCount(article.feed_uuid, "decrease", 1);
        get().updateViewUnread(article.feed_uuid, -1);
      }

      if (status === ArticleReadStatus.UNREAD) {
        get().updateCollectionMeta(isToday ? 1 : 0, 1);
        get().updateUnreadCount(article.feed_uuid, "increase", 1);
        get().updateViewUnread(article.feed_uuid, 1);
      }
    }
  },

  markArticleListAsRead: async (isToday: boolean, isAll: boolean) => {
    const feed = get().feed;
    const params: {
      uuid?: string;
      is_today?: boolean;
      is_all?: boolean;
    } = {};

    if (isToday) params.is_today = isToday;
    if (isAll) params.is_all = isAll;
    if (feed) params.uuid = feed.uuid;

    await apiPost("/mark-all-as-read", params);

    get().getSubscribes();
    get().initCollectionMetas();
  },

  articleDialogViewStatus: false,
  setArticleDialogViewStatus: (status: boolean) => {
    set(() => ({
      articleDialogViewStatus: status,
    }));
  },

  currentFilter: {
    id: 1,
    title: "Unread",
  },
  setFilter: (filter: { id: number; title: string }) => {
    set(() => ({
      currentFilter: filter,
    }));
  },
});
