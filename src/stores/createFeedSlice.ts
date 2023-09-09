import { StateCreator } from "zustand";
import { Channel, FeedResItem } from "@/db";
import * as dataAgent from '@/helpers/dataAgent';

export interface FeedSlice {
  viewMeta: {
    title: string;
    unread: number;
    isToday: boolean;
    isAll: boolean;
  };

  setViewMeta: (meta: any) => void;

  feed: FeedResItem | null;
  setFeed: (feed: FeedResItem | null) => void;
  updateFeed: (uuid: string, updater: any) => void;
  feedList: FeedResItem[];
  getFeedList: () => any;

  feedContextMenuTarget: FeedResItem | null;
  setFeedContextMenuTarget: (target: FeedResItem | null) => void;
}

export const createFeedSlice: StateCreator<FeedSlice> = (set, get) => ({
  viewMeta: {
    title: "",
    unread: 0,
    isToday: false,
    isAll: false,
  },

  setViewMeta(meta) {
    set(() => ({
      viewMeta: meta,
    }));
  },

  feed: null,
  setFeed: (feed: FeedResItem | null) => {
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

});
