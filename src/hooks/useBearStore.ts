import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Article, Channel } from "../db";
import { busChannel } from "../helpers/busChannel";
import * as dataAgent from "../helpers/dataAgent";

interface BearStore {
  channel: Channel | null;
  setChannel: (channel: Channel) => void;
  getFeedList: () => any;

  feedContextMenuTarget: Channel | null;
  setFeedContextMenuTarget: (target: Channel) => void;

  article: Article | null;
  setArticle: (article: Article) => void;
  articleList: Article[];
  setArticleList: (list: Article[]) => void;

  updateArticleAndIdx: (article: Article, idx?: number) => void;
  goPreviousArticle: any;
  goNextArticle: any;

  currentIdx: number;
  setCurrentIdx: (idx: number) => void;

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
      setChannel: (channel: Channel) => {
        set(() => ({
          channel: channel,
        }));
      },
      getFeedList: () => {
        dataAgent.getChannels({}).then((res) => {
          console.log("%c Line:44 🍕 res", "color:#7f2b82", res);
        })
      },
      feedContextMenuTarget: null,
      setFeedContextMenuTarget: (target: Channel) => {
        set(() =>({
          feedContextMenuTarget: target,
        }))
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
        console.log(
          "%c Line:108 🍐 goNextArticle",
          "color:#6ec1c2",
          "goNextArticle"
        );
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
        const cfg = {...get().userConfig, ...config};

        console.log("%c Line:167 🍯 cfg", "color:#fca650", cfg);

        dataAgent.updateUserConfig(cfg).then(() => {
          set(() => ({
            userConfig: cfg,
          }))
        });
      }
    };
  })
);
