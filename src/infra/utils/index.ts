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
  const channelRes = (await parser.parseURL(feedUrl)) as ChannelRes;
  const now = new Date().toString();

  channelRes.category = '';
  channelRes.favicon = `${new URL(channelRes.link).origin}/favicon.ico`;
  channelRes.tag = '';
  channelRes.createDate = now;
  channelRes.lastSyncDate = now;

  channelRes.feedUrl = feedUrl;

  channelRes.items?.forEach((item: RSSFeedItem) => {
    const { content, contentEncoded } = item;

    item.content = contentEncoded || content;
  });

  console.log(channelRes);

  return channelRes;
}
