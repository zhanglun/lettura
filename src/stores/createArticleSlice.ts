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
  getArticleList: (query: any) => any;
  cursor: number;
  setCursor: (c: number) => number;
  markArticleListAsRead: (isToday: boolean, isAll: boolean) => any;

  updateArticleStatus: (article: ArticleResItem, status: ArticleReadStatus) => any;
  updateArticleAndIdx: (ArticleResItem: ArticleResItem, idx?: number) => void;

  hasMorePrev: boolean;
  setHasMorePrev: (more: boolean) => void;

  hasMoreNext: boolean;
  setHasMoreNext: (more: boolean) => void;

  articleDialogViewStatus: boolean;
  setArticleDialogViewStatus: (status: boolean) => void;

  currentFilter: { id: number; title: string };
  filterList: { id: number; title: string }[];
  setFilter: any;
}

export const createArticleSlice: StateCreator<
  ArticleSlice & FeedSlice,
  [],
  [],
  ArticleSlice
> = (set, get, ...args) => ({
  article: null,
  setArticle: (ArticleResItem: ArticleResItem | null) => {
    set(() => ({
      article: ArticleResItem,
    }));
  },

  articleList: [],
  setArticleList: (list: ArticleResItem[]) => {
    set(() => ({
      articleList: list,
    }));
  },

  getArticleList: (query: any) => {
    const currentList = get().articleList;

    return dataAgent.getArticleList(query).then((res) => {
      const { list } = res.data as { list: ArticleResItem[] };

      get().setArticleList([...currentList, ...list]);

      return list;
    });
  },

  updateArticleStatus: (article: ArticleResItem, status: ArticleReadStatus) => {
    if (article.read_status === status) {
      return Promise.resolve();
    }

    return dataAgent
      .updateArticleReadStatus(article.uuid, status)
      .then((res) => {
        if (res) {
          let isToday = dayjs(
            dayjs(article.create_date).format("YYYY-MM-DD")
          ).isSame(dayjs().format("YYYY-MM-DD"));

          if (status === ArticleReadStatus.READ) {
            console.log("%c Line:80 🥪 ArticleReadStatus.READ", "color:#f5ce50", ArticleReadStatus.READ);
            get().updateCollectionMeta(isToday ? -1 : 0, -1);
            get().updateUnreadCount(article.feed_uuid, "decrease", 1);
          }

          if (status === ArticleReadStatus.UNREAD) {
            get().updateCollectionMeta(isToday ? 1 : 0, 1);
            get().updateUnreadCount(article.feed_uuid, "increase", 1);
          }
        }
      });
  },

  updateArticleAndIdx: (article: ArticleResItem, idx?: number) => {
    set(() => ({
      article,
    }));
  },

  hasMoreNext: true,
  setHasMoreNext: (more: boolean) => {
    set(() => ({ hasMoreNext: more }))
  },

  hasMorePrev: false,
  setHasMorePrev: (more: boolean) => {
    set(() => ({ hasMorePrev: more }))
  },

  cursor: 1,
  setCursor: (c: number) => {
    set(() => ({
      cursor: c,
    }));

    return c;
  },

  markArticleListAsRead(isToday: boolean, isAll: boolean) {
    const feed = get().feed;
    let params: {
      uuid?: string;
      is_today?: boolean;
      is_all?: boolean;
    } = {};

    if (isToday) {
      params.is_today = isToday;
    }

    if (isAll) {
      params.is_all = isAll;
    }

    if (feed) {
      params.uuid = feed.uuid;
    }

    return dataAgent.markAllRead(params).then((res) => {
      const { data } = res;
      console.log("%c Line:131 🍖 data", "color:#e41a6a", data);
      set(() => ({
        articleList: get().articleList.map((_) => {
          _.read_status = 2;
          return _;
        }),
      }));

      get().getFeedList();
      get().initCollectionMetas();

      return data;
    });
  },

  articleDialogViewStatus: false,
  setArticleDialogViewStatus: (status: boolean) => {
    set(() => ({
      articleDialogViewStatus: status,
    }));
  },

  filterList: [
    {
      id: 0,
      title: "All",
    },
    {
      id: 1,
      title: "Unread",
    },
    {
      id: 2,
      title: "Read",
    },
  ],
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
