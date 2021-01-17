/* eslint-disable class-methods-use-this */
import { makeAutoObservable, runInAction } from 'mobx';
import { getCustomRepository } from 'typeorm';
import { Channel, RSSFeedItem } from '../../infra/types';
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
   * 添加 Channel
   * @param {RSSFeed} channel 解析出来的内容
   * @param {RSSFeedItem[]} articles
   */
  async subscribeChannel(
    channel: Channel,
    articles: RSSFeedItem[]
  ): Promise<ChannelEntity | string> {
    try {
      const result = await this.channelRepo.addOne(channel);
      await this.articleRepo.insertArticles(result.id, articles);

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

  async getList(): Promise<Channel[]> {
    return this.channelRepo.getAll();
  }

  async findChannelByUrl(url: string): Promise<ChannelEntity> {
    const channel = await this.channelRepo.find({
      where: {
        feedUrl: url,
      },
    });

    return channel[0];
  }
}
