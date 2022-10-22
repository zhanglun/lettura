import { eventbus } from "./eventBus";

export const busChannel = eventbus<{
  getChannels: () => void;
}>();
