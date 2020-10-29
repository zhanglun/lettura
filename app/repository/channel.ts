import { dbInstance as db, SalixDatabase } from '../model';
import { Article, Channel, RSSFeedItem } from '../infra/types';

class ChannelRepo {
  private db: SalixDatabase;

  constructor() {
    this.db = db;
  }

  async getAll() {
    const list = await this.db.channels.toArray();

    return list;
  }

  async addOne(feed: Channel): Promise<string> {
    try {
      return await this.db.channels.put(feed);
    } catch (err) {
      console.log(err);
      return err.message;
    }
  }

  async insertFeedItems(
    feedUrl: string,
    channelTitle: string,
    items: RSSFeedItem[] = []
  ) {
    if (!items.length) {
      return;
    }

    const values = items.map(
      (item): Article => {
        return {
          feedUrl,
          channelTitle,
          ...item,
          isRead: 0,
          isLike: 0,
          createDate: new Date().toString(),
          updateDate: new Date().toString(),
        };
      }
    );

    await this.db.articles.bulkPut(values);
  }
}

export const channelRepo = new ChannelRepo();
