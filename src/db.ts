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
  is_expanded?: boolean;
}
export interface Article {
  id?: number;
  uuid: string;
  feed_uuid: string;
  feed_title: string;
  feed_url: string;
  title: string;
  link: string;
  image: string;
  description: string;
  content?: string;
  pub_date?: string;
  create_date: string;
  read_status: number;
}

export interface ArticleResItem {
  id?: number;
  author: string;
  uuid: string;
  feed_uuid: string;
  feed_title: string;
  feed_url: string;
  title: string;
  link: string;
  image: string;
  description: string;
  content?: string;
  pub_date?: string;
  create_date: string;
  read_status: number;
  starred: number;
  media_object: string;
}

export interface Folder {
  uuid: string;
  name: string;
}
