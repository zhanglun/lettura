export interface Channel {
  item_type: string;
  children: Channel[];
  id?: number;
  uuid: string;
  title: string;
  link: string;
  feed_url: string;
  folder_name?: string;
  folder?: string;
  logo?: string;
  description: string;
  pub_date?: Date;
  health_status: number;
  failure_reason: string;
  unread: number;
  sort?: number;
  create_date?: Date;
  update_date?: Date;
  last_sync_date?: string;
  is_expanded?: boolean;
}

export interface FeedResItem {
  item_type: string;
  children: FeedResItem[];
  id?: number;
  uuid: string;
  title: string;
  link: string;
  feed_url: string;
  folder_name?: string;
  folder?: string;
  logo?: string;
  description: string;
  pub_date?: Date;
  health_status: number;
  failure_reason: string;
  unread: number;
  sort?: number;
  create_date?: Date;
  update_date?: Date;
  last_sync_date?: string;
  folder_uuid?: string | null;
}
export interface Article {
  id?: number;
  uuid: string;
  channel_uuid: string;
  channel_link: string;
  title: string;
  link: string;
  image: string;
  feed_url: string;
  description: string;
  content?: string;
  pub_date?: Date;
  create_date?: Date;
  read_status: number;
}

export interface ArticleResItem {
  id?: number;
  author: string;
  uuid: string;
  channel_uuid: string;
  channel_link: string;
  title: string;
  link: string;
  image: string;
  feed_url: string;
  description: string;
  content?: string;
  pub_date?: Date;
  create_date?: Date;
  read_status: number;
}

export interface Folder {
  uuid: string;
  name: string;
}
