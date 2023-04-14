import {create, State} from "zustand";
import { Article, Channel } from "../db";

interface BearStore {
  channel: Channel | null;
  setChannel: (channel: Channel) => void;

  article: Article | null;
  setArticle: (article: Article) => void;
  articleList: Article[];
  setArticleList: (list: Article[]) => void;

  updateArticleAndIdx: (article: Article, idx?: number) => void;

  currentIdx: number;
  setCurrentIdx: (idx: number) => void;

  currentFilter: { id: number; title: string };
  filterList: { id: number; title: string }[];
  setFilter: any;
}

export const useBearStore = create<BearStore>()((set) => {
  return {
    channel: null,
    setChannel: (channel: Channel) => {
      set(() => ({
        channel: channel,
      }));
    },

    article: null,
    setArticle: (article: Article) => {
      set(() => ({
        article: article,
      }));
    },

    articleList: [],
    setArticleList: (list: Article[]) => {
      set(() => ({
        articleList: list,
      }));
    },

    updateArticleAndIdx: (article: Article, idx?: number) => {
      set(() => {
        console.log('update Article and Idx', idx);

        if (idx) {
          return {
            article,
            currentIdx: idx,
          }
        } else {
          return {
            article,
            currentIdx: idx,
          }
        }
      })
    },

    currentIdx: 0,
    setCurrentIdx: (idx: number) => {
      set(() => ({
        currentIdx: idx,
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
    setFilter: (filter: {id: number, title: string}) => {
      set(() => ({
        currentFilter: filter
      }))
    }
  };
});
