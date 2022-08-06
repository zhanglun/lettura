import Dexie, { Table } from 'dexie';

export interface Channel {
  id?: number;
  title: string;
  link: string;
  feedUrl: string;
  description?: string;
  pubDate?: Date;
  unread?: Number;
}
export interface Article {
  id?: number;
  title: string;
  link: string;
  image: string;
  feedUrl: string;
  description?: string;
  content?: string;
  pubDate?: Date;
  unread: number;
}

export class MySubClassedDexie extends Dexie {
  channels!: Table<Channel>;
  articles!: Table<Article>;

  constructor() {
    super('salix');
    this.version(1.2).stores({
      channels: '++id, title, link, &feedUrl, description, pubDate, unread, favicon',
      articles: '++id, title, &link, image, feedUrl, author, description, content, pubDate, unread',
    });
  }
}

export const db = new MySubClassedDexie();
