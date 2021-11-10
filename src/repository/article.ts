/* eslint-disable class-methods-use-this */
import { EntityRepository, Repository } from 'typeorm';
import Dayjs from 'dayjs';
import { ArticleEntity } from '../entity/article';
import { Article, RSSFeedItem } from '../infra/types';
import { ChannelEntity } from '../entity/channel';
import { ArticleReadStatus } from '../infra/constants/status';

@EntityRepository(ArticleEntity)
export class ArticleRepository extends Repository<ArticleEntity> {
  async getAllArticle(params?: any): Promise<Article[]> {
    const builder = this.createQueryBuilder('article').leftJoinAndSelect(
      'article.channel',
      'channel'
    );

    if (params && params.readStatus !== null) {
      builder.andWhere('article.hasRead = :hasRead', {
        hasRead: params.readStatus,
      });
    }

    builder
      .select([
        'article.*',
        'channel.title as channelTitle',
        'channel.favicon as channelFavicon',
      ])
      .orderBy('pubDate', 'DESC');

    return builder.execute();
  }

  /**
   * 通过channelId查找文章
   * @param params 参数
   * @returns ArticleEntity[]
   */
  async getArticleListInChannel(params: {
    channelId: string;
    readStatus?: number;
  }): Promise<Article[]> {
    const builder = this.createQueryBuilder('article')
      .leftJoinAndSelect('article.channel', 'channel')
      .where('article.channelId = :channelId', {
        channelId: params.channelId,
      });

    if (params.readStatus !== undefined && params.readStatus !== null) {
      builder.andWhere('article.hasRead = :hasRead', {
        hasRead: params.readStatus,
      });
    }

    builder
      .select([
        'article.*',
        'channel.title as channelTitle',
        'channel.favicon as channelFavicon',
      ])
      .orderBy('pubDate', 'DESC');

    return builder.execute();
  }

  async markArticleAsRead(article: ArticleEntity): Promise<boolean> {
    try {
      await this.update(article.id, { hasRead: ArticleReadStatus.isRead });
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async getAllUnread(): Promise<Article[]> {
    return this.createQueryBuilder('article')
      .leftJoinAndSelect('article.channel', 'channel')
      .where('article.hasRead = :hasRead', {
        hasRead: ArticleReadStatus.unRead,
      })
      .select([
        'article.*',
        'channel.title as channelTitle',
        'channel.favicon as channelFavicon',
      ])
      .orderBy('pubDate', 'DESC')
      .execute();
  }

  /**
   * 将频道下的文章标记为已读
   * @param channelId 频道 id
   * @returns
   */
  async markArticleAsReadByChannelId(channelId: string): Promise<any> {
    console.log('全部已读', channelId);

    return this.createQueryBuilder('article')
      .leftJoinAndSelect('article.channel', 'channel')
      .where('article.channelId = :channelId', { channelId })
      .update(ArticleEntity)
      .set({
        hasRead: ArticleReadStatus.isRead,
      })
      .execute();
  }

  /**
   * 获取单个订阅频道下的文章列表
   * @param channelId
   */
  async getListWithChannelId(channelId: string): Promise<Article[]> {
    return this.createQueryBuilder('article')
      .leftJoinAndSelect('article.channel', 'channel')
      .where('article.channelId = :channelId', { channelId })
      .andWhere('article.hasRead = :hasRead', {
        hasRead: ArticleReadStatus.unRead,
      })
      .select([
        'article.*',
        'channel.title as channelTitle',
        'channel.favicon as channelFavicon',
      ])
      .orderBy('pubDate', 'DESC')
      .execute();
  }

  /**
   * 添加文章
   * @param {string} channelId uuid
   * @param items
   */
  async insertArticles(channelId: string, items: RSSFeedItem[] = []) {
    if (!items.length) {
      return;
    }

    const channel = new ChannelEntity();

    channel.id = channelId;

    console.log('article', items);

    const values = items.map(
      (item: RSSFeedItem): ArticleEntity => {
        const article = new ArticleEntity();

        article.author = item.author;
        article.category = 0;
        article.channel = channel;
        article.comments = item.comments;
        article.content = item.content;
        article.description = item.description;
        article.link = item.link;
        article.pubDate = item.pubDate || item.date || item.isoDate;
        article.title = item.title;
        article.hasRead = 0;
        article.isLike = 0;
        article.createDate = new Date().toString();
        article.updateDate = new Date().toString();

        return article;
      }
    );

    await this.createQueryBuilder()
      .insert()
      .into(ArticleEntity)
      .values(values)
      .onConflict(`("link") DO NOTHING`)
      .execute();
  }

  async getUnreadTotal() {
    // const counterMap = new Map();
    // const counter: {
    //   channelId: string;
    //   total: number;
    // }[] = await this.createQueryBuilder('article')
    //   .groupBy('article.channelId')
    //   .andWhere('article.hasRead = :hasRead', {
    //     hasRead: ArticleReadStatus.unRead,
    //   })
    //   .select(['article.channelId as channelId', 'count(article.id) as total'])
    //   .execute();

    // counter.forEach((item) => {
    //   counterMap.set(item.channelId, item.total);
    // });

    const counter = [];

    // 获取未读总数
    const totalUnread = await this.createQueryBuilder('article')
      .where('article.hasRead = :hasRead', {
        hasRead: ArticleReadStatus.unRead,
      })
      .select(['count(article.id) as total'])
      .execute();

    const todayUnread = await this.createQueryBuilder('article')
      .where('article.hasRead = :hasRead', {
        hasRead: ArticleReadStatus.unRead,
      })
      .andWhere('article.updateDate > :start', {
        start: Dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
      })
      .andWhere('article.updateDate < :end', {
        end: Dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss'),
      })
      .select(['count(article.id) as total'])
      .execute();

    if (totalUnread[0]) {
      counter.push({
        channelId: 'inbox',
        total: totalUnread[0].total,
      });
    }

    if (todayUnread[0]) {
      counter.push({
        channelId: 'today',
        total: todayUnread[0].total,
      });
    }

    return counter;
  }
}
