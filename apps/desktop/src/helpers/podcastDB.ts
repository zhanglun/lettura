import Dexie, { Table } from "dexie";

export interface Podcast {
  id?: number;
  uuid: string;
  title: string;
  link: string;
  feed_url: string;
  feed_uuid: string;
  feed_title: string;
  feed_logo: string;
  author: string;
  description: string;
  pub_date: string;
  create_date: string;
  update_date: string;
  starred: number;
  mediaURL: string;
  mediaType: string;
  thumbnail: string;
  add_date: number;
  progress?: number; // 播放进度，单位为秒
  duration?: number; // 单集时长（秒），首次加载元数据后回填
}

export class MySubClassedDexie extends Dexie {
  podcasts!: Table<Podcast>;

  constructor() {
    super("Lettura");

    this.version(1.2).stores({
      podcasts:
        "++id, &uuid, title, link, feed_url, feed_uuid, feed_title, feed_logo, author, description, pub_date, create_date, update_date, starred, mediaURL, mediaType, thumbnail, add_date, progress", // Primary key and indexed props
    });
  }
}

export const db = new MySubClassedDexie();
