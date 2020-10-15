/* eslint-disable class-methods-use-this */
import { makeAutoObservable } from 'mobx';
import RSSParser from 'rss-parser';
import { dbInstance as db } from '../../database';
import { Channel, RSSFeedItem } from '../../infra/types';

const parser = new RSSParser();

export class ChannelStore {
  feedUrl = '';

  currentChannel = '';

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
    // const result = await db.channels.put(feed);

    return result;
  }

  setCurrentChannel(id: string) {
    this.currentChannel = id;
  }

  async getList() {
    return db.channels.toArray();
  }

  async getArticleList(feedUrl: string) {
    const list = await db.articles.toArray();
    console.log(list);
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

    console.log(items);
    const values = items.map((item) => {
      return {
        feedUrl,
        channelTitle,
        ...item,
        isRead: 0,
        isLike: 0,
        createDate: new Date(),
        updateDate: new Date(),
      };
    });

    console.log(values);

    await db.articles.bulkPut(values);
  }

  async parseRSS(): Promise<Omit<Channel, 'id'>> {
    const feed = (await parser.parseURL(this.feedUrl)) as Omit<Channel, 'id'>;

    console.log(feed);

    feed.category = '';
    feed.favicon = `${feed.link}/favicon.ico`;
    feed.tag = '';
    feed.createDate = new Date();
    feed.createDate = new Date();

    return feed;
  }
}
