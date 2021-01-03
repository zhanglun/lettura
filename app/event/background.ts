import { ipcRenderer, IpcRendererEvent } from 'electron';
import { ChannelStore, ArticleStore } from '../view/stores';
import {
  UPDATE_WINDOW_ID,
  FINISH_INITIAL_SYNC,
  MANUAL_SYNC_UNREAD,
  FINISH_MANUAL_SYNC_UNREAD,
} from './constant';
import { parseRSS } from '../infra/utils';

let targetId = 0;

export const initEvent = () => {
  const channelStore = new ChannelStore();
  const articleStore = new ArticleStore();

  function singleFetch(
    requestList: Promise<any>[],
    idList: string[],
    index = 0
  ) {
    let timer: any = null;
    let count = index;

    if (!requestList[index]) {
      console.log('同步结束');
      return;
    }

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      requestList[count]
        .then((res) => {
          console.log('请求完成', count);
          console.log(res);
          count += 1;
          requestList.unshift();
          singleFetch(requestList, idList, count);

          return articleStore.insertArticles(idList[index], res.items);
        })
        .catch((err) => {
          count += 1;
          requestList.unshift();
          console.log(err);
        });
    }, 1000);
  }

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

  async function syncUnreadManually() {
    console.log('手动同步，创建任务更新数据');
    await batchSyncArticles();
    ipcRenderer.sendTo(targetId, FINISH_MANUAL_SYNC_UNREAD);
  }

  ipcRenderer.on(MANUAL_SYNC_UNREAD, async () => {
    await syncUnreadManually();
  });

  syncUnreadWhenAPPStart();
};

ipcRenderer.on(UPDATE_WINDOW_ID, (e: IpcRendererEvent, data) => {
  console.log(e);
  console.log(UPDATE_WINDOW_ID);
  console.log(data);

  targetId = data.mainWindowId;
});
