import { ipcRenderer, IpcRendererEvent } from 'electron';
import log from 'electron-log';
import { ChannelStore, ArticleStore } from '../view/stores';
import {
  UPDATE_WINDOW_ID,
  FINISH_INITIAL_SYNC,
  MANUAL_SYNC_UNREAD,
  FINISH_MANUAL_SYNC_UNREAD,
  EXPORT_OPML,
  FINISH_EXPORT_OPML,
} from './constant';
import { parseRSS } from '../infra/utils';

let targetId = 0;

export const initEvent = () => {
  const channelStore = new ChannelStore();
  const articleStore = new ArticleStore();

  function singleFetch(
    requestList: Promise<void>[],
    idList: string[],
    index = 0
  ) {
    let timer: any = null;
    let count = index;

    if (!requestList[index]) {
      log.info('同步结束');
      return;
    }

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      requestList[count]
        .then((res) => {
          log.info('请求完成', count);
          count += 1;
          requestList.unshift();
          singleFetch(requestList, idList, count);

          return articleStore.insertArticles(idList[index], res.items);
        })
        .catch((err) => {
          count += 1;
          requestList.unshift();
          log.info(err);
        });
    }, 1000);
  }

  /**
   * 批量同步文章
   */
  async function batchSyncArticles() {
    const channelList = await channelStore.getList();
    const channelIdList: string[] = [];
    const requestList: Promise<any>[] = [];

    channelList.forEach((channel) => {
      const { feedUrl, id } = channel;

      requestList.push(parseRSS(feedUrl));
      channelIdList.push(id);
    });

    singleFetch(requestList, channelIdList, 0);
  }

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

  /**
   * 手动更新
   */
  async function syncUnreadManually() {
    log.info('手动同步，创建任务更新数据');
    await batchSyncArticles();
    ipcRenderer.sendTo(targetId, FINISH_MANUAL_SYNC_UNREAD);
  }

  async function exportOPMLFile() {
    log.info('开始导出OPML');
  }

  /**
   * 手动同步未读文章
   */
  ipcRenderer.on(MANUAL_SYNC_UNREAD, async () => {
    await syncUnreadManually();
  });

  /**
   * 导出 OPML
   */
  ipcRenderer.on(EXPORT_OPML, async () => {
    await exportOPMLFile();
    ipcRenderer.sendTo(targetId, FINISH_EXPORT_OPML);
  });

  syncUnreadWhenAPPStart();
};

ipcRenderer.on(UPDATE_WINDOW_ID, (e: IpcRendererEvent, data) => {
  log.info(e);
  log.info(UPDATE_WINDOW_ID);
  log.info(data);

  targetId = data.mainWindowId;
});
