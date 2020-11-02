import { EntityRepository, Repository } from 'typeorm';
import { Channel as ChannelEntity } from '../entity/Channel';
import { Channel } from '../infra/types';

@EntityRepository(ChannelEntity)
export class ChannelRepository extends Repository<ChannelEntity> {
  async getAll() {
    const list = await this.find({});

    return list;
  }

  async addOne(feed: Channel): Promise<Channel> {
    try {
      return await this.save(feed);
    } catch (err) {
      console.log(err);
      return err.message;
    }
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
