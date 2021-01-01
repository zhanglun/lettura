import { ipcRenderer, IpcRendererEvent } from 'electron';
import { ArticleStore } from '../view/stores';
import { FINISH_INITIAL_SYNC, UPDATE_WINDOW_ID } from './constant';

// let targetId = 0;

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
};

ipcRenderer.on(UPDATE_WINDOW_ID, (e: IpcRendererEvent, data) => {
  console.log(e);
  console.log(UPDATE_WINDOW_ID);
  console.log(data);

  // targetId = data.backgroundWindowId;
});
