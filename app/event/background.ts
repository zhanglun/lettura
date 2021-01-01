import { ipcRenderer, IpcRendererEvent } from 'electron';
import { ChannelStore } from '../view/stores';
import {
  UPDATE_WINDOW_ID,
  FINISH_INITIAL_SYNC,
  SYNC_UNREAD_WHEN_START,
} from './constant';

let targetId = 0;

export const initEvent = () => {
  const channelStore = new ChannelStore();

  function syncUnreadWhenAPPStart() {
    channelStore
      .getList()
      .then((list) => {
        ipcRenderer.sendTo(targetId, FINISH_INITIAL_SYNC, list);
        return list;
      })
      .catch((err) => {
        return err;
      });
  }

  ipcRenderer.on(SYNC_UNREAD_WHEN_START, () => {
    syncUnreadWhenAPPStart();
  });

  syncUnreadWhenAPPStart();
};

ipcRenderer.on(UPDATE_WINDOW_ID, (e: IpcRendererEvent, data) => {
  console.log(e);
  console.log(UPDATE_WINDOW_ID);

  targetId = data.mainWindowId;
});
