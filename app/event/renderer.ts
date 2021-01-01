import { ipcRenderer, IpcRendererEvent } from 'electron';
import { ChannelStore, ArticleStore } from '../view/stores';
import { FINISH_INITIAL_SYNC, SYNC_UNREAD_WHEN_START } from './constant';

export const initEvent = () => {
  const channelStore = new ChannelStore();

  function syncUnreadWhenAPPStart() {
    channelStore
      .getList()
      .then((list) => {
        console.log('--->', list);
        ipcRenderer.sendSync(FINISH_INITIAL_SYNC, list);

        return list;
      })
      .catch((err) => {
        return err;
      });
  }

  ipcRenderer.on(SYNC_UNREAD_WHEN_START, (event: IpcRendererEvent, arg) => {
    syncUnreadWhenAPPStart();
  });
};
