import { create } from 'zustand';
import { subscribeWithSelector } from "zustand/middleware";
import { createFeedSlice, FeedSlice } from "@/stores/createFeedSlice";
import { createArticleSlice, ArticleSlice } from "@/stores/createArticleSlice";
import { createUserConfigSlice, UserConfigSlice } from "@/stores/createUserConfigSlice";
import { createPodcastSlice, PodcastSlice } from "@/stores/createPodcastSlice";

export const useBearStore = create<FeedSlice & ArticleSlice & UserConfigSlice & PodcastSlice>()(
  subscribeWithSelector((...a) => {
    return {
      ...createFeedSlice(...a),
      ...createArticleSlice(...a),
      ...createUserConfigSlice(...a),
      ...createPodcastSlice(...a)
    }
  })
)
