import { EntityRepository, Repository } from 'typeorm';
import { Channel as ChannelEntity } from '../entity/channel';
import { Channel } from '../infra/types';

@EntityRepository(ChannelEntity)
export class ChannelRepository extends Repository<ChannelEntity> {
  async getAll() {
    const list = await this.find({});

    return list;
  }

  async addOne(feed: Channel): Promise<ChannelEntity> {
    feed.createDate = new Date().toString();
    feed.updateDate = new Date().toString();

    return this.save(feed);
  }

  async getList(): Promise<ChannelEntity[]> {
    const list = await this.find({});

    return list;
  }

  // async insertFeedItems(
  //   feedUrl: string,
  //   channelTitle: string,
  //   items: RSSFeedItem[] = []
  // ) {
  //   if (!items.length) {
  //     return;
  //   }
  //
  //   const values = items.map(
  //     (item): Article => {
  //       return {
  //         feedUrl,
  //         channelTitle,
  //         ...item,
  //         isRead: 0,
  //         isLike: 0,
  //         createDate: new Date().toString(),
  //         updateDate: new Date().toString(),
  //       };
  //     }
  //   );
  //
  //   await this.repo.articles.bulkPut(values);
  // }
}
