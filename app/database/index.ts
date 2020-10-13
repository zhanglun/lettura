import Dexie, { Version } from 'dexie';
import { Channel } from '../infra/types';

const VERSION = 1;
let dbInstance: Dexie;

export type DBInstance = {
  version: (v: number) => Version;
  feeds: Dexie.Table;
  categories: Dexie.Table;
};

class SalixDatabase extends Dexie {
  feeds: Dexie.Table<Channel, number>;

  constructor() {
    super('SalixDatabase');
    this.version(VERSION).stores({
      feeds: '++feedUrl',
    });

    this.feeds = this.table('feeds');
  }
}

export function createDatabase() {
  if (!dbInstance) {
    dbInstance = new SalixDatabase();
  }

  return dbInstance;
}
