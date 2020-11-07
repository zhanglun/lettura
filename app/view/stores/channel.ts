/* eslint-disable class-methods-use-this */
import { makeAutoObservable } from 'mobx';
import { getCustomRepository } from 'typeorm';
import { Article, Channel } from '../../infra/types';
import { Channel as ChannelEntity } from '../../entity/channel';
import { Article as ArticleEntity } from '../../entity/article';
import { ChannelRepository } from '../../repository/channel';

export class ChannelStore {
  feedUrl = '';

  currentChannel: ChannelEntity = {} as ChannelEntity;

  currentArticle = {} as Article;

  channelList: Channel[] = [];

  channelRepo = {} as ChannelRepository;

  constructor() {
    makeAutoObservable(this);

    this.channelRepo = getCustomRepository(ChannelRepository);
  }

  /**
   * 添加 feed
   * @param {RSSFeed} feed 解析出来的内容
   */
  async add(feed: Channel): Promise<ChannelEntity | string> {
    // const { items } = feed;
    delete feed.items;

    try {
      const result = await this.channelRepo.addOne(feed);
      // await this.channelRepo.insertFeedItems(feed.feedUrl, feed.title, items);

      return result;
    } catch (err) {
      alert(err.message);
    }

    return '';
  }

  setCurrentChannel(channel: ChannelEntity) {
    this.currentChannel = channel;
  }

  async getList(): Promise<ChannelEntity[]> {
    const list = await this.channelRepo.getAll();

    return list;
  }

  setCurrentView(article: ArticleEntity): number {
    return 1;
  }

  async getArticleList(url: string): Promise<ArticleEntity[]> {
    return [];
  }
}
