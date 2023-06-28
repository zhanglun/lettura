import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import dayjs from "dayjs";
import { Article, Channel } from "../db";
import { busChannel } from "../helpers/busChannel";
import * as dataAgent from "../helpers/dataAgent";

interface BearStore {
  channel: Channel | null;
  setChannel: (channel: Channel | null) => void;
  updateFeed: (uuid: string, updater: any) => void;
  feedList: Channel[],
  getFeedList: () => any;

  feedContextMenuTarget: Channel | null;
  setFeedContextMenuTarget: (target: Channel | null) => void;

  article: Article | null;
  setArticle: (article: Article | null) => void;
  articleList: Article[];
  setArticleList: (list: Article[]) => void;
  getArticleList: (uuid: string, filter: any) => any;
  getTodayArticleList: (filter: any) => any;
  getAllArticleList: (filter: any) => any;

  updateArticleAndIdx: (article: Article, idx?: number) => void;
  goPreviousArticle: any;
  goNextArticle: any;

  currentIdx: number;
  setCurrentIdx: (idx: number) => void;

  articleDialogViewStatus: boolean;
  setArticleDialogViewStatus: (status: boolean) => void;

  currentFilter: { id: number; title: string };
  filterList: { id: number; title: string }[];
  setFilter: any;

  userConfig: UserConfig;
  getUserConfig: any;
  updateUserConfig: (cfg: UserConfig) => void;
}

export const useBearStore = create<BearStore>()(
  subscribeWithSelector((set, get) => {
    return {
      channel: null,
      setChannel: (channel: Channel | null) => {
        set(() => ({
          channel: channel,
        }));
      },
      feedList: [],
      updateFeed: (uuid: string, updater: any) => {
        set((state) => ({
          feedList: state.feedList.map((feed) => {
            return feed.uuid === uuid ? {
              ...feed,
              ...updater
            } : feed
          }),
        }))
      },
      getFeedList: () => {
        dataAgent.getChannels({}).then((res) => {
          console.log("%c Line:44 🍕 res", "color:#7f2b82", res);
          set(() => ({
            feedList: res.list || [],
          }));
        });
      },
      feedContextMenuTarget: null,
      setFeedContextMenuTarget: (target: Channel | null) => {
        set(() => ({
          feedContextMenuTarget: target,
        }));
      },

      article: null,
      setArticle: (article: Article | null) => {
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

      getArticleList: (uuid: string, filter: any) => {
        console.log("%c Line:75 🍰 filter", "color:#fca650", filter);
        const currentList = get().articleList;

        return dataAgent.getArticleList(uuid, filter).then((res) => {
          const { list } = res as { list: Article[] };

          get().setArticleList([...currentList, ...list]);

          return list;
        });
      },

      getTodayArticleList: (filter: any) => {
        const currentList = get().articleList;

        return dataAgent.getTodayArticleList(filter).then((res) => {
          const { list } = res as { list: Article[] };

          get().setArticleList([...currentList, ...list]);

          return list;
        });
      },

      getAllArticleList: (filter: any) => {
        const currentList = get().articleList;

        return dataAgent.getAllArticleList(filter).then((res) => {
          const { list } = res as { list: Article[] };

          get().setArticleList([...currentList, ...list]);

          return list;
        });
      },


      updateArticleAndIdx: (article: Article, idx?: number) => {
        console.log("update Article and Idx", idx);
        let articleList = get().articleList;

        if (idx === undefined || idx < 0) {
          idx = articleList.findIndex((item) => item.uuid === article.uuid);
          console.log(
            "🚀 ~ file: useBearStore.ts:57 ~ useBearStore ~ idx:",
            idx
          );
        }

        if (article.read_status === 1) {
          dataAgent.updateArticleReadStatus(article.uuid, 2).then((res) => {
            if (res) {
              busChannel.emit("updateChannelUnreadCount", {
                uuid: article.channel_uuid,
                isToday: dayjs(dayjs(article.create_date).format("YYYY-MM-DD")).isSame( dayjs().format("YYYY-MM-DD")),
                action: "decrease",
                count: 1,
              });

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

      goNextArticle() {
        let cur = -1;
        let currentIdx = get().currentIdx;
        let articleList = get().articleList;

        if (currentIdx < articleList.length - 1) {
          cur = currentIdx + 1;
        }

        get().updateArticleAndIdx(articleList[cur], cur);
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
          articleDialogViewStatus: status
        }))
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

      userConfig: {},

      getUserConfig: () => {
        dataAgent.getUserConfig().then((res) => {
          set(() => ({
            userConfig: res,
          }));
        });
      },

      updateUserConfig: (config: UserConfig) => {
        const cfg = { ...get().userConfig, ...config };

        dataAgent.updateUserConfig(cfg).then(() => {
          set(() => ({
            userConfig: cfg,
          }));
        });
      },
    };
  })
);
