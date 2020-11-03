/* eslint-disable class-methods-use-this */
import { makeAutoObservable } from 'mobx';
import { getCustomRepository } from 'typeorm';
import { Article, Channel } from '../../infra/types';
import { ChannelRepository } from '../../repository/channel';

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

  channelRepo = {} as ChannelRepository;

  constructor() {
    makeAutoObservable(this);

    this.channelRepo = getCustomRepository(ChannelRepository);
  }

  /**
   * 添加 feed
   * @param {RSSFeed} feed 解析出来的内容
   */
  async add(feed: Channel): Promise<string> {
    // const { items } = feed;
    delete feed.items;

    // await channelRepo.addOne(feed);
    // await channelRepo.insertFeedItems(feed.feedUrl, feed.title, items);

    return '';
  }

  setCurrentChannel(channel: Channel) {
    this.currentChannel = channel;
  }

  // async getList() {
  //   const list = await channelRepo.getAll();
  //
  //   this.channelList = list;
  //
  //   return list;
  // }
}
