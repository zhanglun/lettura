/* eslint-disable class-methods-use-this */
import { EntityRepository, Repository } from 'typeorm';
import { ArticleEntity } from '../entity/article';
import { Article, RSSFeedItem } from '../infra/types';
import { ChannelEntity } from '../entity/channel';

@EntityRepository(ArticleEntity)
export class ArticleRepository extends Repository<ArticleEntity> {
  async getAll(): Promise<Article[]> {
    const list = await this.createQueryBuilder('article')
      .leftJoinAndSelect('article.channel', 'channel')
      .select([
        'article.*',
        'channel.title as channelTitle',
        'channel.favicon as channelFavicon',
      ])
      .execute();

    return list;
  }

  async getListWithChannelId(channelId: string): Promise<Article[]> {
    const list = await this.createQueryBuilder('article')
      .leftJoinAndSelect('article.channel', 'channel')
      .where('article.channelId = :channelId', { channelId })
      .select([
        'article.*',
        'channel.title as channelTitle',
        'channel.favicon as channelFavicon',
      ])
      .execute();

    return list;
  }

  // async getUnreadListWithChannelId() {}
  //
  // async getReadListWithChannelId() {}

  /**
   * 添加文件
   * @param {string} channelId uuid
   * @param items
   */
  async insertArticles(channelId: string, items: RSSFeedItem[] = []) {
    if (!items.length) {
      return;
    }

    const channel = new ChannelEntity();

    channel.id = channelId;

    const values = items.map(
      (item): ArticleEntity => {
        const article = new ArticleEntity();

        article.author = item.author;
        article.category = 0;
        article.channel = channel;
        article.comments = item.comments;
        article.content = item.content;
        article.description = item.description;
        article.link = item.link;
        article.pubDate = item.pubDate;
        article.title = item.title;
        article.hasRead = 0;
        article.isLike = 0;
        article.createDate = new Date().toString();
        article.updateDate = new Date().toString();

        return article;
      }
    );

    await this.save(values);
  }
}
