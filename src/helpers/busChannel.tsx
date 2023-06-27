import { Article } from "@/db";
import { eventbus } from "./eventBus";

export const busChannel = eventbus<{
  getChannels: () => void;
  updateChannelUnreadCount: (params: {
    uuid: string;
    article: Article;
    action: "increase" | "decrease" | "upgrade" | "set";
    count: number;
  }) => void;

  goPreviousArticle: () => void;
  goNextArticle: () => void;
}>();
