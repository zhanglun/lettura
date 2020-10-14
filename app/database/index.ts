import Dexie from 'dexie';
import { Channel } from '../infra/types';
import { ChannelModel } from './channel';

const VERSION = 1;

class SalixDatabase extends Dexie {
  public channels!: Dexie.Table<Channel, number>;

  constructor() {
    super('SalixDatabase');

    this.version(VERSION).stores({
      channels: '++feedUrl',
    });

    this.channels = this.table('channels');
    this.channels.mapToClass(ChannelModel);
  }
}

export const dbInstance = new SalixDatabase();
