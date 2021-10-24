import { ipcRenderer, ipcMain, IpcRendererEvent } from 'electron';
import log from 'electron-log';
// import { ArticleStore, ChannelStore } from '../view/stores';
import {
  FINISH_INITIAL_SYNC,
  FINISH_MANUAL_SYNC_UNREAD,
  MANUAL_SYNC_UNREAD,
  UPDATE_WINDOW_ID,
  EXPORT_OPML,
  FINISH_EXPORT_OPML,
  IMPORT_OPML,
  FINISH_IMPORT_OPML,
  SUBSCRIBE,
  MANUAL_SYNC_UNREAD_WITH_CHANNEL_ID,
} from './constant';
import { Toast } from '../view/components/Toast';

export const initEvent = () => {
  //   const articleStore = new ArticleStore();
  //   const channelStore = new ChannelStore();

  //   function handleFinishInitialSync() {
  //     articleStore
  //       .getAllList()
  //       .then((list) => {
  //         return list;
  //       })
  //       .catch((err) => {
  //         return err;
  //       });
  //   }

  //   ipcRenderer.on(FINISH_INITIAL_SYNC, () => {
  //     handleFinishInitialSync();
  //   });
  //   ipcRenderer.on(FINISH_MANUAL_SYNC_UNREAD, async () => {
  //     log.info('手动同步完成，重新查询数据');
  //     await channelStore.getList();
  //   });

  //   // 发送给background
  //   ipcRenderer.on(MANUAL_SYNC_UNREAD, () => {
  //     log.info('转发-》');
  //     ipcRenderer.sendTo(targetId, MANUAL_SYNC_UNREAD);
  //   });

  //   /** 导出 */
  //   ipcRenderer.on(EXPORT_OPML, () => {
  //     log.info('收到导出操作，转发给background');
  //     ipcRenderer.sendTo(targetId, EXPORT_OPML);
  //   });

  //   ipcRenderer.on(FINISH_EXPORT_OPML, () => {
  //     log.info('OPML导出完成');
  //   });

  //   ipcRenderer.on(IMPORT_OPML, (_e, list) => {
  //     log.info('收到导入操作，转发给background ipcRenderer');
  //     // ipcRenderer.sendTo(targetId, IMPORT_OPML, { list });
  //   });

  //   ipcRenderer.on(FINISH_IMPORT_OPML, () => {
  //     log.info('OPML导入完成');
  //   });
  // };

  // ipcRenderer.on(UPDATE_WINDOW_ID, (e: IpcRendererEvent, data) => {
  //   log.info(e);
  //   log.info(UPDATE_WINDOW_ID);
  //   log.info(data);

  //   targetId = data.backgroundWindowId;
  // });

  ipcRenderer.on(
    SUBSCRIBE,
    (
      _e,
      data: {
        status: string | any;
        message: string;
        err: Error;
      }
    ) => {
      console.log(data);
      const { message, status } = data;

      Toast.show({
        type: status,
        title: message,
      });
    }
  );
};
