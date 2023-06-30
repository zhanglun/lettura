import { Article } from "@/db";
import { eventbus } from "./eventBus";

export const busChannel = eventbus<{
  getChannels: () => void;

  updateChannelUnreadCount: (params: {
    uuid: string;
    isToday: boolean;
    action: "increase" | "decrease" | "upgrade" | "set";
    count: number;
  }) => void;

  updateCollectionMeta: () => void;
  reloadArticleList: () => void;

  goPreviousArticle: () => void;
  goNextArticle: () => void;
}>();
