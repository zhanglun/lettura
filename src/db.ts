export interface Channel {
  item_type: string;
  children: {
    uuid: String,
    title: String,
    sort: number,
  }[];
  id?: number;
  uuid: string;
  title: string;
  link: string;
  feed_url: string;
  description: string;
  pub_date?: Date;
  unread: number;
  sort?: number;
}
export interface Article {
  id?: number;
  uuid: string;
  title: string;
  link: string;
  image: string;
  feed_url: string;
  description: string;
  content?: string;
  pub_date?: Date;
  read_status: number;
}
