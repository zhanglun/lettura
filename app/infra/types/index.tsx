import { ArticleEntity } from '../../entity/article';
import { ChannelEntity } from '../../entity/channel';

// RSS2.0 规范约定字段
export interface RSSFeed {
  title: string;
  link: string;
  description: string;
  language?: string;
  copyright?: string;
  pubDate?: Date;
  lastBuildDate?: Date;
  ttl?: number;
  image?: string;
  items?: RSSFeedItem[];
}

export interface RSSFeedItem {
  title: string;
  link: string;
  description: string;
  author: string;
  category: string;
  comments: string;
  content: string;
  contentEncoded?: string;
  pubDate: string;
}

export interface Channel extends ChannelEntity {
  articleCount?: number;
}

export type ChannelRes = RSSFeed & {
  category?: string;
  favicon?: string;
  tag?: '';
  createDate?: string;
  updateDate?: string;
  lastSyncDate?: string;
};

export type Article = ArticleEntity & {
  channelTitle: string;
  channelFavicon: string;
};
