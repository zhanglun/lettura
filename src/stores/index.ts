import { create } from 'zustand';
import { subscribeWithSelector } from "zustand/middleware";
import { createFeedSlice, FeedSlice } from "@/stores/createFeedSlice";
import { createArticleSlice, ArticleSlice } from "@/stores/createArticleSlice";
import { createUserConfigSlice, UserConfigSlice } from "@/stores/createUserConfigSlice";

export const useBearStore = create<FeedSlice & ArticleSlice & UserConfigSlice>()(
  subscribeWithSelector((...a) => {
    return {
      ...createFeedSlice(...a),
      ...createArticleSlice(...a),
      ...createUserConfigSlice(...a)
    }
  })
)
