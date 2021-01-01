import { ipcRenderer, IpcRendererEvent } from 'electron';
import { ChannelStore } from '../view/stores';
import {
  UPDATE_WINDOW_ID,
  FINISH_INITIAL_SYNC,
  MANUAL_SYNC_UNREAD,
  FINISH_MANUAL_SYNC_UNREAD,
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

  function syncUnreadManually() {
    console.log('手动同步，创建任务更新数据');
    ipcRenderer.sendTo(targetId, FINISH_MANUAL_SYNC_UNREAD);
  }

  ipcRenderer.on(MANUAL_SYNC_UNREAD, () => {
    syncUnreadManually();
  });

  syncUnreadWhenAPPStart();
};

ipcRenderer.on(UPDATE_WINDOW_ID, (e: IpcRendererEvent, data) => {
  console.log(e);
  console.log(UPDATE_WINDOW_ID);
  console.log(data);

  targetId = data.mainWindowId;
});
