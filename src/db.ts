export interface Channel {
  id?: number;
  uuid: string;
  title: string;
  link: string;
  feedUrl: string;
  description?: string;
  pubDate?: Date;
  unread: number;
}
export interface Article {
  id?: number;
  uuid: string;
  title: string;
  link: string;
  image: string;
  feedUrl: string;
  description?: string;
  content?: string;
  pubDate?: Date;
  unread: number;
}
