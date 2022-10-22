import {v4 as uuidv4} from 'uuid';
import { Article, Article as ArticleModel, Channel, db } from "../db";
import { invoke } from "@tauri-apps/api";

/**
 * 批量插入Article。检查是否存在，不存在则插入。
 * @param articles
 */
export const bulkAddArticle = (articles: ArticleModel[]) => {
  const links = articles.map((item: ArticleModel) => item.link);

  return db.articles
    .where("link")
    .anyOf(links)
    .toArray()
    .then((exists): Promise<any> => {
      if (exists.length < articles.length) {
        const remotes = articles
          .filter((item: Article) => {
            return !exists.some((exist) => exist.link === item.link);
          })
          .map((item) => {
            item.pubDate = new Date();
            item.uuid = uuidv4();

            return { ...item };
          });

        if (remotes.length) {
          console.log("remotes", remotes);
          return db.articles.bulkAdd(remotes);
        }
      }

      return Promise.resolve();
    });
};

/**
 * 更新或者插入Channel
 * @param channel
 */
export const upsertChannel = async (channel: Channel) => {
  if (await db.channels.get({ feedUrl: channel.feedUrl })) {
    return db.channels.where("feedUrl").equals(channel.feedUrl).modify(channel);
  } else {
    return db.channels.put({...channel, uuid: uuidv4()});
  }
};

export const makeAllRead = async (feedUrl: string) => {
  if (await db.channels.get({ feedUrl })) {
    const res = await db.articles.where({
      feedUrl,
      unread: 1,
    }).modify({ unread: 0 });

    await db.channels.where("feedUrl").equals(feedUrl).modify({ unread: 0 });
  }
};

export const getChannels = async () => {
  return invoke('get_channels')
}

/**
 * 删除频道
 * @param {String} uuid  channel 的 uuid
 */
export const deleteChannel = async (uuid: string) => {
  return invoke('delete_channel', { uuid })
};

export const queryChannelWithKeywords = async(word: string) => {
  return db.channels.filter((channel) => {
    if (channel.title.indexOf(word) > -1) {
      return true
    }
    return false
  }).toArray();
}

export const updateCountWithChannel = async (feedUrl: string): Promise<any> => {
  return {};
};

export const getAllArticleListByChannel = async (
  feedUrl: string,
  filter: {
    unread?: number
  },
): Promise<Article[]> => {
  let table = db.articles
    .where({
      feedUrl,
    })

  if (filter && typeof filter.unread === 'number') {
    table = table.filter((i) => {
      return i.unread === filter.unread
    })
  }

  return table.reverse()
    .sortBy("pubDate");
};


export const importChannels = async (list: string[]) => {
  invoke('import_channels', { list })
}

export const getArticleList = async (uuid: string) => {
  return invoke('get_articles', { uuid })
}

export const fetchFeed = async (url: string) => {
  return invoke('fetch_feed', { url })
}

export const addChannel = async (url: string) => {
  return invoke('add_channel', { url })
}

export const syncArticlesWithChannelUuid = async (uuid: string) => {
  return invoke('sync_articles_with_channel_uuid', { uuid })
}
