import { Article } from "@/db";
import { eventbus } from "./eventBus";

export const busChannel = eventbus<{
  getChannels: () => void;

  goPreviousArticle: () => void;

  goNextArticle: () => void;

  addMediaAndPlay: (media: any) => void;
}>();
