import { eventbus } from "./eventBus";

/** 跨页面的轻量通知总线。目前只有订阅变更一个事件：数据动作完成后
 *  广播，AppLayout 统一监听并刷新 subscribes。需要新事件时在这里登记，
 *  不要为单点调用另起 eventbus 实例。 */
export const busChannel = eventbus<{
  getChannels: () => void;
}>();
