import { EntityRepository, Repository, getConnection } from 'typeorm';
import { ArticleEntity } from '../entity/article';
import { ChannelEntity } from '../entity/channel';
import { ArticleReadStatus } from '../infra/constants/status';
import { Channel } from '../infra/types';

@EntityRepository(ChannelEntity)
export class ChannelRepository extends Repository<Channel> {
  async getAll() {
    const list: ChannelEntity[] = await this.find({});
    const channelIdList = list.reduce((acu, cur: ChannelEntity) => {
      acu.push(cur.id);
      return acu;
    }, [] as string[]);

    const counterMap = new Map();
    const counter: {
      channelId: string;
      total: number;
    }[] = await getConnection()
      .getRepository(ArticleEntity)
      .createQueryBuilder('article')
      .groupBy('article.channelId')
      .where('channelId IN (:...channelIdList)', { channelIdList })
      .andWhere('article.hasRead = :hasRead', {
        hasRead: ArticleReadStatus.unRead,
      })
      .select(['article.channelId as channelId', 'count(article.id) as total'])
      .execute();

    counter.forEach((item) => {
      counterMap.set(item.channelId, item.total);
    });

    const result: Channel[] = list.map(
      (item: ChannelEntity): Channel => {
        return { ...item, articleCount: counterMap.get(item.id) || 0 };
      }
    );

    return result;
  }

  async addOne(feed: Channel): Promise<ChannelEntity> {
    const channel = await this.findOne({
      where: {
        feedUrl: feed.feedUrl,
      },
    });

    if (channel) {
      throw new Error('已经订阅了');
    }

    feed.createDate = new Date().toString();
    feed.updateDate = new Date().toString();

    const result = this.save(feed);

    return result;
  }

  async getList(): Promise<ChannelEntity[]> {
    const list = await this.find({});

    return list;
  }
}
