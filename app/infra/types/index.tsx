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
  pubDate: DataCue;
}

export interface Channel extends RSSFeed {
  id?: number;
  title: string;
  feedUrl: string;
  favicon: string;
  category: string;
  tag: string;
  createTime: string;
  updateTime: string;
}

export interface Article {
  feedId: number;
  title: string;
  url: string;
  content: string;
  isRead: number; // 1: 未读 2: 已读
  isLike: number; // 1: 默认。不收藏 2: 收藏
  pubTime: string;
}
