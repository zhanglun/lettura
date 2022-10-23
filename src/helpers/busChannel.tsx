import { eventbus } from "./eventBus";

export const busChannel = eventbus<{
  getChannels: () => void;
  updateChannelUnreadCount: (params: {
    uuid: string;
    action: "increase" | "decrease";
    count: number;
  }) => void;
}>();
