/* eslint-disable class-methods-use-this */
import { makeAutoObservable } from 'mobx';
import { dbInstance as db } from '../../model';
import { Article, Channel } from '../../infra/types';
import { channelRepo } from '../../repository/channel';
import { articleRepo } from '../../repository/article';

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
   * 添加 feed
   * @param {RSSFeed} feed 解析出来的内容
   */
  async add(feed: Channel): Promise<string> {
    const { items } = feed;

    let result = '';

    delete feed.items;

    result = await channelRepo.addOne(feed);
    await channelRepo.insertFeedItems(feed.feedUrl, feed.title, items);

    return result;
  }

  setCurrentChannel(channel: Channel) {
    this.currentChannel = channel;
  }

  async getList() {
    const list = await channelRepo.getAll();

    this.channelList = list;

    return list;
  }

  async getArticleList(feedUrl: string) {
    const list = await articleRepo.getAllInChannel(feedUrl);

    return list;
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
