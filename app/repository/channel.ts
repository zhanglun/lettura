import { getRepository, Repository } from 'typeorm';
import { Channel as ChannelEntity } from '../entity/Channel';
import { Article, Channel, RSSFeedItem } from '../infra/types';

class ChannelRepo {
  private repo: Repository<ChannelEntity>;

  constructor() {
    this.repo = getRepository(ChannelEntity);
  }

  // async getAll() {
  //   const list = await this.repo.channels.toArray();
  //
  //   return list;
  // }

  async addOne(feed: Channel): Promise<Channel> {
    try {
      return await this.repo.save(feed);
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

export const channelRepo = new ChannelRepo();
