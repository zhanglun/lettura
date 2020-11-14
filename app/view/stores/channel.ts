/* eslint-disable class-methods-use-this */
import { makeAutoObservable, runInAction } from 'mobx';
import { getCustomRepository } from 'typeorm';
import { Channel } from '../../infra/types';
import { ChannelType } from '../../infra/constants/status';
import { ChannelEntity } from '../../entity/channel';
import { ChannelRepository } from '../../repository/channel';
import { ArticleRepository } from '../../repository/article';

export class ChannelStore {
  feedUrl: string;

  currentChannel: ChannelEntity = {} as ChannelEntity;

  channelList: Channel[];

  channelRepo: ChannelRepository;

  articleRepo: ArticleRepository;

  type: string;

  constructor() {
    makeAutoObservable(this);

    this.channelRepo = getCustomRepository(ChannelRepository);
    this.articleRepo = getCustomRepository(ArticleRepository);
    this.type = ChannelType.all;
  }

  /**
   * 添加 feed
   * @param {RSSFeed} feed 解析出来的内容
   */
  async add(feed: Channel): Promise<ChannelEntity | string> {
    const { items } = feed;
    delete feed.items;

    try {
      const result = await this.channelRepo.addOne(feed);
      await this.articleRepo.insertArticles(result.id, items);

      return result;
    } catch (err) {
      console.error(err.message);
    }

    return '';
  }

  setCurrentChannel(channel: ChannelEntity) {
    runInAction(() => {
      this.currentChannel = channel;
    });
  }

  setCurrentType(type: string) {
    this.type = type;
  }

  async getList(): Promise<ChannelEntity[]> {
    const list = await this.channelRepo.getAll();

    return list;
  }
}
