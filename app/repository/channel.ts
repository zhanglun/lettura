import { dbInstance as db } from '../model';

class ChannelRepo {
  static async getAll() {
    const list = await db.channels.toArray();

    return list;
  }
}

export const channelRepo = new ChannelRepo();
