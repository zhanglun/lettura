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
}

export class MySubClassedDexie extends Dexie {
  podcasts!: Table<Podcast>;

  constructor() {
    super("Lettura");

    //@ts-ignore
    this.version(1.1).stores({
      podcasts:
        "++id, &uuid, title, link, feed_url, feed_uuid, feed_title, feed_logo, author, description, pub_date, create_date, update_date, starred, mediaURL, mediaType, thumbnail, add_date", // Primary key and indexed props
    });
  }
}

export const db = new MySubClassedDexie();
