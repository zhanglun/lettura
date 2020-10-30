import { shell } from 'electron';
import RSSParser from 'rss-parser';
import { Channel } from '../types';

const parser = new RSSParser();

export function openBrowser(link: string) {
  shell.openExternal(link);
}

/**
 * 解析 rss url
 * @param {string} feedUrl
 */
export async function parseRSS(feedUrl: string): Promise<Omit<Channel, 'id'>> {
  const feed = (await parser.parseURL(feedUrl)) as Omit<Channel, 'id'>;

  feed.category = '';
  feed.favicon = `${new URL(feed.link).origin}/favicon.ico`;
  feed.tag = '';
  feed.createDate = new Date().toString();
  feed.createDate = new Date().toString();

  return feed;
}
