import { ipcRenderer, IpcRendererEvent } from 'electron';
import { ArticleStore } from '../view/stores';
import {
  FINISH_INITIAL_SYNC,
  FINISH_MANUAL_SYNC_UNREAD,
  MANUAL_SYNC_UNREAD,
  UPDATE_WINDOW_ID,
} from './constant';

let targetId = 0;

export const initEvent = () => {
  const articleStore = new ArticleStore();

  function handleFinishInitialSync() {
    articleStore
      .getAllList()
      .then((list) => {
        return list;
      })
      .catch((err) => {
        return err;
      });
  }

  ipcRenderer.on(FINISH_INITIAL_SYNC, () => {
    handleFinishInitialSync();
  });
  ipcRenderer.on(FINISH_MANUAL_SYNC_UNREAD, () => {
    console.log('手动同步完成，重新查询数据');
  });

  // 发送给background
  ipcRenderer.on(MANUAL_SYNC_UNREAD, () => {
    console.log('转发-》');
    ipcRenderer.sendTo(targetId, MANUAL_SYNC_UNREAD);
  });
};

ipcRenderer.on(UPDATE_WINDOW_ID, (e: IpcRendererEvent, data) => {
  console.log(e);
  console.log(UPDATE_WINDOW_ID);
  console.log(data);

  targetId = data.backgroundWindowId;
});
