import Dexie, { Version } from 'dexie';
import { Feed } from '../infra/types';

const VERSION = 1;
let dbInstance: any = null;

export type DBInstance = {
  version: (v: number) => Version;
  feeds: Dexie.Table;
  categories: Dexie.Table;
};

class SalixDatabase extends Dexie {
  feeds: Dexie.Table<Feed, number>;

  constructor() {
    super('SalixDatabase');
    this.version(VERSION).stores({
      feeds: '++id,name,feedUrl,icon,category,tag,createTime',
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
