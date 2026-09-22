import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { createFeedSlice } from "@/stores/createFeedSlice";
import { createArticleSlice } from "@/stores/createArticleSlice";
import { createUserConfigSlice } from "@/stores/createUserConfigSlice";
import { createPodcastSlice } from "@/stores/createPodcastSlice";
import type { FeedSlice } from "@/stores/createFeedSlice";
import type { ArticleSlice } from "@/stores/createArticleSlice";
import type { UserConfigSlice } from "@/stores/createUserConfigSlice";
import type { PodcastSlice } from "@/stores/createPodcastSlice";

export const useBearStore = create<
  FeedSlice & ArticleSlice & UserConfigSlice & PodcastSlice
>()(
  subscribeWithSelector((...a) => {
    return {
      ...createFeedSlice(...a),
      ...createArticleSlice(...a),
      ...createUserConfigSlice(...a),
      ...createPodcastSlice(...a),
    };
  }),
);
