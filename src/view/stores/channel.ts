/* eslint-disable class-methods-use-this */
import { makeAutoObservable, runInAction } from 'mobx';
import { getCustomRepository } from 'typeorm';
import { Channel, RSSFeedItem } from '../../infra/types';
import { ChannelType } from '../../infra/constants/status';
import { ChannelEntity } from '../../entity/channel';
import { ChannelRepository } from '../../repository/channel';
import { ArticleRepository } from '../../repository/article';

export class ChannelStore {
  feedUrl = '';

  type = '';

  secondsPassed = 0;

  currentChannel: ChannelEntity = {} as ChannelEntity;

  channelList: Channel[] = [];

  channelRepo: ChannelRepository;

  articleRepo: ArticleRepository;

  counterMap: { [key: string]: number } = {};

  constructor() {
    makeAutoObservable(this);

    this.channelRepo = getCustomRepository(ChannelRepository);
    this.articleRepo = getCustomRepository(ArticleRepository);
    this.type = ChannelType.all;

    // eslint-disable-next-line promise/valid-params
    // this.getList().then().catch();
  }

  increaseTimer() {
    this.secondsPassed += 1;
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
    const channelList = await this.channelRepo.getAll();

    const counterMap: { [key: string]: number } = {};
    const amount = this.channelList.reduce((acu, cur) => {
      counterMap[cur.id] = cur.articleCount || 0;
      return acu + (cur.articleCount || 0);
    }, 0);

    counterMap.amount = amount;

    runInAction(() => {
      this.counterMap = counterMap;
      this.channelList = channelList;
    });

    return this.channelList;
  }

  async findChannelByUrl(url: string): Promise<ChannelEntity> {
    const channel = await this.channelRepo.find({
      where: {
        feedUrl: url,
      },
    });

    return channel[0];
  }

  decreaseUnreadCountInChannel(channelId: string, number: number) {
    let current = this.counterMap[channelId] || 0;
    let amount = this.counterMap.amount || 0;

    if (current) {
      current = Math.max(current - number, 0);
      amount = Math.max(amount - number, 0);
    }

    this.counterMap = {
      ...this.counterMap,
      [channelId]: current,
      amount,
    };
  }
}
