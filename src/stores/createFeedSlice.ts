import { StateCreator } from "zustand";
import { Channel, FeedResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import pLimit from "p-limit";

export type CollectionMeta = {
  total: { unread: number };
  today: { unread: number };
};

export interface FeedSlice {
  viewMeta: {
    title: string;
    unread: number;
    isToday: boolean;
    isAll: boolean;
  };

  unreadCount: {
    [key: string]: number;
  };

  updateUnreadCount: (uuid: string, action: string, count: number) => void;

  initCollectionMetas: () => void;
  collectionMeta: CollectionMeta;
  updateCollectionMeta: (c: number, n: number) => void;

  setViewMeta: (meta: any) => void;

  feed: FeedResItem | null;
  setFeed: (feed: FeedResItem | null) => void;
  updateFeed: (uuid: string, updater: any) => void;
  feedList: FeedResItem[];
  setFeedList: (list: FeedResItem[]) => void;
  getFeedList: () => any;

  feedContextMenuTarget: FeedResItem | null;
  setFeedContextMenuTarget: (target: FeedResItem | null) => void;
  feedContextMenuStatus: boolean;
  setFeedContextMenuStatus: (status: boolean) => void;

  openFolder: (uuid: string) => void;
  closeFolder: (uuid: string) => void;

  syncArticles: (feed: FeedResItem) => Promise<any>;
  addNewFeed: (feed: FeedResItem) => void;
}

export const createFeedSlice: StateCreator<FeedSlice> = (
  set,
  get,
  ...args
) => ({
  viewMeta: {
    title: "",
    unread: 0,
    isToday: false,
    isAll: false,
  },

  unreadCount: {},

  updateUnreadCount: (uuid: string, action: string, count: number) => {
    const strategy = (action: string, target: any) => {
      switch (action) {
        case "increase": {
          target ? (target.unread += count) : null;
          break;
        }
        case "decrease": {
          target ? (target.unread -= count) : null;
          break;
        }
        case "upgrade": {
          // TODO
          break;
        }

        case "set": {
          target ? (target.unread = count) : null;
          break;
        }
        default: {
          // TODO
        }
      }
    };

    let list = get().feedList.map((feed) => {
      let target: any = feed.uuid === uuid ? feed : null;
      let child: any = feed.children.find((item) => item.uuid === uuid) || null;

      if (child) {
        target = feed;
      }

      if (!(target || child)) {
        return feed;
      }

      strategy(action, target);
      strategy(action, child);

      feed.unread = Math.max(0, feed.unread);

      return feed;
    });

    console.log("%c Line:102 🍢 list", "color:#ea7e5c", list);

    set({
      feedList: list,
    });
  },

  collectionMeta: {
    total: { unread: 0 },
    today: { unread: 0 },
  },

  initCollectionMetas() {
    dataAgent.getCollectionMetas().then(({ data }) => {
      set(() => ({
        collectionMeta: {
          today: { unread: data.today },
          total: { unread: data.total },
        },
      }));
    });
  },

  updateCollectionMeta(today: number, total: number) {
    set(() => ({
      collectionMeta: {
        today: { unread: get().collectionMeta.today.unread + today },
        total: { unread: get().collectionMeta.total.unread + total },
      },
    }));
  },

  setViewMeta(meta) {
    set(() => ({
      viewMeta: meta,
    }));
  },

  feed: null,
  setFeed: (feed: FeedResItem | null) => {
    console.log("%c Line:148 🥛 feed", "color:#fca650", feed);
    set(() => ({
      feed: feed,
    }));

    if (feed) {
      set(() => ({
        viewMeta: {
          title: feed.title,
          unread: feed.unread,
          isToday: false,
          isAll: false,
        },
      }));
    }
  },
  feedList: [],
  setFeedList: (list: FeedResItem[])=> {
    set(() => ({
      feedList: list
    }))
  },
  updateFeed: (uuid: string, updater: any) => {
    set((state) => ({
      feedList: state.feedList.map((feed) => {
        return feed.uuid === uuid
          ? {
              ...feed,
              ...updater,
            }
          : feed;
      }),
    }));
  },
  getFeedList: () => {
    const initUnreadCount = (
      list: any[],
      countCache: { [key: string]: number }
    ) => {
      return list.map((item) => {
        item.unread = countCache[item.uuid] || 0;
        item.is_expanded = false;

        if (item.children) {
          item.children = initUnreadCount(item.children, countCache);
          item.children.forEach((child: FeedResItem) => {
            child.folder_uuid = item.uuid;
            item.unread += child.unread;
          });
        }

        return item;
      });
    };
    return Promise.all([dataAgent.getFeeds(), dataAgent.getUnreadTotal()]).then(
      ([{ data: feedList }, { data: unreadTotal }]) => {
        feedList = initUnreadCount(feedList, unreadTotal);
        set(() => ({
          feedList: feedList || [],
        }));
      }
    );
  },

  feedContextMenuTarget: null,
  setFeedContextMenuTarget: (target: Channel | null) => {
    set(() => ({
      feedContextMenuTarget: target,
    }));
  },
  feedContextMenuStatus: false,
  setFeedContextMenuStatus(status) {
    set(() => ({
      feedContextMenuStatus: status,
    }));
  },

  closeFolder: (uuid: string) => {
    let list = get().feedList;

    list.forEach(_ => {
      if (_.uuid === uuid) {
        _.is_expanded = false;
      }
    });

    set(() => ({
      feedList: [...list]
    }))
  },

  openFolder: (uuid: string) => {
    let list = get().feedList;

    list.forEach(_ => {
      if (_.uuid === uuid) {
        _.is_expanded = true;
      }
    });

    set(() => ({
      feedList: [...list]
    }))
  },

  syncArticles(feed: FeedResItem): Promise<any> {
    const {children} = feed;
    const limit = pLimit(5);
    const fns = (children?.length > 0 ? children : [{...feed}]).map((_) => {
      return limit(() => {
        return dataAgent.syncFeed("feed", _.uuid);
      })
    });

    const collectionMeta = get().collectionMeta;

    return Promise.all(fns)
      .then((resList) => {
        const map = resList.reduce((acu, { data }) => {
          console.log('===> data', data);
          const [[uuid, values] = []] = Object.entries(data);

          if (uuid && values) {
            acu[uuid] = values;
          }

          return acu;
        }, {} as { [key: string]: any});
        let list = get().feedList.map((_) => {
          if (map[_.uuid]) {
            _.unread += map[_.uuid][1]

            collectionMeta.today.unread += map[_.uuid][1]
            collectionMeta.total.unread += map[_.uuid][1]
          }

          if (_.children) {
            _.children.forEach(child => {
              if (map[child.uuid]) {
                child.unread += map[child.uuid][1];
                _.unread += map[child.uuid][1];

                collectionMeta.today.unread += map[child.uuid][1]
                collectionMeta.total.unread += map[child.uuid][1]
              }
            })
          }

          return _;
        })

        set(() => ({
          feedList: list,
          collectionMeta: collectionMeta,
        }))

        return map;
      }).finally(() => {
    })
  },


  addNewFeed(feed) {
    set((state) => ({
      feedList: [feed, ...state.feedList]
    }))
  }
});
