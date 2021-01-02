import { shell } from 'electron';
import RSSParser from 'rss-parser';
import { ChannelRes, RSSFeedItem } from '../types';

const parser = new RSSParser({
  customFields: {
    item: [['content:encoded', 'contentEncoded']],
  },
});

export function openBrowser(link: string) {
  shell.openExternal(link);
}

/**
 * 解析 rss url
 * @param {string} feedUrl
 */
export async function parseRSS(feedUrl: string): Promise<ChannelRes> {
  const feed = (await parser.parseURL(feedUrl)) as ChannelRes;
  const now = new Date().toString();

  feed.category = '';
  feed.favicon = `${new URL(feed.link).origin}/favicon.ico`;
  feed.tag = '';
  feed.createDate = now;
  feed.updateDate = now;
  feed.lastSyncDate = now;

  feed.items?.forEach((item: RSSFeedItem) => {
    const { content, contentEncoded } = item;

    item.content = contentEncoded || content;
  });

  console.log(feed);

  return feed;
}
