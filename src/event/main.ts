import fs from 'fs';
import path from 'path';
import { ipcMain, ipcRenderer, remote } from 'electron';
import log from 'electron-log';
import { ChannelStore, ArticleStore } from '../view/stores';
import {
  FINISH_INITIAL_SYNC,
  MANUAL_SYNC_UNREAD,
  FINISH_MANUAL_SYNC_UNREAD,
  EXPORT_OPML,
  FINISH_EXPORT_OPML,
  IMPORT_OPML,
  FINISH_IMPORT_OPML,
} from './constant';
import { parseRSS } from '../infra/utils';
import { Channel, RSSFeedItem } from '../infra/types';

type OPMLItem = { title: string; feedUrl: string };

export const initEvent = () => {
  const channelStore = new ChannelStore();
  const articleStore = new ArticleStore();

  function singleFetch(
    requestList: Promise<{ items: RSSFeedItem[] }>[],
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
        ipcRenderer.send(FINISH_INITIAL_SYNC, list);
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
    ipcRenderer.send(FINISH_MANUAL_SYNC_UNREAD);
  }

  async function exportOPMLFile() {
    const channels = await channelStore.getList();
    let $xml = '<xml xmlns="http://www.w3.org/1999/xhtml">';
    let $opml = '<opml version="1.0">';

    channels.forEach((channel) => {
      $opml += `\n    <outline type="rss" text="${channel.title}" title="${channel.title}" xmlUrl="${channel.feedUrl}" htmlUrl="${channel.link}"/>\n`;
    });

    $xml += $opml;
    $xml += '</opml></xml>';

    const downloadPath = remote.app.getPath('downloads');
    let filename = path.resolve(downloadPath, 'salix.opml');
    filename =
      remote.dialog.showSaveDialogSync({
        title: 'Export OPML',
        defaultPath: filename,
      }) || filename;

    log.info('开始导出OPML', filename);

    fs.writeFileSync(filename, $xml);
  }

  /**
   * 导入 OPML
   */

  async function importFeed(item: OPMLItem) {
    const { feedUrl } = item;
    console.log('开始加载 ->', feedUrl);
    const channel = await channelStore.findChannelByUrl(feedUrl);

    if (channel) {
      return false;
    }

    try {
      const channelRes = await parseRSS(feedUrl);
      const { items } = channelRes;
      await channelStore.subscribeChannel(channelRes as Channel, items || []);

      console.log('加载成功 -<', feedUrl);

      return true;
    } catch (err) {
      console.error('Err', err);
      console.log('加载失败 -<', feedUrl);

      return false;
    }
  }

  async function batchImportFeeds(items: OPMLItem[]) {
    const requestList = items.map((item) => {
      return importFeed(item);
    });

    Promise.allSettled(requestList)
      .then((a) => a)
      .catch(() => {});
  }

  /**
   * 手动同步未读文章
   */
  ipcMain.on(MANUAL_SYNC_UNREAD, async () => {
    console.log('----> MANUAL_SYNC_UNREAD');
    await syncUnreadManually();
  });

  /**
   * 导出 OPML
   */
  ipcMain.on(EXPORT_OPML, async (event) => {
    await exportOPMLFile();
    event.reply(FINISH_EXPORT_OPML);
  });

  ipcMain.on(IMPORT_OPML, async (event, { list }: { list: OPMLItem[] }) => {
    log.info('后台开始批量导入订阅', list);
    await batchImportFeeds(list);
    event.reply(FINISH_IMPORT_OPML);
  });

  syncUnreadWhenAPPStart();
};
