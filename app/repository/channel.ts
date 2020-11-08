import { EntityRepository, Repository } from 'typeorm';
import { ChannelEntity } from '../entity/channel';
import { Channel } from '../infra/types';

@EntityRepository(ChannelEntity)
export class ChannelRepository extends Repository<ChannelEntity> {
  async getAll() {
    const list = await this.find({});

    return list;
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

    return this.save(feed);
  }

  async getList(): Promise<ChannelEntity[]> {
    const list = await this.find({});

    return list;
  }
}
