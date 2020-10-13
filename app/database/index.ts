import Dexie, { Version } from 'dexie';
import { Channel } from '../infra/types';

const VERSION = 1;
let dbInstance: Dexie;

export type DBInstance = {
  version: (v: number) => Version;
  channels: Dexie.Table;
  categories: Dexie.Table;
};

class SalixDatabase extends Dexie {
  channels: Dexie.Table<Channel, number>;

  constructor() {
    super('SalixDatabase');
    this.version(VERSION).stores({
      channels: '++feedUrl',
    });

    this.channels = this.table('channels');
  }
}

export function createDatabase() {
  if (!dbInstance) {
    dbInstance = new SalixDatabase();
  }

  return dbInstance;
}
