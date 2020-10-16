/* eslint-disable class-methods-use-this */
import { makeAutoObservable } from 'mobx';
import Dayjs from 'dayjs';
import RSSParser from 'rss-parser';
import { dbInstance as db } from '../../database';
import { Channel, RSSFeedItem } from '../../infra/types';
import { ArticleReadStatus } from '../../infra/constants/status';

const parser = new RSSParser();

export class ChannelStore {
  feedUrl = '';

  currentChannel = '';

  channelList: Channel[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  async add(url: string): Promise<string> {
    this.feedUrl = url;

    const feed = await this.parseRSS();
    const { items } = feed;

    let result = '';

    delete feed.items;

    try {
      result = await db.channels.put(feed);
      await this.updateFeedItems(feed.feedUrl, feed.title, items);
    } catch (err) {
      console.log(err);
    }

    return result;
  }

  setCurrentChannel(name: string) {
    this.currentChannel = name;
  }

  async getList() {
    const channelList = await db.channels.toArray();

    this.channelList = channelList;

    return channelList;
  }

  async getArticleList(feedUrl: string) {
    const list = await this.getUnreadArticleList(feedUrl);

    list.forEach((item) => {
      item.pubDate = Dayjs(item.pubDate).format('YYYY-MM-DD HH:mm');
      console.log(item);
      return item;
    });

    console.log(list);
    return list;
  }

  async getToadyArticleList() {
    // const query = {
    //   isRead: ArticleReadStatus.unRead,
    // }
    //
    // const list = await db.articles
    //   .where('isRead')
    //   .equals(ArticleReadStatus.unRead)
    //   .and((item) => {
    //     new Date(item.pubDate) > dayjs().startOf('day')
    //   })
    // return list;
  }

  async getUnreadArticleList(feedUrl?: string) {
    const query = {
      isRead: ArticleReadStatus.unRead,
      ...{ feedUrl },
    };

    console.log('query', query);

    const list = await db.articles.where(query).toArray();
    console.log('===>', list);
    return list;
  }

  async updateFeedItems(
    feedUrl: string,
    channelTitle: string,
    items: RSSFeedItem[] = []
  ) {
    if (!items.length) {
      return;
    }

    const values = items.map((item) => {
      return {
        feedUrl,
        channelTitle,
        ...item,
        isRead: 0,
        isLike: 0,
        createDate: new Date().toString(),
        updateDate: new Date().toString(),
      };
    });

    await db.articles.bulkPut(values);
  }

  async parseRSS(): Promise<Omit<Channel, 'id'>> {
    const feed = (await parser.parseURL(this.feedUrl)) as Omit<Channel, 'id'>;

    feed.category = '';
    feed.favicon = `${feed.link}/favicon.ico`;
    feed.tag = '';
    feed.createDate = new Date().toString();
    feed.createDate = new Date().toString();

    return feed;
  }
}
