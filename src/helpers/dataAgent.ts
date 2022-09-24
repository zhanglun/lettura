import { Article, Article as ArticleModel, Channel, db } from "../db";

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
    return db.channels.put(channel);
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

/**
 * 删除频道
 * @param {Number} channelId channel 的 id
 */
export const deleteChannel = async (channelId: number) => {
  const channel = await db.channels.get({ id: channelId });

  if (channel) {
    await db.channels.where("id").equals(channelId).delete();
    const a = db.articles.where("feedUrl").equals(channel.feedUrl);
    console.log("a ====> ", a);
    await db.articles.where("feedUrl").equals(channel.feedUrl).delete();
  }
};

export const updateCountWithChannel = async (feedUrl: string): Promise<any> => {
  const c = await db.channels.get({ feedUrl });

  if (c) {
    const unread = await db.articles
      .where({
        feedUrl,
        unread: 1,
      })
      .count();

    console.log("unread", unread);

    await db.channels.where("feedUrl").equals(feedUrl).modify({ unread });

    return { feedUrl: unread };
  }

  return {};
};

export const getAllArticleListByChannel = async (
  feedUrl: string,
  filter: {
    unread: number
  },
): Promise<Article[]> => {
  return db.articles
    .where({
      feedUrl,
      ...filter
    })
    .reverse()
    .sortBy("pubDate");
};
