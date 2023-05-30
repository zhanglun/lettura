export interface Channel {
  item_type: string;
  children: Channel[];
  id?: number;
  uuid: string;
  title: string;
  link: string;
  feed_url: string;
  icon?: string;
  description: string;
  pub_date?: Date;
  unread: number;
  sort?: number;
  create_date?: Date,
}
export interface Article {
  id?: number;
  uuid: string;
  channel_uuid: string;
  title: string;
  link: string;
  image: string;
  feed_url: string;
  description: string;
  content?: string;
  pub_date?: Date;
  read_status: number;
}

export interface Folder {
  uuid: string;
  name: string;
}
