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

  // async add(url: string) {
  //   this.feedUrl = 'https://www.ugediao.com/feed';
  //   const feed = await this.parseRSS();

  //   delete feed.items;
  //   // const result = await db.channels.put(feed);

  //   console.log(result);
  // }

  setCurrentChannel(id: string) {
    this.currentChannel = id;
  }

  // async parseRSS(): Promise<Partial<Channel>> {
  //   const feed = await parser.parseURL(this.feedUrl);
  //   console.log(feed);

  //   feed.category = '';
  //   feed.favicon = `${feed.link}/favicon`;
  //   feed.tag = '';
  //   feed.createTime = new Date();
  //   feed.updateTime = new Date();

  //   return feed;
  // }
}
