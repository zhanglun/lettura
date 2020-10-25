/* eslint-disable class-methods-use-this */
import { makeAutoObservable } from 'mobx';
import Dayjs from 'dayjs';
import RSSParser from 'rss-parser';
import { dbInstance as db } from '../../database';
import { Article, Channel, RSSFeedItem } from '../../infra/types';
import { ArticleReadStatus } from '../../infra/constants/status';

const parser = new RSSParser();

export class ChannelStore {
  feedUrl = '';

  currentChannel: Channel = {
    title: '',
    feedUrl: '',
    favicon: '',
    category: '',
    tag: '',
    createDate: '',
    updateDate: '',
    link: '',
    description: '',
  };

  currentArticle = {} as Article;

  channelList: Channel[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * 添加 feed url
   * @param {string} url feed url
   */
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

  setCurrentChannel(channel: Channel) {
    this.currentChannel = channel;
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
      return item;
    });

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
      ...(feedUrl ? { feedUrl } : {}),
    };

    const list = await db.articles.where(query).toArray();

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

    const values = items.map(
      (item): Article => {
        return {
          feedUrl,
          channelTitle,
          ...item,
          isRead: 0,
          isLike: 0,
          createDate: new Date().toString(),
          updateDate: new Date().toString(),
        };
      }
    );

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

  setCurrentView(article: Article) {
    this.currentArticle = article;

    db.articles
      .where('link')
      .equals(article.link)
      .modify({ isRead: 1 })
      .then((a) => {
        console.log('isRead', a);
        return a;
      })
      .catch((e) => {
        console.log(e);
      });
  }
}
