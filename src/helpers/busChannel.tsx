import { eventbus } from "./eventBus";

export const busChannel = eventbus<{
  getChannels: () => void;
  updateChannelUnreadCount: (params: {
    uuid: string;
    action: "increase" | "decrease" | "upgrade" | "set";
    count: number;
  }) => void;
}>();
