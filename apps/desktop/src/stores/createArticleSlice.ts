import { StateCreator } from "zustand";
import dayjs from "dayjs";
import { ArticleResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { FeedSlice } from "./createFeedSlice";
import { ArticleReadStatus } from "@/typing";

export interface ArticleSlice {
  article: ArticleResItem | null;
  setArticle: (ArticleResItem: ArticleResItem | null) => void;
  articleList: ArticleResItem[];
  setArticleList: (list: ArticleResItem[]) => void;
  getArticleList: (query: any) => Promise<ArticleResItem[]>;
  cursor: number;
  setCursor: (c: number) => number;
  markArticleListAsRead: (isToday: boolean, isAll: boolean) => Promise<any>;

  updateArticleStatus: (
    article: ArticleResItem,
    status: ArticleReadStatus,
  ) => Promise<void>;
  updateArticleAndIdx: (article: ArticleResItem, idx?: number) => void;

  hasMorePrev: boolean;
  setHasMorePrev: (more: boolean) => void;

  hasMoreNext: boolean;
  setHasMoreNext: (more: boolean) => void;

  articleDialogViewStatus: boolean;
  setArticleDialogViewStatus: (status: boolean) => void;

  currentFilter: { id: number; title: string };
  setFilter: any;

  rightPanelExpanded: boolean;
  setRightPanelExpanded: (expanded: boolean) => void;

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
  rightPanelExpanded: false,
  setArticle: (ArticleResItem: ArticleResItem | null) => {
    set(() => ({
      article: ArticleResItem,
      rightPanelExpanded: ArticleResItem !== null,
    }));
  },
  setRightPanelExpanded: (expanded: boolean) => {
    set(() => ({ rightPanelExpanded: expanded }));
  },

  expandedArticleUuid: null,
  setExpandedArticleUuid: (uuid: string | null) => {
    set(() => ({ expandedArticleUuid: uuid }));
  },

  articleList: [],
  setArticleList: (list: ArticleResItem[]) => {
    set(() => ({
      articleList: list,
    }));
  },

  getArticleList: async (query: any) => {
    const currentList = get().articleList;
    const res = await dataAgent.getArticleList(query);
    const { list } = res.data as { list: ArticleResItem[] };

    get().setArticleList([...currentList, ...list]);

    return list;
  },

  updateArticleStatus: async (article: ArticleResItem, status: ArticleReadStatus) => {
    if (article.read_status === status) {
      return;
    }

    const res = await dataAgent.updateArticleReadStatus(article.uuid, status);

    if (res) {
      const isToday = dayjs(
        dayjs(article.create_date).format("YYYY-MM-DD"),
      ).isSame(dayjs().format("YYYY-MM-DD"));

      if (status === ArticleReadStatus.READ) {
        get().updateCollectionMeta(isToday ? -1 : 0, -1);
        get().updateUnreadCount(article.feed_uuid, "decrease", 1);
      }

      if (status === ArticleReadStatus.UNREAD) {
        get().updateCollectionMeta(isToday ? 1 : 0, 1);
        get().updateUnreadCount(article.feed_uuid, "increase", 1);
      }
    }
  },

  updateArticleAndIdx: (article: ArticleResItem, _idx?: number) => {
    set(() => ({
      article,
    }));
  },

  hasMoreNext: true,
  setHasMoreNext: (more: boolean) => {
    set(() => ({ hasMoreNext: more }));
  },

  hasMorePrev: false,
  setHasMorePrev: (more: boolean) => {
    set(() => ({ hasMorePrev: more }));
  },

  cursor: 1,
  setCursor: (c: number) => {
    set(() => ({
      cursor: c,
    }));

    return c;
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

    const res = await dataAgent.markAllRead(params);
    const { data } = res;

    set(() => ({
      articleList: get().articleList.map((_) => {
        _.read_status = 2;
        return _;
      }),
    }));

    get().getSubscribes();
    get().initCollectionMetas();

    return data;
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
