import Dexie from 'dexie';
import { Channel, Article } from '../infra/types';
import { ChannelModel } from './channel';
import { ArticleModel } from './article';

const VERSION = 1;

export class SalixDatabase extends Dexie {
  public channels!: Dexie.Table<Channel, string>;

  public articles: Dexie.Table<Article, string>;

  constructor() {
    super('SalixDatabase');

    this.version(VERSION).stores({
      channels: '++id, &feedUrl, link, title',
      articles: '++id, &link, feedUrl, title, isRead',
    });

    this.channels = this.table('channels');
    this.articles = this.table('articles');

    this.channels.mapToClass(ChannelModel);
    this.articles.mapToClass(ArticleModel);
  }
}

export const dbInstance = new SalixDatabase();
