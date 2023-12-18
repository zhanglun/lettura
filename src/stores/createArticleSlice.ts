import { StateCreator } from "zustand";
import dayjs from "dayjs";
import { ArticleResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { FeedSlice } from "./createFeedSlice";

export interface ArticleSlice {
  article: ArticleResItem | null;
  setArticle: (ArticleResItem: ArticleResItem | null) => void;
  articleList: ArticleResItem[];
  setArticleList: (list: ArticleResItem[]) => void;
  getArticleList: (uuid: string, type: string | null, filter: any) => any;
  getTodayArticleList: (filter: any) => any;
  getAllArticleList: (filter: any) => any;
  cursor: number;
  setCursor: (c: number) => number;
  markArticleListAsRead: (isToday: boolean, isAll: boolean) => any;

  updateArticleAndIdx: (ArticleResItem: ArticleResItem, idx?: number) => void;
  goPreviousArticle: any;
  goNextArticle: any;

  currentIdx: number;
  setCurrentIdx: (idx: number) => void;

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

  getArticleList: (uuid: string, type: string | null, filter: any) => {
    const currentList = get().articleList;

    return dataAgent.getArticleList(uuid, type, filter).then((res) => {
      const { list } = res.data as { list: ArticleResItem[] };

      get().setArticleList([...currentList, ...list]);

      return list;
    });
  },

  getTodayArticleList: (filter: any) => {
    const currentList = get().articleList;

    return dataAgent.getTodayArticleList(filter).then(({ data: res }) => {
      const { list } = res as { list: ArticleResItem[] };

      get().setArticleList([...currentList, ...list]);

      return list;
    });
  },

  getAllArticleList: (filter: any) => {
    const currentList = get().articleList;

    return dataAgent.getAllArticleList(filter).then(({ data: res }) => {
      const { list } = res as { list: ArticleResItem[] };

      get().setArticleList([...currentList, ...list]);

      return list;
    });
  },

  updateArticleAndIdx: (article: ArticleResItem, idx?: number) => {
    console.log("update ArticleResItem and Idx", idx);
    let articleList = get().articleList;

    if (idx === undefined || idx < 0) {
      idx = articleList.findIndex((item) => item.uuid === article.uuid);
      console.log("🚀 ~ file: useBearStore.ts:57 ~ useBearStore ~ idx:", idx);
    }

    if (article.read_status === 1) {
      dataAgent.updateArticleReadStatus(article.uuid, 2).then((res) => {
        if (res) {
          let isToday = dayjs(
            dayjs(article.create_date).format("YYYY-MM-DD")
          ).isSame(dayjs().format("YYYY-MM-DD"));

          get().updateCollectionMeta(isToday ? -1 : 0, -1);
          get().updateUnreadCount(article.feed_uuid, "decrease", 1);

          article.read_status = 2;

          set(() => ({
            article,
            currentIdx: idx,
          }));
        }
      });
    }

    set(() => ({
      article,
      currentIdx: idx,
    }));
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
      set(() => ({
        articleList: get().articleList.map((_) => {
          _.read_status = 2;
          return _;
        }),
      }));

      get().getFeedList();
      get().initCollectionMetas();
    });
  },

  goPreviousArticle() {
    let cur = -1;
    let currentIdx = get().currentIdx;
    let articleList = get().articleList;

    if (currentIdx <= 0) {
      cur = 0;
    } else {
      cur = currentIdx - 1;
    }

    get().updateArticleAndIdx(articleList[cur], cur);
  },

  goNextArticle(): [shouldLoad: boolean] {
    let cur = -1;
    let currentIdx = get().currentIdx;
    let articleList = get().articleList;

    if (currentIdx < articleList.length - 1) {
      cur = currentIdx + 1;
    }

    console.log(
      "%c Line:205 🍕 articleList.length",
      "color:#e41a6a",
      articleList.length
    );
    console.log("%c Line:205 🌶 cur", "color:#3f7cff", cur);

    if (cur === articleList.length - 1) {
      console.error("%c Line:194 🥖 cur", "color:#ed9ec7", "到底了");
      get().setCursor(get().cursor + 1);

      return [true];
    } else {
      get().updateArticleAndIdx(articleList[cur], cur);
    }

    return [false];
  },

  currentIdx: 0,
  setCurrentIdx: (idx: number) => {
    set(() => ({
      currentIdx: idx,
    }));
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
