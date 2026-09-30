import { create } from "zustand";
import type { ArticleSlice } from "@/stores/createArticleSlice";
import { createArticleSlice } from "@/stores/createArticleSlice";
import type { FeedSlice } from "@/stores/createFeedSlice";
import { createFeedSlice } from "@/stores/createFeedSlice";
import type { PodcastSlice } from "@/stores/createPodcastSlice";
import { createPodcastSlice } from "@/stores/createPodcastSlice";
import type { UserConfigSlice } from "@/stores/createUserConfigSlice";
import { createUserConfigSlice } from "@/stores/createUserConfigSlice";

export const useAppStore = create<
  FeedSlice & ArticleSlice & UserConfigSlice & PodcastSlice
>()((...a) => {
  return {
    ...createFeedSlice(...a),
    ...createArticleSlice(...a),
    ...createUserConfigSlice(...a),
    ...createPodcastSlice(...a),
  };
});
