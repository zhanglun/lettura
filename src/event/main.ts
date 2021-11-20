import { ipcMain, ipcRenderer } from 'electron';
import log from 'electron-log';
import { getCustomRepository } from 'typeorm';
import { ChannelEntity } from '../entity/channel';
import { ChannelRepository } from '../repository/channel';
import { ArticleRepository } from '../repository/article';
import {
  SUBSCRIBE,
  FINISH_INITIAL_SYNC,
  MANUAL_SYNC_UNREAD,
  MARK_ARTICLE_READ,
  MARK_ARTICLE_READ_BY_CHANNEL,
  EXPORT_OPML,
  FINISH_EXPORT_OPML,
  IMPORT_OPML,
  FINISH_IMPORT_OPML,
  PROXY_GET_CHANNEL_LIST,
  PROXY_GET_ARTICLE_LIST,
  PROXY_GET_UNREAD_TOTAL,
  PROXY_GET_ARTICLE_LIST_IN_CHANNEL,
} from './constant';
import * as EventDict from './constant';
import { parseRSS } from '../infra/utils';
import { Channel, RSSFeedItem } from '../infra/types';
import { ArticleEntity } from '../entity/article';

type OPMLItem = { title: string; feedUrl: string };

export const initEvent = () => {
  const channelRepo: ChannelRepository = getCustomRepository(ChannelRepository);
  const articleRepo: ArticleRepository = getCustomRepository(ArticleRepository);

  function fetchQueue(
    requestList: Promise<{ items: RSSFeedItem[] }>[],
    idList: string[]
  ) {
    let p: Promise<any> = Promise.resolve();
    const result: any = {};

    requestList.forEach((req, i) => {
      p = req
        .then(async (res) => {
          log.info('请求完成', res);
          const list = await articleRepo.insertArticles(idList[i], res.items);

          log.info('新增', list.length);

          result[idList[i]] = list;
          return result;
        })
        .finally(() => {
          return result;
        });
    });

    return p;
  }

  /**
   * 批量同步文章
   */
  async function batchSyncArticles() {
    const channelList = await channelRepo.getList();
    const channelIdList: string[] = [];
    const requestList: Promise<any>[] = [];

    channelList.forEach((channel) => {
      const { feedUrl, id } = channel;
      requestList.push(parseRSS(feedUrl));
      channelIdList.push(id);
    });

    return fetchQueue(requestList, channelIdList);
  }

  /**
   * 同步单个频道的文章
   */
  async function syncArticlesWithChannelId(channelId: string) {
    const channelList = await channelRepo.getList();
    const channel: ChannelEntity = channelList.filter(
      (c) => c.id === channelId
    )[0];

    if (channel && channel.feedUrl) {
      const { feedUrl, id } = channel;
      const result = await parseRSS(feedUrl);

      return articleRepo.insertArticles(id, result.items || []);
    }

    return [];
  }

  async function syncUnreadManuallyWithChannelId(channelId: string) {
    log.info(`手动同步，${channelId}的文章`);
    await syncArticlesWithChannelId(channelId);
  }

  async function exportOPMLFile() {
    // const channels = await channelStore.getList();
    // let $xml = '<xml xmlns="http://www.w3.org/1999/xhtml">';
    // let $opml = '<opml version="1.0">';
    // channels.forEach((channel) => {
    //   $opml += `\n    <outline type="rss" text="${channel.title}" title="${channel.title}" xmlUrl="${channel.feedUrl}" htmlUrl="${channel.link}"/>\n`;
    // });
    // $xml += $opml;
    // $xml += '</opml></xml>';
    // const downloadPath = remote.app.getPath('downloads');
    // let filename = path.resolve(downloadPath, 'salix.opml');
    // filename =
    //   remote.dialog.showSaveDialogSync({
    //     title: 'Export OPML',
    //     defaultPath: filename,
    //   }) || filename;
    // log.info('开始导出OPML', filename);
    // fs.writeFileSync(filename, $xml);
  }

  /**
   * 导入 OPML
   */
  async function importFeed(item: OPMLItem) {
    const { feedUrl } = item;

    console.log('开始加载 ->', feedUrl);

    const channel = await channelRepo.getOneByUrl(feedUrl);

    if (channel) {
      return false;
    }

    try {
      const channelRes = await parseRSS(feedUrl);
      const { items } = channelRes;
      await channelRepo.subscribeChannel(channelRes as Channel);

      // TODO: 插入文章

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
   * 同步当前频道的文章，并返回频道中所有的未读文章
   */
  ipcMain.on(
    EventDict.MANUAL_SYNC_UNREAD_WITH_CHANNEL_ID,
    async (event, params) => {
      const { channelId, readStatus } = params;
      const channel = await channelRepo.getOneById(channelId);

      // TODO: 同步间隔配置化
      if (
        new Date(channel.lastSyncDate).getTime() <
        new Date().getTime() - 1000 * 10
      ) {
        log.info('同步时间过期，开始同步');
        await syncUnreadManuallyWithChannelId(channelId);

        // 更新最后同步时间
        await channelRepo.updateLastSyncDate(channelId);
      }

      const result = await articleRepo.getArticleListInChannel({
        channelId,
        readStatus,
      });

      event.reply(EventDict.MANUAL_SYNC_UNREAD_WITH_CHANNEL_ID, result);
    }
  );

  /**
   * 导出订阅关系
   */
  ipcMain.on(EXPORT_OPML, async (event) => {
    await exportOPMLFile();
    event.reply(FINISH_EXPORT_OPML);
  });

  ipcMain.on(IMPORT_OPML, async (event, list: OPMLItem[]) => {
    try {
      log.info('后台开始批量导入订阅', list);
      await batchImportFeeds(list);
      event.reply(IMPORT_OPML, {
        status: 'success',
      });
    } catch (err) {
      event.reply(IMPORT_OPML, {
        status: 'error',
        message: err.message,
        err,
      });
    }
  });

  ipcMain.on(SUBSCRIBE, async (event, data) => {
    try {
      const { items = [] } = data;
      const result = await channelRepo.addOne(data as Channel);

      await articleRepo.insertArticles(result.id, items);

      event.reply(SUBSCRIBE, {
        status: 'success',
      });
    } catch (err) {
      event.reply(SUBSCRIBE, {
        status: 'error',
        message: err.message,
        err,
      });
    }
  });

  ipcMain.on(PROXY_GET_CHANNEL_LIST, async (event) => {
    const result = await channelRepo.getAll();

    event.reply(PROXY_GET_CHANNEL_LIST, result);
  });

  /**
   * 获取所有的文章
   */
  ipcMain.on(PROXY_GET_ARTICLE_LIST, async (event, params) => {
    const result = await articleRepo.getAllArticle(params);

    event.reply(PROXY_GET_ARTICLE_LIST, result);
  });

  /**
   * 获取频道中所有的文章
   */
  ipcMain.on(PROXY_GET_ARTICLE_LIST_IN_CHANNEL, async (event, params) => {
    const result = await articleRepo.getArticleListInChannel(params);

    event.reply(PROXY_GET_ARTICLE_LIST_IN_CHANNEL, result);
  });

  /**
   * 获取未读计数总数
   */
  ipcMain.on(PROXY_GET_UNREAD_TOTAL, async (event) => {
    const result = await articleRepo.getUnreadTotal();

    event.reply(PROXY_GET_UNREAD_TOTAL, result);
  });

  ipcMain.on(MARK_ARTICLE_READ, async (event, article) => {
    const result = await articleRepo.markArticleAsRead(article);

    event.reply(MARK_ARTICLE_READ, result);
  });

  ipcMain.on(MARK_ARTICLE_READ_BY_CHANNEL, async (event, { channelId }) => {
    const result = await articleRepo.markArticleAsReadByChannelId(channelId);

    event.reply(MARK_ARTICLE_READ_BY_CHANNEL, result);
  });

  ipcMain.on(EventDict.PROXY_SYNC_ARTICLE_BY_CHANNEL, async (event, params) => {
    const { channelId } = params;
    const channel = await channelRepo.getOneById(channelId);

    let result: ArticleEntity[] = [];
    let synced = false;

    // TODO: 同步间隔配置化
    if (
      channel &&
      new Date(channel.lastSyncDate).getTime() <
        new Date().getTime() - 1000 * 10
    ) {
      log.info('同步时间过期，开始同步');

      // 更新最后同步时间
      await channelRepo.updateLastSyncDate(channelId);

      const res = await parseRSS(channel.feedUrl);

      if (res && res.items) {
        result = (await articleRepo.insertArticles(channelId, res.items)) || [];
      }

      synced = true;
    }

    event.reply(EventDict.PROXY_SYNC_ARTICLE_BY_CHANNEL, {
      synced,
      result,
    });
  });

  /**
   * 取消订阅
   */
  ipcMain.on(EventDict.PROXY_CANCEL_SUBSCRIBE, async (event, params) => {
    const { channelId } = params;

    const res = await channelRepo.cancelSubscribe(channelId);

    event.reply(EventDict.PROXY_CANCEL_SUBSCRIBE, res);
  });

  ipcMain.on(EventDict.PROXY_SYNC_CHANNEL, async (event) => {
    const result = await batchSyncArticles();

    event.reply(EventDict.PROXY_SYNC_CHANNEL, result);
  });
};
